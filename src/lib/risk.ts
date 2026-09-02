import type { FlagSeverity, RecordStatus, ScoreBand } from "@/lib/types";

export const bandMeta: Record<
  ScoreBand,
  { label: string; text: string; bg: string; ring: string }
> = {
  green: { label: "Low risk", text: "text-risk-green", bg: "bg-risk-green-bg", ring: "stroke-risk-green" },
  amber: { label: "Medium risk", text: "text-risk-amber", bg: "bg-risk-amber-bg", ring: "stroke-risk-amber" },
  red: { label: "High risk", text: "text-risk-red", bg: "bg-risk-red-bg", ring: "stroke-risk-red" },
};

export function bandForScore(score: number): ScoreBand {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

export const severityMeta: Record<FlagSeverity, { label: string; text: string; bg: string }> = {
  low: { label: "Low", text: "text-risk-green", bg: "bg-risk-green-bg" },
  medium: { label: "Medium", text: "text-risk-amber", bg: "bg-risk-amber-bg" },
  high: { label: "High", text: "text-risk-red", bg: "bg-risk-red-bg" },
};

export const recordStatusMeta: Record<RecordStatus, { label: string; text: string; bg: string }> = {
  found: { label: "Found", text: "text-risk-green", bg: "bg-risk-green-bg" },
  pending: { label: "Pending", text: "text-risk-amber", bg: "bg-risk-amber-bg" },
  missing: { label: "Missing", text: "text-risk-red", bg: "bg-risk-red-bg" },
};

export function formatDate(iso: string | null): string {
  if (!iso) return "Present";
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
