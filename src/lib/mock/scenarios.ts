import type {
  Flag,
  Owner,
  RecordItem,
  RecordSourceKey,
  ScoreBand,
} from "@/lib/types";

export interface Scenario {
  key: string;
  score: number;
  band: ScoreBand;
  summary: string;
  owners: Omit<Owner, "id" | "propertyId">[];
  records: Omit<RecordItem, "id" | "propertyId">[];
  flags: Omit<Flag, "id" | "propertyId">[];
}

const recordsBySource = (
  entries: Record<RecordSourceKey, Omit<RecordItem, "id" | "propertyId">[]>,
) => Object.values(entries).flat();

export const scenarios: Scenario[] = [
  {
    key: "clear",
    score: 88,
    band: "green",
    summary:
      "Chain of title is consistent across land records and registration, taxes are current, and no pending court cases were found. One minor document is still missing.",
    owners: [
      {
        name: "Rameshbhai K. Patel",
        ownershipStart: "1998-04-11",
        ownershipEnd: "2016-07-22",
        transactionType: "Inheritance",
      },
      {
        name: "Nilesh R. Patel",
        ownershipStart: "2016-07-22",
        ownershipEnd: "2021-11-03",
        transactionType: "Sale Deed",
        documentRef: "Reg. No. 4521/2016",
      },
      {
        name: "Kavita N. Shah",
        ownershipStart: "2021-11-03",
        ownershipEnd: null,
        transactionType: "Sale Deed",
        documentRef: "Reg. No. 8830/2021",
      },
    ],
    records: recordsBySource({
      land_records: [
        { source: "land_records", label: "7/12 Extract", status: "found" },
        { source: "land_records", label: "8-A Extract", status: "found" },
        { source: "land_records", label: "Mutation Entries (Hakkpatrak)", status: "found" },
      ],
      registration: [
        { source: "registration", label: "Sale Deed (2021)", status: "found" },
        { source: "registration", label: "Encumbrance Certificate", status: "found" },
        { source: "registration", label: "Index-II", status: "missing", note: "Not yet uploaded by sub-registrar office" },
      ],
      rera: [
        { source: "rera", label: "RERA Registration", status: "found", note: "Not applicable — resale plot, no active project" },
      ],
      tax: [
        { source: "tax", label: "Property Tax Receipts (last 3 yrs)", status: "found" },
        { source: "tax", label: "Outstanding Dues Statement", status: "found", note: "No dues pending" },
      ],
      court: [
        { source: "court", label: "Civil Court Case Search", status: "found", note: "No matching cases" },
        { source: "court", label: "Revenue Tribunal Search", status: "found", note: "No matching cases" },
      ],
      map: [
        { source: "map", label: "Village Map (FMB)", status: "found" },
        { source: "map", label: "Boundary Overlay", status: "found" },
      ],
    }),
    flags: [
      {
        category: "Documentation",
        severity: "low",
        title: "Index-II copy not on file",
        description:
          "The sub-registrar's Index-II summary for the 2021 sale deed hasn't been digitised yet, though the deed itself was located.",
        recommendedNextStep: "Request a certified Index-II copy from the sub-registrar's office directly.",
      },
    ],
  },
  {
    key: "caution",
    score: 61,
    band: "amber",
    summary:
      "Ownership history has a gap that isn't fully backed by registered documents, and one prior mortgage entry appears without a clear release. Overall usable, but worth resolving before payment.",
    owners: [
      {
        name: "Bipinchandra M. Joshi",
        ownershipStart: "2003-02-18",
        ownershipEnd: "2014-09-05",
        transactionType: "Sale Deed",
        documentRef: "Reg. No. 1187/2003",
      },
      {
        name: "Joshi Family HUF",
        ownershipStart: "2014-09-05",
        ownershipEnd: "2019-01-30",
        transactionType: "Family Settlement",
        documentRef: "Unregistered — referenced in mutation entry only",
      },
      {
        name: "Sanjay B. Trivedi",
        ownershipStart: "2019-01-30",
        ownershipEnd: null,
        transactionType: "Sale Deed",
        documentRef: "Reg. No. 6602/2019",
      },
    ],
    records: recordsBySource({
      land_records: [
        { source: "land_records", label: "7/12 Extract", status: "found" },
        { source: "land_records", label: "8-A Extract", status: "found" },
        { source: "land_records", label: "Mutation Entries (Hakkpatrak)", status: "found", note: "Gap: 2014 family settlement entry not backed by a registered deed" },
      ],
      registration: [
        { source: "registration", label: "Sale Deed (2019)", status: "found" },
        { source: "registration", label: "Encumbrance Certificate", status: "found", note: "Shows a 2011 mortgage entry" },
        { source: "registration", label: "Mortgage Release Deed", status: "missing" },
      ],
      rera: [
        { source: "rera", label: "RERA Registration", status: "found", note: "Not applicable — resale plot, no active project" },
      ],
      tax: [
        { source: "tax", label: "Property Tax Receipts (last 3 yrs)", status: "found" },
        { source: "tax", label: "Outstanding Dues Statement", status: "found", note: "One quarter overdue" },
      ],
      court: [
        { source: "court", label: "Civil Court Case Search", status: "found", note: "No matching cases" },
        { source: "court", label: "Revenue Tribunal Search", status: "pending" },
      ],
      map: [
        { source: "map", label: "Village Map (FMB)", status: "found" },
        { source: "map", label: "Boundary Overlay", status: "found", note: "Minor boundary mismatch with neighbouring survey no." },
      ],
    }),
    flags: [
      {
        category: "Ownership chain",
        severity: "medium",
        title: "Unregistered family settlement in the chain",
        description:
          "The 2014 transfer within the Joshi family was recorded as a mutation entry but has no registered deed backing it, which weakens the ownership chain at that link.",
        recommendedNextStep: "Ask the seller for the underlying family settlement document, or a certified copy from the revenue office.",
      },
      {
        category: "Encumbrance",
        severity: "medium",
        title: "Mortgage entry without a release deed on file",
        description:
          "A 2011 mortgage against this plot appears on the Encumbrance Certificate, but no release/discharge deed was found confirming it was repaid and cleared.",
        recommendedNextStep: "Get written confirmation from the lender (or a registered release deed) that the mortgage was closed.",
      },
      {
        category: "Tax",
        severity: "low",
        title: "One quarter of property tax overdue",
        description: "The latest dues statement shows one outstanding quarterly payment.",
        recommendedNextStep: "Ask the seller to clear the outstanding amount before registration, or adjust it at settlement.",
      },
    ],
  },
  {
    key: "risk",
    score: 34,
    band: "red",
    summary:
      "A pending civil suit references this survey number and the ownership chain has a disputed transfer. Treat this as high-risk until an advocate reviews the case file.",
    owners: [
      {
        name: "Manharlal D. Desai",
        ownershipStart: "1991-06-02",
        ownershipEnd: "2010-03-14",
        transactionType: "Inheritance",
      },
      {
        name: "Desai Brothers (jointly)",
        ownershipStart: "2010-03-14",
        ownershipEnd: "2020-08-19",
        transactionType: "Partition Deed",
        documentRef: "Reg. No. 2290/2010",
      },
      {
        name: "Ashokbhai D. Desai",
        ownershipStart: "2020-08-19",
        ownershipEnd: null,
        transactionType: "Sale Deed",
        documentRef: "Reg. No. 9114/2020 — disputed by co-heir",
      },
    ],
    records: recordsBySource({
      land_records: [
        { source: "land_records", label: "7/12 Extract", status: "found", note: "Entry disputed — objection noted in remarks column" },
        { source: "land_records", label: "8-A Extract", status: "found" },
        { source: "land_records", label: "Mutation Entries (Hakkpatrak)", status: "found" },
      ],
      registration: [
        { source: "registration", label: "Sale Deed (2020)", status: "found" },
        { source: "registration", label: "Encumbrance Certificate", status: "found" },
        { source: "registration", label: "Partition Deed (2010)", status: "found", note: "One co-heir's signature contested" },
      ],
      rera: [
        { source: "rera", label: "RERA Registration", status: "found", note: "Not applicable — resale plot, no active project" },
      ],
      tax: [
        { source: "tax", label: "Property Tax Receipts (last 3 yrs)", status: "found" },
        { source: "tax", label: "Outstanding Dues Statement", status: "missing" },
      ],
      court: [
        { source: "court", label: "Civil Court Case Search", status: "found", note: "Active suit: Civil Suit No. 214/2022, partition dispute" },
        { source: "court", label: "Revenue Tribunal Search", status: "found", note: "No matching cases" },
      ],
      map: [
        { source: "map", label: "Village Map (FMB)", status: "found" },
        { source: "map", label: "Boundary Overlay", status: "pending" },
      ],
    }),
    flags: [
      {
        category: "Litigation",
        severity: "high",
        title: "Active civil suit references this survey number",
        description:
          "Civil Suit No. 214/2022 is pending before the civil court and names this survey number in a partition dispute among heirs.",
        recommendedNextStep: "Do not proceed to payment until an advocate reviews the case file and its current status.",
      },
      {
        category: "Ownership chain",
        severity: "high",
        title: "2020 sale disputed by a co-heir",
        description:
          "One of the co-heirs from the 2010 partition has contested the 2020 sale deed, meaning the current owner's title may not be undisputed.",
        recommendedNextStep: "Ask the seller for a no-objection or settlement from all co-heirs before proceeding.",
      },
      {
        category: "Tax",
        severity: "low",
        title: "Outstanding dues statement not available",
        description: "The municipal record for outstanding dues could not be retrieved.",
        recommendedNextStep: "Request a manual dues certificate from the local tax office.",
      },
    ],
  },
];

export function scenarioForSeed(seed: string): Scenario {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return scenarios[hash % scenarios.length];
}
