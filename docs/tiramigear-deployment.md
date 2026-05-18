# tiramigear Deployment

Ziel: Lokal bleibt fuer Entwicklung moeglich, aber die App soll sauber unter festen Domains laufen:

- `dev.tiramigear.ch` fuer Entwicklung/Staging
- `tiramigear.ch` fuer Produktion
- optionale Preview-URLs fuer Pull Requests und Feature-Branches

## Empfehlung

Fuer tiramigear ist die pragmatische Variante:

1. Vercel hostet die Next.js-App.
2. GitHub bleibt die Quelle fuer Deployments.
3. Supabase laeuft mit getrennten Projekten fuer Dev und Produktion.
4. `main` deployed auf Produktion.
5. `develop` oder `dev` deployed auf `dev.tiramigear.ch`.
6. Feature-Branches erhalten automatische Preview-Deployments.

Diese Trennung ist wichtig, weil Material-, Auftrags- und Ruecknahmedaten spaeter echte Betriebsdaten sind. Testdaten gehoeren nicht in dieselbe Datenbank wie Produktion.

## Umgebungen

| Umgebung | Domain | Git-Quelle | Supabase | Zweck |
| --- | --- | --- | --- | --- |
| Lokal | `http://localhost:3000` oder `http://127.0.0.1:3003` | lokaler Branch | Dev-Projekt | Entwicklung mit Codex |
| Dev/Staging | `https://dev.tiramigear.ch` | `develop` oder `dev` | Dev-Projekt | Testen mit echten Ablaeufen, aber ohne Produktivdaten |
| Produktion | `https://tiramigear.ch` | `main` | Prod-Projekt | Echtes Tagesgeschaeft |
| Preview | Vercel Preview URL | Feature-Branch/PR | Dev-Projekt oder isolierte Preview-DB | Review einzelner Aenderungen |

## Vercel Setup

1. Vercel mit GitHub verbinden.
2. Repository `kfwt/tiramigear` als Projekt importieren.
3. Production Branch auf `main` setzen.
4. Environment Variables pro Umgebung setzen:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

Beispiel:

```text
# Production
NEXT_PUBLIC_SITE_URL=https://tiramigear.ch

# Preview / Dev
NEXT_PUBLIC_SITE_URL=https://dev.tiramigear.ch
```

Vercel unterscheidet Environment Variables fuer Production, Preview und Development. Damit koennen Dev und Produktion dieselbe Codebasis nutzen, aber unterschiedliche Supabase-Projekte ansprechen.

## Domains

In Vercel beim Projekt unter Settings -> Domains:

- `tiramigear.ch` als Produktionsdomain hinzufuegen
- optional `www.tiramigear.ch` als Weiterleitung auf `tiramigear.ch`
- `dev.tiramigear.ch` als Branch-/Preview-Domain fuer die Dev-Umgebung hinzufuegen

DNS:

- Apex-Domain wie `tiramigear.ch` nutzt je nach Vercel-Anzeige einen A-Record.
- Subdomain wie `dev.tiramigear.ch` nutzt normalerweise einen CNAME.
- Die konkreten DNS-Werte immer aus Vercel uebernehmen, weil Vercel sie projektbezogen anzeigt.

## Supabase Setup

Empfohlen sind zwei Supabase-Projekte:

- `tiramigear-dev`
- `tiramigear-prod`

In beiden Projekten:

1. Migrationen aus `supabase/migrations` ausfuehren.
2. Admin-Bootstrap ausfuehren.
3. RLS pruefen.
4. API Keys in Vercel nur in die passende Umgebung eintragen.

Wichtig: Keine Secret Keys oder Service Role Keys in `NEXT_PUBLIC_*` Variablen eintragen. Im Browser darf nur der publishable/anon Key verwendet werden.

## Supabase Auth Redirects

In Supabase unter Authentication -> URL Configuration:

Production Site URL:

```text
https://tiramigear.ch
```

Additional Redirect URLs:

```text
https://tiramigear.ch/**
https://dev.tiramigear.ch/**
http://localhost:3000/**
http://127.0.0.1:3003/**
```

Falls Vercel Preview URLs genutzt werden, kommt zusaetzlich ein Vercel-Preview-Pattern dazu. Das ist vor allem fuer Magic Links, Passwort-Reset und spaeter OAuth relevant.

## Alternativen

### Vercel + Supabase

Beste Variante fuer den aktuellen Stand. Schnell, wenig Betrieb, gute GitHub-Integration, automatische Deployments.

### Render/Fly.io/Railway + Supabase

Moeglich, wenn mehr Kontrolle ueber Serverprozesse gebraucht wird. Etwas mehr Betrieb und Konfiguration.

### Eigener VPS, z.B. Hetzner

Maximale Kontrolle, aber auch Verantwortung fuer Docker, SSL, Updates, Backups, Monitoring und Deployments.

### Cloudflare Pages/Workers

Interessant fuer statische oder Edge-lastige Apps. Fuer eine normale Next.js-App mit Supabase ist Vercel im Moment einfacher.

## Naechster Deployment-Schritt

Wenn wir live gehen wollen:

1. Vercel-Projekt anlegen.
2. `develop` Branch fuer Dev/Staging erstellen.
3. Supabase Dev/Prod trennen.
4. Domains in Vercel hinterlegen.
5. Redirect URLs in Supabase setzen.
6. Migrationen in Dev und Prod ausfuehren.
7. Login und Auftragserfassung auf `dev.tiramigear.ch` testen.
8. Danach `main` auf `tiramigear.ch` produktiv schalten.

## Quellen

- Vercel: Domains und Custom Domains
- Vercel: Environments und Environment Variables
- Supabase: Auth Redirect URLs
- Supabase: Custom Domains
