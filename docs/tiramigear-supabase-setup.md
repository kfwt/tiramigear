# tiramigear Supabase Setup

Stand: 2026-05-12

## Ziel

Dieses Dokument beschreibt, wie aus dem fachlichen Datenmodell ein echtes Supabase-Projekt wird.

Die erste technische Migration liegt hier:

`supabase/migrations/0001_initial_tiramigear_schema.sql`

## Was die Migration enthält

- PostgreSQL-Enums für Rollen, Kategorien, Zustände, Auftragsstatus und Zumietungsstatus
- Tabellen für Organisation, Benutzerprofile, Inventar, Massenware, Cases, Packages, Aufträge, Logistik, Rücknahme, Schäden, Exporte und Audit Logs
- Snapshot-Tabellen für Auftragspositionen
- RLS-Grundlagen mit Mandantentrennung über `org_id`
- Helper-Funktionen für aktuelle Organisation, Rolle und Adminprüfung
- Indizes für zentrale Abfragen

## Wichtiger Bootstrap-Punkt

Normale Benutzer gehören immer zu einer Organisation. Damit RLS funktioniert, braucht es aber zuerst:

1. eine Organisation
2. einen ersten Admin-User
3. ein `profiles`-Profil für diesen Admin

Das muss beim ersten Setup über Supabase Dashboard, Service Role Script oder ein Admin-Bootstrap-Script erfolgen.

## Empfohlene nächste technische Schritte

1. GitHub Repository erstellen
2. Next.js App scaffolden
3. Supabase-Projekt erstellen
4. Supabase CLI verbinden
5. Migration lokal gegen Supabase testen
6. Seed-Script für Organisation + ersten Admin schreiben
7. Auth/Login in der App bauen
8. RLS-Policies rollenfeiner machen

## RLS-Hinweis

Die erste Migration trennt sauber nach Organisation und erlaubt Bearbeitung innerhalb der eigenen Organisation. Das ist eine gute technische Basis, aber noch nicht die finale Rollenmatrix.

Später verfeinern wir:

- Admin: Benutzer, Systemeinstellungen, Löschrechte
- User: Aufträge, Kalkulation, Inventar, Packages
- Logistik: Packlisten, Fahrzeuge, Laden, Rücknahme
- Technik: Zustand, Schäden, Reparaturen

## Warum noch keine Crew-Tabellen?

Crew/Crewsheets sind als Phase 2 vorbereitet, aber nicht im initialen MVP-Schema enthalten. Der Auftrag, Fahrzeuge und Zeitfelder sind so modelliert, dass Crew-Schichten später andocken können.
