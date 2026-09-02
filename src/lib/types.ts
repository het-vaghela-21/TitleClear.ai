export type AreaKind = "rural" | "urban";

export type LandType = "agricultural" | "non-agricultural";

export type AreaUnit = "sq_m" | "sq_ft" | "acre" | "guntha" | "bigha";

/**
 * A plot as entered by the user. `state` is kept as a field (not hardcoded)
 * so more states can be added later without changing this shape.
 */
export interface Property {
  id: string;
  state: string; // e.g. "GJ"
  areaKind: AreaKind;
  district: string;
  taluka?: string; // rural
  village?: string; // rural
  ward?: string; // urban
  citySurveyArea?: string; // urban
  surveyNo?: string;
  fpNo?: string; // final plot no. (town planning scheme)
  khataNo?: string;
  ownerNameRef?: string; // optional, reference only, not required
  landType: LandType;
  areaValue?: number;
  areaUnit?: AreaUnit;
  createdAt: string;
}

export interface Owner {
  id: string;
  propertyId: string;
  name: string;
  ownershipStart: string; // ISO date
  ownershipEnd: string | null; // null = current owner
  transactionType: string; // e.g. "Sale Deed", "Inheritance", "Gift Deed"
  documentRef?: string;
}

export type RecordSourceKey =
  | "land_records"
  | "registration"
  | "rera"
  | "tax"
  | "court"
  | "map";

export type RecordStatus = "found" | "missing" | "pending";

export interface RecordItem {
  id: string;
  propertyId: string;
  source: RecordSourceKey;
  label: string;
  status: RecordStatus;
  retrievedAt?: string;
  note?: string;
}

export type FlagSeverity = "low" | "medium" | "high";

export interface Flag {
  id: string;
  propertyId: string;
  category: string;
  severity: FlagSeverity;
  title: string;
  description: string;
  recommendedNextStep: string;
}

export type ScoreBand = "green" | "amber" | "red";

export interface Report {
  id: string;
  propertyId: string;
  titleClearScore: number; // 0-100
  band: ScoreBand;
  generatedAt: string;
  status: "processing" | "ready";
  summary: string;
}

export interface ReportBundle {
  property: Property;
  report: Report;
  owners: Owner[];
  records: RecordItem[];
  flags: Flag[];
}
