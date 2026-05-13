# tiramigear Rollenmatrix

Stand: 2026-05-11

## Rollen

- Admin
- User
- Logistik
- Technik

## Sichtbarkeit

Grundsatz:

- Preise, Einkaufspreise und Amortisation sind fuer alle Rollen sichtbar.
- Unterschiede liegen primaer bei Bearbeiten, Administrieren und operativen Aktionen.

## Vorlaeufige Berechtigungsmatrix

| Funktion | Admin | User | Logistik | Technik |
| --- | --- | --- | --- | --- |
| Dashboard sehen | Ja | Ja | Ja | Ja |
| Inventar sehen | Ja | Ja | Ja | Ja |
| Preise sehen | Ja | Ja | Ja | Ja |
| Einkaufspreise sehen | Ja | Ja | Ja | Ja |
| Amortisation sehen | Ja | Ja | Ja | Ja |
| Einzelgeraete erfassen/bearbeiten | Ja | Ja | Nein | Ja |
| Massenware erfassen/bearbeiten | Ja | Ja | Ja | Ja |
| Geraetezustand aendern | Ja | Ja | Ja | Ja |
| Schadensmeldung erfassen | Ja | Ja | Ja | Ja |
| Schaden/Reparaturstatus bearbeiten | Ja | Nein | Nein | Ja |
| Artikel als vermisst markieren | Ja | Ja | Ja | Ja |
| Vermisst-Fall schliessen | Ja | Nein | Nein | Ja |
| Cases verwalten | Ja | Ja | Ja | Ja |
| Packages verwalten | Ja | Ja | Nein | Nein |
| Auftraege sehen | Ja | Ja | Ja | Ja |
| Auftraege erstellen/bearbeiten | Ja | Ja | Nein | Nein |
| Kalkulation bearbeiten | Ja | Ja | Nein | Nein |
| Externes Mietmaterial erfassen | Ja | Ja | Ja | Nein |
| Packlisten sehen | Ja | Ja | Ja | Ja |
| Packstatus bearbeiten | Ja | Ja | Ja | Ja |
| Fahrzeuge/Logistik planen | Ja | Nein | Ja | Nein |
| Ruecknahme durchfuehren | Ja | Ja | Ja | Ja |
| Exporte erstellen | Ja | Ja | Ja | Nein |
| Benutzer verwalten | Ja | Nein | Nein | Nein |
| Systemeinstellungen | Ja | Nein | Nein | Nein |

## Zu klaerende Punkte

- Darf Logistik externe Mietmaterialien preislich bearbeiten oder nur Lieferant/Menge/Status?
- Darf Technik neue Einzelgeraete erfassen oder nur technische Daten und Zustand pflegen?
- Duerfen User abgeschlossene Auftraege nachtraeglich aendern?
- Soll es fuer kritische Aktionen einen Freigabeprozess geben, z.B. Auftrag abschliessen oder Schaden schliessen?
