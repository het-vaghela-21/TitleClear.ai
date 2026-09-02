/**
 * Shapes observed from the live GujRERA 2.0 public endpoints during the
 * trial investigation (see NOTES.md). These are partial — only the fields
 * this connector actually reads — since the real responses carry many more
 * fields we don't need.
 */

export interface GlobalSearchResult {
  entityId: number;
  entityType: "PROJECT" | "PROMOTER" | "AGENT" | "ARCHITECT" | "ENGINEER" | "LAWYER" | "CA" | string;
  entityName: string;
  description?: string;
  ptype?: string;
  distName?: string;
  distCode?: string;
  taluka?: string;
  pinCode?: string;
  address?: string;
  mobileNo?: string;
  emailId?: string;
  pdate?: string; // e.g. "13/07/2022 - 31/12/2028"
  regNo?: string;
  imageUid?: string | null;
}

export interface GlobalSearchResponse {
  status: number;
  message: string;
  data: GlobalSearchResult[];
  totalPages: number;
}

export interface ProjectDetail {
  id: number;
  prjRegId: number;
  projectName: string;
  projectType: string;
  startDate?: string;
  completionDate?: string;
  projectStatus?: string;
  projectDesc?: string;
  projectAddress?: string;
  projectAddress2?: string;
  distName?: string;
  subDistName?: string;
  pinCode?: string;
}

export interface ProjectDetailsResponse {
  status: number;
  message: string;
  data: {
    projectDetail: ProjectDetail;
  };
}

export interface AllDataByProjectId {
  projRegId: number;
  projRegNo: string;
  projectAckNo: string;
  projectName: string;
  projectType: string;
  promoterId: number;
  promoterName: string;
  promoterType?: string;
  promoterEmailId?: string;
  promoterMobileNo?: string;
  approvedDate?: string; // "DD-MM-YYYY"
  certificateUid?: string;
}

export interface AllDataByProjectIdResponse {
  status: number;
  message: string;
  data: AllDataByProjectId;
}

/**
 * `getproject-doc` returns two sibling objects under `data`: `findoc`
 * (financial statements — balance sheets, P&L, cash flow) and `projectdoc`
 * (the disclosure documents we actually care about: title report, title
 * clearance certificate, encumbrance certificate). Easy to mix up since
 * both exist — we only read `projectdoc`.
 */
export interface ProjectDoc {
  titleReportId?: number;
  titleReportUId?: string;
  titleReportIssueDate?: string;
  titleReportIssuerName?: string;
  titleClearanceCertificateId?: number;
  titleClearanceCertificateUId?: string;
  titleClearanceCertificateIssuanceDate?: string;
  titleClearanceCertificateIssuerName?: string;
  encumbranceCertificateDocId?: number;
  encumbranceCertificateDocUId?: string;
  encumbranceCertificateDocIssuanceDate?: string;
  encumbranceCertificateDocIssuerName?: string;
}

export interface ProjectDocResponse {
  status: number;
  message: string;
  data: {
    findoc: Record<string, unknown>;
    projectdoc: ProjectDoc;
  };
}

export interface DocMetadata {
  documentId: number;
  fileName: string;
  mimeType: string;
  uploadedOn: string;
  totalPages?: number;
  uid: string;
}
