#!/usr/bin/env bash
# Baut die komplette Mockup-Seite und verschlüsselt sie mit StatiCrypt nach docs/ (GitHub Pages).
#   ./build.sh            Seite bauen und verschlüsseln (Inhalte aus data/)
#   ./build.sh --refresh  vorher die Inhalte von rutfront.koeln neu laden
# Das Passwort wird abgefragt und nie in eine Datei geschrieben.
# Alternativ: STATICRYPT_PASSWORD in der Umgebung setzen.
set -euo pipefail
cd "$(dirname "$0")"

if [ "${1:-}" = "--refresh" ] || [ ! -f data/pages.json ]; then
  NODE_USE_ENV_PROXY=1 node scripts/fetch-content.mjs
fi
node scripts/build-site.mjs

if [ -z "${STATICRYPT_PASSWORD:-}" ]; then
  # Die Eingabe ist unsichtbar, daher zweimal abfragen, damit sich kein Tippfehler einschleicht.
  while true; do
    read -r -s -p "Passwort für die Seite: " STATICRYPT_PASSWORD
    echo
    read -r -s -p "Passwort wiederholen:   " PASSWORD_AGAIN
    echo
    [ "$STATICRYPT_PASSWORD" = "$PASSWORD_AGAIN" ] && [ -n "$STATICRYPT_PASSWORD" ] && break
    echo "Eingaben stimmen nicht überein oder sind leer, bitte nochmal."
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

echo "Fertig: docs/ (verschlüsselt). Jetzt committen und pushen."
