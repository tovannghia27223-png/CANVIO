#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HELPER="$ROOT/scripts/activate-vendor-tree.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Successful activation replaces the old tree and consumes the staging tree.
mkdir -p "$TMP/success/current" "$TMP/success/stage"
printf old > "$TMP/success/current/version"
printf new > "$TMP/success/stage/version"
bash "$HELPER" "$TMP/success/stage" "$TMP/success/current" >/dev/null
test "$(cat "$TMP/success/current/version")" = new
test ! -e "$TMP/success/stage"

# Simulate failure on the second mv (stage -> destination); the prior tree must be restored.
mkdir -p "$TMP/failure/current" "$TMP/failure/stage" "$TMP/fake-bin"
printf old > "$TMP/failure/current/version"
printf new > "$TMP/failure/stage/version"
cat > "$TMP/fake-bin/mv" <<'MV'
#!/usr/bin/env bash
count_file="$MV_COUNT_FILE"
count=0; [[ -f "$count_file" ]] && count="$(cat "$count_file")"
count=$((count+1)); printf '%s' "$count" > "$count_file"
if [[ "$count" -eq 2 ]]; then exit 71; fi
exec /bin/mv "$@"
MV
chmod +x "$TMP/fake-bin/mv"
export MV_COUNT_FILE="$TMP/mv-count"
if PATH="$TMP/fake-bin:$PATH" bash "$HELPER" "$TMP/failure/stage" "$TMP/failure/current" >/dev/null 2>&1; then
  echo 'Expected injected activation failure was not observed.' >&2; exit 1
fi
test "$(cat "$TMP/failure/current/version")" = old
test -d "$TMP/failure/stage"
echo 'Vendor tree activation transaction: 2/2 PASS (replace + rollback)'
