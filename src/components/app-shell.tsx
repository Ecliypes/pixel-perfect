import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Crosshair, Flag, LayoutGrid, List, Map as MapIcon, Menu, Settings } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/matches", label: "Match History", icon: List },
  { to: "/performance", label: "Performance", icon: BarChart3 },
  { to: "/maps", label: "Maps", icon: MapIcon },
  { to: "/goals", label: "Goals", icon: Flag },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Wordmark() {
  return (
    <Link to="/" className="flex items-baseline gap-1.5 px-2">
      <span className="text-[19px] font-semibold tracking-[-0.04em] text-foreground">diff</span>
      <span className="neon-glow h-1.5 w-1.5 translate-y-[-1px] rounded-[1px] bg-primary" />
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            {active && <span className="neon-glow absolute -left-3 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary" />}
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ProfileChip() {
  const { profile } = useAppState();
  const initials = profile.username.slice(0, 2).toUpperCase();
  return (
    <Link to="/settings" className="flex items-center gap-2.5 rounded-md border border-border px-2.5 py-2 transition-colors hover:border-border-strong">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary font-mono text-[11px] font-medium text-secondary-foreground">{initials}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">
          {profile.username}
          {profile.tag && <span className="text-subtle">#{profile.tag}</span>}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Crosshair className="h-3 w-3 text-primary" strokeWidth={2} />
          {profile.rank}
          <span className="tabular text-subtle">· {profile.rr} RR</span>
        </div>
      </div>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <Wordmark />
      <div>
        <div className="eyebrow mb-2 px-2.5">Valorant</div>
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="mt-auto">
        <ProfileChip />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarBody />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
          <button aria-label="Open navigation" onClick={() => setOpen(true)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
            <Menu className="h-4 w-4" />
          </button>
          <Wordmark />
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-60 border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
