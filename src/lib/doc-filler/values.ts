import type { DocTemplate, FieldValues, GroupEntry } from "./types";
import { isGroup } from "./types";

/** Blank draft for a template: defaults applied, min entries per group. */
export function initialValues(template: DocTemplate): FieldValues {
  const values: FieldValues = {};
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (isGroup(field)) {
        const entries: GroupEntry[] = [];
        for (let i = 0; i < field.min; i++) entries.push({});
        values[field.id] = entries;
      } else if (field.defaultValue !== undefined) {
        values[field.id] = field.defaultValue;
      }
    }
  }
  return values;
}

/** Count of required fields still empty — used for the completeness meter. */
export function missingRequired(template: DocTemplate, values: FieldValues): number {
  let missing = 0;
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (isGroup(field)) {
        const entries = Array.isArray(values[field.id]) ? (values[field.id] as GroupEntry[]) : [];
        for (const entry of entries) {
          for (const sub of field.fields) {
            if (sub.required && !(entry[sub.id] ?? "").trim()) missing++;
          }
        }
      } else if (field.required) {
        const v = values[field.id];
        if (typeof v !== "string" || v.trim() === "") missing++;
      }
    }
  }
  return missing;
}
