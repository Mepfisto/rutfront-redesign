# rutfront-redesign

Redesign-Mockup der kompletten Seite https://rutfront.koeln (Rutfront Fastelovendsbund e.V.):
Startseite, Aktuelles inkl. aller Beiträge, Termine, Mitglied werden, Über uns mit Unterseiten,
Impressum und Datenschutz. Kein offizielles Projekt des Vereins, nur ein Entwurf zur Diskussion.

Die Inhalte kommen unverändert von der echten Seite (WordPress-REST-API), das Layout ist neu.

## Idee

- Startseite mit Hero, „Nächster Termin" (wird beim Öffnen aus den Terminen berechnet) und den neuesten Beiträgen
- Aktuelles als einspaltige Liste mit festen 16:9-Vorschaubildern statt Masonry-Kacheln, mit Kategorie-Chips und Suche
- Termine als Karten mit Datumsbadge; vergangene Termine werden ausgegraut
- Chronik als Zeitleiste, Über uns und Elferrat der Herzen als Kartenraster
- YouTube-Video wird erst nach Klick geladen (Datenschutz)
- Dropdown-Menü per Tastatur bedienbar, Mobilmenü, Alt-Texte für Titelbilder, Skip-Link
- Impressum und Datenschutz stehen im Footer statt im Menü „Über uns"

## Aufbau

| Pfad | Inhalt |
|---|---|
| `scripts/fetch-content.mjs` | lädt Seiten und Beiträge nach `data/` |
| `scripts/build-site.mjs` | baut daraus die Seite nach `dist/` (CSS/JS pro Seite inline) |
| `scripts/site.css`, `scripts/site.js` | Design und Verhalten |
| `build.sh` | alles in einem: holen, bauen, mit StatiCrypt verschlüsseln nach `docs/` |
| `docs/` | die verschlüsselte Seite, wird über GitHub Pages ausgeliefert |

`data/` und `dist/` sind in der `.gitignore` und nie im Repo. GitHub Pages ist auf Free-Accounts
nur mit öffentlichen Repos möglich; läge der Klartext im Repo, wäre der Passwortschutz wirkungslos.

## Lokal ansehen (Klartext)

```bash
node scripts/fetch-content.mjs   # nur nötig, wenn data/ fehlt oder aktualisiert werden soll
node scripts/build-site.mjs
python3 -m http.server 8792 --directory dist
```

Dann http://localhost:8792 öffnen. Kein npm-Install nötig (Node 18+).

## Veröffentlichen (GitHub Pages, passwortgeschützt)

1. `./build.sh` ausführen (`--refresh` lädt vorher die aktuellen Inhalte) und das Passwort eingeben.
2. `docs/` und `.staticrypt.json` committen und pushen.
3. Im Repo unter Settings → Pages: „Deploy from a branch", Branch `main`, Ordner `/docs`.
4. Link und Passwort getrennt an die Kollegin / den Kollegen geben.

Das Passwort gehört nie ins Repo. Mit „Auf diesem Gerät merken" reicht eine Eingabe für alle Seiten.
Der Schutz hält Zufallsbesucher ab, ist aber keine echte Zugriffskontrolle: Wer das Passwort hat,
kann die Seite weitergeben.

## Hinweise

- Bilder, Logo und Videovorschau sind direkt von rutfront.koeln eingebunden (Internet nötig).
- Die Kategorien (Termine / Presse / Radio / Verein) sind Beispiele; die echte Seite hat nur Schlagwörter.
  Sie stehen in `scripts/build-site.mjs` (`CATEGORY`).
- Der Mixcloud-Player im Radio-Beitrag lädt weiterhin sofort.
- Das Kontaktformular gibt es auf der echten Seite nicht; „Kontakt" ist ein `mailto:`-Link.
