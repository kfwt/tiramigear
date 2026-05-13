# tiramigear Entscheidungen

Stand: 2026-05-11

## 1. Inventarlogik

Entscheidung:

- Normales Equipment wird einzeln als physisches Geraet erfasst.
- Massenware darf mit Stueckzahlen verwaltet werden.

Beispiele fuer Massenware:

- Kabel
- Adapter
- Kabelbruecken
- Verbrauchs- oder Kleinteile ohne relevante Seriennummer

Konsequenz fuer das Datenmodell:

- Es braucht einen Inventartyp, z.B. `single_item` und `bulk_item`.
- Einzelgeraete haben Seriennummer, Barcode, Zustand, Amortisation und Historie pro Geraet.
- Massenware hat Gesamtbestand, reservierte Menge, verfuegbare Menge und optional Zustand auf Bestandsebene.

## 2. Verfuegbarkeit

Entscheidung:

- Doppelte Buchungen werden nicht hart blockiert.
- Das System warnt bei Konflikten oder Unterdeckung.

Konsequenz fuer UX:

- Auftraege koennen trotz Konflikt gespeichert werden.
- Konflikte muessen klar sichtbar sein.
- Bei Unterdeckung soll direkt externes Mietmaterial erfasst werden koennen.

## 3. Extern angemietetes Material

Entscheidung:

- Das Tool soll Material abbilden, das nicht Tirami gehoert, sondern fuer einen Auftrag angemietet wird.

Konsequenz fuer das Datenmodell:

- Es braucht Projektpositionen fuer externes Mietmaterial.
- Diese Positionen haben mindestens: Beschreibung, Lieferant, Mietkosten, Verkaufspreis/Weiterverrechnung, Menge, Zeitraum, Rueckgabestatus.
- Externes Mietmaterial wird nicht in die Amortisation des eigenen Inventars eingerechnet.

## 4. Rollen

Entscheidung:

- Admin
- User
- Logistik
- Technik

Vorlaeufige Bedeutung:

- Admin: Benutzer, Rollen, Systemeinstellungen, alle Daten.
- User: Auftraege, Inventaransicht, Kalkulation und allgemeine Planung.
- Logistik: Packlisten, Fahrzeugplanung, Laden, Ruecknahme, Gewichtskontrolle.
- Technik: Geraetezustand, Schadensmeldung, Reparaturstatus, technische Notizen.

Die exakten Berechtigungen werden separat als Matrix festgelegt.

Sichtbarkeit:

- Preise, Einkaufspreise und Amortisation duerfen von allen Rollen gesehen werden.

## 5. Ruecknahme und Schadensmeldung

Entscheidung:

- Ruecknahme und Schadensmeldung gehoeren direkt ins MVP.

Konsequenz fuer MVP:

- Mobile Ruecknahmeansicht.
- Zustand bei Rueckgabe erfassen.
- Schaden mit Foto und Notiz dokumentieren.
- Statuswechsel auf `Leichte Maengel`, `Defekt`, `In Reparatur` oder `Vermisst`.
- Offene Schadensfaelle im Dashboard anzeigen.

## 6. Amortisation

Entscheidung:

- Amortisation wird netto berechnet, also ohne MwSt.
- Grundlage sind Equipment-Einnahmen nach Rabatt, aber ohne Transport, Personal und sonstige Zusatzkosten.
- Die MwSt. ist eine Durchlaufposition und sollte nicht als echte Geraeteinnahme gelten.

Beispiel:

- Tagesrate auf der Kalkulation: CHF 200.00 netto
- MwSt. 8.1%: CHF 16.20
- Rechnungstotal brutto: CHF 216.20
- Fuer die Amortisation zaehlen CHF 200.00.

## 7. Produktausrichtung

Entscheidung:

- tiramigear soll primaer wie ein internes Arbeits-Tool fuer Disposition, Technik und Logistik wirken.
- Management-Zahlen und Amortisation sind sichtbar, aber nicht der dominante Nutzungskontext.

Konsequenz fuer UX:

- Startscreen priorisiert naechste Auftraege, offene Konflikte, Packstatus, Ruecknahmen und Schaeden.
- Kennzahlen bleiben kompakt und handlungsorientiert.
- Mobile Ablaeufe fuer Scan, Packen, Ruecknahme und Schadensmeldung bekommen hohes Gewicht.

## 8. Auftragsstatus

Entscheidung:

Der Status-Flow fuer Auftraege ist:

1. Anfrage / Kalkulation
2. Geplant
3. Bestaetigt
4. In Packung
5. Geladen
6. Im Einsatz
7. Retour
8. In Kontrolle
9. Abgeschlossen

Zusatzstatus:

- Storniert

Konsequenz fuer UX:

- Die Dispo arbeitet vor allem in den Phasen `Anfrage / Kalkulation`, `Geplant` und `Bestaetigt`.
- Logistik arbeitet vor allem in `In Packung`, `Geladen`, `Im Einsatz` und `Retour`.
- Technik arbeitet vor allem in `In Kontrolle` und bei Schadensmeldungen.
- Amortisation wird erst nach `Abgeschlossen` berechnet.

## 9. Zeit- und Verfuegbarkeitslogik

Entscheidung:

- Verfuegbarkeit wird von Ladedatum bis Retour-Datum geprueft.
- Der reine Event-Zeitraum reicht nicht, weil Material waehrend Transport, Aufbau, Event, Abbau und Ruecktransport physisch nicht verfuegbar ist.

Zeitfelder pro Auftrag:

- Event-Beginn
- Event-Ende
- Packdatum
- Ladedatum
- Retour-Datum
- Kontrollfrist

Konsequenz fuer UX:

- Konflikte werden als Warnung angezeigt, blockieren das Speichern aber nicht.
- Bei Konflikt oder Unterdeckung kann direkt externes Mietmaterial erfasst werden.
- Ruecknahme und Schadensmeldung starten nach `Retour`.
- Der Auftrag kann erst nach `In Kontrolle` sauber auf `Abgeschlossen` wechseln.

## 10. Ruecknahmeprozess und Geraetezustaende

Entscheidung:

- `Vermisst` wird als zusaetzlicher Geraetezustand aufgenommen.

Geraetezustaende:

- Gut
- Leichte Maengel
- Defekt
- In Reparatur
- Vermisst

Ruecknahmeablauf:

1. Auftrag wechselt auf `Retour`.
2. Material wird gescannt oder manuell abgehakt.
3. Pro Position wird Zustand bestaetigt oder Schaden/Fehlbestand gemeldet.
4. Bei Schaden werden Foto, Notiz und neuer Zustand erfasst.
5. Bei fehlendem Material wird Zustand `Vermisst` gesetzt.
6. Wenn alle Positionen geprueft sind, wechselt der Auftrag auf `In Kontrolle`.
7. Nach finaler Pruefung wechselt der Auftrag auf `Abgeschlossen`.

Konsequenz fuer UX:

- Dashboard zeigt offene Ruecknahmen, Schaeden und vermisste Artikel.
- Packlisten und Ruecknahmelisten muessen Einzelgeraete und Massenware unterstuetzen.
- Vermisste Artikel duerfen bei kuenftiger Verfuegbarkeit nicht als verfuegbar gelten.

## 11. Massenware-Ruecknahme

Entscheidung:

- Massenware wird mengenbasiert zurueckgenommen.
- Einzelgeraete werden einzeln gescannt oder einzeln bestaetigt.

Beispiel:

- Ausgegeben: 40 Stk.
- Zurueck: 38 Stk.
- Defekt: 1 Stk.
- Vermisst: 2 Stk.

Ruecknahmefelder fuer Massenware:

- Ausgegeben
- Zurueck
- Defekt
- Vermisst
- Notiz
- Optional Foto bei Schaden

Konsequenz fuer Verfuegbarkeit:

- Zurueckgemeldete Mengen erhoehen den verfuegbaren Bestand.
- Defekte Mengen werden nicht als verfuegbar gezaehlt.
- Vermisste Mengen werden nicht als verfuegbar gezaehlt.
- Defekte und vermisste Mengen erscheinen im Dashboard und in der Ruecknahmeuebersicht.

## 12. Cases und Massenware

Entscheidung:

- Cases duerfen sowohl Einzelgeraete als auch Massenware-Mengen enthalten.
- Material darf auch lose, also ohne Case, einem Auftrag zugewiesen werden.

Beispiele:

- Case Audio A: 12 Einzelgeraete
- Kabelcase 1: 20x Powercon 10m, 10x XLR 5m, 6x Adapter
- Loseposten: 4x Stativ, 2x Truss Bundle

Konsequenz fuer UX:

- Case-Details zeigen zwei Listen: Einzelgeraete und Massenware.
- Packlisten zeigen pro Case Soll-Mengen und Ist-Mengen.
- Gewichte werden aus Case-Eigengewicht, Einzelgeraeten und Massenware-Mengen berechnet.
- Bei Massenware im Case muss eine Standardmenge gepflegt werden.

## 13. Case-Gewicht

Entscheidung:

Case-Gesamtgewicht wird automatisch berechnet:

`Case-Eigengewicht + Summe Einzelgeraete-Gewicht + Summe (Massenware-Menge * Stueckgewicht)`

Konsequenz fuer Daten:

- Cases brauchen ein Feld `emptyWeight`.
- Einzelgeraete brauchen ein Feld `weight`.
- Massenware braucht ein optionales Feld `unitWeight`.

Konsequenz fuer UX:

- Case-Detail zeigt Eigengewicht, Einzelgeraete-Gewicht, Massenware-Gewicht und Gesamtgewicht.
- Logistik nutzt das Gesamtgewicht fuer Fahrzeug-Nutzlasten.
- Wenn bei Massenware kein Stueckgewicht gepflegt ist, zeigt das System eine Datenqualitaetswarnung.

## 14. Packages / Setup-Vorlagen

Entscheidung:

- Packages sind Vorlagen fuer wiederkehrende Setups, z.B. Standard-Buehnen-Setups, Corporate Audio, Streaming-Regie oder Festival-Licht.
- Packages koennen Einzelgeraete, Massenware-Mengen, Cases und externe Mietpositionen als Platzhalter enthalten.
- Wenn ein Package geaendert wird, werden bestehende Auftraege nicht automatisch veraendert.
- Neue Auftraege uebernehmen jeweils die aktuelle Package-Vorlage.

Package-Inhalte:

- Einzelgeraete
- Massenware-Mengen
- Cases
- Externe Mietpositionen als Platzhalter, z.B. `4x Moving Light extern bei Bedarf`
- Notizen fuer Dispo, Technik und Logistik

Konsequenz fuer UX:

- Beim Erstellen eines Auftrags kann ein Package als Startpunkt gewaehlt werden.
- Nach Uebernahme in einen Auftrag werden die Positionen zu normalen Auftragspositionen.
- Verfuegbarkeitswarnungen werden erst im konkreten Auftrag gegen Ladedatum bis Retour berechnet.
- Packages zeigen einen Richtpreis, Gesamtgewicht und offene Datenqualitaetswarnungen.

## 15. Package-Preislogik

Entscheidung fuer MVP:

- Packages haben keinen fixen Preis.
- Der Package-Richtpreis wird aus den enthaltenen Positionen berechnet.
- Nach Uebernahme in einen Auftrag koennen Rabatt, Mengen, Tage, externe Mietpositionen und manuelle Anpassungen im Auftrag bearbeitet werden.

Berechnung:

- Einzelgeraete: Menge * Tagesrate
- Massenware: Menge * Tagesrate/Stueck oder definierte Mietrate
- Cases: Summe der enthaltenen Positionen, nicht zusaetzlich doppelt verrechnen
- Externe Mietpositionen: als Platzhalter mit optionalem erwarteten Verkaufspreis

Spaetere Option:

- Ein Package kann einen Override-Preis oder Pauschalpreis erhalten, z.B. `Standard Buehne M pauschal CHF 5'500`.
- Dieser Override-Preis wird bewusst nicht im MVP umgesetzt, damit Kalkulation und Amortisation zuerst sauber nachvollziehbar bleiben.

## 16. Externes Mietmaterial / Zumietung

Entscheidung:

- Externes Mietmaterial wird pro Auftrag erfasst.
- Es gehoert nicht zum eigenen Inventar und fliesst nicht in die Amortisation ein.
- Es darf aber in Kalkulation, Packliste, Logistik und Margenbetrachtung erscheinen.

Ausloeser:

- Verfuegbarkeitskonflikt bei eigenem Material
- Unterdeckung bei Massenware
- Bewusste Zumietung fuer groessere Setups
- Platzhalter aus einem Package, z.B. `4x Moving Light extern bei Bedarf`

MVP-Felder:

- Beschreibung
- Kategorie
- Menge
- Lieferant
- Lieferantenkontakt / Link
- Einkaufspreis netto
- Verkaufspreis netto / Weiterverrechnung
- Zeitraum
- Abholung / Lieferung
- Rueckgabe faellig
- Status
- Notiz

Status fuer Zumietung:

1. Bedarf offen
2. Angefragt
3. Bestaetigt
4. Abholung geplant
5. Abgeholt / geliefert
6. Im Einsatz
7. Retoure faellig
8. Retournierte Ware
9. Abgerechnet

Konsequenz fuer UX:

- Bei Verfuegbarkeitswarnung gibt es eine direkte Aktion `Zumietung erfassen`.
- Die Dispo sieht offene Zumietungen pro Auftrag.
- Die Logistik sieht externe Positionen auf Packliste und Fahrzeugplanung.
- Technik/Ruecknahme kann externe Positionen als zurueckgegeben oder problematisch markieren.
- Eigene Amortisation ignoriert externe Positionen.

## 17. Auftragsabschluss

Entscheidung:

- Ein Auftrag darf erst auf `Abgeschlossen` wechseln, wenn alle operativen Ruecknahme- und Kontrollpunkte erledigt sind.
- `Abgeschlossen` ist ein gepruefter Zustand, nicht nur ein manueller Statuswechsel.

Abschluss-Checks:

- Alle eigenen Einzelgeraete sind zurueck oder als `Defekt`, `In Reparatur` oder `Vermisst` markiert.
- Massenware-Mengen sind kontrolliert: zurueck, defekt und vermisst.
- Externes Mietmaterial ist retourniert oder ein Problem ist dokumentiert.
- Offene Schaeden sind erfasst.
- Kalkulation ist final.
- Erst danach wird die Amortisation fuer eigenes Equipment berechnet.

Konsequenz fuer UX:

- Der Button `Abschliessen` ist erst aktiv, wenn alle Pflichtchecks erfuellt sind.
- Fehlende Punkte werden als konkrete To-do-Liste angezeigt.
- Admin kann bei Bedarf einen Abschluss trotz offener Punkte erzwingen, muss aber eine Begruendung erfassen.

## 18. Crew-/Personalmodul

Entscheidungsvorschlag:

- Crew-/Personalplanung passt fachlich zu tiramigear, wird aber nicht als voller MVP-Kern umgesetzt.
- Das Thema wird als Phase-2-Modul geplant.
- Der MVP soll technisch darauf vorbereitet werden, Crew-Schichten, Fahrer/Mitfahrer und Crewsheet-Exports spaeter sauber anzubinden.

Begruendung:

- Ein Crewsheet umfasst Projektkontakte, Personen, Rollen, Einsatzzeiten, Fahrzeuge, Treffpunkte, Sicherheitsinformationen und persoenliche Terminblaetter.
- Das ist wertvoll, aber ein eigenes grosses Modul mit Datenschutz-, Berechtigungs- und Exportanforderungen.
- Wenn wir es direkt vollstaendig in den MVP nehmen, steigt Scope und Risiko deutlich.

MVP-Vorbereitung:

- Auftragszeiten sauber modellieren.
- Fahrzeuge so modellieren, dass Fahrer/Mitfahrer spaeter referenziert werden koennen.
- Projektkontakte und Hinweise strukturiert vorsehen.
- Keine vollstaendige Personalverfuegbarkeit, Zeiterfassung oder Crewsheet-PDF-Erzeugung im ersten MVP.

Details:

- Siehe `docs/tiramigear-crew-modul.md`.
