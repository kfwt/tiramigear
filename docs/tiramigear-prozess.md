# tiramigear Entwicklungsprozess

Stand: 2026-05-11

## Ziel

tiramigear wird als internes webbasiertes Equipment Management System fuer Tirami GmbH entwickelt. Der Prozess startet bewusst mit Wireframes und MVP-Scope, bevor wir technische Implementierung, Datenbank und Deployment finalisieren.

## Arbeitsweise

1. Anforderungen schaerfen
2. Wireframe pruefen und verbessern
3. MVP festlegen
4. Datenmodell finalisieren
5. Tech-Setup vorbereiten
6. Erste lauffaehige App bauen
7. Module iterativ entwickeln
8. Testen, deployen, einführen

## Scope-Entscheid

Der Kern von tiramigear bleibt im MVP Equipment, Dispo, Logistik, Ruecknahme und Kalkulation.

Crew-/Personalplanung passt fachlich gut, wird aber als Phase-2-Modul behandelt. Das Datenmodell und die Auftragszeitlogik werden so vorbereitet, dass Crew-Schichten, Fahrzeuge, Fahrer/Mitfahrer und Crewsheet-Exports spaeter sauber angebunden werden koennen.

## Phase 1: Produktklarheit

Ziel: Wir verstehen genau, wie Tirami im Alltag mit Equipment arbeitet.

Entscheidungen:

- Welche Artikel sind Einzelgeraete und welche sind Massenware?
- Welcher Status-Flow steuert Auftrag, Packung, Ruecknahme und Abschluss?
- Wie sehen Auftrag, Aufbau, Event, Abbau und Rueckgabe zeitlich aus?
- Wie werden Warnungen bei Doppelbuchung und Unterdeckung angezeigt?
- Wie wird extern angemietetes Material erfasst?
- Wer darf Preise, Amortisation und Exporte sehen?
- Was ist fuer MVP zwingend, was kommt spaeter?

Ergebnis:

- Finaler MVP-Scope
- Bereinigte offene Fragen
- Priorisierte User Journeys

## Phase 2: Wireframe

Ziel: Die wichtigsten Screens und Abläufe sind sichtbar, bevor Code entsteht.

Screens:

- Login
- Dashboard
- Inventar
- Geraetedetail
- Massenartikel-Detail
- Case-Detail
- Case-Packliste mit Einzelgeraeten und Massenware
- Package-Verwaltung
- Package-Detail fuer Standard-Setups
- Auftrag/Kalkulation
- Logistikplanung
- Mobile Scanner/Packliste/Ruecknahme/Schadensmeldung
- Admin

Ergebnis:

- Klickbarer Low-Fi-Wireframe
- Freigegebene Navigation
- Erste UI-Regeln fuer Desktop und Mobile

## Phase 3: Datenmodell

Ziel: Die Datenbank bildet die echten Geschäftsregeln ab.

Kernobjekte:

- organizations
- users/profiles
- items
- bulk_items
- item_photos
- cases
- case_items
- case_bulk_items
- packages
- package_items
- package_cases
- package_bulk_items
- package_external_items
- projects
- project_items
- external_rental_items
- vehicles
- logistics_assignments
- condition_events
- damage_reports
- exports
- audit_logs

Phase-2-Objekte fuer Crew:

- people
- crew_roles
- project_crew_assignments
- project_crew_shifts
- crew_sheet_exports
- project_safety_notes
- project_contacts

Ergebnis:

- ERD / Datenmodell
- Supabase-Migrationen
- Row-Level-Security-Konzept

Arbeitsdokument:

- `docs/tiramigear-datenmodell.md`

## Phase 4: Technisches Fundament

Ziel: Ein sauberes App-Skelett steht.

Stack:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, Storage
- Vercel
- GitHub
- Playwright/Vitest

Ergebnis:

- GitHub Repository
- Lokale Entwicklungsumgebung
- Login, Layout, Routing
- Supabase-Projekt mit Migrationen
- Preview Deployment

## Phase 5: MVP-Module

Reihenfolge:

1. Auth und Rollen
2. Inventar
3. Cases
4. Ruecknahme und Schadensmeldung
5. Aufträge und Kalkulation
6. Externes Mietmaterial
7. Packages
8. Logistik
9. Amortisation
10. Exporte
11. Admin und Systemsettings

## Tool-Verbindungen

Empfohlen:

- GitHub: Code, Issues, Pull Requests
- Figma: Wireframes und Design
- Supabase: Auth, Datenbank, Storage
- Vercel: Deployment
- Linear oder GitHub Issues: Aufgabenplanung
- Sentry: Fehlertracking

## Naechster Schritt

Wir gehen den ersten Wireframe durch und entscheiden, welche Kernablaeufe im MVP wirklich enthalten sein muessen. Danach erstellen wir ein bereinigtes Datenmodell.
