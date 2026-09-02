/**
 * Trial CLI for the GujRERA connector.
 *
 * Usage:
 *   RERA_CONNECTOR_ENABLED=true npm run gujrera -- --project "Aalekh Bungalows"
 *   RERA_CONNECTOR_ENABLED=true npm run gujrera -- --promoter "Aalekh Enterprise"
 *   RERA_CONNECTOR_ENABLED=true npm run gujrera -- --reg-no "PR/GJ/SURAT/..."
 *
 * (The repo has no Python entry point, so this stands in for the
 * `python -m connectors.gujrera --project "<name>"` shape the trial asked
 * for — same idea, run via tsx instead.)
 */
import { gujReraConnector } from "../src/lib/connectors/gujrera";
import { ManualHandlingRequiredError } from "../src/lib/connectors/registry";

function parseArgs(argv: string[]) {
  const query: { projectName?: string; promoterName?: string; reraRegNo?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === "--project") query.projectName = value;
    if (arg === "--promoter") query.promoterName = value;
    if (arg === "--reg-no") query.reraRegNo = value;
  }
  return query;
}

async function main() {
  const query = parseArgs(process.argv.slice(2));

  if (!query.projectName && !query.promoterName && !query.reraRegNo) {
    console.error("Usage: npm run gujrera -- --project <name> | --promoter <name> | --reg-no <no>");
    process.exit(1);
  }

  try {
    const records = await gujReraConnector.fetch(query);
    console.log(JSON.stringify(records, null, 2));
  } catch (err) {
    if (err instanceof ManualHandlingRequiredError) {
      console.error(`NEEDS MANUAL HANDLING: ${err.message}`);
      process.exit(2);
    }
    console.error(String(err instanceof Error ? err.message : err));
    process.exit(1);
  }
}

main();
