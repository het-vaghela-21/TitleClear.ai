import { gujreraFetchDocMetadata, gujreraFetchJson } from "./client";
import { normalizeProjectDetail, normalizeSearchResult } from "./normalize";
import type {
  AllDataByProjectIdResponse,
  DocMetadata,
  GlobalSearchResponse,
  ProjectDetailsResponse,
  ProjectDocResponse,
} from "./types";
import type {
  NormalizedRegistryRecord,
  RegistryConnector,
  RegistryQuery,
} from "../registry";

/** Trial-scale cap: enrich at most this many project matches per lookup, never the whole result set. */
const MAX_PROJECTS_TO_ENRICH = 5;

export interface GujReraConnectorDeps {
  fetchJson: (path: string, init?: RequestInit) => Promise<unknown>;
  fetchDocMetadata: (uid: string) => Promise<unknown>;
  isEnabled: () => boolean;
}

const defaultDeps: GujReraConnectorDeps = {
  fetchJson: gujreraFetchJson,
  fetchDocMetadata: gujreraFetchDocMetadata,
  isEnabled: () => process.env.RERA_CONNECTOR_ENABLED === "true",
};

function queryText(query: RegistryQuery): string {
  return query.reraRegNo || query.projectName || query.promoterName || "";
}

async function enrichProject(
  base: NormalizedRegistryRecord,
  deps: GujReraConnectorDeps,
): Promise<NormalizedRegistryRecord> {
  const id = base.entityId;

  const [allDataRes, detailRes, docRes] = await Promise.all([
    deps.fetchJson(`/project_reg/public/alldatabyprojectid/${id}`) as Promise<AllDataByProjectIdResponse>,
    deps.fetchJson(`/project_reg/public/getproject-details/${id}`) as Promise<ProjectDetailsResponse>,
    deps.fetchJson(`/project_reg/public/getproject-doc/${id}`) as Promise<ProjectDocResponse>,
  ]);

  const doc = docRes?.data?.projectdoc;
  const docMetadata: Partial<Record<"titleReport" | "titleClearance" | "encumbrance", DocMetadata>> = {};

  // Best-effort: a metadata lookup failing shouldn't fail the whole record.
  await Promise.all([
    doc?.titleReportUId
      ? deps
          .fetchDocMetadata(doc.titleReportUId)
          .then((m) => { docMetadata.titleReport = m as DocMetadata; })
          .catch(() => undefined)
      : undefined,
    doc?.titleClearanceCertificateUId
      ? deps
          .fetchDocMetadata(doc.titleClearanceCertificateUId)
          .then((m) => { docMetadata.titleClearance = m as DocMetadata; })
          .catch(() => undefined)
      : undefined,
    doc?.encumbranceCertificateDocUId
      ? deps
          .fetchDocMetadata(doc.encumbranceCertificateDocUId)
          .then((m) => { docMetadata.encumbrance = m as DocMetadata; })
          .catch(() => undefined)
      : undefined,
  ]);

  return normalizeProjectDetail({
    base,
    allData: allDataRes?.data,
    detail: detailRes?.data?.projectDetail,
    doc,
    docMetadata,
  });
}

/**
 * Builds a GujRERA connector. Production code should use the default
 * export `gujReraConnector` below; tests construct their own with fake
 * `deps` backed by saved fixtures, so nothing here ever needs to reach the
 * network or mock a module.
 */
export function createGujReraConnector(deps: GujReraConnectorDeps = defaultDeps): RegistryConnector {
  return {
    id: "gujrera",

    async fetch(query: RegistryQuery): Promise<NormalizedRegistryRecord[]> {
      if (!deps.isEnabled()) {
        throw new Error(
          "GujRERA connector is disabled. Set RERA_CONNECTOR_ENABLED=true to use it (trial only).",
        );
      }

      const text = queryText(query);
      if (!text.trim()) {
        throw new Error("RegistryQuery needs one of projectName, promoterName, or reraRegNo");
      }

      const searchRes = (await deps.fetchJson("/project_reg/public/global-search", {
        method: "POST",
        body: JSON.stringify({ query: text, startWith: 0, dataSize: 25 }),
      })) as GlobalSearchResponse;

      let results = searchRes?.data ?? [];

      if (query.reraRegNo) {
        results = results.filter((r) => r.regNo === query.reraRegNo);
      } else if (query.projectName) {
        results = results.filter((r) => r.entityType === "PROJECT");
      } else if (query.promoterName) {
        results = results.filter((r) => r.entityType === "PROMOTER");
      }

      const normalized = results.map(normalizeSearchResult);

      const projectRecords = normalized
        .filter((r) => r.entityType === "project")
        .slice(0, MAX_PROJECTS_TO_ENRICH);
      const otherRecords = normalized.filter((r) => r.entityType !== "project");

      const enrichedProjects = await Promise.all(projectRecords.map((r) => enrichProject(r, deps)));

      return [...enrichedProjects, ...otherRecords];
    },
  };
}

export const gujReraConnector: RegistryConnector = createGujReraConnector();
