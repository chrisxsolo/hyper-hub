#!/bin/bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
requested_version="$(tr -d '[:space:]' < "$repo_root/.nvmrc" 2>/dev/null || true)"

current_major=""
if command -v node >/dev/null 2>&1; then
  current_major="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || true)"
fi

if [[ -n "$requested_version" && "$current_major" == "$requested_version" ]]; then
  exec "$@"
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

# Some shells and Homebrew setups export an npm prefix globally.
# nvm refuses to initialize when these are present.
unset npm_config_prefix
unset NPM_CONFIG_PREFIX
unset PREFIX

# Some terminal environments export DEBUG=release globally.
# Next.js 16's Turbopack currently treats any DEBUG value as test mode,
# which can enable slower, non-standard dev behavior.
unset DEBUG

if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  if [[ -n "${CI:-}" || -n "${VERCEL:-}" ]]; then
    exec "$@"
  fi

  echo "nvm is required to run this repo with Node $requested_version. Run 'nvm use' first." >&2
  exit 1
fi

# shellcheck disable=SC1090
. "$NVM_DIR/nvm.sh"
nvm use >/dev/null

exec "$@"
