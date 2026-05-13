import type { Metric, PackageTemplate, ProjectRow, RentalStatus } from "@/types/domain";

export const dashboardMetrics: Metric[] = [
  {
    label: "Heute disponieren",
    value: "7",
    detail: "Aufträge in Planung oder Packung"
  },
  {
    label: "Konflikte",
    value: "3",
    detail: "Warnung, nicht blockiert",
    tone: "warn"
  },
  {
    label: "Rücknahmen offen",
    value: "5",
    detail: "Zustand prüfen",
    tone: "warn"
  },
  {
    label: "Schäden / Vermisst",
    value: "14",
    detail: "Technik prüft",
    tone: "bad"
  }
];

export const projectRows: ProjectRow[] = [
  {
    date: "24.05.2026",
    name: "Corporate Event Basel",
    status: "Bestätigt",
    material: "bereit",
    action: "Packliste prüfen",
    materialTone: "good"
  },
  {
    date: "28.05.2026",
    name: "Festival Setup",
    status: "Geplant",
    material: "2 Konflikte",
    action: "Zumietung klären",
    materialTone: "warn"
  },
  {
    date: "03.06.2026",
    name: "Townhall Stream",
    status: "Anfrage / Kalkulation",
    material: "Unterdeckung",
    action: "Alternative wählen",
    materialTone: "warn"
  }
];

export const packageTemplates: PackageTemplate[] = [
  {
    name: "Standard Bühne M",
    category: "Bühne",
    rate: "CHF 6'840 / Tag",
    weight: "1'180 kg · 4 Cases · 16 Loseposten"
  },
  {
    name: "Corporate Audio M",
    category: "Corporate",
    rate: "CHF 2'340 / Tag",
    weight: "Audio Cases, Funk, Kabelcase"
  },
  {
    name: "Streaming Regie S",
    category: "Streaming",
    rate: "CHF 1'780 / Tag",
    weight: "Video Regie · 82 kg",
    warning: "2 Stückgewichte fehlen"
  }
];

export const rentalStatuses: RentalStatus[] = [
  { label: "Bedarf offen", detail: "14x Powercon", tone: "warn" },
  { label: "Angefragt", detail: "4x Moving Light", tone: "warn" },
  { label: "Bestätigt", detail: "4x Robe Spiider", tone: "good" }
];
