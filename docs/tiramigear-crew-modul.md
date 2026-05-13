# tiramigear Crew- und Personalmodul

Stand: 2026-05-12

## Ausgangspunkt

Als Referenz liegt ein exportiertes Crewsheet vor:

`/Users/kfwt/Downloads/Crewsheet_P26-0153 StageOne, Carpathia, Score, 20.05.2026.pdf`

Der Export zeigt, dass ein Crewsheet deutlich mehr ist als eine reine Personalliste. Es verbindet Projektinformationen, Einsatzzeiten, Rollen, Fahrzeuge, Kontakte, Treffpunkte und Sicherheitsinformationen.

## Erkenntnisse aus dem Crewsheet

Das PDF enthaelt unter anderem:

- Projektkopf mit Projektname, Projektnummer, Stand und Projektzeitraum
- Ansprechpartner, Projektbetreuung, Kundenkontakt und Lieferadresse
- Parkplatz-/Anreisehinweise
- Dresscode und Sicherheitsinformationen
- Verhalten bei Unfall, Brandfall, Evakuation und Ereignissen
- Terminuebersicht fuer Laden, Transport, Aufbau, Veranstaltung, Abbau und Ruecktransport
- Ressourcenuebersicht mit Zeit, Name, Funktion, Treffpunkt, Hotel und Bemerkung
- Adressliste mit Name, E-Mail und Telefon
- Fahrzeuguebersicht mit Fahrer, Fahrzeug, Anhänger und Mitfahrer
- persoenliche Termine pro Crewmitglied
- Hinweise zu Ueberzeit, Freigaben und abrechenbaren Aufwaenden

## Senior-Developer-Einschaetzung

Ja, ein Crew-/Personalmodul passt fachlich sehr gut zu tiramigear, weil es direkt an Auftrag, Logistik, Fahrzeuge und Tagesplanung anschliesst.

Aber: Es ist gross genug, um das MVP zu gefaehrden, wenn wir es sofort vollstaendig bauen.

Empfehlung:

- Im MVP das Datenmodell so vorbereiten, dass Crew spaeter sauber integrierbar ist.
- Optional im MVP einen einfachen Crew-Block pro Auftrag aufnehmen.
- Vollstaendige Crewplanung, Crewsheet-PDF und Personenverfuegbarkeit als Phase 2 planen.

## MVP-Abgrenzung

Nicht als voller MVP-Kern:

- Vollstaendige Personaldisposition
- Verfuegbarkeitskalender fuer Personen
- Arbeitszeitabrechnung
- Freelancer-Portale
- Automatischer Versand
- Digitale Zusagen/Absagen
- Lohn-/Spesenabrechnung

Sinnvoll als MVP-Vorbereitung:

- Projekt kann Crew-Zeilen enthalten
- Rollen/Funktionen koennen gepflegt werden
- Fahrzeuge koennen Fahrer und Mitfahrer referenzieren
- Exportstruktur wird beim Datenmodell beruecksichtigt

## Phase-2-Funktionsumfang

Ein spaeteres Crew-Modul sollte koennen:

- Personenstammdaten verwalten
- Rollen/Funktionen pflegen, z.B. Projektleitung, Audio, Licht, Video, LKW, Stagehand
- Crew pro Auftrag planen
- Schichten pro Person erfassen
- Treffpunkt, Hotel, Fahrzeug und Bemerkung pro Einsatz pflegen
- Fahrzeuguebersicht mit Fahrer und Mitfahrer erstellen
- persoenliche Terminblaetter pro Person generieren
- Crewsheet als PDF exportieren
- Datenschutz und Zugriff sauber regeln

## Grobes Datenmodell

Moegliche Tabellen:

- `people`
- `crew_roles`
- `project_crew_assignments`
- `project_crew_shifts`
- `crew_sheet_exports`
- `project_safety_notes`
- `project_contacts`
- `vehicle_assignments`

## Wichtige Datenschutzregel

Personendaten wie Telefonnummern, E-Mail-Adressen, Einsatzzeiten und Hotels sind sensibler als reine Equipmentdaten.

Konsequenz:

- Crew-Daten brauchen feinere Berechtigungen.
- Nicht jede Rolle sollte alle privaten Kontaktdaten sehen.
- PDF-Exports sollten protokolliert werden.
- Loesch- und Archivierungsregeln muessen spaeter definiert werden.

## Entscheidungsvorschlag

Crew-Funktionalitaet wird als Phase-2-Modul geplant.

Fuer den MVP:

- Datenmodell offen halten
- Fahrzeuge/Logistik so bauen, dass Fahrer/Mitfahrer spaeter angebunden werden koennen
- Auftrag-Zeitlogik so bauen, dass Crew-Schichten spaeter darauf referenzieren koennen
- Kein vollstaendiger Crewsheet-Generator im ersten MVP
