import { ArrowDownRight, ArrowUpRight, FlaskConical } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Result } from "@/lib/types";

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className, bodyClass }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("panel", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-[13px] font-medium">{title}</h2>
          {action}
        </div>
      )}
      <div className={cn("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

export function Delta({ value, unit = "", digits = 1, invert = false }: { value: number | null; unit?: string; digits?: number; invert?: boolean }) {
  if (value == null || !isFinite(value)) return <span className="text-[11px] text-subtle">no prior data</span>;
  if (Math.abs(value) < Math.pow(10, -digits) / 2) return <span className="tabular text-[11px] text-neutral">±0{unit}</span>;
  const good = invert ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("tabular inline-flex items-center gap-0.5 text-[11px] font-medium", good ? "text-positive" : "text-negative")}>
      <Icon className="h-3 w-3" strokeWidth={2.25} />
      {value > 0 ? "+" : ""}
      {value.toFixed(digits)}
      {unit}
    </span>
  );
}

export function ResultTag({ r, score }: { r: Result; score?: string }) {
  const label = r === "win" ? "Win" : r === "loss" ? "Loss" : "Draw";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-4 w-[3px] rounded-full", r === "win" ? "neon-glow bg-positive" : r === "loss" ? "neon-glow bg-negative" : "bg-neutral")} />
      <span className={cn("text-[13px] font-medium", r === "win" ? "text-positive" : r === "loss" ? "text-negative" : "text-neutral")}>{label}</span>
      {score && <span className="tabular text-[12px] text-muted-foreground">{score}</span>}
    </span>
  );
}

export function SampleTag() {
  return (
    <span title="Sample data — not a real match" className="inline-flex items-center gap-1 rounded-[4px] border border-border px-1.5 py-px text-[10px] uppercase tracking-wider text-subtle">
      <FlaskConical className="h-2.5 w-2.5" />
      Sample
    </span>
  );
}

export function DemoNotice({ count, onClear }: { count: number; onClear: () => void }) {
  if (!count) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border-strong px-4 py-2.5 text-[12.5px] text-muted-foreground">
      <span className="flex items-center gap-2">
        <FlaskConical className="h-3.5 w-3.5 text-subtle" />
        Showing {count} sample matches for demonstration. These are not real games you played.
      </span>
      <button onClick={onClear} className="text-[12.5px] font-medium text-foreground underline-offset-4 hover:underline">
        Clear sample data
      </button>
    </div>
  );
}

export function NativeSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-8 rounded-md border border-input bg-card px-2.5 pr-7 text-[13px] text-foreground outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </select>
  );
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground">{icon}</div>
      <div className="text-[14px] font-medium">{title}</div>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Bar({ pct, tone = "primary" }: { pct: number; tone?: "primary" | "positive" | "muted" }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tone === "primary" ? "bg-primary" : tone === "positive" ? "bg-positive" : "bg-subtle")}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}
