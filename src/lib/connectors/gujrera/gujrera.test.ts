import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createGujReraConnector, type GujReraConnectorDeps } from "./connector";
import { ManualHandlingRequiredError } from "../registry";

const FIXTURES_DIR = path.join(process.cwd(), "src/lib/connectors/gujrera/fixtures");

async function loadFixture(name: string): Promise<unknown> {
  const raw = await readFile(path.join(FIXTURES_DIR, name), "utf8");
  return JSON.parse(raw);
}

/** A fetchJson fake that serves saved fixtures instead of the network, keyed by path shape. */
function fixtureFetchJson(urlPath: string): Promise<unknown> {
  if (urlPath === "/project_reg/public/global-search") {
    return loadFixture("global-search-shivalik.json");
  }
  if (urlPath === "/project_reg/public/alldatabyprojectid/17020") {
    return loadFixture("alldata-17020.json");
  }
  if (urlPath === "/project_reg/public/getproject-details/17020") {
    return loadFixture("project-details-17020.json");
  }
  if (urlPath === "/project_reg/public/getproject-doc/17020") {
    return loadFixture("project-doc-17020.json");
  }
  throw new Error(`No fixture wired up for ${urlPath}`);
}

function fixtureFetchDocMetadata(uid: string): Promise<unknown> {
  if (uid === "P2BPiDWn86g0h92a1uq0SPqqXu8zMbkiBlzKhhugMuzDkrBG29gWA7X8HMbzd1lg2lBJhhCgAe") {
    return loadFixture("doc-metadata-title-report.json");
  }
  if (uid === "43aPACWm86gihqraV7qURPpUXgazddk8FlPKhhJgyvzEhr8a2e9WS7X8XMrHdiggEBBSzhkoA7") {
    return loadFixture("doc-metadata-encumbrance.json");
  }
  return Promise.reject(new Error(`No fixture wired up for doc uid ${uid}`));
}

function fakeDeps(overrides: Partial<GujReraConnectorDeps> = {}): GujReraConnectorDeps {
  return {
    fetchJson: fixtureFetchJson,
    fetchDocMetadata: fixtureFetchDocMetadata,
    isEnabled: () => true,
    ...overrides,
  };
}

test("fetch() by project name returns an enriched, normalized project record", async () => {
  const connector = createGujReraConnector(fakeDeps());
  const records = await connector.fetch({ projectName: "Shivalik" });

  assert.equal(records.length, 1);
  const [record] = records;

  assert.equal(record.entityType, "project");
  assert.equal(record.projectName, "AALEKH BUNGALOWS - A");
  assert.equal(record.promoterName, "AALEKH ENTERPRISE");
  assert.equal(record.reraRegNo, "PR/GJ/SURAT/SURAT CITY/SUDA/PAA12907/120224/311228");
  assert.equal(record.registrationStatus, "New");
  assert.equal(record.district, "Surat");
  assert.equal(record.projectType, "Plotted Development");
  assert.equal(record.registrationDate, "2024-02-12");
  assert.equal(record.completionDate, "2028-12-31");
  assert.equal(record.contact?.email, "aalekhenterprise.utran@gmail.com");

  assert.equal(record.documents.length, 4);
  const kinds = record.documents.map((d) => d.kind).sort();
  assert.deepEqual(kinds, [
    "encumbrance_certificate",
    "registration_certificate",
    "title_clearance_certificate",
    "title_report",
  ]);

  const titleReport = record.documents.find((d) => d.kind === "title_report");
  assert.ok(titleReport);
  assert.equal(titleReport?.fileName, "TITLE CLEAR REPORT-AALEKH.pdf");
  assert.equal(titleReport?.mimeType, "application/pdf");
  assert.ok(titleReport?.metadataUrl.includes("/vdms/getDocMetadata/"));
  assert.ok(titleReport?.downloadUrl.includes("/vdms/download/"));

  const encumbrance = record.documents.find((d) => d.kind === "encumbrance_certificate");
  assert.ok(encumbrance);
  assert.equal(encumbrance?.fileName, "ENCRAMBRANCE CERTI-AALEKH.pdf");
});

test("fetch() by reraRegNo filters to the exact matching project", async () => {
  const connector = createGujReraConnector(fakeDeps());
  const records = await connector.fetch({
    reraRegNo: "PR/GJ/SURAT/SURAT CITY/SUDA/PAA12907/120224/311228",
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].entityId, "17020");
});

test("fetch() by promoter name returns unenriched promoter records", async () => {
  const connector = createGujReraConnector(fakeDeps());
  const records = await connector.fetch({ promoterName: "Shivalik" });

  assert.equal(records.length, 1);
  assert.equal(records[0].entityType, "promoter");
  assert.equal(records[0].promoterName, "AALAYAMSHIVALIK LLP   ");
  assert.equal(records[0].documents.length, 0);
});

test("fetch() throws when the connector is disabled", async () => {
  const connector = createGujReraConnector(fakeDeps({ isEnabled: () => false }));
  await assert.rejects(() => connector.fetch({ projectName: "Shivalik" }), /disabled/i);
});

test("fetch() throws when no query field is given", async () => {
  const connector = createGujReraConnector(fakeDeps());
  await assert.rejects(() => connector.fetch({}), /needs one of/i);
});

test("fetch() propagates a captcha/login block instead of swallowing it", async () => {
  const connector = createGujReraConnector(
    fakeDeps({
      fetchJson: async () => {
        throw new ManualHandlingRequiredError("HTTP 403 from GujRERA — likely an auth/bot wall");
      },
    }),
  );
  await assert.rejects(
    () => connector.fetch({ projectName: "Shivalik" }),
    ManualHandlingRequiredError,
  );
});
