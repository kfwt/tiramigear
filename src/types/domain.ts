export type NavKey = "dashboard" | "inventory" | "packages" | "orders" | "logistics" | "admin";

export type AppRole = "admin" | "user" | "logistics" | "technician";

export type UserProfile = {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: AppRole;
};

export type ProjectStatusCode =
  | "inquiry_calculation"
  | "planned"
  | "confirmed"
  | "packing"
  | "loaded"
  | "in_use"
  | "returned"
  | "in_check"
  | "completed"
  | "cancelled";

export type ProjectStatus =
  | "Anfrage / Kalkulation"
  | "Geplant"
  | "Bestätigt"
  | "In Packung"
  | "Geladen"
  | "Im Einsatz"
  | "Retour"
  | "In Kontrolle"
  | "Abgeschlossen"
  | "Storniert";

export type StatusTone = "good" | "warn" | "bad" | "neutral";

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone?: StatusTone;
};

export type ProjectRow = {
  date: string;
  name: string;
  status: ProjectStatus;
  material: string;
  action: string;
  materialTone: StatusTone;
};

export type PackageTemplate = {
  name: string;
  category: string;
  rate: string;
  weight: string;
  warning?: string;
};

export type RentalStatus = {
  label: string;
  detail: string;
  tone: StatusTone;
};
