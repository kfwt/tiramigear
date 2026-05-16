"use client";

import { AlertTriangle, Boxes, CheckCircle2, PackagePlus, ScanLine, Search } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Field, ListRow, Panel, Select, StatusBadge } from "@/components/ui";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { StatusTone, UserProfile } from "@/types/domain";

type CaptureType = "single" | "bulk" | "case" | "external";
type EquipmentCategory = "audio" | "lighting" | "video" | "truss_rigging" | "cables_accessories" | "other";
type ItemCondition = "good" | "minor_issues" | "defective" | "in_repair" | "missing";
type InventoryTypeLabel = "Einzelgerät" | "Massenware" | "Case" | "Zumietung";

type InventoryRow = {
  id: string;
  code: string;
  name: string;
  type: InventoryTypeLabel;
  status: string;
  statusTone: StatusTone;
  owner: "Eigenmaterial" | "Extern";
  quantity: string;
  finance: string;
  createdAt?: string;
};

type DbItemRow = {
  id: string;
  name: string;
  barcode: string | null;
  serial_number: string | null;
  condition: ItemCondition | null;
  purchase_price: number | string | null;
  daily_rate: number | string | null;
  created_at: string;
};

type DbBulkRow = {
  id: string;
  name: string;
  barcode: string | null;
  total_quantity: number;
  purchase_price_total: number | string | null;
  daily_rate: number | string | null;
  created_at: string;
};

type DbCaseRow = {
  id: string;
  name: string;
  empty_weight: number | string | null;
  created_at: string;
};

type DbExternalRow = {
  id: string;
  name: string;
  default_quantity: number;
  purchase_price: number | string | null;
  sell_price: number | string | null;
  created_at: string;
};

type CaptureForm = {
  type: CaptureType;
  name: string;
  category: EquipmentCategory;
  condition: ItemCondition;
  barcode: string;
  serialNumber: string;
  quantity: string;
  weight: string;
  purchasePrice: string;
  dailyRate: string;
  supplier: string;
  supplierContact: string;
  notes: string;
};

type InventoryViewProps = {
  profile: UserProfile | null;
};

const categoryOptions: Array<{ value: EquipmentCategory; label: string }> = [
  { value: "lighting", label: "Licht" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "truss_rigging", label: "Truss / Rigging" },
  { value: "cables_accessories", label: "Kabel / Zubehör" },
  { value: "other", label: "Sonstiges" }
];

const conditionOptions: Array<{ value: ItemCondition; label: string }> = [
  { value: "good", label: "Gut" },
  { value: "minor_issues", label: "Leichte Mängel" },
  { value: "defective", label: "Defekt" },
  { value: "in_repair", label: "In Reparatur" },
  { value: "missing", label: "Vermisst" }
];

const captureTypeOptions: Array<{ value: CaptureType; label: string }> = [
  { value: "single", label: "Einzelgerät" },
  { value: "bulk", label: "Massenware" },
  { value: "case", label: "Case" },
  { value: "external", label: "Zumietung" }
];

const initialForm: CaptureForm = {
  type: "single",
  name: "",
  category: "lighting",
  condition: "good",
  barcode: "",
  serialNumber: "",
  quantity: "1",
  weight: "",
  purchasePrice: "",
  dailyRate: "",
  supplier: "",
  supplierContact: "",
  notes: ""
};

const demoRows: InventoryRow[] = [
  {
    id: "demo-single",
    code: "TG-LGT-001",
    name: "Robe Spiider #01",
    type: "Einzelgerät",
    status: "Verfügbar",
    statusTone: "good",
    owner: "Eigenmaterial",
    quantity: "1",
    finance: "Demo"
  },
  {
    id: "demo-bulk",
    code: "TG-CBL-PC10",
    name: "Powercon 10m",
    type: "Massenware",
    status: "Bestand",
    statusTone: "good",
    owner: "Eigenmaterial",
    quantity: "186 Stk.",
    finance: "Demo"
  }
];

function categoryLabel(value?: string | null) {
  return categoryOptions.find((option) => option.value === value)?.label ?? "Sonstiges";
}

function conditionStatus(condition?: ItemCondition | null): { label: string; tone: StatusTone } {
  switch (condition) {
    case "minor_issues":
      return { label: "Leichte Mängel", tone: "warn" };
    case "defective":
      return { label: "Defekt", tone: "bad" };
    case "in_repair":
      return { label: "In Reparatur", tone: "warn" };
    case "missing":
      return { label: "Vermisst", tone: "bad" };
    default:
      return { label: "Verfügbar", tone: "good" };
  }
}

function formatCurrency(value?: number | string | null) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "ohne Preis";
  }

  return new Intl.NumberFormat("de-CH", {
    currency: "CHF",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(numeric);
}

function optionalText(value: string) {
  return value.trim() || null;
}

function parseNumber(value: string, fallback = 0) {
  if (!value.trim()) {
    return fallback;
  }

  const numeric = Number(value.replace("'", "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function optionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const numeric = Number(value.replace("'", "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseQuantity(value: string) {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

function typeCode(type: InventoryTypeLabel) {
  switch (type) {
    case "Massenware":
      return "BULK";
    case "Case":
      return "CASE";
    case "Zumietung":
      return "EXT";
    default:
      return "ITEM";
  }
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
  detail
}: {
  icon: typeof Boxes;
  title: string;
  detail?: string;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-[var(--cyan)]" aria-hidden />
          <h2 className="truncate font-heading text-lg font-bold">{title}</h2>
        </div>
        {detail ? <p className="mt-1 text-sm text-[var(--text2)]">{detail}</p> : null}
      </div>
    </div>
  );
}

export function InventoryView({ profile }: InventoryViewProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<InventoryRow[]>(isSupabaseConfigured() ? [] : demoRows);
  const [form, setForm] = useState<CaptureForm>(initialForm);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<InventoryTypeLabel | "Alle">("Alle");
  const [statusFilter, setStatusFilter] = useState<string>("Alle");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [externalTableReady, setExternalTableReady] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

  const loadInventory = useCallback(async () => {
    if (!supabase || !profile) {
      setRows(isSupabaseConfigured() ? [] : demoRows);
      return;
    }

    setLoading(true);
    setMessage(undefined);

    const [itemsResponse, bulkResponse, casesResponse, externalResponse] = await Promise.all([
      supabase
        .from("items")
        .select("id, name, category, serial_number, barcode, condition, purchase_price, daily_rate, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("bulk_items")
        .select("id, name, category, barcode, total_quantity, purchase_price_total, daily_rate, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("cases")
        .select("id, name, empty_weight, max_weight, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("external_catalog_items")
        .select("id, name, category, supplier, default_quantity, purchase_price, sell_price, created_at")
        .order("created_at", { ascending: false })
    ]);

    if (itemsResponse.error || bulkResponse.error || casesResponse.error) {
      setMessage(itemsResponse.error?.message ?? bulkResponse.error?.message ?? casesResponse.error?.message);
      setLoading(false);
      return;
    }

    setExternalTableReady(!externalResponse.error);

    const itemRows: InventoryRow[] = ((itemsResponse.data ?? []) as DbItemRow[]).map((item) => {
      const status = conditionStatus(item.condition as ItemCondition);
      return {
        id: `item-${item.id}`,
        code: item.barcode || item.serial_number || `ITEM-${String(item.id).slice(0, 8)}`,
        name: item.name,
        type: "Einzelgerät",
        status: status.label,
        statusTone: status.tone,
        owner: "Eigenmaterial",
        quantity: "1",
        finance: formatCurrency(item.purchase_price ?? item.daily_rate),
        createdAt: item.created_at
      };
    });

    const bulkRows: InventoryRow[] = ((bulkResponse.data ?? []) as DbBulkRow[]).map((item) => ({
      id: `bulk-${item.id}`,
      code: item.barcode || `BULK-${String(item.id).slice(0, 8)}`,
      name: item.name,
      type: "Massenware",
      status: "Bestand",
      statusTone: Number(item.total_quantity) > 0 ? "good" : "warn",
      owner: "Eigenmaterial",
      quantity: `${item.total_quantity} Stk.`,
      finance: formatCurrency(item.purchase_price_total ?? item.daily_rate),
      createdAt: item.created_at
    }));

    const caseRows: InventoryRow[] = ((casesResponse.data ?? []) as DbCaseRow[]).map((item) => ({
      id: `case-${item.id}`,
      code: `CASE-${String(item.id).slice(0, 8)}`,
      name: item.name,
      type: "Case",
      status: "Verfügbar",
      statusTone: "good",
      owner: "Eigenmaterial",
      quantity: `${Number(item.empty_weight ?? 0).toFixed(1)} kg leer`,
      finance: "keine Amort.",
      createdAt: item.created_at
    }));

    const externalRows: InventoryRow[] = externalResponse.error
      ? []
      : ((externalResponse.data ?? []) as DbExternalRow[]).map((item) => ({
          id: `external-${item.id}`,
          code: `EXT-${String(item.id).slice(0, 8)}`,
          name: item.name,
          type: "Zumietung",
          status: "Katalog",
          statusTone: "neutral",
          owner: "Extern",
          quantity: `${item.default_quantity} Stk.`,
          finance: formatCurrency(item.purchase_price ?? item.sell_price),
          createdAt: item.created_at
        }));

    setRows([...itemRows, ...bulkRows, ...caseRows, ...externalRows]);
    setLastLoadedAt(new Date());
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const filteredRows = rows.filter((row) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = query
      ? [row.code, row.name, row.type, row.status, row.owner].some((value) => value.toLowerCase().includes(query))
      : true;
    const matchesType = typeFilter === "Alle" || row.type === typeFilter;
    const matchesStatus = statusFilter === "Alle" || row.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    cases: rows.filter((row) => row.type === "Case").length,
    external: rows.filter((row) => row.type === "Zumietung").length,
    single: rows.filter((row) => row.type === "Einzelgerät").length,
    bulk: rows.filter((row) => row.type === "Massenware").length
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !profile) {
      setMessage("Bitte zuerst einloggen. Ohne Profil kann kein Material gespeichert werden.");
      return;
    }

    if (!form.name.trim()) {
      setMessage("Bitte einen Namen erfassen.");
      return;
    }

    if (form.type === "external" && !externalTableReady) {
      setMessage("Zumietungs-Katalog ist vorbereitet, die Migration 0002 muss aber noch in Supabase ausgeführt werden.");
      return;
    }

    setSaving(true);
    setMessage(undefined);

    const org_id = profile.org_id;
    const basePayload = {
      org_id,
      name: form.name.trim(),
      notes: optionalText(form.notes)
    };

    const response =
      form.type === "single"
        ? await supabase.from("items").insert({
            ...basePayload,
            barcode: optionalText(form.barcode),
            category: form.category,
            condition: form.condition,
            daily_rate: parseNumber(form.dailyRate),
            purchase_price: optionalNumber(form.purchasePrice),
            serial_number: optionalText(form.serialNumber),
            supplier: optionalText(form.supplier),
            supplier_contact: optionalText(form.supplierContact),
            weight: parseNumber(form.weight)
          })
        : form.type === "bulk"
          ? await supabase.from("bulk_items").insert({
              ...basePayload,
              barcode: optionalText(form.barcode),
              category: form.category,
              daily_rate: optionalNumber(form.dailyRate),
              purchase_price_total: optionalNumber(form.purchasePrice),
              supplier: optionalText(form.supplier),
              supplier_contact: optionalText(form.supplierContact),
              total_quantity: parseQuantity(form.quantity),
              unit_weight: optionalNumber(form.weight)
            })
          : form.type === "case"
            ? await supabase.from("cases").insert({
                ...basePayload,
                empty_weight: parseNumber(form.weight),
                max_weight: null
              })
            : await supabase.from("external_catalog_items").insert({
                ...basePayload,
                category: form.category,
                default_quantity: parseQuantity(form.quantity),
                purchase_price: optionalNumber(form.purchasePrice),
                sell_price: optionalNumber(form.dailyRate),
                supplier: optionalText(form.supplier),
                supplier_contact: optionalText(form.supplierContact),
                unit_weight: optionalNumber(form.weight)
              });

    setSaving(false);

    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    setForm({ ...initialForm, type: form.type });
    setMessage(`${captureTypeOptions.find((option) => option.value === form.type)?.label} gespeichert.`);
    await loadInventory();
  }

  const statusOptions = ["Alle", ...Array.from(new Set(rows.map((row) => row.status)))];
  const selectedTypeLabel = captureTypeOptions.find((option) => option.value === form.type)?.label ?? "Material";
  const submitDisabled = saving || !profile || (form.type === "external" && !externalTableReady);

  return (
    <>
      <ViewHeader
        eyebrow="Material"
        title="Inventar & Stückgut"
        detail="Einzelgeräte werden einzeln geführt. Massenware wie Kabel, Adapter und Kabelbrücken arbeitet mit Stückzahlen. Zumietungen sind als externer Katalog vorbereitet."
      />

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel>
          <p className="text-sm font-medium text-[var(--text2)]">Einzelgeräte</p>
          <strong className="mt-2 block font-heading text-3xl">{stats.single}</strong>
        </Panel>
        <Panel>
          <p className="text-sm font-medium text-[var(--text2)]">Massenware</p>
          <strong className="mt-2 block font-heading text-3xl">{stats.bulk}</strong>
        </Panel>
        <Panel>
          <p className="text-sm font-medium text-[var(--text2)]">Cases</p>
          <strong className="mt-2 block font-heading text-3xl">{stats.cases}</strong>
        </Panel>
        <Panel>
          <p className="text-sm font-medium text-[var(--text2)]">Zumietung</p>
          <strong className="mt-2 block font-heading text-3xl">{stats.external}</strong>
          {!externalTableReady && isSupabaseConfigured() ? <StatusBadge tone="warn">Migration 0002 offen</StatusBadge> : null}
        </Panel>
      </div>

      <Panel>
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Suche</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text2)]" />
              <Field className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Gerät, Barcode, Case" value={search} />
            </div>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Typ</span>
            <Select onChange={(event) => setTypeFilter(event.target.value as InventoryTypeLabel | "Alle")} value={typeFilter}>
              <option>Alle</option>
              <option>Einzelgerät</option>
              <option>Massenware</option>
              <option>Case</option>
              <option>Zumietung</option>
            </Select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Status</span>
            <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </label>
          <Button className="mt-auto inline-flex items-center justify-center gap-2" onClick={() => void loadInventory()}>
            <ScanLine className="h-4 w-4" aria-hidden />
            Aktualisieren
          </Button>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SectionTitle icon={Boxes} title="Live-Bestand" detail={lastLoadedAt ? `Geladen ${lastLoadedAt.toLocaleTimeString("de-CH")}` : undefined} />
            <StatusBadge tone={isSupabaseConfigured() ? "good" : "warn"}>{isSupabaseConfigured() ? "Supabase live" : "Demo-Modus"}</StatusBadge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs uppercase text-[var(--text2)]">
                  <th className="px-3 py-3 font-bold">Code</th>
                  <th className="px-3 py-3 font-bold">Material</th>
                  <th className="px-3 py-3 font-bold">Typ</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Eigentum</th>
                  <th className="px-3 py-3 font-bold">Menge</th>
                  <th className="px-3 py-3 font-bold">Finanz</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-3 py-4 font-mono text-xs">{row.code}</td>
                    <td className="px-3 py-4">
                      <strong>{row.name}</strong>
                      <p className="text-xs text-[var(--text2)]">{typeCode(row.type)}</p>
                    </td>
                    <td className="px-3 py-4">{row.type}</td>
                    <td className="px-3 py-4">
                      <StatusBadge tone={row.statusTone}>{row.status}</StatusBadge>
                    </td>
                    <td className="px-3 py-4">{row.owner}</td>
                    <td className="px-3 py-4">{row.quantity}</td>
                    <td className="px-3 py-4">{row.finance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredRows.length === 0 ? (
            <ListRow className="mt-3">
              <strong>Noch kein Material gefunden</strong>
              <p className="text-sm text-[var(--text2)]">Erfasse rechts den ersten Eintrag. Danach erscheint er hier live aus Supabase.</p>
            </ListRow>
          ) : null}
          {loading ? <p className="mt-3 text-sm text-[var(--text2)]">Inventar wird geladen...</p> : null}
        </Panel>

        <Panel>
          <SectionTitle icon={PackagePlus} title="Schnellerfassung" detail={`${selectedTypeLabel} direkt in Supabase speichern`} />
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Erfassungsart</span>
              <Select onChange={(event) => setForm((value) => ({ ...value, type: event.target.value as CaptureType }))} value={form.type}>
                {captureTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Name</span>
              <Field
                onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                placeholder={form.type === "case" ? "z.B. Kabelcase C-12" : "z.B. Robe Spiider #15"}
                required
                value={form.name}
              />
            </label>
            {form.type !== "case" ? (
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Kategorie</span>
                <Select onChange={(event) => setForm((value) => ({ ...value, category: event.target.value as EquipmentCategory }))} value={form.category}>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
            ) : null}
            {form.type === "single" ? (
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Zustand</span>
                <Select onChange={(event) => setForm((value) => ({ ...value, condition: event.target.value as ItemCondition }))} value={form.condition}>
                  {conditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
            ) : null}
            {form.type !== "case" ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Barcode</span>
                  <Field onChange={(event) => setForm((value) => ({ ...value, barcode: event.target.value }))} placeholder="optional" value={form.barcode} />
                </label>
                {form.type === "single" ? (
                  <label>
                    <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Seriennummer</span>
                    <Field
                      onChange={(event) => setForm((value) => ({ ...value, serialNumber: event.target.value }))}
                      placeholder="optional"
                      value={form.serialNumber}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
            {form.type === "bulk" || form.type === "external" ? (
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Menge</span>
                <Field
                  min={1}
                  onChange={(event) => setForm((value) => ({ ...value, quantity: event.target.value }))}
                  type="number"
                  value={form.quantity}
                />
              </label>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">{form.type === "case" ? "Leergewicht kg" : "Gewicht kg"}</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, weight: event.target.value }))} placeholder="0.00" value={form.weight} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">
                  {form.type === "external" ? "Mietkosten netto" : form.type === "bulk" ? "EK Gesamt netto" : "EK netto"}
                </span>
                <Field onChange={(event) => setForm((value) => ({ ...value, purchasePrice: event.target.value }))} placeholder="CHF 0.00" value={form.purchasePrice} />
              </label>
            </div>
            {form.type !== "case" ? (
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">
                  {form.type === "external" ? "Verkaufspreis netto" : "Tagesrate netto"}
                </span>
                <Field onChange={(event) => setForm((value) => ({ ...value, dailyRate: event.target.value }))} placeholder="CHF 0.00" value={form.dailyRate} />
              </label>
            ) : null}
            {form.type === "external" || form.type === "single" || form.type === "bulk" ? (
              <div className="grid gap-3">
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Lieferant</span>
                  <Field onChange={(event) => setForm((value) => ({ ...value, supplier: event.target.value }))} placeholder="optional" value={form.supplier} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Kontakt / URL</span>
                  <Field
                    onChange={(event) => setForm((value) => ({ ...value, supplierContact: event.target.value }))}
                    placeholder="optional"
                    value={form.supplierContact}
                  />
                </label>
              </div>
            ) : null}
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Notiz</span>
              <Field onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} placeholder="optional" value={form.notes} />
            </label>

            {form.type === "external" && !externalTableReady ? (
              <ListRow>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" aria-hidden />
                  <p className="text-sm text-[var(--text2)]">
                    Der Zumietungs-Katalog braucht noch Migration 0002. Eigene Geräte, Massenware und Cases kannst du bereits speichern.
                  </p>
                </div>
              </ListRow>
            ) : null}

            <Button disabled={submitDisabled} type="submit" variant="primary" className="inline-flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {saving ? "Speichern..." : "Speichern"}
            </Button>
          </form>

          {message ? (
            <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--bg2)] p-3 text-sm text-[var(--text2)]">{message}</div>
          ) : null}
          <p className="mt-4 text-xs leading-5 text-[var(--text2)]">
            Kategorie: {categoryLabel(form.category)}. Externes Material zählt später nicht zur Netto-Amortisation und wird in Aufträgen als Zumietung geführt.
          </p>
        </Panel>
      </div>
    </>
  );
}
