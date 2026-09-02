/**
 * A state's plot-input configuration: field labels and pick-lists vary by
 * state (e.g. "Taluka" vs "Mandal", "Khata" vs "Patta"), so this is kept as
 * data rather than hardcoded into the form. Gujarat is the only state wired
 * up today; adding another state means adding another file that satisfies
 * this shape.
 */
export interface StateConfig {
  code: string; // e.g. "GJ"
  name: string;
  ruralAreaLabel: string; // e.g. "Taluka"
  khataLabel: string; // e.g. "Khata / Survey No."
  districts: string[];
  talukasByDistrict: Record<string, string[]>;
}
