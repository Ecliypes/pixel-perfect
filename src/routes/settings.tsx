import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NativeSelect, PageHeader, Panel } from "@/components/kit";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RANKS } from "@/lib/constants";
import { actions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Diff" },
      { name: "description", content: "Manage your Diff profile, rank and stored data." },
      { property: "og:title", content: "Settings — Diff" },
      { property: "og:description", content: "Manage your Diff profile, rank and stored data." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { profile, matches, goals, ready } = useAppState();
  const [p, setP] = useState(profile);
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => setP(profile), [profile]);
  const demo = matches.filter((m) => m.demo).length;

  function save(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^[\w .-]{2,16}$/u.test(p.username.trim())) errs.username = "2–16 characters: letters, numbers, spaces, . _ -";
    if (p.tag && !/^[a-zA-Z0-9]{2,5}$/.test(p.tag)) errs.tag = "2–5 letters or numbers";
    if (!Number.isInteger(p.rr) || p.rr < 0 || p.rr > 100) errs.rr = "RR must be 0–100";
    setErr(errs);
    if (Object.keys(errs).length) return;
    actions.updateProfile({ ...p, username: p.username.trim() });
    toast.success("Profile saved");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ matches, goals, profile }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "diff-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!ready) return <div className="h-96" />;

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-2xl gap-4">
        <Panel title="Profile">
          <form onSubmit={save} className="grid gap-4" noValidate>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <label>
                <span className="mb-1 block text-[12px] text-muted-foreground">Riot name</span>
                <Input value={p.username} onChange={(e) => setP({ ...p, username: e.target.value })} aria-invalid={!!err.username} />
                {err.username && <span className="mt-1 block text-[11.5px] text-negative">{err.username}</span>}
              </label>
              <label>
                <span className="mb-1 block text-[12px] text-muted-foreground">Tagline</span>
                <Input value={p.tag} onChange={(e) => setP({ ...p, tag: e.target.value })} placeholder="EUW" aria-invalid={!!err.tag} />
                {err.tag && <span className="mt-1 block text-[11.5px] text-negative">{err.tag}</span>}
              </label>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <label>
                <span className="mb-1 block text-[12px] text-muted-foreground">Current rank</span>
                <NativeSelect className="h-9 w-full" value={p.rank} onChange={(e) => setP({ ...p, rank: e.target.value })}>
                  <option>Unranked</option>
                  {RANKS.map((r) => <option key={r}>{r}</option>)}
                </NativeSelect>
              </label>
              <label>
                <span className="mb-1 block text-[12px] text-muted-foreground">RR</span>
                <Input inputMode="numeric" value={String(p.rr)} onChange={(e) => setP({ ...p, rr: Number(e.target.value.replace(/\D/g, "") || 0) })} aria-invalid={!!err.rr} />
                {err.rr && <span className="mt-1 block text-[11.5px] text-negative">{err.rr}</span>}
              </label>
            </div>
            <p className="text-[12px] text-subtle">Rank is entered manually — Diff isn't connected to Riot's servers.</p>
            <div><Button size="sm" type="submit">Save profile</Button></div>
          </form>
        </Panel>

        <Panel title="Data">
          <div className="grid gap-4 text-[13px]">
            <p className="text-muted-foreground">
              Diff stores everything in this browser. {matches.length - demo} logged matches, {demo} sample matches, {goals.length} goals.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={exportData}>Export JSON</Button>
              {demo ? (
                <Button size="sm" variant="outline" onClick={() => { actions.clearDemo(); toast.success("Sample data removed"); }}>Remove sample data</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { actions.loadDemo(); toast.success("Sample data loaded"); }}>Load sample data</Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-negative hover:text-negative">Delete everything</Button></AlertDialogTrigger>
                <AlertDialogContent className="border-border-strong bg-popover">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all data?</AlertDialogTitle>
                    <AlertDialogDescription>Every match, goal and your profile will be removed from this browser. Export first if you want a backup.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { actions.resetAll(); toast.success("All data deleted"); }}>Delete everything</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
