#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

if [ -f ".venv/bin/activate" ]; then
  source ".venv/bin/activate"
elif [ -f ".venv/Scripts/activate" ]; then
  source ".venv/Scripts/activate"
else
  echo "Virtual environment activate script not found in .venv."
  echo "Create one with: python -m venv .venv"
  exit 1
fi

python -m uvicorn main:app --reload --port "${1:-8000}"
