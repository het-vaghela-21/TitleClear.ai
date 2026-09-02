import type { DocTemplate } from "./types";
import { bhadaKarar } from "./templates/bhada-karar";
import { banakhat } from "./templates/banakhat";
import { vechanDastavej } from "./templates/vechan-dastavej";
import { bakshisDastavej } from "./templates/bakshis-dastavej";
import { releaseLekh } from "./templates/release-lekh";
import { vasiyatnamu } from "./templates/vasiyatnamu";
import { kulmukhtyarnamu } from "./templates/kulmukhtyarnamu";
import { sogandnamu } from "./templates/sogandnamu";

/**
 * All available document templates. Adding a document = writing one file in
 * ./templates and listing it here; the catalog, filler UI and exports pick
 * it up automatically.
 */
export const docTemplates: DocTemplate[] = [
  bhadaKarar,
  banakhat,
  vechanDastavej,
  bakshisDastavej,
  releaseLekh,
  vasiyatnamu,
  kulmukhtyarnamu,
  sogandnamu,
];

export function getDocTemplate(slug: string): DocTemplate | undefined {
  return docTemplates.find((t) => t.slug === slug);
}
