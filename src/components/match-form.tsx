import { format } from "date-fns";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/kit";
import { AGENTS, MAPS } from "@/lib/constants";
import { actions } from "@/lib/store";
import type { Match } from "@/lib/types";

const int = (label: string, max: number) =>
  z.coerce.number({ invalid_type_error: `${label} must be a number` }).int(`${label} must be a whole number`).min(0, `${label} can't be negative`).max(max, `${label} looks too high`);

const schema = z
  .object({
    map: z.string().min(1, "Choose a map"),
    agent: z.string().min(1, "Choose an agent"),
    roundsWon: int("Rounds won", 30),
    roundsLost: int("Rounds lost", 30),
    kills: int("Kills", 80),
    deaths: int("Deaths", 80),
    assists: int("Assists", 80),
    headshotPct: z.coerce.number({ invalid_type_error: "HS% must be a number" }).min(0, "HS% must be 0–100").max(100, "HS% must be 0–100"),
    acs: int("ACS", 700),
    date: z.string().min(1, "Enter a date"),
    atkWon: z.string().optional(),
    defWon: z.string().optional(),
    notes: z.string().max(280, "Keep notes under 280 characters").optional(),
  })
  .superRefine((v, ctx) => {
    if (v.roundsWon + v.roundsLost === 0) ctx.addIssue({ code: "custom", path: ["roundsWon"], message: "Enter the final score" });
    if (new Date(v.date).getTime() > Date.now() + 60_000) ctx.addIssue({ code: "custom", path: ["date"], message: "Date can't be in the future" });
    const a = v.atkWon === "" || v.atkWon == null ? null : Number(v.atkWon);
    const d = v.defWon === "" || v.defWon == null ? null : Number(v.defWon);
    if ((a == null) !== (d == null)) ctx.addIssue({ code: "custom", path: ["atkWon"], message: "Fill both side scores, or leave both empty" });
    if (a != null && d != null) {
      if (!Number.isInteger(a) || !Number.isInteger(d) || a < 0 || d < 0) ctx.addIssue({ code: "custom", path: ["atkWon"], message: "Side scores must be whole numbers" });
      else if (a + d !== v.roundsWon) ctx.addIssue({ code: "custom", path: ["atkWon"], message: `Attack + defense rounds won must equal ${v.roundsWon}` });
    }
  });

type FormState = Record<keyof z.input<typeof schema>, string>;

function initial(m?: Match): FormState {
  return {
    map: m?.map ?? "",
    agent: m?.agent ?? "",
    roundsWon: m ? String(m.roundsWon) : "",
    roundsLost: m ? String(m.roundsLost) : "",
    kills: m ? String(m.kills) : "",
    deaths: m ? String(m.deaths) : "",
    assists: m ? String(m.assists) : "",
    headshotPct: m ? String(m.headshotPct) : "",
    acs: m ? String(m.acs) : "",
    date: format(m ? new Date(m.date) : new Date(), "yyyy-MM-dd'T'HH:mm"),
    atkWon: m?.atkWon != null ? String(m.atkWon) : "",
    defWon: m?.defWon != null ? String(m.defWon) : "",
    notes: m?.notes ?? "",
  };
}

function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-[12px] text-muted-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11.5px] text-negative">{error}</span>}
    </label>
  );
}

export function MatchFormDialog({ open, onOpenChange, match, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; match?: Match; onSaved?: (m: Match) => void }) {
  const [f, setF] = useState<FormState>(() => initial(match));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (open) {
      setF(initial(match));
      setErrors({});
    }
  }, [open, match]);

  const bind = (k: keyof FormState) => ({
    value: f[k],
    onChange: (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value })),
    "aria-invalid": !!errors[k],
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) {
      const errs: Partial<Record<keyof FormState, string>> = {};
      for (const i of r.error.issues) {
        const k = i.path[0] as keyof FormState;
        if (!errs[k]) errs[k] = i.message;
      }
      setErrors(errs);
      return;
    }
    const v = r.data;
    const rounds = v.roundsWon + v.roundsLost;
    const hasSides = v.atkWon !== "" && v.atkWon != null;
    const atkPlayed = hasSides ? Math.min(12, Math.ceil(rounds / 2)) : undefined;
    const payload = {
      map: v.map, agent: v.agent, roundsWon: v.roundsWon, roundsLost: v.roundsLost,
      kills: v.kills, deaths: v.deaths, assists: v.assists, headshotPct: v.headshotPct, acs: v.acs,
      date: new Date(v.date).toISOString(),
      atkWon: hasSides ? Number(v.atkWon) : undefined,
      atkPlayed,
      defWon: hasSides ? Number(v.defWon) : undefined,
      defPlayed: hasSides ? rounds - (atkPlayed ?? 0) : undefined,
      notes: v.notes || undefined,
    };
    if (match) {
      actions.updateMatch(match.id, payload);
      toast.success("Match updated");
      onSaved?.({ ...match, ...payload });
    } else {
      const m = actions.addMatch(payload);
      toast.success(`Logged ${m.map} · ${m.kills}/${m.deaths}/${m.assists}`);
      onSaved?.(m);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border-strong bg-popover sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-[16px]">{match ? "Edit match" : "Log a match"}</DialogTitle>
          <DialogDescription className="text-[12.5px]">Enter stats from the end-of-game scoreboard. Everything stays on this device.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Map" error={errors.map}>
              <NativeSelect className="h-9 w-full" {...bind("map")}>
                <option value="">Select map</option>
                {MAPS.map((m) => <option key={m}>{m}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Agent" error={errors.agent}>
              <NativeSelect className="h-9 w-full" {...bind("agent")}>
                <option value="">Select agent</option>
                {AGENTS.map((a) => <option key={a}>{a}</option>)}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
            <Field label="Rounds won" error={errors.roundsWon}><Input inputMode="numeric" placeholder="13" {...bind("roundsWon")} /></Field>
            <Field label="Rounds lost" error={errors.roundsLost}><Input inputMode="numeric" placeholder="9" {...bind("roundsLost")} /></Field>
            <Field label="Played" error={errors.date} className="col-span-2 sm:col-span-1"><Input type="datetime-local" {...bind("date")} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            <Field label="Kills" error={errors.kills}><Input inputMode="numeric" {...bind("kills")} /></Field>
            <Field label="Deaths" error={errors.deaths}><Input inputMode="numeric" {...bind("deaths")} /></Field>
            <Field label="Assists" error={errors.assists}><Input inputMode="numeric" {...bind("assists")} /></Field>
            <Field label="HS %" error={errors.headshotPct}><Input inputMode="decimal" placeholder="22.5" {...bind("headshotPct")} /></Field>
            <Field label="ACS" error={errors.acs}><Input inputMode="numeric" placeholder="230" {...bind("acs")} /></Field>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="mb-2 text-[12px] text-muted-foreground">Rounds won per side <span className="text-subtle">— optional, enables attack/defense analysis</span></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Attack" error={errors.atkWon}><Input inputMode="numeric" {...bind("atkWon")} /></Field>
              <Field label="Defense"><Input inputMode="numeric" {...bind("defWon")} /></Field>
            </div>
          </div>
          <Field label="Notes" error={errors.notes}>
            <Input placeholder="e.g. lost every B retake" {...bind("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{match ? "Save changes" : "Log match"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
