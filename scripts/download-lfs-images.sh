#!/usr/bin/env bash
# Télécharge les images LFS depuis GitHub via l'API batch LFS.
# Usage: GH_TOKEN=xxx bash scripts/download-lfs-images.sh

set -euo pipefail

ARCHIVE_QUESTIONS="archive/public/questions"
TOKEN="${GH_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Erreur : GH_TOKEN non défini" >&2
  exit 1
fi

# Collect all LFS pointer files
mapfile -t POINTERS < <(find "$ARCHIVE_QUESTIONS" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.gif" -o -name "*.webp" \))

echo "${#POINTERS[@]} fichiers trouvés"

# Build batch request JSON
OBJECTS_JSON=""
for f in "${POINTERS[@]}"; do
  OID=$(sed -n 's/^oid sha256://p' "$f" 2>/dev/null || true)
  SIZE=$(sed -n 's/^size //p' "$f" 2>/dev/null || true)
  if [ -n "$OID" ] && [ -n "$SIZE" ]; then
    OBJECTS_JSON="${OBJECTS_JSON},{\"oid\":\"${OID}\",\"size\":${SIZE}}"
  fi
done
OBJECTS_JSON="[${OBJECTS_JSON:1}]"

# Call LFS batch API
BATCH_RESPONSE=$(curl -sf \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/vnd.git-lfs+json" \
  -H "Accept: application/vnd.git-lfs+json" \
  -d "{\"operation\":\"download\",\"transfers\":[\"basic\"],\"objects\":${OBJECTS_JSON}}" \
  "https://github.com/Dromadon/gennaker.git/info/lfs/objects/batch")

# Download each file
OK=0
FAIL=0
for f in "${POINTERS[@]}"; do
  OID=$(sed -n 's/^oid sha256://p' "$f" 2>/dev/null || true)
  [ -z "$OID" ] && continue

  HREF=$(echo "$BATCH_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
oid = '$OID'
for obj in data.get('objects', []):
    if obj.get('oid') == oid:
        print(obj.get('actions', {}).get('download', {}).get('href', ''))
        break
" 2>/dev/null || true)
  if [ -z "$HREF" ]; then
    echo "  ✗ URL introuvable pour $f"
    FAIL=$((FAIL + 1))
    continue
  fi

  if curl -sf -L -o "$f" "$HREF"; then
    OK=$((OK + 1))
    printf "\r  %d/%d téléchargées..." "$OK" "${#POINTERS[@]}"
  else
    echo "  ✗ Échec download : $f"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "✓ $OK images téléchargées ($FAIL échecs)"
