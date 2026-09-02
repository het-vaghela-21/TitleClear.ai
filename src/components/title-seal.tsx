import { bandMeta } from "@/lib/risk";
import type { ScoreBand } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TitleSealProps {
  score: number;
  band: ScoreBand;
  size?: number;
  className?: string;
}

const TICKS = 48;
const RADIUS_TICK_OUTER = 94;
const RADIUS_TICK_INNER_MINOR = 87;
const RADIUS_TICK_INNER_MAJOR = 82;
const RADIUS_PROGRESS = 74;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_PROGRESS;

/**
 * The report's signature mark: styled after a cadastral survey stamp — a
 * tick-marked dial (echoing the survey-number grid this data comes from)
 * with a progress ring showing the Title Clear Score. Risk color appears
 * only here and on flags, per the product's "use color sparingly" rule.
 */
export function TitleSeal({ score, band, size = 200, className }: TitleSealProps) {
  const meta = bandMeta[band];
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const angle = (i / TICKS) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 12 === 0;
    const innerR = isMajor ? RADIUS_TICK_INNER_MAJOR : RADIUS_TICK_INNER_MINOR;
    const x1 = 100 + innerR * Math.cos(angle);
    const y1 = 100 + innerR * Math.sin(angle);
    const x2 = 100 + RADIUS_TICK_OUTER * Math.cos(angle);
    const y2 = 100 + RADIUS_TICK_OUTER * Math.sin(angle);
    return { x1, y1, x2, y2, isMajor };
  });

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size} className="rotate-0">
        <circle cx="100" cy="100" r="98" fill="none" className="stroke-border" strokeWidth="1" />
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={t.isMajor ? 1.5 : 0.75}
            className={t.isMajor ? "stroke-muted-foreground/60" : "stroke-muted-foreground/30"}
          />
        ))}
        <circle
          cx="100"
          cy="100"
          r={RADIUS_PROGRESS}
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        <circle
          cx="100"
          cy="100"
          r={RADIUS_PROGRESS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          className={cn(meta.ring, "transition-[stroke-dashoffset] duration-700 ease-out")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-medium leading-none tabular-nums">
          {score}
        </span>
        <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">/ 100</span>
        <span className={cn("mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-medium", meta.bg, meta.text)}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}
