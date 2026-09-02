import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import { findInTokens, normalizeQuery } from "./match";
import {
  CORP_RATE_CATEGORIES,
  GAMTAL_CATEGORIES,
  NA_RATE_CATEGORIES,
  VADODARA_META,
  type JantriDistrictMeta,
  type RateCategory,
} from "./meta";
import type {
  CorpZone,
  JantriResult,
  NaVillage,
  RateLine,
  VillageHit,
} from "./types";

/**
 * District registry + search core. The ~1.4MB dataset stays server-side —
 * routes call into this; the client only ever receives result cards. Data
 * files are read lazily from disk (not imported) so neither the bundler
 * nor the type-checker chews the full dataset. Adding a district = data
 * files + meta + one entry in `districtDefs`.
 */

interface DistrictData {
  corp: CorpZone[];
  na: NaVillage[];
}

interface DistrictDef {
  meta: JantriDistrictMeta;
  load: () => DistrictData;
}

function loadJson<T>(relPath: string): T {
  const file = path.join(process.cwd(), "src", "lib", "jantri", relPath);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

const districtDefs: Record<string, DistrictDef> = {
  vadodara: {
    meta: VADODARA_META,
    load: () => ({
      corp: loadJson<CorpZone[]>("vadodara/corp.json"),
      na: loadJson<NaVillage[]>("vadodara/na.json"),
    }),
  },
};

const dataCache = new Map<string, DistrictData>();

function getData(slug: string): DistrictData | undefined {
  const def = districtDefs[slug];
  if (!def) return undefined;
  const cached = dataCache.get(slug);
  if (cached) return cached;
  const data = def.load();
  dataCache.set(slug, data);
  return data;
}

export function getDistrictMeta(slug: string): JantriDistrictMeta | undefined {
  return districtDefs[slug]?.meta;
}

export function listDistricts(): JantriDistrictMeta[] {
  return Object.values(districtDefs).map((d) => d.meta);
}

/* ------------------------------------------------------------------ */
/* Lazy per-district indexes                                           */
/* ------------------------------------------------------------------ */

interface DistrictIndex {
  corpByVillage: Map<string, CorpZone[]>; // "taluka|village" -> zones
  naByVillage: Map<string, NaVillage>;
  villages: VillageHit[]; // sorted
}

const indexCache = new Map<string, DistrictIndex>();

function key(t: string, v: string): string {
  return `${t}|${v}`;
}

function getIndex(slug: string): DistrictIndex | undefined {
  const dataset = getData(slug);
  if (!dataset) return undefined;
  const cached = indexCache.get(slug);
  if (cached) return cached;

  const corpByVillage = new Map<string, CorpZone[]>();
  for (const zone of dataset.corp) {
    const k = key(zone.t, zone.v);
    const list = corpByVillage.get(k);
    if (list) list.push(zone);
    else corpByVillage.set(k, [zone]);
  }

  const naByVillage = new Map<string, NaVillage>();
  for (const village of dataset.na) {
    naByVillage.set(key(village.t, village.v), village);
  }

  const villages: VillageHit[] = [];
  for (const k of corpByVillage.keys()) {
    const [taluka, village] = k.split("|");
    villages.push({ village, taluka, book: "corp" });
  }
  for (const k of naByVillage.keys()) {
    const [taluka, village] = k.split("|");
    villages.push({ village, taluka, book: "na" });
  }
  villages.sort(
    (a, b) => a.village.localeCompare(b.village) || a.taluka.localeCompare(b.taluka),
  );

  const index = { corpByVillage, naByVillage, villages };
  indexCache.set(slug, index);
  return index;
}

/* ------------------------------------------------------------------ */
/* Village autocomplete                                                */
/* ------------------------------------------------------------------ */

export function searchVillages(slug: string, query: string, limit = 40): VillageHit[] {
  const index = getIndex(slug);
  if (!index) return [];
  const q = normalizeQuery(query);
  if (q.length < 2) return [];
  const starts: VillageHit[] = [];
  const contains: VillageHit[] = [];
  for (const hit of index.villages) {
    if (hit.village.startsWith(q)) starts.push(hit);
    else if (hit.village.includes(q)) contains.push(hit);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Rate helpers                                                        */
/* ------------------------------------------------------------------ */

function rateLines(categories: RateCategory[], rates: (number | null)[]): RateLine[] {
  const lines: RateLine[] = [];
  categories.forEach((category, i) => {
    const rate = rates[i];
    if (rate == null) return;
    lines.push({
      label: category.en,
      labelGu: category.gu,
      asr2011: rate,
      multiplier: category.multiplier,
      current: Math.round(rate * category.multiplier),
    });
  });
  return lines;
}

/* ------------------------------------------------------------------ */
/* Lookup                                                              */
/* ------------------------------------------------------------------ */

export interface LookupParams {
  village: string;
  /** Narrow to one taluka (from an autocomplete pick). */
  taluka?: string;
  /** Survey / block number; empty = show all zones/rows of the village. */
  survey?: string;
}

export function lookup(slug: string, params: LookupParams): JantriResult[] {
  const meta = districtDefs[slug]?.meta;
  const index = getIndex(slug);
  if (!meta || !index) return [];

  const villageQ = normalizeQuery(params.village);
  const talukaQ = params.taluka ? normalizeQuery(params.taluka) : undefined;
  const surveyQ = normalizeQuery(params.survey ?? "");

  // Pick matching villages, then pull the same name+taluka from BOTH books
  // (a corporation-area village can also have an NA-book entry).
  let selected = index.villages.filter(
    (h) => h.village === villageQ && (!talukaQ || h.taluka === talukaQ),
  );
  if (selected.length === 0 && villageQ.length >= 2) {
    selected = index.villages.filter(
      (h) => h.village.includes(villageQ) && (!talukaQ || h.taluka === talukaQ),
    );
  }
  const names = new Set(selected.map((h) => key(h.taluka, h.village)));
  for (const h of index.villages) {
    if (names.has(key(h.taluka, h.village)) && !selected.includes(h)) selected.push(h);
  }

  const results: JantriResult[] = [];

  for (const hit of selected) {
    if (hit.book === "corp") {
      results.push(...lookupCorp(index, hit, surveyQ));
    } else {
      const na = lookupNa(index, hit, surveyQ);
      if (na) results.push(na);
    }
  }
  return results;
}

function lookupCorp(
  index: DistrictIndex,
  hit: VillageHit,
  surveyQ: string,
): JantriResult[] {
  const zones = index.corpByVillage.get(key(hit.taluka, hit.village)) ?? [];
  const results: JantriResult[] = [];

  if (surveyQ === "") {
    for (const zone of zones) {
      results.push({
        kind: "corp-zone",
        village: hit.village,
        taluka: hit.taluka,
        zone: zone.z,
        match: { type: "all" },
        rates: rateLines(CORP_RATE_CATEGORIES, zone.r),
      });
    }
    return results;
  }

  let any = false;
  for (const zone of zones) {
    const { exact, related } = findInTokens(zone.s, surveyQ);
    if (exact.length > 0) {
      any = true;
      results.push({
        kind: "corp-zone",
        village: hit.village,
        taluka: hit.taluka,
        zone: zone.z,
        match: { type: "exact", tokens: exact },
        rates: rateLines(CORP_RATE_CATEGORIES, zone.r),
      });
    } else if (related.length > 0) {
      any = true;
      results.push({
        kind: "corp-zone",
        village: hit.village,
        taluka: hit.taluka,
        zone: zone.z,
        match: { type: "related", tokens: related.slice(0, 8) },
        rates: rateLines(CORP_RATE_CATEGORIES, zone.r),
      });
    }
  }

  if (!any) {
    const fallbackZones = zones.filter((z) => z.f === 1);
    for (const zone of fallbackZones) {
      results.push({
        kind: "corp-zone",
        village: hit.village,
        taluka: hit.taluka,
        zone: zone.z,
        match: { type: "fallback" },
        rates: rateLines(CORP_RATE_CATEGORIES, zone.r),
      });
    }
    if (fallbackZones.length === 0 && zones.length > 0) {
      results.push({
        kind: "not-listed",
        village: hit.village,
        taluka: hit.taluka,
        book: "corp",
        survey: surveyQ,
      });
    }
  }
  return results;
}

function lookupNa(
  index: DistrictIndex,
  hit: VillageHit,
  surveyQ: string,
): JantriResult | null {
  const village = index.naByVillage.get(key(hit.taluka, hit.village));
  if (!village) return null;

  const sections = [];
  if (surveyQ !== "") {
    for (const row of village.rows) {
      const { exact, related } = findInTokens(row.s, surveyQ);
      if (exact.length > 0) {
        sections.push({
          match: { type: "exact" as const, tokens: exact },
          locationClass: row.c,
          rates: rateLines(NA_RATE_CATEGORIES, row.r),
        });
      } else if (related.length > 0) {
        sections.push({
          match: { type: "related" as const, tokens: related.slice(0, 8) },
          locationClass: row.c,
          rates: rateLines(NA_RATE_CATEGORIES, row.r),
        });
      }
    }
  } else {
    for (const row of village.rows) {
      sections.push({
        match: { type: "all" as const },
        locationClass: row.c,
        rates: rateLines(NA_RATE_CATEGORIES, row.r),
      });
    }
  }

  const gamtal: RateLine[] = [];
  if (village.gr != null) {
    const cat = GAMTAL_CATEGORIES.residential;
    gamtal.push({
      label: cat.en,
      labelGu: cat.gu,
      asr2011: village.gr,
      multiplier: cat.multiplier,
      current: Math.round(village.gr * cat.multiplier),
    });
  }
  if (village.gc != null) {
    const cat = GAMTAL_CATEGORIES.commercial;
    gamtal.push({
      label: cat.en,
      labelGu: cat.gu,
      asr2011: village.gc,
      multiplier: cat.multiplier,
      current: Math.round(village.gc * cat.multiplier),
    });
  }

  // Survey queried, nothing listed, no gamtal either → nothing to show.
  if (surveyQ !== "" && sections.length === 0 && gamtal.length === 0) return null;

  return {
    kind: "na",
    village: hit.village,
    taluka: hit.taluka,
    sections,
    gamtal,
    surveyNotListed: surveyQ !== "" && sections.length === 0,
  };
}
