import type { DocBlock, DocumentModel, Run } from "@/lib/doc-filler/types";
import { cn } from "@/lib/utils";

/**
 * Renders a DocumentModel as a paper sheet. The same markup is what gets
 * printed (the documents section's print stylesheet hides everything marked
 * data-doc-chrome and lets .doc-sheet fill the page).
 */
export function DocPreview({ model, className }: { model: DocumentModel; className?: string }) {
  return (
    <div
      className={cn(
        "doc-sheet bg-white text-[#111] shadow-sm border border-border rounded-sm",
        "px-10 py-12 sm:px-14 sm:py-14",
        className,
      )}
      lang={model.lang}
    >
      {model.blocks.map((block, i) => (
        <DocBlockView key={i} block={block} />
      ))}
    </div>
  );
}

function RunsView({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((run, i) => {
        let node: React.ReactNode = run.text;
        if (run.bold) node = <strong key={i}>{node}</strong>;
        if (run.underline) node = <u key={i}>{node}</u>;
        return run.bold || run.underline ? node : <span key={i}>{node}</span>;
      })}
    </>
  );
}

function DocBlockView({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "title":
      return (
        <h2 className="doc-title text-center text-lg font-bold tracking-wide underline underline-offset-4 mb-6">
          {block.text}
        </h2>
      );
    case "subtitle":
      return <p className="text-center font-semibold mb-4">{block.text}</p>;
    case "para":
      return (
        <p
          className={cn(
            "mb-4 leading-8",
            block.align === "center" && "text-center",
            block.align === "right" && "text-right",
            (block.align ?? "justify") === "justify" && "text-justify",
          )}
        >
          <RunsView runs={block.runs} />
        </p>
      );
    case "clause":
      return (
        <div className="mb-3 flex gap-3 leading-8">
          <span className="shrink-0 font-semibold min-w-7">{block.no}</span>
          <p className="text-justify flex-1">
            <RunsView runs={block.runs} />
          </p>
        </div>
      );
    case "schedule":
      return (
        <div className="my-6">
          {block.caption ? (
            <p className="text-center font-bold underline underline-offset-4 mb-3">{block.caption}</p>
          ) : null}
          <table className="w-full border-collapse text-sm leading-7">
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  <td className="border border-[#999] px-3 py-1.5 font-semibold w-[38%] align-top">
                    {row.label}
                  </td>
                  <td className="border border-[#999] px-3 py-1.5 align-top">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "signatures":
      return (
        <div className="mt-10 mb-6 flex flex-wrap justify-between gap-x-8 gap-y-10">
          {block.parties.map((p, i) => (
            <div key={i} className="min-w-44 text-center">
              <div className="h-14" />
              <div className="border-t border-dotted border-[#555] pt-2 text-sm">
                <p className="font-semibold">{p.name}</p>
                <p>{p.role}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "witnesses":
      return (
        <div className="mt-8">
          <p className="font-bold underline underline-offset-4 mb-3">{block.heading}</p>
          <ol className="space-y-6">
            {block.names.map((name, i) => (
              <li key={i} className="flex items-end gap-3 text-sm leading-6">
                <span className="shrink-0 font-semibold">{i + 1}.</span>
                <span className="flex-1">
                  {name}
                  <span className="mt-4 block border-b border-dotted border-[#555]" />
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "stamp-space":
      return (
        <div className="stamp-space mb-8 flex h-40 items-center justify-center rounded-sm border border-dashed border-[#aaa]">
          <p className="text-center text-xs text-[#888]">{block.note}</p>
        </div>
      );
    case "spacer":
      return <div className="h-6" />;
  }
}
