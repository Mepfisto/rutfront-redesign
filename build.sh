#!/usr/bin/env bash
# Baut die komplette Mockup-Seite und verschlüsselt sie mit StatiCrypt nach docs/ (GitHub Pages).
#   ./build.sh            Seite bauen und verschlüsseln (Inhalte aus data/)
#   ./build.sh --refresh  vorher die Inhalte von rutfront.koeln neu laden
#   ./build.sh --sichtbar Passwort beim Eintippen anzeigen (sieht man Tippfehler), kombinierbar mit --refresh
# Das Passwort wird abgefragt und nie in eine Datei geschrieben.
# Alternativ: STATICRYPT_PASSWORD in der Umgebung setzen.
# Am Ende wird geprüft, ob das eingegebene Passwort die erzeugte Seite wirklich entschlüsselt.
set -euo pipefail
cd "$(dirname "$0")"

refresh=0
visible=0
for arg in "$@"; do
  case "$arg" in
    --refresh) refresh=1 ;;
    --sichtbar) visible=1 ;;
    *) echo "Unbekannte Option: $arg"; exit 2 ;;
  esac
done

if [ "$refresh" = 1 ] || [ ! -f data/pages.json ]; then
  NODE_USE_ENV_PROXY=1 node scripts/fetch-content.mjs
fi
node scripts/build-site.mjs

if [ -z "${STATICRYPT_PASSWORD:-}" ]; then
  # Die Eingabe ist normalerweise unsichtbar, daher zweimal abfragen, damit sich kein Tippfehler einschleicht.
  if [ "$visible" = 1 ]; then flags=(-r); else flags=(-r -s); fi  # IFS= unten: Leerzeichen bleiben erhalten
  while true; do
    IFS= read "${flags[@]}" -p "Passwort für die Seite: " STATICRYPT_PASSWORD
    [ "$visible" = 1 ] || echo
    IFS= read "${flags[@]}" -p "Passwort wiederholen:   " PASSWORD_AGAIN
    [ "$visible" = 1 ] || echo
    if [ "$STATICRYPT_PASSWORD" != "$PASSWORD_AGAIN" ] || [ -z "$STATICRYPT_PASSWORD" ]; then
      echo "Eingaben stimmen nicht überein oder sind leer, bitte nochmal."
      continue
    fi
    # Umlaute und Sonderzeichen können je nach Programm unterschiedlich kodiert sein (z. B. ü als ein Zeichen
    # oder als u plus Punkte). Dann stimmt das Passwort im Browser nicht, obwohl es gleich aussieht.
    if printf %s "$STATICRYPT_PASSWORD" | LC_ALL=C grep -q '[^ -~]'; then
      echo "Das Passwort enthält Nicht-ASCII-Zeichen (Umlaute, ß, €, typografische Anführungszeichen …)."
      echo "Bitte nur Buchstaben ohne Umlaute, Ziffern und gewöhnliche Satzzeichen verwenden, sonst kann es im"
      echo "Browser abgelehnt werden. Neu eingeben:"
      continue
    fi
    break
  done
  unset PASSWORD_AGAIN
  export STATICRYPT_PASSWORD
fi

# StatiCrypt behält den Namen des Eingabeordners (docs/dist/...), daher erst in einen
# temporären Ordner schreiben und dann nach docs/ verschieben.
rm -rf docs .enc-tmp
npx --yes staticrypt@3.5.4 dist -r \
  --directory .enc-tmp \
  --short \
  --remember 7 \
  --template-title "Rutfront Redesign – Entwurf (geschützt)" \
  --template-instructions "Entwurf, nur für eingeladene Personen." \
  --template-placeholder "Passwort" \
  --template-button "Öffnen" \
  --template-error "Falsches Passwort" \
  --template-remember "Auf diesem Gerät merken (7 Tage)" \
  --template-color-primary "#e30613" \
  --template-color-secondary "#fbf4f4"

mv .enc-tmp/dist docs
rmdir .enc-tmp

# Selbsttest: entschlüsselt die erzeugte Seite mit dem eben eingegebenen Passwort?
./check-password.sh docs/index.html

echo "Fertig: docs/ (verschlüsselt). Jetzt committen und pushen."
