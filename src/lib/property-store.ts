import type { Property, ReportBundle } from "@/lib/types";

/**
 * There's no backend yet, so a submitted plot's details (and the report
 * generated from them) travel between the form, the assembling screen and
 * the report screen via sessionStorage, keyed by the property id in the URL.
 */
const PROPERTY_PREFIX = "titleclear:property:";
const REPORT_PREFIX = "titleclear:report:";

export function saveProperty(property: Property) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PROPERTY_PREFIX + property.id, JSON.stringify(property));
}

export function loadProperty(id: string): Property | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PROPERTY_PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Property;
  } catch {
    return null;
  }
}

export function saveReportBundle(bundle: ReportBundle) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    REPORT_PREFIX + bundle.property.id,
    JSON.stringify(bundle),
  );
}

export function loadReportBundle(propertyId: string): ReportBundle | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(REPORT_PREFIX + propertyId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReportBundle;
  } catch {
    return null;
  }
}
