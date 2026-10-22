#!/usr/bin/env bash
# Prüft, ob ein Passwort zur verschlüsselten Seite passt, ohne etwas zu verändern.
#   ./check-password.sh              Passwort unsichtbar eingeben, gegen docs/index.html prüfen
#   ./check-password.sh --sichtbar   Eingabe sichtbar (damit man Tippfehler sieht)
#   ./check-password.sh --sichtbar docs/termine/index.html   andere Datei prüfen
# Das Passwort wird nirgends gespeichert. Alternativ STATICRYPT_PASSWORD in der Umgebung setzen.
set -euo pipefail
cd "$(dirname "$0")"

visible=0
if [ "${1:-}" = "--sichtbar" ]; then visible=1; shift; fi
file="${1:-docs/index.html}"
[ -f "$file" ] || { echo "$file fehlt, erst ./build.sh ausführen."; exit 2; }

if [ -z "${STATICRYPT_PASSWORD:-}" ]; then
  if [ "$visible" = 1 ]; then
    read -r -p "Passwort: " STATICRYPT_PASSWORD
  else
    read -r -s -p "Passwort: " STATICRYPT_PASSWORD
    echo
  fi
fi
export STATICRYPT_PASSWORD

out="$(mktemp -d "${TMPDIR:-/tmp}/rf-check.XXXXXX")"
if npx --yes staticrypt@3.5.4 "$file" --decrypt --directory "$out" >/dev/null 2>&1 \
   && grep -q "<title>" "$out"/*.html 2>/dev/null; then
  echo "✔ Das Passwort passt zu $file."
else
  echo "✘ Das Passwort passt NICHT zu $file."
  echo "  Tipp: ./check-password.sh --sichtbar zeigt die Eingabe, dann sieht man Tippfehler."
  exit 1
fi
