import {
  gujreraDocDownloadUrl,
  gujreraDocMetadataUrl,
} from "./client";
import type {
  AllDataByProjectId,
  DocMetadata,
  GlobalSearchResult,
  ProjectDetail,
  ProjectDoc,
} from "./types";
import type { NormalizedRegistryRecord, RegistryDocumentLink } from "../registry";

/** "12-02-2024" -> "2024-02-12". Passes through values already in ISO form. */
function toIsoDate(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const m = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return undefined;
}

function entityTypeFrom(raw: string): NormalizedRegistryRecord["entityType"] {
  if (raw === "PROJECT") return "project";
  if (raw === "PROMOTER") return "promoter";
  if (raw === "AGENT") return "agent";
  return "other";
}

/** Maps one row from /global-search into a normalized record with no detail/doc data yet. */
export function normalizeSearchResult(result: GlobalSearchResult): NormalizedRegistryRecord {
  return {
    source: "gujrera",
    entityType: entityTypeFrom(result.entityType),
    entityId: String(result.entityId),
    projectName: result.entityType === "PROJECT" ? result.entityName : undefined,
    promoterName: result.entityType === "PROMOTER" ? result.entityName : undefined,
    reraRegNo: result.regNo || undefined,
    district: result.distName,
    projectType: result.ptype,
    address: result.address,
    contact: { email: result.emailId || undefined, mobile: result.mobileNo || undefined },
    documents: [],
    retrievedAt: new Date().toISOString(),
  };
}

function docLink(
  kind: RegistryDocumentLink["kind"],
  uid: string | undefined,
  issuedOn: string | undefined,
  issuerName: string | undefined,
  metadata: DocMetadata | undefined,
): RegistryDocumentLink | undefined {
  if (!uid) return undefined;
  return {
    kind,
    fileName: metadata?.fileName,
    mimeType: metadata?.mimeType,
    issuedOn: toIsoDate(issuedOn) ?? issuedOn,
    issuerName,
    metadataUrl: gujreraDocMetadataUrl(uid),
    downloadUrl: gujreraDocDownloadUrl(uid),
  };
}

/**
 * Combines the search result with the richer per-project lookups
 * (alldatabyprojectid, getproject-details, getproject-doc) into one
 * normalized record. Document metadata is optional — pass it in when
 * available; the connector fetches it best-effort.
 */
export function normalizeProjectDetail(params: {
  base: NormalizedRegistryRecord;
  allData?: AllDataByProjectId;
  detail?: ProjectDetail;
  doc?: ProjectDoc;
  docMetadata?: Partial<Record<"titleReport" | "titleClearance" | "encumbrance", DocMetadata>>;
}): NormalizedRegistryRecord {
  const { base, allData, detail, doc, docMetadata } = params;

  const documents: RegistryDocumentLink[] = [];
  if (allData?.certificateUid) {
    const link = docLink(
      "registration_certificate",
      allData.certificateUid,
      allData.approvedDate,
      undefined,
      undefined,
    );
    if (link) documents.push(link);
  }
  if (doc) {
    const titleReport = docLink(
      "title_report",
      doc.titleReportUId,
      doc.titleReportIssueDate,
      doc.titleReportIssuerName,
      docMetadata?.titleReport,
    );
    if (titleReport) documents.push(titleReport);

    const titleClearance = docLink(
      "title_clearance_certificate",
      doc.titleClearanceCertificateUId,
      doc.titleClearanceCertificateIssuanceDate,
      doc.titleClearanceCertificateIssuerName,
      docMetadata?.titleClearance,
    );
    if (titleClearance) documents.push(titleClearance);

    const encumbrance = docLink(
      "encumbrance_certificate",
      doc.encumbranceCertificateDocUId,
      doc.encumbranceCertificateDocIssuanceDate,
      doc.encumbranceCertificateDocIssuerName,
      docMetadata?.encumbrance,
    );
    if (encumbrance) documents.push(encumbrance);
  }

  return {
    ...base,
    projectName: detail?.projectName ?? allData?.projectName ?? base.projectName,
    promoterName: allData?.promoterName ?? base.promoterName,
    reraRegNo: allData?.projRegNo ?? base.reraRegNo,
    registrationStatus: detail?.projectStatus,
    district: detail?.distName ?? base.district,
    projectType: detail?.projectType ?? allData?.projectType ?? base.projectType,
    registrationDate: toIsoDate(allData?.approvedDate),
    completionDate: toIsoDate(detail?.completionDate) ?? detail?.completionDate,
    address:
      detail?.projectAddress || detail?.projectAddress2
        ? [detail.projectAddress, detail.projectAddress2].filter(Boolean).join(", ")
        : base.address,
    contact: {
      email: allData?.promoterEmailId ?? base.contact?.email,
      mobile: allData?.promoterMobileNo ?? base.contact?.mobile,
    },
    documents,
    retrievedAt: new Date().toISOString(),
  };
}
