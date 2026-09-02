import type { ExtractedFields } from "../types";

export interface SyntheticField {
  labelEn: string;
  labelGu: string;
  key: keyof ExtractedFields;
  value: string;
}

export interface SyntheticDoc {
  id: string;
  docType: string;
  titleEn: string;
  titleGu: string;
  fields: SyntheticField[];
}

const VILLAGES = ["Kalol", "Bavla", "Sanand", "Mehsana", "Anand"];
const DISTRICTS = ["Ahmedabad", "Gandhinagar", "Mehsana", "Anand", "Vadodara"];
const OWNER_NAMES_GU = ["રમેશભાઈ પટેલ", "સુરેશભાઈ શાહ", "કિરણ મોદી", "જયેશ ઠાકોર", "હેતલ વાઘેલા"];
const OWNER_NAMES_EN = ["Ramesh Patel", "Suresh Shah", "Kiran Modi", "Jayesh Thakor", "Hetal Vaghela"];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

/**
 * Generates deterministic synthetic RoR (7/12 extract) and Index-2-style
 * documents mixing Gujarati and English labels/values. `seed` controls
 * which sample values are used so the set is reproducible.
 */
export function buildSyntheticDoc(seed: number): SyntheticDoc {
  const isRor = seed % 2 === 0;
  const docType = isRor ? "7/12 Extract" : "Index-2";
  const surveyNo = `${100 + (seed % 400)}/${1 + (seed % 9)}`;
  const khataNo = `${2000 + (seed % 900)}`;
  const village = pick(VILLAGES, seed);
  const district = pick(DISTRICTS, seed + 1);
  const ownerEn = pick(OWNER_NAMES_EN, seed);
  const ownerGu = pick(OWNER_NAMES_GU, seed);
  const areaValue = (0.5 + (seed % 20) * 0.25).toFixed(2);
  const areaUnit = seed % 2 === 0 ? "acre" : "guntha";
  const day = 1 + (seed % 27);
  const month = 1 + (seed % 12);
  const year = 2015 + (seed % 10);
  const date = `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
  const transactionType = seed % 3 === 0 ? "Sale Deed" : seed % 3 === 1 ? "Gift Deed" : "Inheritance";

  const fields: SyntheticField[] = [
    { labelEn: "Document Type", labelGu: "દસ્તાવેજનો પ્રકાર", key: "docType", value: docType },
    { labelEn: "Owner Name", labelGu: "માલિકનું નામ", key: "ownerName", value: `${ownerEn} / ${ownerGu}` },
    { labelEn: "Survey No", labelGu: "સર્વે નંબર", key: "surveyNo", value: surveyNo },
    { labelEn: "Khata No", labelGu: "ખાતા નંબર", key: "khataNo", value: khataNo },
    { labelEn: "Village", labelGu: "ગામ", key: "village", value: village },
    { labelEn: "District", labelGu: "જિલ્લો", key: "district", value: district },
    { labelEn: "Area", labelGu: "ક્ષેત્રફળ", key: "areaValue", value: `${areaValue} ${areaUnit}` },
    { labelEn: "Date", labelGu: "તારીખ", key: "transactionDate", value: date },
    { labelEn: "Transaction Type", labelGu: "વ્યવહારનો પ્રકાર", key: "transactionType", value: transactionType },
  ];

  return {
    id: `synthetic-${String(seed).padStart(3, "0")}`,
    docType,
    titleEn: isRor ? "Record of Rights (7/12 Extract)" : "Index-2 Registration Extract",
    titleGu: isRor ? "હક્ક પત્રક (૭/૧૨ ઉતારો)" : "ઈન્ડેક્સ-૨ નોંધણી ઉતારો",
    fields,
  };
}

/** Plain-text reconstruction of what's rendered onto the image, for CER scoring. */
export function referenceText(doc: SyntheticDoc): string {
  const lines = [doc.titleGu, doc.titleEn];
  for (const f of doc.fields) {
    lines.push(f.labelGu, `(${f.labelEn})`, `${f.labelEn} : ${f.value}`);
  }
  return lines.join("\n");
}

/** Ground-truth fields matching ExtractedFields, for scoring the harness. */
export function groundTruthFields(doc: SyntheticDoc): ExtractedFields {
  const out: ExtractedFields = { docType: doc.docType };
  for (const f of doc.fields) {
    if (f.key === "areaValue") {
      const [value, unit] = f.value.split(" ");
      out.areaValue = parseFloat(value);
      out.areaUnit = unit;
    } else if (f.key === "transactionDate") {
      const [d, m, y] = f.value.split("-");
      out.transactionDate = `${y}-${m}-${d}`;
    } else if (f.key === "ownerName") {
      out.ownerName = f.value.split(" / ")[0];
    } else {
      (out as Record<string, unknown>)[f.key] = f.value;
    }
  }
  return out;
}
