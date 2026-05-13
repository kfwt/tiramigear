# tiramigear Entwicklung

Stand: 2026-05-13

## Was jetzt gebaut ist

Die Projektbasis ist als Next.js App vorbereitet. Der erste lauffaehige App-Rahmen bildet den zuvor abgestimmten Wireframe ab:

- Dashboard fuer Dispo-Tagesblick
- Inventar mit Einzelgeraeten, Massenware und Zumietung
- Packages fuer Standard-Setups
- Auftraege mit Statusfluss, Zumietung, Ruecknahme und Kalkulation
- Logistik fuer Laden, Transport und Retour
- Admin-Bereich fuer Rollen, Supabase-Status und spaetere Module

Die Oberflaeche arbeitet aktuell mit Demo-Daten. Das ist bewusst so, damit zuerst Ablauf, Navigation und Bedienlogik geprueft werden koennen, bevor wir Daten dauerhaft speichern.

## Verwendeter Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase fuer Auth, Datenbank und Storage
- GitHub fuer Versionierung und spaeter Issues/Deployments

## Lokale Dateien

- `src/components/app-shell.tsx`: Hauptoberflaeche
- `src/components/ui.tsx`: einfache UI-Bausteine
- `src/data/demo.ts`: Demo-Daten fuer die erste App-Version
- `src/lib/supabase.ts`: Supabase Browser Client
- `supabase/migrations/0001_initial_tiramigear_schema.sql`: Datenbankstart

## Arbeitsweise mit Codex

Sinnvolle Tool-Verbindungen:

- GitHub: Repository, Branches, Pull Requests, Reviews
- Supabase: Projekt, SQL-Migrationen, Auth, Storage
- Optional spaeter: Linear oder GitHub Issues fuer Aufgabenplanung

Wenn GitHub und Supabase verbunden sind, kann Codex:

- Code anlegen und refactoren
- Migrationen schreiben
- Setup-Dokumentation pflegen
- technische Checks ausfuehren
- nach Freigabe Dependencies installieren und lokalen Dev-Server starten

## Was noch offen ist

Die aktuelle Umgebung hat `node`, aber noch keinen Package Manager wie `npm` oder `pnpm`. Fuer den naechsten Schritt muessen die Abhaengigkeiten installiert werden. Danach pruefen wir die App im Browser und gehen iterativ durch die Screens.

## Naechster sinnvoller Schritt

1. Package Manager / Dependencies installieren
2. App lokal starten
3. UI im Browser pruefen
4. Supabase `.env.local` setzen
5. Auth/Login und Admin-Bootstrap bauen
6. Datenbankzugriff schrittweise von Demo-Daten auf Supabase umstellen
