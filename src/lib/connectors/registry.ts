/**
 * Interface for real, external registry lookups (government portals, etc.),
 * as distinct from `SourceConnector` (types.ts) which drives the mock
 * per-property report pipeline. A registry connector answers a one-off
 * search — "find this project/promoter/registration number" — and returns
 * normalized records; it doesn't know about our `Property` shape.
 *
 * Kept intentionally minimal per the GujRERA trial: fetch(query) -> records.
 */

export interface RegistryQuery {
  projectName?: string;
  promoterName?: string;
  reraRegNo?: string;
}

export type RegistryEntityType = "project" | "promoter" | "agent" | "other";

/**
 * A link to a disclosed document (title report, EC, etc.). We only ever
 * capture the link + metadata here — the connector must not download the
 * document itself.
 */
export interface RegistryDocumentLink {
  kind:
    | "registration_certificate"
    | "title_report"
    | "title_clearance_certificate"
    | "encumbrance_certificate";
  fileName?: string;
  mimeType?: string;
  issuedOn?: string;
  issuerName?: string;
  /** Metadata endpoint for this document — safe to call, returns filename/size/etc, not the file. */
  metadataUrl: string;
  /** Where the actual file lives. Recorded for later use; never fetched by this connector. */
  downloadUrl: string;
}

export interface NormalizedRegistryRecord {
  source: string; // e.g. "gujrera"
  entityType: RegistryEntityType;
  entityId: string;
  projectName?: string;
  promoterName?: string;
  reraRegNo?: string;
  registrationStatus?: string;
  district?: string;
  projectType?: string;
  registrationDate?: string; // ISO date, if known
  completionDate?: string; // ISO date, if known
  address?: string;
  contact?: { email?: string; mobile?: string };
  documents: RegistryDocumentLink[];
  retrievedAt: string;
}

export interface RegistryConnector {
  id: string;
  fetch(query: RegistryQuery): Promise<NormalizedRegistryRecord[]>;
}

/**
 * Thrown when the connector hits a captcha, login wall, or anything that
 * looks like bot-detection. Per the trial's hard constraint, connectors
 * must never try to solve or work around these — they throw this instead
 * so the caller can surface a "needs manual handling" error.
 */
export class ManualHandlingRequiredError extends Error {
  constructor(reason: string) {
    super(`GujRERA connector needs manual handling: ${reason}`);
    this.name = "ManualHandlingRequiredError";
  }
}
