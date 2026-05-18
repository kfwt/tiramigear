"use client";

import clsx from "clsx";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Settings
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Field, ListRow, Panel, Select, StatusBadge } from "@/components/ui";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ProjectStatus, ProjectStatusCode, StatusTone, UserProfile } from "@/types/domain";

type ProjectRow = {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  status: ProjectStatusCode;
  event_start_at: string | null;
  event_end_at: string | null;
  pack_at: string | null;
  load_at: string;
  return_at: string;
  check_due_at: string | null;
  discount_percent: number | string;
  vat_rate: number | string;
  notes: string | null;
  created_at: string;
};

type ProjectForm = {
  name: string;
  client: string;
  location: string;
  status: ProjectStatusCode;
  eventStartAt: string;
  eventEndAt: string;
  packAt: string;
  loadAt: string;
  returnAt: string;
  checkDueAt: string;
  discountPercent: string;
  vatRate: string;
  notes: string;
};

type EquipmentCategory = "audio" | "lighting" | "video" | "truss_rigging" | "cables_accessories" | "other";
type PositionSourceType = "item" | "bulk_item" | "case" | "external" | "manual";

type MaterialOption = {
  key: string;
  id: string | null;
  itemIds?: string[];
  availableQuantity?: number;
  sourceType: PositionSourceType;
  name: string;
  label: string;
  category: EquipmentCategory | null;
  quantityHint: string;
  unitPrice: number;
  purchasePrice?: number;
  supplier?: string | null;
};

type ProjectPositionRow = {
  id: string;
  source_type: PositionSourceType;
  source_id: string | null;
  description: string;
  category: EquipmentCategory | null;
  quantity: number | string;
  days: number | string;
  unit_price: number | string;
  total_price: number | string;
  counts_for_amortization: boolean;
  created_at: string;
};

type PositionForm = {
  materialKey: string;
  description: string;
  quantity: string;
  days: string;
  unitPrice: string;
};

type DbItemOptionRow = {
  id: string;
  name: string;
  barcode: string | null;
  serial_number: string | null;
  condition: string | null;
  category: EquipmentCategory | null;
  daily_rate: number | string | null;
};

type DbBulkOptionRow = {
  id: string;
  name: string;
  barcode: string | null;
  category: EquipmentCategory | null;
  total_quantity: number;
  daily_rate: number | string | null;
};

type DbCaseOptionRow = {
  id: string;
  name: string;
  empty_weight: number | string | null;
};

type DbExternalOptionRow = {
  id: string;
  name: string;
  category: EquipmentCategory | null;
  default_quantity: number;
  purchase_price: number | string | null;
  sell_price: number | string | null;
  supplier: string | null;
};

type DbProjectItemAssignmentRow = {
  item_id: string;
};

type OrdersViewProps = {
  profile: UserProfile | null;
};

const statusOptions: Array<{ value: ProjectStatusCode; label: ProjectStatus; tone: StatusTone }> = [
  { value: "inquiry_calculation", label: "Anfrage / Kalkulation", tone: "warn" },
  { value: "planned", label: "Geplant", tone: "warn" },
  { value: "confirmed", label: "Bestätigt", tone: "good" },
  { value: "packing", label: "In Packung", tone: "warn" },
  { value: "loaded", label: "Geladen", tone: "good" },
  { value: "in_use", label: "Im Einsatz", tone: "good" },
  { value: "returned", label: "Retour", tone: "warn" },
  { value: "in_check", label: "In Kontrolle", tone: "warn" },
  { value: "completed", label: "Abgeschlossen", tone: "good" },
  { value: "cancelled", label: "Storniert", tone: "bad" }
];

const demoProjects: ProjectRow[] = [
  {
    id: "demo-festival",
    name: "Festival Setup",
    client: "StageOne",
    location: "Basel",
    status: "planned",
    event_start_at: "2026-05-28T16:00:00.000Z",
    event_end_at: "2026-05-29T01:00:00.000Z",
    pack_at: "2026-05-27T08:00:00.000Z",
    load_at: "2026-05-27T10:00:00.000Z",
    return_at: "2026-05-29T16:00:00.000Z",
    check_due_at: "2026-05-30T12:00:00.000Z",
    discount_percent: 0,
    vat_rate: 8.1,
    notes: "Demo-Auftrag",
    created_at: "2026-05-18T10:00:00.000Z"
  }
];

const manualMaterialOption: MaterialOption = {
  key: "manual",
  id: null,
  sourceType: "manual",
  name: "Manuelle Position",
  label: "Manuelle Position",
  category: "other",
  quantityHint: "frei",
  unitPrice: 0
};

const demoPositions: ProjectPositionRow[] = [
  {
    id: "demo-position",
    source_type: "manual",
    source_id: null,
    description: "Demo Materialposition",
    category: "other",
    quantity: 1,
    days: 1,
    unit_price: 0,
    total_price: 0,
    counts_for_amortization: false,
    created_at: "2026-05-18T10:00:00.000Z"
  }
];

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function toDateTimeInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "offen";
  }

  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function parseNumber(value: string, fallback: number) {
  if (!value.trim()) {
    return fallback;
  }

  const numeric = Number(value.replace("'", "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function optionalText(value: string) {
  return value.trim() || null;
}

function formatCurrency(value?: number | string | null) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "CHF 0.00";
  }

  return new Intl.NumberFormat("de-CH", {
    currency: "CHF",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(numeric);
}

function averageNumber(values: Array<number | string | null | undefined>) {
  const numericValues = values.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);

  if (numericValues.length === 0) {
    return 0;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function itemCode(item: DbItemOptionRow) {
  return item.barcode || item.serial_number || `ITEM-${String(item.id).slice(0, 8)}`;
}

function itemConditionLabel(value?: string | null) {
  switch (value) {
    case "minor_issues":
      return "mit leichten Mängeln";
    case "defective":
      return "defekt";
    case "in_repair":
      return "in Reparatur";
    case "missing":
      return "vermisst";
    default:
      return "verfügbar";
  }
}

function categoryLabel(value?: EquipmentCategory | null) {
  switch (value) {
    case "audio":
      return "Audio";
    case "lighting":
      return "Licht";
    case "video":
      return "Video";
    case "truss_rigging":
      return "Truss / Rigging";
    case "cables_accessories":
      return "Kabel / Zubehör";
    default:
      return "Sonstiges";
  }
}

function sourceLabel(sourceType: PositionSourceType) {
  switch (sourceType) {
    case "item":
      return "Einzelgerät";
    case "bulk_item":
      return "Massenware";
    case "case":
      return "Case";
    case "external":
      return "Zumietung";
    default:
      return "Manuell";
  }
}

function sourceTone(sourceType: PositionSourceType): StatusTone {
  if (sourceType === "external") {
    return "warn";
  }

  if (sourceType === "manual") {
    return "neutral";
  }

  return "good";
}

function positionTotal(quantity: string, days: string, unitPrice: string) {
  return parseNumber(quantity, 0) * parseNumber(days, 1) * parseNumber(unitPrice, 0);
}

function requiresWholeQuantity(sourceType: PositionSourceType) {
  return sourceType === "item" || sourceType === "bulk_item" || sourceType === "external";
}

function statusMeta(status: ProjectStatusCode) {
  return statusOptions.find((option) => option.value === status) ?? statusOptions[0];
}

function initialForm(): ProjectForm {
  const now = new Date();
  const eventStart = addHours(now, 24 * 7);
  const eventEnd = addHours(eventStart, 8);
  const packAt = addHours(eventStart, -30);
  const loadAt = addHours(eventStart, -24);
  const returnAt = addHours(eventEnd, 16);
  const checkDueAt = addHours(returnAt, 24);

  return {
    name: "",
    client: "",
    location: "",
    status: "inquiry_calculation",
    eventStartAt: toDateTimeInput(eventStart),
    eventEndAt: toDateTimeInput(eventEnd),
    packAt: toDateTimeInput(packAt),
    loadAt: toDateTimeInput(loadAt),
    returnAt: toDateTimeInput(returnAt),
    checkDueAt: toDateTimeInput(checkDueAt),
    discountPercent: "0",
    vatRate: "8.1",
    notes: ""
  };
}

function initialPositionForm(): PositionForm {
  return {
    materialKey: manualMaterialOption.key,
    description: "",
    quantity: "1",
    days: "1",
    unitPrice: "0"
  };
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
  icon: typeof ClipboardList;
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

function WorkflowStrip({ current }: { current: ProjectStatusCode }) {
  const workflow = statusOptions.filter((status) => status.value !== "cancelled");
  const currentIndex = workflow.findIndex((status) => status.value === current);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {workflow.map((status, index) => {
        const active = current !== "cancelled" && index <= currentIndex;
        return (
          <div
            key={status.value}
            className={clsx(
              "flex min-w-[138px] items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold",
              active
                ? "border-[var(--cyan)] bg-[rgba(0,204,204,0.12)] text-[var(--text)]"
                : "border-[var(--line)] bg-[var(--bg2)] text-[var(--text2)]"
            )}
          >
            {active ? <CheckCircle2 className="h-4 w-4 text-[var(--cyan)]" aria-hidden /> : <span className="h-4 w-4 rounded-full border border-[var(--line)]" />}
            {status.label}
          </div>
        );
      })}
    </div>
  );
}

export function OrdersView({ profile }: OrdersViewProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [projects, setProjects] = useState<ProjectRow[]>(isSupabaseConfigured() ? [] : demoProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(() => initialForm());
  const [positionForm, setPositionForm] = useState<PositionForm>(() => initialPositionForm());
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([manualMaterialOption]);
  const [positions, setPositions] = useState<ProjectPositionRow[]>(isSupabaseConfigured() ? [] : demoPositions);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);
  const [message, setMessage] = useState<string>();
  const [positionMessage, setPositionMessage] = useState<string>();
  const [externalCatalogReady, setExternalCatalogReady] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

  const loadMaterialOptions = useCallback(async () => {
    if (!supabase || !profile) {
      setMaterialOptions([manualMaterialOption]);
      return;
    }

    const [itemsResponse, bulkResponse, casesResponse, externalResponse] = await Promise.all([
      supabase
        .from("items")
        .select("id, name, barcode, serial_number, condition, category, daily_rate")
        .order("name", { ascending: true }),
      supabase
        .from("bulk_items")
        .select("id, name, barcode, category, total_quantity, daily_rate")
        .order("name", { ascending: true }),
      supabase
        .from("cases")
        .select("id, name, empty_weight")
        .order("name", { ascending: true }),
      supabase
        .from("external_catalog_items")
        .select("id, name, category, default_quantity, purchase_price, sell_price, supplier")
        .eq("is_active", true)
        .order("name", { ascending: true })
    ]);

    setExternalCatalogReady(!externalResponse.error);

    const itemGroups = new Map<string, DbItemOptionRow[]>();

    if (!itemsResponse.error) {
      ((itemsResponse.data ?? []) as DbItemOptionRow[]).forEach((item) => {
        const groupKey = [item.name.trim().toLowerCase(), item.category ?? "other", item.condition ?? "good", Number(item.daily_rate ?? 0)].join("|");
        itemGroups.set(groupKey, [...(itemGroups.get(groupKey) ?? []), item]);
      });
    }

    const itemOptions: MaterialOption[] = Array.from(itemGroups.values()).map((items) => {
      const firstItem = items[0];
      const codes = items.map(itemCode);
      const conditionHint = itemConditionLabel(firstItem.condition);

      return {
        key: `item:${items.map((item) => item.id).join(":")}`,
        id: items.length === 1 ? firstItem.id : null,
        itemIds: items.map((item) => item.id),
        availableQuantity: items.length,
        sourceType: "item",
        name: firstItem.name,
        label: items.length > 1 ? `${firstItem.name} · ${items.length} Einzelgeräte` : `${firstItem.name} · ${codes[0]}`,
        category: firstItem.category,
        quantityHint: `${items.length} ${conditionHint}`,
        unitPrice: averageNumber(items.map((item) => item.daily_rate))
      };
    });

    const bulkOptions: MaterialOption[] = bulkResponse.error
      ? []
      : ((bulkResponse.data ?? []) as DbBulkOptionRow[]).map((item) => ({
          key: `bulk_item:${item.id}`,
          id: item.id,
          sourceType: "bulk_item",
          name: item.name,
          label: `${item.name}${item.barcode ? ` · ${item.barcode}` : ""}`,
          category: item.category,
          quantityHint: `${item.total_quantity} Stk. Bestand`,
          availableQuantity: item.total_quantity,
          unitPrice: Number(item.daily_rate ?? 0)
        }));

    const caseOptions: MaterialOption[] = casesResponse.error
      ? []
      : ((casesResponse.data ?? []) as DbCaseOptionRow[]).map((item) => ({
          key: `case:${item.id}`,
          id: item.id,
          sourceType: "case",
          name: item.name,
          label: `${item.name} · Case`,
          category: "other",
          quantityHint: `${Number(item.empty_weight ?? 0).toFixed(1)} kg leer`,
          unitPrice: 0
        }));

    const externalOptions: MaterialOption[] = externalResponse.error
      ? []
      : ((externalResponse.data ?? []) as DbExternalOptionRow[]).map((item) => ({
          key: `external:${item.id}`,
          id: item.id,
          sourceType: "external",
          name: item.name,
          label: `${item.name}${item.supplier ? ` · ${item.supplier}` : ""}`,
          category: item.category,
          quantityHint: `${item.default_quantity} Stk. Standard`,
          unitPrice: Number(item.sell_price ?? item.purchase_price ?? 0),
          purchasePrice: Number(item.purchase_price ?? 0),
          supplier: item.supplier
        }));

    setMaterialOptions([manualMaterialOption, ...itemOptions, ...bulkOptions, ...caseOptions, ...externalOptions]);
  }, [profile, supabase]);

  const loadProjects = useCallback(async () => {
    if (!supabase || !profile) {
      setProjects(isSupabaseConfigured() ? [] : demoProjects);
      return;
    }

    setLoading(true);
    setMessage(undefined);

    const { data, error } = await supabase
      .from("projects")
      .select(
        "id, name, client, location, status, event_start_at, event_end_at, pack_at, load_at, return_at, check_due_at, discount_percent, vat_rate, notes, created_at"
      )
      .order("load_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const loadedProjects = (data ?? []) as ProjectRow[];
    setProjects(loadedProjects);
    setSelectedId((current) => current ?? loadedProjects[0]?.id ?? null);
    setLastLoadedAt(new Date());
    setLoading(false);
  }, [profile, supabase]);

  const loadPositions = useCallback(
    async (projectId: string | null) => {
      if (!projectId) {
        setPositions([]);
        return;
      }

      if (!supabase || !profile) {
        setPositions(isSupabaseConfigured() ? [] : demoPositions);
        return;
      }

      const { data, error } = await supabase
        .from("project_positions")
        .select("id, source_type, source_id, description, category, quantity, days, unit_price, total_price, counts_for_amortization, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) {
        setPositionMessage(error.message);
        return;
      }

      setPositions((data ?? []) as ProjectPositionRow[]);
      setPositionMessage(undefined);
    },
    [profile, supabase]
  );

  useEffect(() => {
    void loadProjects();
    void loadMaterialOptions();
  }, [loadMaterialOptions, loadProjects]);

  const selectedProject = projects.find((project) => project.id === selectedId) ?? projects[0] ?? null;
  const statusCounts = statusOptions.map((status) => ({
    ...status,
    count: projects.filter((project) => project.status === status.value).length
  }));

  useEffect(() => {
    void loadPositions(selectedProject?.id ?? null);
  }, [loadPositions, selectedProject?.id]);

  const selectedMaterial = materialOptions.find((option) => option.key === positionForm.materialKey) ?? manualMaterialOption;
  const ownMaterialTotal = positions
    .filter((position) => position.counts_for_amortization)
    .reduce((sum, position) => sum + Number(position.total_price ?? 0), 0);
  const externalTotal = positions
    .filter((position) => position.source_type === "external")
    .reduce((sum, position) => sum + Number(position.total_price ?? 0), 0);
  const currentPositionTotal = positionTotal(positionForm.quantity, positionForm.days, positionForm.unitPrice);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !profile) {
      setMessage("Bitte zuerst einloggen. Ohne Profil kann kein Auftrag gespeichert werden.");
      return;
    }

    const loadAt = fromDateTimeInput(form.loadAt);
    const returnAt = fromDateTimeInput(form.returnAt);

    if (!form.name.trim() || !loadAt || !returnAt) {
      setMessage("Bitte Auftrag, Ladezeit und Retourzeit erfassen.");
      return;
    }

    if (new Date(returnAt) < new Date(loadAt)) {
      setMessage("Retour muss nach dem Ladedatum liegen.");
      return;
    }

    const eventStartAt = fromDateTimeInput(form.eventStartAt);
    const eventEndAt = fromDateTimeInput(form.eventEndAt);

    if (eventStartAt && eventEndAt && new Date(eventEndAt) < new Date(eventStartAt)) {
      setMessage("Event-Ende muss nach Event-Beginn liegen.");
      return;
    }

    setSaving(true);
    setMessage(undefined);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        check_due_at: fromDateTimeInput(form.checkDueAt),
        client: optionalText(form.client),
        created_by: profile.id,
        discount_percent: parseNumber(form.discountPercent, 0),
        event_end_at: eventEndAt,
        event_start_at: eventStartAt,
        load_at: loadAt,
        location: optionalText(form.location),
        name: form.name.trim(),
        notes: optionalText(form.notes),
        org_id: profile.org_id,
        pack_at: fromDateTimeInput(form.packAt),
        return_at: returnAt,
        status: form.status,
        vat_rate: parseNumber(form.vatRate, 8.1)
      })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm(initialForm());
    setSelectedId(data?.id ?? null);
    setMessage("Auftrag gespeichert.");
    await loadProjects();
  }

  async function handleAddPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !profile || !selectedProject) {
      setPositionMessage("Bitte zuerst einen Auftrag auswählen.");
      return;
    }

    const description = positionForm.description.trim() || selectedMaterial.name;
    const parsedQuantity = selectedMaterial.sourceType === "case" ? 1 : parseNumber(positionForm.quantity, 1);
    const days = parseNumber(positionForm.days, 1);
    const unitPrice = parseNumber(positionForm.unitPrice, selectedMaterial.unitPrice);
    const quantity = requiresWholeQuantity(selectedMaterial.sourceType) ? Math.round(parsedQuantity) : parsedQuantity;
    const totalPrice = quantity * days * unitPrice;

    if (!description) {
      setPositionMessage("Bitte eine Beschreibung erfassen.");
      return;
    }

    if (parsedQuantity <= 0 || days <= 0) {
      setPositionMessage("Menge und Tage müssen grösser als 0 sein.");
      return;
    }

    if (requiresWholeQuantity(selectedMaterial.sourceType) && !Number.isInteger(parsedQuantity)) {
      setPositionMessage("Einzelgeräte, Massenware und Zumietung brauchen ganze Stückzahlen.");
      return;
    }

    if (selectedMaterial.availableQuantity && quantity > selectedMaterial.availableQuantity) {
      setPositionMessage(`Es sind nur ${selectedMaterial.availableQuantity} Stück in dieser Auswahl verfügbar.`);
      return;
    }

    setSavingPosition(true);
    setPositionMessage(undefined);

    let assignedItemIds: string[] = [];

    if (selectedMaterial.sourceType === "item") {
      const itemIds = selectedMaterial.itemIds ?? (selectedMaterial.id ? [selectedMaterial.id] : []);

      if (itemIds.length === 0) {
        setSavingPosition(false);
        setPositionMessage("Diese Einzelgeräte-Gruppe enthält keine Geräte.");
        return;
      }

      const { data: existingItems, error } = await supabase
        .from("project_item_assignments")
        .select("item_id")
        .eq("project_id", selectedProject.id)
        .in("item_id", itemIds);

      if (error) {
        setSavingPosition(false);
        setPositionMessage(error.message);
        return;
      }

      const blockedItemIds = new Set(((existingItems ?? []) as DbProjectItemAssignmentRow[]).map((item) => item.item_id));
      assignedItemIds = itemIds.filter((itemId) => !blockedItemIds.has(itemId)).slice(0, quantity);

      if (assignedItemIds.length < quantity) {
        setSavingPosition(false);
        setPositionMessage(`In dieser Einzelgeräte-Gruppe sind nur ${assignedItemIds.length} Stück für diesen Auftrag frei.`);
        return;
      }
    }

    if (selectedMaterial.sourceType === "bulk_item" && selectedMaterial.id) {
      const { data: existingBulk } = await supabase
        .from("project_bulk_assignments")
        .select("id")
        .eq("project_id", selectedProject.id)
        .eq("bulk_item_id", selectedMaterial.id)
        .maybeSingle();

      if (existingBulk) {
        setSavingPosition(false);
        setPositionMessage("Diese Massenware ist bereits auf dem Auftrag.");
        return;
      }
    }

    const countsForAmortization = selectedMaterial.sourceType === "item" || selectedMaterial.sourceType === "bulk_item";
    const sourceId =
      selectedMaterial.sourceType === "item"
        ? assignedItemIds.length === 1
          ? assignedItemIds[0]
          : null
        : selectedMaterial.sourceType === "manual" || selectedMaterial.sourceType === "external"
          ? null
          : selectedMaterial.id;

    const { data: positionData, error: positionError } = await supabase
      .from("project_positions")
      .insert({
        category: selectedMaterial.category,
        counts_for_amortization: countsForAmortization,
        days,
        description,
        org_id: profile.org_id,
        project_id: selectedProject.id,
        quantity,
        source_id: sourceId,
        source_type: selectedMaterial.sourceType,
        total_price: totalPrice,
        unit_price: unitPrice
      })
      .select("id")
      .single();

    if (positionError || !positionData?.id) {
      setSavingPosition(false);
      setPositionMessage(positionError?.message ?? "Position konnte nicht gespeichert werden.");
      return;
    }

    const positionId = positionData.id as string;

    if (selectedMaterial.sourceType === "item" && assignedItemIds.length > 0) {
      const { error } = await supabase.from("project_item_assignments").insert(
        assignedItemIds.map((itemId) => ({
          item_id: itemId,
          org_id: profile.org_id,
          position_id: positionId,
          project_id: selectedProject.id
        }))
      );

      if (error) {
        setSavingPosition(false);
        setPositionMessage(error.message);
        await loadPositions(selectedProject.id);
        return;
      }
    }

    if (selectedMaterial.sourceType === "bulk_item" && selectedMaterial.id) {
      const { error } = await supabase.from("project_bulk_assignments").insert({
        bulk_item_id: selectedMaterial.id,
        org_id: profile.org_id,
        planned_quantity: Math.round(quantity),
        position_id: positionId,
        project_id: selectedProject.id
      });

      if (error) {
        setSavingPosition(false);
        setPositionMessage(error.message);
        await loadPositions(selectedProject.id);
        return;
      }
    }

    if (selectedMaterial.sourceType === "external") {
      const { data: externalData, error } = await supabase
        .from("external_rental_items")
        .insert({
          category: selectedMaterial.category,
          description,
          org_id: profile.org_id,
          position_id: positionId,
          project_id: selectedProject.id,
          purchase_price: selectedMaterial.purchasePrice ?? null,
          quantity: Math.max(1, Math.round(quantity)),
          rental_end_at: selectedProject.return_at,
          rental_start_at: selectedProject.load_at,
          sell_price: totalPrice,
          status: "need_open",
          supplier: selectedMaterial.supplier ?? null
        })
        .select("id")
        .single();

      if (error) {
        setSavingPosition(false);
        setPositionMessage(error.message);
        await loadPositions(selectedProject.id);
        return;
      }

      if (externalData?.id) {
        await supabase.from("project_positions").update({ source_id: externalData.id }).eq("id", positionId);
      }
    }

    setSavingPosition(false);
    setPositionForm(initialPositionForm());
    setPositionMessage("Materialposition gespeichert.");
    await loadPositions(selectedProject.id);
  }

  async function updateStatus(projectId: string, status: ProjectStatusCode) {
    if (!supabase) {
      return;
    }

    setMessage(undefined);

    const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setProjects((current) => current.map((project) => (project.id === projectId ? { ...project, status } : project)));
  }

  return (
    <>
      <ViewHeader
        eyebrow="Aufträge"
        title="Auftrag disponieren"
        detail="Auftragsköpfe, Materialpositionen und gruppierte Einzelgeräte werden live in Supabase gespeichert. Verfügbarkeitswarnungen hängen wir als nächsten Schritt daran."
      />

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel>
          <p className="text-sm font-medium text-[var(--text2)]">Aufträge total</p>
          <strong className="mt-2 block font-heading text-3xl">{projects.length}</strong>
        </Panel>
        {statusCounts.slice(0, 3).map((status) => (
          <Panel key={status.value}>
            <p className="text-sm font-medium text-[var(--text2)]">{status.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <strong className="font-heading text-3xl leading-none">{status.count}</strong>
              <StatusBadge tone={status.tone}>{status.count === 1 ? "Auftrag" : "Aufträge"}</StatusBadge>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4">
          <Panel>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <SectionTitle
                icon={ClipboardList}
                title="Live-Auftragsliste"
                detail={lastLoadedAt ? `Geladen ${lastLoadedAt.toLocaleTimeString("de-CH")}` : undefined}
              />
              <Button className="inline-flex items-center gap-2" onClick={() => void loadProjects()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
                Aktualisieren
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--line)] text-xs uppercase text-[var(--text2)]">
                    <th className="px-3 py-3 font-bold">Laden</th>
                    <th className="px-3 py-3 font-bold">Auftrag</th>
                    <th className="px-3 py-3 font-bold">Kunde</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-3 py-3 font-bold">Retour</th>
                    <th className="px-3 py-3 font-bold">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    const meta = statusMeta(project.status);
                    const selected = selectedProject?.id === project.id;
                    return (
                      <tr key={project.id} className={clsx("border-b border-[var(--line)] last:border-0", selected && "bg-[var(--bg2)]")}>
                        <td className="px-3 py-4 font-medium">{formatDateTime(project.load_at)}</td>
                        <td className="px-3 py-4">
                          <strong>{project.name}</strong>
                          <p className="text-xs text-[var(--text2)]">{project.location || "ohne Ort"}</p>
                        </td>
                        <td className="px-3 py-4">{project.client || "offen"}</td>
                        <td className="px-3 py-4">
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        </td>
                        <td className="px-3 py-4">{formatDateTime(project.return_at)}</td>
                        <td className="px-3 py-4">
                          <button className="font-bold text-[var(--text)] underline-offset-4 hover:underline" onClick={() => setSelectedId(project.id)}>
                            Öffnen
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!loading && projects.length === 0 ? (
              <ListRow className="mt-3">
                <strong>Noch kein Auftrag vorhanden</strong>
                <p className="text-sm text-[var(--text2)]">Erfasse rechts den ersten Auftrag. Danach können wir Materialpositionen und Warnungen anbinden.</p>
              </ListRow>
            ) : null}
          </Panel>

          {selectedProject ? (
            <Panel>
              <SectionTitle icon={Settings} title="Statusfluss" detail={selectedProject.name} />
              <WorkflowStrip current={selectedProject.status} />
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Status setzen</span>
                  <Select
                    onChange={(event) => void updateStatus(selectedProject.id, event.target.value as ProjectStatusCode)}
                    value={selectedProject.status}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                </label>
                <StatusBadge tone={statusMeta(selectedProject.status).tone}>{statusMeta(selectedProject.status).label}</StatusBadge>
              </div>
            </Panel>
          ) : null}

          {selectedProject ? (
            <Panel>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <SectionTitle icon={ClipboardList} title="Materialpositionen" detail={selectedProject.name} />
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="good">Eigenmaterial {formatCurrency(ownMaterialTotal)}</StatusBadge>
                  <StatusBadge tone={externalTotal > 0 ? "warn" : "neutral"}>Zumietung {formatCurrency(externalTotal)}</StatusBadge>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[var(--line)] text-xs uppercase text-[var(--text2)]">
                          <th className="px-3 py-3 font-bold">Position</th>
                          <th className="px-3 py-3 font-bold">Quelle</th>
                          <th className="px-3 py-3 font-bold">Menge</th>
                          <th className="px-3 py-3 font-bold">Tage</th>
                          <th className="px-3 py-3 font-bold">EP netto</th>
                          <th className="px-3 py-3 font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((position) => (
                          <tr key={position.id} className="border-b border-[var(--line)] last:border-0">
                            <td className="px-3 py-4">
                              <strong>{position.description}</strong>
                              <p className="text-xs text-[var(--text2)]">{categoryLabel(position.category)}</p>
                            </td>
                            <td className="px-3 py-4">
                              <StatusBadge tone={sourceTone(position.source_type)}>{sourceLabel(position.source_type)}</StatusBadge>
                            </td>
                            <td className="px-3 py-4">{Number(position.quantity).toLocaleString("de-CH")}</td>
                            <td className="px-3 py-4">{Number(position.days).toLocaleString("de-CH")}</td>
                            <td className="px-3 py-4">{formatCurrency(position.unit_price)}</td>
                            <td className="px-3 py-4 font-bold">{formatCurrency(position.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {positions.length === 0 ? (
                    <ListRow className="mt-3">
                      <strong>Noch keine Materialpositionen</strong>
                      <p className="text-sm text-[var(--text2)]">Wähle rechts Material aus Inventar, Massenware, Cases oder Zumietung.</p>
                    </ListRow>
                  ) : null}
                </div>

                <form className="grid gap-3" onSubmit={handleAddPosition}>
                  <label>
                    <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Material</span>
                    <Select
                      onChange={(event) => {
                        const next = materialOptions.find((option) => option.key === event.target.value) ?? manualMaterialOption;
                        const currentQuantity = parseNumber(positionForm.quantity, 1);
                        const cappedQuantity = next.availableQuantity ? Math.min(Math.max(1, Math.round(currentQuantity)), next.availableQuantity) : currentQuantity;
                        setPositionForm((value) => ({
                          ...value,
                          description: next.sourceType === "manual" ? value.description : next.name,
                          materialKey: next.key,
                          quantity: next.sourceType === "case" ? "1" : String(cappedQuantity),
                          unitPrice: String(next.unitPrice)
                        }));
                      }}
                      value={positionForm.materialKey}
                    >
                      {materialOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {sourceLabel(option.sourceType)} · {option.label}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <ListRow>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={sourceTone(selectedMaterial.sourceType)}>{sourceLabel(selectedMaterial.sourceType)}</StatusBadge>
                      <StatusBadge>{selectedMaterial.quantityHint}</StatusBadge>
                      {selectedMaterial.sourceType === "external" ? <StatusBadge tone="warn">keine Amortisation</StatusBadge> : null}
                    </div>
                  </ListRow>

                  <label>
                    <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Beschreibung</span>
                    <Field
                      onChange={(event) => setPositionForm((value) => ({ ...value, description: event.target.value }))}
                      placeholder="z.B. 4x Moving Light extern"
                      value={positionForm.description}
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                    <label>
                      <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Menge</span>
                      <Field
                        disabled={selectedMaterial.sourceType === "case"}
                        max={selectedMaterial.availableQuantity}
                        min={1}
                        onChange={(event) => setPositionForm((value) => ({ ...value, quantity: event.target.value }))}
                        step={selectedMaterial.sourceType === "manual" ? "0.25" : "1"}
                        type="number"
                        value={positionForm.quantity}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Tage</span>
                      <Field
                        min={0.25}
                        onChange={(event) => setPositionForm((value) => ({ ...value, days: event.target.value }))}
                        step="0.25"
                        type="number"
                        value={positionForm.days}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">EP netto</span>
                      <Field onChange={(event) => setPositionForm((value) => ({ ...value, unitPrice: event.target.value }))} value={positionForm.unitPrice} />
                    </label>
                  </div>

                  <div className="rounded-lg bg-[var(--bg2)] p-3">
                    <span className="text-xs font-bold uppercase text-[var(--text2)]">Position total</span>
                    <strong className="mt-1 block font-heading text-2xl">{formatCurrency(currentPositionTotal)}</strong>
                  </div>

                  {!externalCatalogReady ? (
                    <ListRow>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" aria-hidden />
                        <p className="text-sm text-[var(--text2)]">Zumietungs-Katalog ist noch nicht aktiv. Manuelle und eigene Positionen funktionieren bereits.</p>
                      </div>
                    </ListRow>
                  ) : null}

                  <Button disabled={savingPosition || !selectedProject} type="submit" variant="primary" className="inline-flex items-center justify-center gap-2">
                    {savingPosition ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                    {savingPosition ? "Speichern..." : "Position hinzufügen"}
                  </Button>

                  {positionMessage ? (
                    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg2)] p-3 text-sm text-[var(--text2)]">{positionMessage}</div>
                  ) : null}
                </form>
              </div>
            </Panel>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Panel>
              <SectionTitle icon={AlertTriangle} title="Verfügbarkeit" />
              <StatusBadge tone="warn">nächster Schritt</StatusBadge>
              <p className="mt-3 text-sm text-[var(--text2)]">Warnungen werden aus Materialpositionen und Zeitfenster berechnet.</p>
            </Panel>
            <Panel>
              <SectionTitle icon={ClipboardCheck} title="Rücknahme" />
              <StatusBadge tone="warn">vorbereitet</StatusBadge>
              <p className="mt-3 text-sm text-[var(--text2)]">Retour und Kontrolle hängen am Statusfluss und später an Scanlisten.</p>
            </Panel>
            <Panel>
              <SectionTitle icon={FileText} title="Netto-Amortisation" />
              <StatusBadge tone="neutral">ohne MwSt.</StatusBadge>
              <p className="mt-3 text-sm text-[var(--text2)]">Berechnung folgt, sobald Eigenmaterialpositionen am Auftrag hängen.</p>
            </Panel>
          </div>
        </div>

        <Panel>
          <SectionTitle icon={Plus} title="Auftrag erfassen" detail="Pflichtfelder: Auftrag, Laden, Retour" />
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Auftrag</span>
              <Field onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="z.B. Corporate Event Basel" required value={form.name} />
            </label>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Kunde</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, client: event.target.value }))} placeholder="optional" value={form.client} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Ort</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, location: event.target.value }))} placeholder="optional" value={form.location} />
              </label>
            </div>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Status</span>
              <Select onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as ProjectStatusCode }))} value={form.status}>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </label>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Event Beginn</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, eventStartAt: event.target.value }))} type="datetime-local" value={form.eventStartAt} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Event Ende</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, eventEndAt: event.target.value }))} type="datetime-local" value={form.eventEndAt} />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Packen</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, packAt: event.target.value }))} type="datetime-local" value={form.packAt} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Laden</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, loadAt: event.target.value }))} required type="datetime-local" value={form.loadAt} />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Retour</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, returnAt: event.target.value }))} required type="datetime-local" value={form.returnAt} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Kontrolle bis</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, checkDueAt: event.target.value }))} type="datetime-local" value={form.checkDueAt} />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Rabatt %</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, discountPercent: event.target.value }))} value={form.discountPercent} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">MwSt. %</span>
                <Field onChange={(event) => setForm((value) => ({ ...value, vatRate: event.target.value }))} value={form.vatRate} />
              </label>
            </div>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Notiz</span>
              <Field onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} placeholder="optional" value={form.notes} />
            </label>

            <Button disabled={saving || !profile} type="submit" variant="primary" className="inline-flex items-center justify-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CalendarClock className="h-4 w-4" aria-hidden />}
              {saving ? "Speichern..." : "Auftrag speichern"}
            </Button>
          </form>

          {message ? (
            <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--bg2)] p-3 text-sm text-[var(--text2)]">{message}</div>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
