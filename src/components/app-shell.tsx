"use client";

import clsx from "clsx";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileText,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  Package as PackageIcon,
  Plus,
  ScanLine,
  Shield,
  Sun,
  Truck,
  UserRound,
  Wrench
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { InventoryView } from "@/components/inventory-view";
import { OrdersView } from "@/components/orders-view";
import { Button, Field, ListRow, Panel, Select, StatusBadge } from "@/components/ui";
import { dashboardMetrics, packageTemplates, projectRows } from "@/data/demo";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { NavKey, StatusTone, UserProfile } from "@/types/domain";

type NavItem = {
  key: NavKey;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "inventory", label: "Inventar", icon: Boxes },
  { key: "packages", label: "Packages", icon: PackageIcon },
  { key: "orders", label: "Aufträge", icon: ClipboardList },
  { key: "logistics", label: "Logistik", icon: Truck },
  { key: "admin", label: "Admin", icon: Shield }
];

const roleLabels: Record<UserProfile["role"], string> = {
  admin: "Admin",
  user: "User",
  logistics: "Logistik",
  technician: "Technik"
};

const warningRows = [
  {
    title: "4x Robe Spiider doppelt disponiert",
    detail: "Festival Setup überschneidet sich mit Gala Luzern.",
    action: "Extern anmieten"
  },
  {
    title: "Powercon 10m: 14 Stk. fehlen",
    detail: "Massenware bleibt mengenbasiert, System warnt bei Unterdeckung.",
    action: "Alternative prüfen"
  },
  {
    title: "Case CH-12 zu schwer",
    detail: "Gewicht wird aus Case, Einzelgeräten und Stückmengen berechnet.",
    action: "Splitten"
  }
];

const logisticsRows = [
  {
    time: "08:00",
    task: "Corporate Event Basel laden",
    vehicle: "3.5t Hebebühne",
    status: "Packliste bereit"
  },
  {
    time: "11:30",
    task: "Retour Gala Luzern",
    vehicle: "Sprinter 2",
    status: "Rücknahme offen"
  },
  {
    time: "15:00",
    task: "Zumietung Festival Setup abholen",
    vehicle: "Anhänger",
    status: "Lieferant bestätigt"
  }
];

function toneForStatus(status: string): StatusTone {
  if (["Bestätigt", "bereit", "Verfügbar", "Packliste bereit", "Lieferant bestätigt"].includes(status)) {
    return "good";
  }

  if (["Doppelt disponiert", "Unterdeckung", "Angefragt", "Rücknahme offen", "Geplant"].includes(status)) {
    return "warn";
  }

  if (["Vermisst", "Defekt"].includes(status)) {
    return "bad";
  }

  return "neutral";
}

function ViewHeader({
  eyebrow,
  title,
  detail
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-bold uppercase text-[var(--text2)]">{eyebrow}</p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-[var(--text)]">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-[var(--text2)]">{detail}</p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  action
}: {
  icon: LucideIcon;
  title: string;
  action?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--cyan)]" aria-hidden />
        <h2 className="truncate font-heading text-lg font-bold">{title}</h2>
      </div>
      {action ? (
        <Button className="inline-flex shrink-0 items-center gap-2">
          {action}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

function MetricGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {dashboardMetrics.map((metric) => (
        <Panel key={metric.label}>
          <p className="text-sm font-medium text-[var(--text2)]">{metric.label}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <strong className="font-heading text-3xl leading-none">{metric.value}</strong>
            {metric.tone ? <StatusBadge tone={metric.tone}>{metric.detail}</StatusBadge> : null}
          </div>
          {!metric.tone ? <p className="mt-3 text-sm text-[var(--text2)]">{metric.detail}</p> : null}
        </Panel>
      ))}
    </div>
  );
}

function ProjectTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--line)] text-xs uppercase text-[var(--text2)]">
            <th className="px-3 py-3 font-bold">Datum</th>
            <th className="px-3 py-3 font-bold">Auftrag</th>
            <th className="px-3 py-3 font-bold">Status</th>
            <th className="px-3 py-3 font-bold">Material</th>
            <th className="px-3 py-3 font-bold">Aktion</th>
          </tr>
        </thead>
        <tbody>
          {projectRows.map((project) => (
            <tr key={project.name} className="border-b border-[var(--line)] last:border-0">
              <td className="px-3 py-4 font-medium">{project.date}</td>
              <td className="px-3 py-4 font-bold">{project.name}</td>
              <td className="px-3 py-4">
                <StatusBadge tone={toneForStatus(project.status)}>{project.status}</StatusBadge>
              </td>
              <td className="px-3 py-4">
                <StatusBadge tone={project.materialTone}>{project.material}</StatusBadge>
              </td>
              <td className="px-3 py-4">
                <button className="font-bold text-[var(--text)] underline-offset-4 hover:underline">
                  {project.action}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardView() {
  return (
    <>
      <ViewHeader
        eyebrow="Heute"
        title="Dispo-Tagesblick"
        detail="Operative Übersicht für Material, Zumietungen, Packstatus und Rücknahmen. Konflikte warnen nur, damit fehlendes Material angemietet werden kann."
      />
      <MetricGrid />
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(620px,1fr)_minmax(280px,0.55fr)]">
        <Panel>
          <SectionTitle icon={ClipboardList} title="Dispo Tagesliste" action="Alle anzeigen" />
          <ProjectTable />
        </Panel>
        <Panel>
          <SectionTitle icon={AlertTriangle} title="Material-Warnungen" />
          <div className="grid gap-3">
            {warningRows.map((warning) => (
              <ListRow key={warning.title}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong>{warning.title}</strong>
                    <p className="mt-1 text-sm text-[var(--text2)]">{warning.detail}</p>
                  </div>
                  <StatusBadge tone="warn">Warnung</StatusBadge>
                </div>
                <Button className="mt-2 w-full">{warning.action}</Button>
              </ListRow>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel>
          <SectionTitle icon={PackageIcon} title="Packung" />
          <p className="text-sm text-[var(--text2)]">Cases, lose Ware und Packages werden pro Auftrag als Snapshot geführt.</p>
          <div className="mt-4 h-2 rounded-full bg-[var(--bg2)]">
            <div className="h-2 w-[68%] rounded-full bg-[var(--cyan)]" />
          </div>
          <p className="mt-2 text-xs font-bold text-[var(--text2)]">68% bereit</p>
        </Panel>
        <Panel>
          <SectionTitle icon={ClipboardCheck} title="Rücknahme" />
          <p className="text-sm text-[var(--text2)]">Abschluss ist erst möglich, wenn Rücknahme, Schäden und Kalkulation erledigt sind.</p>
          <div className="mt-4 grid gap-2">
            <StatusBadge tone="warn">5 offene Kontrollen</StatusBadge>
            <StatusBadge tone="bad">2 vermisste Positionen</StatusBadge>
          </div>
        </Panel>
        <Panel>
          <SectionTitle icon={FileText} title="Netto-Amortisation" />
          <p className="text-sm text-[var(--text2)]">Berechnet nach abgeschlossenem Auftrag, ohne MwSt., Transport, Personal und Zumietung.</p>
          <strong className="mt-4 block font-heading text-2xl">{"CHF 18'420"}</strong>
        </Panel>
      </div>
    </>
  );
}

function PackagesView() {
  return (
    <>
      <ViewHeader
        eyebrow="Templates"
        title="Packages für Standard-Setups"
        detail="Packages bestücken typische Bühnen- und Event-Setups schnell. Beim Auftrag wird ein Snapshot erstellt, spätere Änderungen ändern alte Aufträge nicht."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.65fr)]">
        <Panel>
          <SectionTitle icon={PackageIcon} title="Package-Bibliothek" />
          <div className="grid gap-3">
            {packageTemplates.map((item) => (
              <ListRow key={item.name} className="md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{item.name}</strong>
                    <StatusBadge>{item.category}</StatusBadge>
                    {item.warning ? <StatusBadge tone="warn">{item.warning}</StatusBadge> : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text2)]">{item.weight}</p>
                </div>
                <div className="text-left md:text-right">
                  <strong>{item.rate}</strong>
                  <p className="text-xs text-[var(--text2)]">Richtpreis netto</p>
                </div>
              </ListRow>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle icon={ClipboardCheck} title="Package-Aufbau" />
          <div className="grid gap-3">
            <ListRow>
              <strong>Einzelgeräte</strong>
              <p className="text-sm text-[var(--text2)]">Konkrete Geräte, Cases und Seriennummern bleiben eindeutig nachvollziehbar.</p>
            </ListRow>
            <ListRow>
              <strong>Massenware</strong>
              <p className="text-sm text-[var(--text2)]">Kabel, Adapter und Verbrauchsnähe werden als Stückzahlen eingefügt.</p>
            </ListRow>
            <ListRow>
              <strong>Zumietungs-Platzhalter</strong>
              <p className="text-sm text-[var(--text2)]">Externes Material kann im Package geplant werden, zählt aber nicht zur Amortisation.</p>
            </ListRow>
            <Button variant="primary" className="inline-flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" aria-hidden />
              Package anlegen
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}

function LogisticsView() {
  return (
    <>
      <ViewHeader
        eyebrow="Logistik"
        title="Laden, Transport, Retour"
        detail="Logistik sieht Tagesplanung, Fahrzeuge, Packstatus und Rücknahme ohne Umweg über Finanzdetails."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <SectionTitle icon={Truck} title="Tagesplan" />
          <div className="grid gap-3">
            {logisticsRows.map((row) => (
              <ListRow key={`${row.time}-${row.task}`} className="md:grid-cols-[80px_1fr_180px_150px] md:items-center">
                <strong>{row.time}</strong>
                <div>
                  <strong>{row.task}</strong>
                  <p className="text-sm text-[var(--text2)]">{row.vehicle}</p>
                </div>
                <StatusBadge tone={toneForStatus(row.status)}>{row.status}</StatusBadge>
                <Button>Öffnen</Button>
              </ListRow>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle icon={ScanLine} title="Scan & Kontrolle" />
          <div className="grid gap-3">
            <Field placeholder="Barcode / QR-Code scannen" />
            <Select defaultValue="Laden">
              <option>Laden</option>
              <option>Retour</option>
              <option>Schaden melden</option>
              <option>Vermisst markieren</option>
            </Select>
            <Button variant="primary" className="inline-flex items-center justify-center gap-2">
              <ScanLine className="h-4 w-4" aria-hidden />
              Erfassen
            </Button>
            <ListRow>
              <StatusBadge tone="warn">Hinweis</StatusBadge>
              <p className="text-sm text-[var(--text2)]">Defekt, vermisst und Reparaturstatus sperren Material für zukünftige Verfügbarkeitswarnungen.</p>
            </ListRow>
          </div>
        </Panel>
      </div>
    </>
  );
}

function AdminView({ profile }: { profile: UserProfile | null }) {
  const supabaseReady = isSupabaseConfigured();

  return (
    <>
      <ViewHeader
        eyebrow="System"
        title="Admin & Einstellungen"
        detail="Rollen, Organisation, Supabase-Status und spätere Integrationen werden hier zentral verwaltet."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <SectionTitle icon={UserRound} title="Aktueller Benutzer" />
          {profile ? (
            <div className="grid gap-2">
              <ListRow>
                <strong>{profile.name}</strong>
                <p className="text-sm text-[var(--text2)]">{profile.email}</p>
              </ListRow>
              <StatusBadge tone="good">{roleLabels[profile.role]}</StatusBadge>
            </div>
          ) : (
            <p className="text-sm text-[var(--text2)]">Noch kein Profil geladen.</p>
          )}
        </Panel>
        <Panel>
          <SectionTitle icon={UserRound} title="Rollen" />
          <div className="grid gap-2">
            {["Admin", "User", "Logistik", "Technik"].map((role) => (
              <ListRow key={role} className="grid-cols-[1fr_auto] items-center">
                <strong>{role}</strong>
                <StatusBadge tone="good">aktiv</StatusBadge>
              </ListRow>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle icon={Shield} title="Supabase" />
          <StatusBadge tone={supabaseReady ? "good" : "warn"}>
            {supabaseReady ? "Env verbunden" : "Env fehlt lokal"}
          </StatusBadge>
          <p className="mt-3 text-sm text-[var(--text2)]">
            Sobald `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt sind, verbindet sich die App mit Supabase.
          </p>
          <Button className="mt-4">Setup anzeigen</Button>
        </Panel>
        <Panel>
          <SectionTitle icon={Wrench} title="Nächste Module" />
          <div className="grid gap-2">
            <ListRow>
              <strong>Crew & Crewsheets</strong>
              <p className="text-sm text-[var(--text2)]">Vorbereitet als Phase 2, damit Personalressourcen nicht das MVP überladen.</p>
            </ListRow>
            <ListRow>
              <strong>Export & Reports</strong>
              <p className="text-sm text-[var(--text2)]">PDF, Excel und Packlisten aus Aufträgen und Logistikdaten.</p>
            </ListRow>
          </div>
        </Panel>
      </div>
    </>
  );
}

function renderView(active: NavKey, profile: UserProfile | null) {
  switch (active) {
    case "inventory":
      return <InventoryView profile={profile} />;
    case "packages":
      return <PackagesView />;
    case "orders":
      return <OrdersView profile={profile} />;
    case "logistics":
      return <LogisticsView />;
    case "admin":
      return <AdminView profile={profile} />;
    default:
      return <DashboardView />;
  }
}

function AuthStateScreen({
  dark,
  message,
  variant
}: {
  dark: boolean;
  message?: string;
  variant: "loading" | "locked";
}) {
  return (
    <main data-theme={dark ? "dark" : "light"} className="min-h-screen bg-[var(--bg2)] px-4 py-8 text-[var(--text)]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-xl place-items-center">
        <Panel className="w-full">
          <div className="flex items-start gap-3">
            {variant === "loading" ? (
              <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-[var(--cyan)]" aria-hidden />
            ) : (
              <Shield className="mt-0.5 h-5 w-5 text-[var(--cyan)]" aria-hidden />
            )}
            <div>
              <h1 className="font-heading text-xl font-bold">
                {variant === "loading" ? "Session wird geprüft" : "Anmeldung erforderlich"}
              </h1>
              <p className="mt-1 text-sm leading-6 text-[var(--text2)]">
                {message ??
                  (variant === "loading"
                    ? "tiramigear lädt Benutzer und Rolle."
                    : "Bitte melde dich mit deinem tiramigear Account an.")}
              </p>
            </div>
          </div>
          {variant === "locked" ? (
            <a
              className="mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--cyan)] bg-[var(--cyan)] px-3 font-medium text-[#001a2a]"
              href="/login"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Zum Login
            </a>
          ) : null}
        </Panel>
      </div>
    </main>
  );
}

export function AppShell() {
  const [active, setActive] = useState<NavKey>("dashboard");
  const [dark, setDark] = useState(false);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authMessage, setAuthMessage] = useState<string>();
  const activeItem = useMemo(() => navItems.find((item) => item.key === active) ?? navItems[0], [active]);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;

    async function loadProfile(userId: string | null) {
      if (!mounted) {
        return;
      }

      setAuthReady(false);

      if (!userId) {
        setProfile(null);
        setAuthMessage(undefined);
        setAuthReady(true);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, org_id, email, name, role")
        .eq("id", userId)
        .single();

      if (!mounted) {
        return;
      }

      if (error) {
        setProfile(null);
        setAuthMessage("Dein Login ist gültig, aber das Benutzerprofil wurde noch nicht gefunden.");
      } else {
        setProfile(data as UserProfile);
        setAuthMessage(undefined);
      }

      setAuthReady(true);
    }

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setAuthMessage(error.message);
        setAuthReady(true);
        return;
      }

      await loadProfile(data.session?.user.id ?? null);
    }

    void loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      void loadProfile(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase?.auth.signOut();
    setProfile(null);
    window.location.href = "/login";
  }

  if (supabaseReady && !authReady) {
    return <AuthStateScreen dark={dark} variant="loading" />;
  }

  if (supabaseReady && !profile) {
    return <AuthStateScreen dark={dark} message={authMessage} variant="locked" />;
  }

  return (
    <div data-theme={dark ? "dark" : "light"} className="min-h-screen bg-[var(--bg2)] text-[var(--text)]">
      <aside className="border-b border-[#11115f] bg-[var(--sidebar)] text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 lg:h-full lg:px-5">
          <div className="flex items-center justify-between gap-3 lg:block">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.35)] text-lg font-black"
              aria-label="tiramigear Start"
              onClick={() => setActive("dashboard")}
            >
              tg
            </button>
            <div className="text-right lg:mt-6 lg:text-left">
              <strong className="block font-heading text-xl">tiramigear</strong>
              <span className="text-xs text-[#d5d8ff]">Equipment Management</span>
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-4 lg:grid-cols-1" aria-label="Hauptnavigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = item.key === active;

              return (
                <button
                  key={item.key}
                  className={clsx(
                    "flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-sm font-bold transition",
                    selected ? "bg-[#073c73] text-white" : "text-[#eef1ff] hover:bg-[rgba(255,255,255,0.12)]"
                  )}
                  onClick={() => setActive(item.key)}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto hidden rounded-lg border border-[rgba(255,255,255,0.18)] p-3 text-xs text-[#d5d8ff] lg:block">
            <strong className="mb-1 block text-white">MVP Fokus</strong>
            Dispo, Technik, Logistik, Rücknahme und Zumietung zuerst. Crew folgt vorbereitet in Phase 2.
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-[var(--line)] bg-[var(--bg)]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-[var(--text2)]">Arbeitsbereich</p>
              <h2 className="font-heading text-xl font-bold">{activeItem.label}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="inline-flex items-center gap-2" onClick={() => setDark((value) => !value)}>
                {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
                {dark ? "Light Mode" : "Dark Mode"}
              </Button>
              <Button className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" aria-hidden />
                Export
              </Button>
              <Button variant="primary" className="inline-flex items-center gap-2" onClick={() => setActive("orders")}>
                <Plus className="h-4 w-4" aria-hidden />
                Neuer Auftrag
              </Button>
              {profile ? (
                <>
                  <div className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg2)] px-3">
                    <UserRound className="h-4 w-4 text-[var(--text2)]" aria-hidden />
                    <span className="text-sm font-bold">{profile.email}</span>
                    <StatusBadge tone="good">{roleLabels[profile.role]}</StatusBadge>
                  </div>
                  <Button className="inline-flex items-center gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" aria-hidden />
                    Logout
                  </Button>
                </>
              ) : (
                <a
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 font-medium text-[var(--text)] transition hover:border-[var(--cyan)]"
                  href="/login"
                >
                  <UserRound className="h-4 w-4" aria-hidden />
                  Login
                </a>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-5 lg:px-6">{renderView(active, profile)}</main>
      </div>
    </div>
  );
}
