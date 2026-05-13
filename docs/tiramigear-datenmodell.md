# tiramigear Datenmodell

Stand: 2026-05-12

Dieses Dokument beschreibt das erste fachliche MVP-Datenmodell. Es ist noch kein finales SQL-Schema, aber bereits so strukturiert, dass daraus Supabase/PostgreSQL-Migrationen abgeleitet werden können.

## Leitprinzipien

- Alle operativen Daten gehören zu einer Organisation (`org_id`).
- Einzelgeräte und Massenware werden getrennt modelliert.
- Packages sind Vorlagen; Aufträge erhalten Snapshots der übernommenen Positionen.
- Verfügbarkeit wird von `load_at` bis `return_at` geprüft.
- Konflikte blockieren nicht, sondern erzeugen Warnungen und können zu Zumietung führen.
- Amortisation zählt nur eigenes Equipment, netto, nach abgeschlossenem Auftrag.
- Externes Mietmaterial zählt nicht zur Amortisation.
- Rücknahme und Schäden sind MVP-Kern.
- Crew/Crewsheets werden vorbereitet, aber als Phase 2 umgesetzt.

## Enums

### Rollen

- `admin`
- `user`
- `logistics`
- `technician`

### Artikeltyp

- `single_item`
- `bulk_item`

### Kategorien

- `audio`
- `lighting`
- `video`
- `truss_rigging`
- `cables_accessories`
- `other`

### Gerätezustand

- `good`
- `minor_issues`
- `defective`
- `in_repair`
- `missing`

### Auftragsstatus

- `inquiry_calculation`
- `planned`
- `confirmed`
- `packing`
- `loaded`
- `in_use`
- `returned`
- `in_check`
- `completed`
- `cancelled`

### Zumietungsstatus

- `need_open`
- `requested`
- `confirmed`
- `pickup_planned`
- `picked_up_or_delivered`
- `in_use`
- `return_due`
- `returned`
- `settled`

## Mandanten und Benutzer

### organizations

Organisation/Mandant.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| name | text | ja | z.B. Tirami GmbH |
| slug | text | ja | eindeutig |
| plan | text | nein | später für Subscription |
| created_at | timestamptz | ja | automatisch |

### profiles

Erweiterung zu `auth.users`.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | entspricht `auth.users.id` |
| org_id | uuid | ja | FK zu `organizations.id` |
| email | text | ja | aus Auth |
| name | text | ja | Anzeigename |
| role | enum | ja | admin/user/logistics/technician |
| is_active | boolean | ja | Account gesperrt/aktiv |
| last_login_at | timestamptz | nein | optional |
| created_at | timestamptz | ja | automatisch |

## Inventar

### items

Ein physisches Einzelgerät.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| name | text | ja | Gerätename |
| category | enum | ja | Kategorie |
| serial_number | text | nein | Herstellerseriennummer |
| barcode | text | nein | interner Barcode/QR |
| weight | numeric | ja | kg |
| condition | enum | ja | inkl. `missing` |
| current_case_id | uuid | nein | aktueller Case |
| purchase_date | date | nein | Kaufdatum |
| purchase_price | numeric | nein | EK netto |
| supplier | text | nein | Lieferant |
| supplier_contact | text | nein | Kontakt/URL |
| daily_rate | numeric | ja | netto |
| half_day_rate | numeric | nein | netto |
| hourly_rate | numeric | nein | netto |
| notes | text | nein | Freitext |
| created_at | timestamptz | ja | automatisch |
| updated_at | timestamptz | ja | automatisch |

Wichtig:

- Jedes relevante Gerät wird einzeln erfasst.
- `missing`, `defective` und `in_repair` zählen nicht als verfügbar.
- Amortisation wird pro `item` berechnet.

### bulk_items

Massenware mit Bestand.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| name | text | ja | z.B. Powercon 10m |
| category | enum | ja | meist Kabel/Zubehör |
| barcode | text | nein | optional für Kiste/Artikeltyp |
| total_quantity | integer | ja | Gesamtbestand |
| available_quantity_override | integer | nein | optional manuell korrigiert |
| unit_weight | numeric | nein | kg pro Stück |
| daily_rate | numeric | nein | netto pro Stück |
| purchase_price_total | numeric | nein | EK Gesamtbestand |
| supplier | text | nein | Lieferant |
| supplier_contact | text | nein | Kontakt/URL |
| notes | text | nein | Freitext |
| created_at | timestamptz | ja | automatisch |
| updated_at | timestamptz | ja | automatisch |

Wichtig:

- Rücknahme läuft mengenbasiert.
- Defekte/vermisste Mengen reduzieren die Verfügbarkeit.

### item_photos

Fotos für Einzelgeräte, später auch für Schäden.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| item_id | uuid | nein | FK zu `items.id` |
| damage_report_id | uuid | nein | FK zu `damage_reports.id` |
| storage_path | text | ja | Supabase Storage |
| is_primary | boolean | ja | Hauptfoto |
| created_at | timestamptz | ja | automatisch |

## Cases

### cases

Transportcase oder Kiste.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| name | text | ja | Case-Name |
| empty_weight | numeric | ja | Eigengewicht kg |
| max_weight | numeric | nein | Nutz-/Maximalgewicht |
| length_cm | numeric | nein | Außenmaß |
| width_cm | numeric | nein | Außenmaß |
| height_cm | numeric | nein | Außenmaß |
| notes | text | nein | Freitext |
| created_at | timestamptz | ja | automatisch |
| updated_at | timestamptz | ja | automatisch |

Case-Gewicht:

`empty_weight + Summe items.weight + Summe(case_bulk_items.quantity * bulk_items.unit_weight)`

### case_items

Einzelgeräte im Case.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| case_id | uuid | ja | FK zu `cases.id` |
| item_id | uuid | ja | FK zu `items.id` |
| created_at | timestamptz | ja | automatisch |

### case_bulk_items

Massenware-Mengen im Case.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| case_id | uuid | ja | FK zu `cases.id` |
| bulk_item_id | uuid | ja | FK zu `bulk_items.id` |
| default_quantity | integer | ja | Soll-Menge im Case |
| created_at | timestamptz | ja | automatisch |

## Packages

### packages

Setup-Vorlage, z.B. Standard Bühne M.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| name | text | ja | Package-Name |
| category | text | nein | Bühne, Corporate, Streaming |
| notes | text | nein | Dispo-/Technikhinweise |
| created_at | timestamptz | ja | automatisch |
| updated_at | timestamptz | ja | automatisch |

MVP-Preislogik:

- Kein fixer Package-Preis.
- Richtpreis wird aus Positionen berechnet.
- Pauschal-/Override-Preis erst später.

### package_items

Einzelgeräte in Package-Vorlage.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| package_id | uuid | ja | FK |
| item_id | uuid | ja | FK zu `items.id` |
| quantity | integer | ja | meist 1 |

### package_cases

Cases in Package-Vorlage.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| package_id | uuid | ja | FK |
| case_id | uuid | ja | FK zu `cases.id` |

### package_bulk_items

Massenware in Package-Vorlage.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| package_id | uuid | ja | FK |
| bulk_item_id | uuid | ja | FK |
| quantity | integer | ja | Soll-Menge |

### package_external_items

Platzhalter für erwartete Zumietung.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| package_id | uuid | ja | FK |
| description | text | ja | z.B. 4x Moving Light extern |
| category | enum | nein | optional |
| quantity | integer | ja | Menge |
| expected_sell_price | numeric | nein | netto |
| notes | text | nein | Hinweis |

## Aufträge

### projects

Auftrag/Event.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| name | text | ja | Auftragstitel |
| client | text | nein | Kunde |
| location | text | nein | Ort |
| status | enum | ja | Auftragsstatus |
| event_start_at | timestamptz | nein | Event-Beginn |
| event_end_at | timestamptz | nein | Event-Ende |
| pack_at | timestamptz | nein | Packdatum |
| load_at | timestamptz | ja | Verfügbarkeitsstart |
| return_at | timestamptz | ja | Verfügbarkeitsende |
| check_due_at | timestamptz | nein | Kontrollfrist |
| discount_percent | numeric | nein | Rabatt |
| vat_rate | numeric | ja | aktuell 8.1 |
| notes | text | nein | Freitext |
| created_by | uuid | ja | profile |
| created_at | timestamptz | ja | automatisch |
| updated_at | timestamptz | ja | automatisch |

Verfügbarkeit:

- Eigene Einzelgeräte und Massenware werden von `load_at` bis `return_at` geprüft.
- Konflikte erzeugen Warnungen, blockieren aber nicht.

### project_positions

Snapshot aller kalkulatorischen Positionen im Auftrag.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| project_id | uuid | ja | FK |
| source_type | text | ja | item, bulk_item, case, external, manual |
| source_id | uuid | nein | Referenz, falls vorhanden |
| description | text | ja | Snapshot-Text |
| category | enum | nein | Kategorie |
| quantity | numeric | ja | Menge |
| days | numeric | ja | Miettage |
| unit_price | numeric | ja | netto |
| total_price | numeric | ja | netto |
| counts_for_amortization | boolean | ja | nur eigenes Equipment |
| created_at | timestamptz | ja | automatisch |

Wichtig:

- Package-Übernahme schreibt Positionen als Snapshot.
- Spätere Package-Änderungen verändern bestehende Aufträge nicht.

### project_item_assignments

Konkrete Einzelgeräte im Auftrag für Verfügbarkeit und Rücknahme.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| project_id | uuid | ja | FK |
| item_id | uuid | ja | FK |
| position_id | uuid | nein | FK zu `project_positions.id` |
| return_status | enum | nein | Zustand bei Rücknahme |
| returned_at | timestamptz | nein | Rückgabezeit |

### project_bulk_assignments

Massenware im Auftrag.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| project_id | uuid | ja | FK |
| bulk_item_id | uuid | ja | FK |
| position_id | uuid | nein | FK |
| planned_quantity | integer | ja | ausgegeben/geplant |
| returned_quantity | integer | nein | zurück |
| defective_quantity | integer | nein | defekt |
| missing_quantity | integer | nein | vermisst |
| notes | text | nein | Rücknahmehinweis |

## Externes Mietmaterial

### external_rental_items

Extern angemietetes Material pro Auftrag.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| project_id | uuid | ja | FK |
| position_id | uuid | nein | Kalkulationsposition |
| description | text | ja | Beschreibung |
| category | enum | nein | Kategorie |
| quantity | integer | ja | Menge |
| supplier | text | nein | Vermieter |
| supplier_contact | text | nein | Kontakt/URL |
| purchase_price | numeric | nein | Einkauf netto |
| sell_price | numeric | nein | Weiterverrechnung netto |
| rental_start_at | timestamptz | nein | Zeitraum |
| rental_end_at | timestamptz | nein | Zeitraum |
| status | enum | ja | Zumietungsstatus |
| pickup_notes | text | nein | Abholung/Lieferung |
| return_notes | text | nein | Retoure |
| problem_notes | text | nein | Problemfall |
| created_at | timestamptz | ja | automatisch |
| updated_at | timestamptz | ja | automatisch |

## Logistik

### vehicles

Fahrzeuge.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| name | text | ja | z.B. Sprinter Kevin |
| vehicle_type | text | ja | Sprinter, LKW, Anhänger |
| payload_kg | numeric | nein | Nutzlast |
| volume_m3 | numeric | nein | optional |
| license_plate | text | nein | Kennzeichen |
| notes | text | nein | Freitext |

### project_vehicle_assignments

Fahrzeuge im Auftrag.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| project_id | uuid | ja | FK |
| vehicle_id | uuid | nein | FK, falls Stammfahrzeug |
| vehicle_name_snapshot | text | ja | frei editierbar |
| payload_kg_snapshot | numeric | nein | Snapshot |
| notes | text | nein | Freitext |

### logistics_load_items

Was liegt auf welchem Fahrzeug.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| project_vehicle_assignment_id | uuid | ja | FK |
| source_type | text | ja | case, item, bulk_item, external |
| source_id | uuid | nein | Referenz |
| description | text | ja | Snapshot |
| quantity | numeric | ja | Menge |
| weight_kg_snapshot | numeric | nein | Gewicht |
| loaded_status | text | nein | offen/geladen |

## Rücknahme, Schäden und Historie

### damage_reports

Schaden oder Problemfall.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| project_id | uuid | nein | Auftrag |
| item_id | uuid | nein | Einzelgerät |
| bulk_item_id | uuid | nein | Massenware |
| external_rental_item_id | uuid | nein | externe Position |
| reported_by | uuid | ja | profile |
| condition | enum | nein | neuer Zustand |
| quantity | integer | nein | bei Massenware |
| title | text | ja | Kurztext |
| description | text | nein | Notiz |
| status | text | ja | offen/in Arbeit/erledigt |
| created_at | timestamptz | ja | automatisch |
| resolved_at | timestamptz | nein | erledigt |

### condition_events

Zustandsverlauf für Geräte.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| item_id | uuid | ja | FK |
| project_id | uuid | nein | Kontext |
| from_condition | enum | nein | vorher |
| to_condition | enum | ja | nachher |
| note | text | nein | Begründung |
| created_by | uuid | ja | profile |
| created_at | timestamptz | ja | automatisch |

## Export und Audit

### exports

Exporthistorie.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| project_id | uuid | nein | Kontext |
| export_type | text | ja | excel, pdf_calc, pdf_packlist |
| file_path | text | nein | Storage |
| created_by | uuid | ja | profile |
| created_at | timestamptz | ja | automatisch |

### audit_logs

Änderungshistorie für kritische Aktionen.

| Feld | Typ | Pflicht | Hinweis |
| --- | --- | --- | --- |
| id | uuid | ja | Primary Key |
| org_id | uuid | ja | Mandant |
| actor_id | uuid | ja | profile |
| entity_type | text | ja | Tabelle/Objekt |
| entity_id | uuid | ja | Objekt |
| action | text | ja | create/update/delete/export/force_complete |
| before_json | jsonb | nein | vorher |
| after_json | jsonb | nein | nachher |
| reason | text | nein | z.B. Admin-Abschluss trotz offener Punkte |
| created_at | timestamptz | ja | automatisch |

## Phase-2-Vorbereitung: Crew

Noch nicht MVP-Kern, aber später anschließbar:

- `people`
- `crew_roles`
- `project_crew_assignments`
- `project_crew_shifts`
- `crew_sheet_exports`
- `project_contacts`
- `project_safety_notes`

Die Auftragszeitfelder, Fahrzeuge und Projektkontakte werden im MVP so gestaltet, dass diese Tabellen später sauber andocken können.

## Row Level Security

Grundregel:

- Jede fachliche Tabelle hat `org_id`.
- Benutzer dürfen nur Daten ihrer eigenen Organisation sehen.
- Rollen steuern Bearbeitungsrechte, nicht die Preissicht.
- Preise, EK und Amortisation sind für alle Rollen sichtbar.

MVP-Rollen grob:

- Admin: alles inklusive Benutzer und Systemeinstellungen.
- User: Aufträge, Inventar, Kalkulation, Packages.
- Logistik: Packlisten, Fahrzeuge, Laden, Rücknahme.
- Technik: Zustand, Schäden, Reparaturen.

## Kritische Regeln für die Umsetzung

- `completed` darf nur gesetzt werden, wenn Abschluss-Checks erfüllt sind oder Admin mit Begründung übersteuert.
- Amortisation wird erst bei `completed` berechnet.
- Externe Mietpositionen zählen nie zur Amortisation.
- Package-Änderungen wirken nie rückwirkend auf bestehende Aufträge.
- Fehlende `unit_weight` bei Massenware erzeugt Datenqualitätswarnung.
- `missing`, `defective` und `in_repair` zählen nicht als verfügbar.
