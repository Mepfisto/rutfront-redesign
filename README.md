# rutfront-aktuelles

Redesign-Mockup für https://rutfront.koeln/aktuelles/ (Rutfront Fastelovendsbund e.V.).
Kein offizielles Projekt des Vereins, nur ein Entwurf zur Diskussion.

## Idee

- Banner „Nächster Termin" (Elfter im Elften) mit Countdown
- Einspaltige Liste statt Masonry-Kacheln, Vorschaubilder fest 16:9 (kein Layout-Sprung beim Laden)
- Kategorie-Chips (Termine / Presse / Radio / Verein) und Live-Suche
- Alt-Texte, mobil einspaltig, keine Seitenleiste

## Aufbau

- `src/index.html` – das Mockup im Klartext (Einzeldatei, kein Build-Schritt für die Entwicklung)
- `docs/index.html` – dieselbe Seite, mit StatiCrypt passwortgeschützt; wird über GitHub Pages ausgeliefert
- `build.sh` – erzeugt `docs/index.html` aus `src/index.html`

Lokal ansehen:

```bash
python3 -m http.server 8792 --directory src
```

## Veröffentlichen (GitHub Pages, passwortgeschützt)

1. `./build.sh` ausführen und das Passwort eingeben (wird nicht gespeichert).
2. `docs/index.html` und `.staticrypt.json` committen und pushen.
3. In den Repo-Einstellungen unter Pages „Deploy from a branch", Branch `main`, Ordner `/docs` wählen.
4. Link und Passwort getrennt an die Kollegin / den Kollegen geben.

Nach jeder Änderung an `src/index.html` Schritt 1 und 2 wiederholen.

## Hinweise

- Das Passwort gehört nie ins Repo. Die verschlüsselte Seite schützt gegen Zufallsbesucher, ist aber keine echte Zugriffskontrolle: Wer das Passwort hat, kann sie weitergeben.
- `src/` steht in der `.gitignore` und wird nie committet. GitHub Pages ist auf Free-Accounts nur mit öffentlichen Repos möglich; läge die Klartext-Datei im Repo, wäre der Passwortschutz wirkungslos. Die Quelle bleibt daher nur lokal (Backup selbst machen).
- Bilder und Logo sind direkt von rutfront.koeln eingebunden (Internet nötig).
- Die Kategorien sind Beispiele; die echte Seite hat nur Schlagwörter.
- Links und Paginierung sind Platzhalter.
- Der Countdown rechnet gegen den 11.11.2026, 14 Uhr.
