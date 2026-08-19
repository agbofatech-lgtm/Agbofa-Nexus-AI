#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
if ! command -v buf >/dev/null 2>&1; then
  echo "BLOCKED: buf is not installed" >&2
  exit 2
fi
buf lint
buf generate
echo "protobuf generation complete"
