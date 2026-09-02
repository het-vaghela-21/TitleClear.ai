/**
 * Field sections shared across deed templates: party groups (name, age,
 * occupation, address…) and the property schedule. Templates compose these
 * instead of redefining them, so party/property handling stays consistent.
 */

import type { FieldDef, FieldGroup, FormSection, LText } from "./types";

/** Standard sub-fields describing one party to a deed. */
export function partyFields(opts?: { withPan?: boolean; withAadhaar?: boolean }): FieldDef[] {
  const fields: FieldDef[] = [
    {
      id: "name",
      kind: "text",
      label: { en: "Full name", gu: "પૂરું નામ" },
      placeholder: { en: "e.g. Rameshbhai Ambalal Patel", gu: "દા.ત. રમેશભાઈ અંબાલાલ પટેલ" },
      required: true,
      gujarati: true,
    },
    {
      id: "age",
      kind: "number",
      label: { en: "Age (years)", gu: "ઉંમર (વર્ષ)" },
      placeholder: { en: "e.g. 45", gu: "દા.ત. ૪૫" },
      required: true,
    },
    {
      id: "occupation",
      kind: "text",
      label: { en: "Occupation", gu: "ધંધો" },
      placeholder: { en: "e.g. business / farming / service", gu: "દા.ત. ધંધો / ખેતી / નોકરી" },
      gujarati: true,
    },
    {
      id: "caste",
      kind: "text",
      label: { en: "Community / caste (as on record)", gu: "જ્ઞાતિ (રેકોર્ડ મુજબ)" },
      help: {
        en: "Deeds in Gujarat customarily mention it; leave empty to omit.",
        gu: "ગુજરાતના દસ્તાવેજોમાં રિવાજ મુજબ લખાય છે; ન લખવું હોય તો ખાલી રાખો.",
      },
      gujarati: true,
    },
    {
      id: "address",
      kind: "textarea",
      label: { en: "Residential address", gu: "રહેઠાણનું સરનામું" },
      placeholder: {
        en: "House / street, village or city, taluka, district",
        gu: "મકાન / શેરી, ગામ કે શહેર, તાલુકો, જિલ્લો",
      },
      required: true,
      gujarati: true,
      colSpan: 2,
    },
  ];
  if (opts?.withPan) {
    fields.push({
      id: "pan",
      kind: "text",
      label: { en: "PAN", gu: "પાન નંબર" },
      placeholder: { en: "ABCDE1234F", gu: "ABCDE1234F" },
      help: {
        en: "Required for registration when consideration exceeds Rs. 10 lakh.",
        gu: "અવેજ રૂ. ૧૦ લાખથી વધુ હોય ત્યારે નોંધણી માટે જરૂરી.",
      },
    });
  }
  if (opts?.withAadhaar) {
    fields.push({
      id: "aadhaar",
      kind: "text",
      label: { en: "Aadhaar no. (optional)", gu: "આધાર નંબર (વૈકલ્પિક)" },
      placeholder: { en: "XXXX XXXX XXXX", gu: "XXXX XXXX XXXX" },
      help: {
        en: "The model drafts identify parties by Aadhaar; leave empty to omit.",
        gu: "મોડેલ ડ્રાફ્ટમાં પક્ષકારની ઓળખ આધારથી અપાય છે; ન લખવો હોય તો ખાલી રાખો.",
      },
    });
    fields.push({
      id: "mobile",
      kind: "text",
      label: { en: "Mobile no. (optional)", gu: "મોબાઈલ નંબર (વૈકલ્પિક)" },
      placeholder: { en: "98XXXXXXXX", gu: "98XXXXXXXX" },
    });
  }
  return fields;
}

/**
 * Party introduction line in the model-draft style:
 * "નામ, ઉ.વ.આ. ૪૫, ધંધો: ખેતી, રહેવાસી: …, આધાર કાર્ડ નં. …, પાન કાર્ડ નં. …, મોબાઈલ નં. …"
 * Optional identifiers are appended only when filled.
 */
export function partyLine(
  p: {
    t: (id: string, blank?: string) => string;
    age: (id: string) => string;
    has: (id: string) => boolean;
  },
  lang: "gu" | "en",
): string {
  if (lang === "gu") {
    let line = `${p.t("name")}, ${p.age("age")}, ધંધો: ${p.t("occupation")}`;
    if (p.has("caste")) line += `, જ્ઞાતિ: ${p.t("caste")}`;
    line += `, રહેવાસી: ${p.t("address")}`;
    if (p.has("aadhaar")) line += `, આધાર કાર્ડ નં. ${p.t("aadhaar")}`;
    if (p.has("pan")) line += `, પાન કાર્ડ નં. ${p.t("pan")}`;
    if (p.has("mobile")) line += `, મોબાઈલ નં. ${p.t("mobile")}`;
    return line;
  }
  let line = `${p.t("name")}, ${p.age("age")}, occupation: ${p.t("occupation")}`;
  if (p.has("caste")) line += `, community: ${p.t("caste")}`;
  line += `, residing at ${p.t("address")}`;
  if (p.has("aadhaar")) line += `, Aadhaar no. ${p.t("aadhaar")}`;
  if (p.has("pan")) line += `, PAN ${p.t("pan")}`;
  if (p.has("mobile")) line += `, mobile ${p.t("mobile")}`;
  return line;
}

/** A repeating party group, e.g. sellers (1–4) or buyers (1–4). */
export function partyGroup(
  id: string,
  entryLabel: LText,
  opts?: {
    min?: number;
    max?: number;
    withPan?: boolean;
    withAadhaar?: boolean;
    addLabel?: LText;
  },
): FieldGroup {
  return {
    id,
    kind: "group",
    entryLabel,
    addLabel: opts?.addLabel,
    min: opts?.min ?? 1,
    max: opts?.max ?? 4,
    fields: partyFields({ withPan: opts?.withPan, withAadhaar: opts?.withAadhaar }),
  };
}

/** Witness group used by every registrable deed (two witnesses standard). */
export function witnessGroup(): FieldGroup {
  return {
    id: "witnesses",
    kind: "group",
    entryLabel: { en: "Witness", gu: "સાક્ષી" },
    addLabel: { en: "Add witness", gu: "સાક્ષી ઉમેરો" },
    min: 2,
    max: 3,
    fields: [
      {
        id: "name",
        kind: "text",
        label: { en: "Full name", gu: "પૂરું નામ" },
        required: true,
        gujarati: true,
      },
      {
        id: "address",
        kind: "text",
        label: { en: "Address (short)", gu: "સરનામું (ટૂંકમાં)" },
        gujarati: true,
      },
    ],
  };
}

/** The property-schedule section shared by immovable-property deeds. */
export function propertySection(opts?: {
  titleOverride?: LText;
  /** Set false for documents where the property block is optional (e.g. POA). */
  required?: boolean;
}): FormSection {
  const req = opts?.required ?? true;
  const section: FormSection = {
    id: "property",
    title: opts?.titleOverride ?? { en: "Property details", gu: "મિલકતની વિગત" },
    description: {
      en: "Exactly as on the 7/12 extract, property card or index-2 — this becomes the schedule of the deed.",
      gu: "૭/૧૨, પ્રોપર્ટી કાર્ડ કે ઇન્ડેક્સ-૨ મુજબ — આ વિગત દસ્તાવેજના મિલકત વર્ણનમાં આવશે.",
    },
    fields: [
      {
        id: "propVillage",
        kind: "text",
        label: { en: "Village / city (mouje)", gu: "મોજે ગામ / શહેર" },
        placeholder: { en: "e.g. Mouje Bavla", gu: "દા.ત. મોજે બાવળા" },
        required: true,
        gujarati: true,
      },
      {
        id: "propTaluka",
        kind: "text",
        label: { en: "Taluka", gu: "તાલુકો" },
        required: true,
        gujarati: true,
      },
      {
        id: "propDistrict",
        kind: "text",
        label: { en: "District", gu: "જિલ્લો" },
        required: true,
        gujarati: true,
      },
      {
        id: "propSubDistrict",
        kind: "text",
        label: { en: "Sub-district (registration)", gu: "પેટા/સબ ડિસ્ટ્રિક્ટ (નોંધણી)" },
        help: {
          en: "The sub-registrar office area, e.g. 'Sub-District Sanand'.",
          gu: "સબ રજિસ્ટ્રાર કચેરીનો વિસ્તાર, દા.ત. 'સબ ડિસ્ટ્રિક્ટ સાણંદ'.",
        },
        gujarati: true,
      },
      {
        id: "surveyNo",
        kind: "text",
        label: { en: "Survey / block no.", gu: "સર્વે / બ્લોક નંબર" },
        placeholder: { en: "e.g. 142/2", gu: "દા.ત. ૧૪૨/૨" },
        required: true,
      },
      {
        id: "khataNo",
        kind: "text",
        label: { en: "Khata no. (computerised)", gu: "ખાતા નંબર (કોમ્પ્યુટરાઈઝ્ડ)" },
        placeholder: { en: "e.g. 88", gu: "દા.ત. ૮૮" },
      },
      {
        id: "akar",
        kind: "text",
        label: { en: "Assessment (aakar, Rs.)", gu: "આકાર (રૂ. પૈસા)" },
        placeholder: { en: "e.g. 12.50", gu: "દા.ત. ૧૨.૫૦" },
        help: {
          en: "The revenue assessment shown on the 7/12 — mainly for agricultural land.",
          gu: "૭/૧૨ પર દર્શાવેલ મહેસૂલી આકાર — મુખ્યત્વે ખેતીની જમીન માટે.",
        },
      },
      {
        id: "cityMeta",
        kind: "text",
        label: { en: "TP / FP / city survey no. (if urban)", gu: "ટી.પી. / એફ.પી. / સીટી સર્વે નં. (શહેરી હોય તો)" },
        placeholder: { en: "e.g. TP 4, FP 88", gu: "દા.ત. ટી.પી. ૪, એફ.પી. ૮૮" },
      },
      {
        id: "area",
        kind: "text",
        label: { en: "Area (with unit)", gu: "ક્ષેત્રફળ (એકમ સાથે)" },
        placeholder: { en: "e.g. 250 sq.m. / 2 acre 3 guntha", gu: "દા.ત. ૨૫૦ ચો.મી. / ૨ એકર ૩ ગુંઠા" },
        required: true,
        gujarati: true,
      },
      {
        id: "propDescription",
        kind: "textarea",
        label: { en: "Description (construction, khata etc.)", gu: "વર્ણન (બાંધકામ, ખાતા નં. વગેરે)" },
        placeholder: {
          en: "e.g. non-agricultural open plot with compound wall, khata no. 88",
          gu: "દા.ત. બિનખેતી ખુલ્લો પ્લોટ, ફરતે કમ્પાઉન્ડ વોલ, ખાતા નં. ૮૮",
        },
        gujarati: true,
        colSpan: 2,
      },
      {
        id: "boundEast",
        kind: "text",
        label: { en: "Boundary — East", gu: "ચતુર્દિશા — પૂર્વે" },
        placeholder: { en: "e.g. survey no. 143", gu: "દા.ત. સર્વે નં. ૧૪૩" },
        gujarati: true,
      },
      {
        id: "boundWest",
        kind: "text",
        label: { en: "Boundary — West", gu: "ચતુર્દિશા — પશ્ચિમે" },
        gujarati: true,
      },
      {
        id: "boundNorth",
        kind: "text",
        label: { en: "Boundary — North", gu: "ચતુર્દિશા — ઉત્તરે" },
        gujarati: true,
      },
      {
        id: "boundSouth",
        kind: "text",
        label: { en: "Boundary — South", gu: "ચતુર્દિશા — દક્ષિણે" },
        gujarati: true,
      },
    ],
  };
  if (!req) {
    section.fields = section.fields.map((f) =>
      "required" in f ? { ...f, required: false } : f,
    );
  }
  return section;
}
