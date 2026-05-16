# Supabase Dashboard Schritte

Stand: 2026-05-16

## 1. Projekt erstellen

1. Supabase Dashboard öffnen.
2. Neues Projekt erstellen.
3. Name: `tiramigear`.
4. Region: Europa, falls verfügbar.
5. Datenbank-Passwort sicher speichern.

## 2. API-Werte kopieren

Im Projekt:

1. `Project Settings`
2. `API`
3. `Project URL` kopieren
4. `anon public` key kopieren

Diese Werte kommen lokal in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Der `service_role` key bleibt geheim und wird nicht in den Browser-Code gepackt.

## 3. Migration ausführen

Im Projekt:

1. `SQL Editor`
2. `New query`
3. Inhalt von `supabase/migrations/0001_initial_tiramigear_schema.sql` einfügen
4. `Run`

## 4. Ersten Admin erstellen

1. In der App `/login` öffnen.
2. `Ersten Account anlegen` wählen.
3. Admin-E-Mail und Passwort setzen.
4. Falls Supabase E-Mail-Bestätigung verlangt, Mail bestätigen.
5. In Supabase `Authentication` öffnen.
6. Den neuen Benutzer öffnen und seine User ID kopieren.
7. In `supabase/bootstrap/first_admin.sql` die Platzhalter ersetzen:
   - `REPLACE_WITH_AUTH_USER_ID`
   - `REPLACE_WITH_ADMIN_EMAIL`
8. SQL im Supabase SQL Editor ausführen.

Danach hat der erste Benutzer die Rolle `admin` in der Organisation `tirami`.

## 5. Connector-Hinweis

Wenn der Supabase-Connector in Codex Projekte sehen soll, muss die Supabase-Integration Zugriff auf dieses Projekt haben. Aktuell sieht Codex noch keine Projekte, deshalb ist der Dashboard-Weg der schnellste Start.
