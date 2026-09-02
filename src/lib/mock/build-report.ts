import type { Property, ReportBundle } from "@/lib/types";
import { scenarioForSeed } from "./scenarios";
import { propertySeed } from "./seed";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}_${Date.now().toString(36)}`;
}

export function buildReportBundle(property: Property): ReportBundle {
  const scenario = scenarioForSeed(propertySeed(property));

  const owners = scenario.owners.map((o) => ({
    ...o,
    id: nextId("owner"),
    propertyId: property.id,
  }));

  const records = scenario.records.map((r) => ({
    ...r,
    id: nextId("record"),
    propertyId: property.id,
    retrievedAt: new Date().toISOString(),
  }));

  const flags = scenario.flags.map((f) => ({
    ...f,
    id: nextId("flag"),
    propertyId: property.id,
  }));

  const report = {
    id: nextId("report"),
    propertyId: property.id,
    titleClearScore: scenario.score,
    band: scenario.band,
    generatedAt: new Date().toISOString(),
    status: "ready" as const,
    summary: scenario.summary,
  };

  return { property, report, owners, records, flags };
}
