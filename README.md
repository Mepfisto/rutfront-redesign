[![Rutfront Redesign: Mockup online ansehen](assets/banner.svg)](https://mepfisto.github.io/rutfront-redesign/)

[![Webseite](https://img.shields.io/website?url=https%3A%2F%2Fmepfisto.github.io%2Frutfront-redesign%2F&label=Webseite&logo=githubpages&logoColor=white&up_message=online&down_message=offline&up_color=brightgreen&down_color=red)](https://mepfisto.github.io/rutfront-redesign/)
[![Seite aktualisiert](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FMepfisto%2Frutfront-redesign%2Fmain%2Fbadge-update.json&logo=github&logoColor=white)](https://github.com/Mepfisto/rutfront-redesign/commits/main/docs)

**Online ansehen:** https://mepfisto.github.io/rutfront-redesign/ (passwortgeschützt, das Passwort gibt es getrennt vom Link)

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
- YouTube-Video wird erst nach Klick geladen (Datenschutz); das Vorschaubild wird beim Bauen heruntergeladen und fest eingebettet, beim Seitenaufruf geht keine Anfrage an YouTube
- Dropdown-Menü mit Pfeil-Schalter: öffnet weich per Hover, Klick auf den Pfeil (Touch, Tastatur) oder Enter, schließt mit Escape, Klick daneben oder Tab hinaus; Hover-Puffer gegen Zuklappen. Dazu Mobilmenü, Alt-Texte für Titelbilder, Skip-Link
- Neu: **Kölsch-Wörterbuch**: kölsche Wörter im Text (Kütt noch, Jenoss:in, Fastelovend, Alaaf, Kamelle, Nubbel …) sind gepunktet unterstrichen und zeigen beim Darüberfahren, Antippen oder per Tastatur eine kurze Übersetzung. Pro Seite wird jedes Wort nur beim ersten Vorkommen markiert, Links und Überschriften bleiben unberührt (außer den Termin-Titeln). Das Liederheft ist besonders ausgebaut: zusätzliche Liedwörter (Kölle, simmer, jeiht, isset, de komms, et es janz ejal …), jedes Vorkommen markiert und ein Schalter „Hochdeutsch einblenden“, der hinter jedem kölschen Wort die Kurzübersetzung in Klammern zeigt. Einträge in `scripts/woerterbuch.json` (Felder `tip`, `kurz`, `nur`, `alle`, `prio`), Logik in `scripts/woerterbuch.js`
- Neu: **Kostüm-Ampel** (`/kostuem-ampel/`): Kostüm eintippen, die Ampel zeigt Rot, Gelb oder Grün mit kurzem Kommentar im Rutfront-Ton. Läuft komplett im Browser, nichts wird gespeichert oder verschickt. Teaser auf der Startseite und Eintrag im Menü „Über uns"
- Impressum und Datenschutz stehen im Footer statt im Menü „Über uns"

## Aufbau

| Pfad | Inhalt |
|---|---|
| `scripts/fetch-content.mjs` | lädt Seiten und Beiträge nach `data/` |
| `scripts/build-site.mjs` | baut daraus die Seite nach `dist/` (CSS/JS pro Seite inline) |
| `scripts/site.css`, `scripts/site.js` | Design und Verhalten |
| `scripts/kostuem.json`, `scripts/kostuem.js` | Texte und Logik der Kostüm-Ampel (Antworten hier anpassen) |
| `scripts/woerterbuch.json`, `scripts/woerterbuch.js` | Einträge und Logik des Kölsch-Wörterbuchs (Übersetzungen hier anpassen, Entwurf) |
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
2. `docs/`, `.staticrypt.json` und `badge-update.json` committen und pushen (das Datum im Badge „Seite aktualisiert“ kommt aus `badge-update.json`).
3. Im Repo unter Settings → Pages: „Deploy from a branch", Branch `main`, Ordner `/docs`.
4. Link und Passwort getrennt an die Kollegin / den Kollegen geben.

Passwort passt nicht? `./check-password.sh --sichtbar` prüft lokal gegen `docs/index.html`, ob ein Passwort
die Seite entschlüsselt (`✔`/`✘`), ohne etwas zu verändern. `./build.sh --sichtbar` zeigt die Eingabe beim
Setzen eines neuen Passworts. `build.sh` prüft am Ende selbst, ob das eingegebene Passwort die erzeugte
Seite entschlüsselt.

Das Passwort darf nur aus ASCII-Zeichen bestehen (Buchstaben ohne Umlaute, Ziffern, gewöhnliche Satzzeichen): Umlaute und
Sonderzeichen sind je nach Programm unterschiedlich kodiert (ü als ein Zeichen oder als u plus Punkte), dann wird das
Passwort im Browser abgelehnt, obwohl es gleich aussieht. `build.sh` lehnt solche Passwörter ab. Im Passwortmanager
ein Passwort „ohne Sonderzeichen“ oder eine Passphrase aus Wörtern erzeugen.

Das Passwort gehört nie ins Repo. Mit „Auf diesem Gerät merken" reicht eine Eingabe für alle Seiten.
Der Schutz hält Zufallsbesucher ab, ist aber keine echte Zugriffskontrolle: Wer das Passwort hat,
kann die Seite weitergeben.

## Hinweise

- Bilder, Logo und Videovorschau sind direkt von rutfront.koeln eingebunden (Internet nötig).
- Die Kategorien (Termine / Presse / Radio / Verein) sind Beispiele; die echte Seite hat nur Schlagwörter.
  Sie stehen in `scripts/build-site.mjs` (`CATEGORY`).
- Der Mixcloud-Player im Radio-Beitrag lädt weiterhin sofort.
- Die Antworten der Kostüm-Ampel sind Entwurfstexte und müssten vom Verein geprüft werden. Rund 60 Regeln mit etwa 700 Stichwörtern; ein spezifischeres Stichwort überstimmt das allgemeinere, in ihm steckende (Stadtsoldat vor Soldat), sonst gewinnt die strengste Stufe, damit ein harmloses Wort nie ein rotes Stichwort übertönt. Rote Stichwörter erscheinen nicht in der Vorschlagsliste des Eingabefelds.
- Das Kontaktformular gibt es auf der echten Seite nicht; „Kontakt" ist ein `mailto:`-Link.
