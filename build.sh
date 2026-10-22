#!/usr/bin/env bash
# Verschlüsselt src/index.html mit StatiCrypt nach docs/index.html (GitHub Pages).
# Das Passwort wird abgefragt und nie in eine Datei geschrieben.
# Alternativ: STATICRYPT_PASSWORD in der Umgebung setzen.
set -euo pipefail
cd "$(dirname "$0")"

if [ -z "${STATICRYPT_PASSWORD:-}" ]; then
  read -r -s -p "Passwort für die Seite: " STATICRYPT_PASSWORD
  echo
  export STATICRYPT_PASSWORD
fi

npx --yes staticrypt@3.5.4 src/index.html \
  --directory docs \
  --short \
  --remember 7 \
  --template-title "Rutfront Aktuelles – Entwurf (geschützt)" \
  --template-instructions "Entwurf, nur für eingeladene Personen." \
  --template-placeholder "Passwort" \
  --template-button "Öffnen" \
  --template-error "Falsches Passwort" \
  --template-remember "Auf diesem Gerät merken (7 Tage)" \
  --template-color-primary "#e30613" \
  --template-color-secondary "#fbf4f4"

echo "Fertig: docs/index.html (verschlüsselt). Jetzt committen und pushen."
