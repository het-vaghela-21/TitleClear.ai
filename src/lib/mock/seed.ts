import type { Property } from "@/lib/types";

/** Deterministic seed so the same plot details always resolve to the same demo scenario. */
export function propertySeed(property: Property): string {
  return [
    property.district,
    property.taluka,
    property.village,
    property.ward,
    property.citySurveyArea,
    property.surveyNo,
    property.khataNo,
  ]
    .filter(Boolean)
    .join("|");
}
