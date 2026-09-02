import type { Property, RecordItem, RecordSourceKey } from "@/lib/types";

/**
 * Common shape every source connector implements, real or mock. The UI only
 * ever talks to this interface, so live government connectors can be
 * swapped in later without touching the assembling/report screens.
 */
export interface SourceConnector {
  source: RecordSourceKey;
  displayName: string;
  fetchRecords(property: Property): Promise<Omit<RecordItem, "id" | "propertyId">[]>;
}

export const SOURCE_ORDER: RecordSourceKey[] = [
  "land_records",
  "registration",
  "rera",
  "tax",
  "court",
  "map",
];

export const SOURCE_LABELS: Record<RecordSourceKey, string> = {
  land_records: "Land Records",
  registration: "Registration / EC",
  rera: "RERA",
  tax: "Property Tax",
  court: "Court Cases",
  map: "Map / Boundaries",
};
