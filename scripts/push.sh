#!/usr/bin/env bash
# 🚀 push.sh — Sube master y main al remoto con mensajes claros.
# Uso:  ./scripts/push.sh
# Si da 403: el token del codespace no tiene escritura en kelvimsantos/Robotomia.
# Arreglo (una vez):  gh auth login  → HTTPS → "Paste a token" (scope 'repo')
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Rama actual: $(git rev-parse --abbrev-ref HEAD)"
echo "→ Repo remoto: $(git remote get-url origin)"

# 1) Push a origin/master
echo "→ Push a origin/master ..."
if ! git push origin master 2>&1; then
  echo ""
  echo "❌ Push a master falló (probablemente 403)."
  echo "   La auth del codespace (GITHUB_TOKEN) NO tiene escritura en el repo Robotomia."
  echo "   Solución (una sola vez):"
  echo "     unset GITHUB_TOKEN"
  echo "     gh auth login          # HTTPS → 'Paste a token' con scope 'repo'"
  echo "     git push origin master"
  exit 1
fi

# 2) Push a origin/main (sincronizado con master en local)
echo "→ Push a origin/main ..."
if ! git push origin main --force-with-lease 2>&1; then
  echo "   (main remoto tenía el README del template; reintento igualándolo a master)"
  git push origin main --force-with-lease
fi

echo ""
echo "✅ Push completado."
git status --short --branch