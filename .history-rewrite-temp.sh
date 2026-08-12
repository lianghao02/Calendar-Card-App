#!/usr/bin/env bash
set -euo pipefail
git init --bare .history-clean.git
git fast-export --signed-tags=strip main \
  | '/c/Users/chia-hao/AppData/Local/Programs/Python/Python313/python.exe' .history-fast-export-filter.py \
  | git --git-dir=.history-clean.git fast-import --force
git --git-dir=.history-clean.git symbolic-ref HEAD refs/heads/main
git --git-dir=.history-clean.git fsck --no-dangling
