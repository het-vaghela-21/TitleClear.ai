/**
 * Jantri (Annual Statement of Rates) lookup types.
 *
 * The dataset mirrors the two physical ASR-2011 (Final) books the state
 * publishes per district:
 *  - "Corporation book": value zones for corporation/urban-authority areas.
 *    Each zone lists the survey/block numbers it covers and 7 rates.
 *  - "NA (village) book": one entry per revenue village, with rows of
 *    survey numbers grouped by location class and 4 non-agricultural
 *    rates, plus village-site (gamtal) rates.
 *
 * All rates are ₹ per square metre as printed in ASR-2011. The rate in
 * force today is derived from them by a district-level multiplier (see
 * meta.ts) — never stored, so a policy change is a one-line edit.
 */

/** A value zone from the Corporation/Authority book. */
export interface CorpZone {
  /** Taluka, e.g. "VADODARA CITY". */
  t: string;
  /** Village / area name, e.g. "AKOTA". */
  v: string;
  /** Zone id as printed, e.g. "86/0/1". */
  z: string;
  /**
   * 7 ASR-2011 rates (₹/sq.m), null when not printed for the zone:
   * [open plot residential, residence flat, office, shop,
   *  open plot industrial, agri irrigated, agri non-irrigated]
   */
  r: (number | null)[];
  /** Survey/block tokens covered, as printed ("86/2", "1674/PAIKI", "12 TO 45"). */
  s: string[];
  /** 1 when the zone also covers "all other plots in the zone boundary". */
  f?: 0 | 1;
}

/** One rate row of an NA-book village (a group of surveys + location class). */
export interface NaRow {
  s: string[];
  /** Location class as printed, e.g. highway-touching / interior. */
  c: string;
  /**
   * 4 ASR-2011 rates (₹/sq.m):
   * [NA residential, NA commercial, NA industrial, mineral-bearing]
   */
  r: (number | null)[];
}

/** A village entry from the NA (village) book. */
export interface NaVillage {
  t: string;
  v: string;
  rows: NaRow[];
  /** Gamtal (village site) residential rate, ₹/sq.m. */
  gr?: number | null;
  /** Gamtal commercial rate, ₹/sq.m. */
  gc?: number | null;
}

export type Book = "corp" | "na";

/** Autocomplete entry. */
export interface VillageHit {
  village: string;
  taluka: string;
  book: Book;
}

export type SurveyMatch = "exact" | "related";

/** One labelled rate with the derived current value. */
export interface RateLine {
  label: string;
  labelGu: string;
  /** ASR-2011 printed rate, ₹/sq.m. */
  asr2011: number;
  /**
   * Category multiplier per the GR of 13-04-2023 (land ×2, flat ×1.8,
   * office ×1.5, shop ×2) — shown next to the derived value.
   */
  multiplier: number;
  /** Rate in force today (asr2011 × multiplier, rounded), ₹/sq.m. */
  current: number;
}

export type MatchInfo =
  /** The survey/block number is listed in this zone/row. */
  | { type: "exact"; tokens: string[] }
  /** Subdivided/base variants of the number are listed ("1674/PAIKI"…). */
  | { type: "related"; tokens: string[] }
  /** Not listed, but the zone covers "all other plots in its boundary". */
  | { type: "fallback" }
  /** Shown without a survey query. */
  | { type: "all" };

export interface CorpZoneResult {
  kind: "corp-zone";
  village: string;
  taluka: string;
  zone: string;
  match: MatchInfo;
  rates: RateLine[];
}

export interface NaSection {
  match: MatchInfo;
  locationClass: string;
  rates: RateLine[];
}

export interface NaResult {
  kind: "na";
  village: string;
  taluka: string;
  /** Empty when the survey query matched nothing — gamtal still applies. */
  sections: NaSection[];
  gamtal: RateLine[];
  /** True when a survey was queried but no row listed it. */
  surveyNotListed: boolean;
}

export interface NotFoundResult {
  kind: "not-listed";
  village: string;
  taluka: string;
  book: Book;
  survey: string;
}

export type JantriResult = CorpZoneResult | NaResult | NotFoundResult;

export interface JantriSearchResponse {
  district: string;
  results: JantriResult[];
  /** Echo of meta the UI shows next to results. */
  meta: {
    multiplierNote: { en: string; gu: string };
    asOfNote: { en: string; gu: string };
    factsVerifiedOn: string;
  };
}
