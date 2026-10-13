import { format } from "date-fns";
import { Bar as RBar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { stroke: "var(--color-subtle)", fontSize: 11, tickLine: false, axisLine: false } as const;

function TooltipBox({ active, payload, label, unit }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border-strong bg-popover px-2.5 py-2 text-[12px] shadow-sm">
      {label && <div className="mb-1 text-subtle">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-[2px]" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="tabular ml-auto font-medium">
            {p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface LineSpec {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
  dots?: boolean;
}

export function TrendChart({ data, lines, height = 220, unit, reference, domain }: { data: Record<string, number | string>[]; lines: LineSpec[]; height?: number; unit?: string; reference?: number; domain?: [number | string, number | string] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="date" {...axis} tickFormatter={(d: string) => format(new Date(d), "MMM d")} minTickGap={32} />
        <YAxis {...axis} domain={domain ?? ["auto", "auto"]} width={44} />
        <Tooltip
          cursor={{ stroke: "var(--color-border-strong)" }}
          content={(p) => <TooltipBox {...(p as never)} unit={unit} label={p.label ? format(new Date(p.label as string), "MMM d, HH:mm") : undefined} />}
        />
        {reference != null && <ReferenceLine y={reference} stroke="var(--color-border-strong)" strokeDasharray="3 3" />}
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={l.color}
            strokeWidth={l.dashed ? 1 : 1.75}
            strokeDasharray={l.dashed ? "2 3" : undefined}
            strokeOpacity={l.dashed ? 0.7 : 1}
            dot={l.dots ? { r: 1.5, strokeWidth: 0, fill: l.color } : false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HBarChart({ data, dataKey, name, unit, height }: { data: Record<string, number | string>[]; dataKey: string; name: string; unit?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(120, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barCategoryGap={8}>
        <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
        <XAxis type="number" {...axis} domain={[0, 100]} />
        <YAxis type="category" dataKey="name" {...axis} width={72} stroke="var(--color-muted-foreground)" />
        <Tooltip cursor={{ fill: "var(--color-accent)" }} content={(p) => <TooltipBox {...(p as never)} unit={unit} />} />
        <ReferenceLine x={50} stroke="var(--color-border-strong)" strokeDasharray="3 3" />
        <RBar dataKey={dataKey} name={name} fill="var(--color-chart-2)" radius={[0, 3, 3, 0]} maxBarSize={14} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
