# tiramigear

Internes Equipment-Management fuer Dispo, Technik und Logistik.

## Aktueller Stand

- Next.js App-Skelett mit klickbarer Arbeitsoberflaeche
- Login-Seite unter `/login` fuer Supabase Auth vorbereitet
- Demo-Views fuer Dashboard, Inventar, Packages, Auftraege, Logistik und Admin
- Supabase-Migration fuer das MVP-Datenmodell
- Dokumentierte Produktentscheide, Rollen, Prozess und Crew-Abgrenzung

## Fokus des MVP

- Inventar mit Einzelgeraeten und mengenbasierter Massenware
- Auftraege mit Statusfluss von Anfrage bis Abschluss
- Verfuegbarkeitswarnungen ohne harte Blockade
- Zumietmaterial pro Auftrag
- Packages fuer Standard-Setups
- Packlisten, Logistik, Ruecknahme, Schaden und Vermisst
- Netto-Amortisation nach abgeschlossenem Auftrag

Crew/Crewsheets sind vorbereitet, aber als Phase 2 abgegrenzt.

## Lokales Setup

```bash
npm install
npm run dev
```

Danach laeuft die App normalerweise unter:

```text
http://localhost:3000
```

## Supabase

1. Supabase-Projekt erstellen
2. `.env.example` nach `.env.local` uebernehmen
3. `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` setzen
4. Migration aus `supabase/migrations/0001_initial_tiramigear_schema.sql` ausfuehren
5. Bootstrap fuer Organisation und ersten Admin erstellen

Details stehen in `docs/tiramigear-supabase-setup.md`.

## Wichtige Dokumente

- `docs/tiramigear-prozess.md`
- `docs/tiramigear-entscheidungen.md`
- `docs/tiramigear-datenmodell.md`
- `docs/tiramigear-rollenmatrix.md`
- `docs/tiramigear-crew-modul.md`
- `docs/tiramigear-supabase-setup.md`
- `docs/tiramigear-supabase-dashboard.md`

## Naechste Entwicklungsschritte

1. Dependencies installieren und App lokal starten
2. Supabase-Projekt verbinden
3. Auth/Login und Admin-Bootstrap umsetzen
4. Inventar CRUD gegen Supabase speichern
5. Auftragsanlage mit Materialpositionen und Verfuegbarkeitswarnungen bauen
6. Ruecknahme, Schaden und Vermisst-Workflow umsetzen
7. Packlisten/Exports ergaenzen
