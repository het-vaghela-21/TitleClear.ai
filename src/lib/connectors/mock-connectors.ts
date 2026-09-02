import type { Property } from "@/lib/types";
import { scenarioForSeed } from "@/lib/mock/scenarios";
import { propertySeed } from "@/lib/mock/seed";
import type { SourceConnector } from "./types";
import { SOURCE_LABELS, SOURCE_ORDER } from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One mock connector per source. Each resolves with the canned records for
 * whichever demo scenario the property's details hash to, after a simulated
 * network delay — so the assembling screen has real, independently-timed
 * promises to key off rather than a single fake timer.
 */
function makeMockConnector(source: (typeof SOURCE_ORDER)[number]): SourceConnector {
  return {
    source,
    displayName: SOURCE_LABELS[source],
    async fetchRecords(property: Property) {
      await delay(700 + Math.random() * 1400);
      const scenario = scenarioForSeed(propertySeed(property));
      return scenario.records.filter((r) => r.source === source);
    },
  };
}

export const mockConnectors: SourceConnector[] = SOURCE_ORDER.map(makeMockConnector);
