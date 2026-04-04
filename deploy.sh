#!/bin/bash
# Wrapper agar `./deploy.sh` (seperti di docs) memanggil skrip utama.
set -e
exec "$(dirname "$0")/scripts/deploy.sh" "$@"
