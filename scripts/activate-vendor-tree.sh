#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 2 ]]; then echo "Usage: $0 <staged-directory> <destination-directory>" >&2; exit 2; fi
STAGE="$1"; DEST="$2"; OLD="\${DEST}.previous.$$"
if [[ ! -d "$STAGE" ]]; then echo "Staged vendor directory is missing: $STAGE" >&2; exit 2; fi
if [[ -e "$OLD" ]]; then echo "Refusing to overwrite stale backup: $OLD" >&2; exit 2; fi
restore_previous(){ if [[ -e "$OLD" && ! -e "$DEST" ]]; then mv "$OLD" "$DEST" || { echo "CRITICAL: could not restore previous vendor tree" >&2; return 1; }; fi; }
trap restore_previous EXIT HUP INT TERM
if [[ -e "$DEST" ]]; then mv "$DEST" "$OLD"; fi
if ! mv "$STAGE" "$DEST"; then echo "Activation failed; restoring previous vendor tree." >&2; restore_previous; exit 1; fi
rm -rf "$OLD"; trap - EXIT HUP INT TERM; echo "Activated verified vendor tree: $DEST"
