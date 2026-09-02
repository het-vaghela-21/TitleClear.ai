import { File, FileImage, FileText, FileType, type LucideIcon } from "lucide-react";
import type { DocKind } from "@/lib/doc-library/types";
import { cn } from "@/lib/utils";

const ICONS: Record<DocKind, LucideIcon> = {
  pdf: FileType,
  word: FileText,
  image: FileImage,
  text: FileText,
  other: File,
};

/**
 * A muted file-type tint on a neutral badge. Deliberately outside the
 * green/amber/red risk palette — in this product those three colours mean
 * risk level and nothing else.
 */
const TINTS: Record<DocKind, string> = {
  pdf: "bg-destructive/10 text-destructive",
  word: "bg-primary/10 text-primary",
  image: "bg-secondary text-secondary-foreground",
  text: "bg-muted text-muted-foreground",
  other: "bg-muted text-muted-foreground",
};

export function DocKindIcon({
  kind,
  className,
  size = "md",
}: {
  kind: DocKind;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = ICONS[kind];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md",
        size === "sm" ? "size-7" : "size-9",
        TINTS[kind],
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  );
}
