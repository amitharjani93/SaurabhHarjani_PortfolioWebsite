#!/bin/sh
# Mirrors the "Tests moved with the code" logic in .github/workflows/ci.yml so it
# can be exercised locally:  sh scripts/check-test-freshness.sh <base-ref>
#
# Advisory only — it prints what a reviewer should look at, and always exits 0.

BASE="${1:-origin/main}"
CHANGED=$(git diff --name-only "$BASE" HEAD)

changed() { echo "$CHANGED" | grep -qE "$1"; }
note()    { echo "  ! $1"; }

FLAGGED=0

if changed '^src/(lib|services)/' && ! changed '^test/unit/'; then
  note "src/lib or src/services changed with no change under test/unit/."
  FLAGGED=1
fi

if changed '^src/pages/.*\.astro$' && ! changed '^test/support/dist\.ts$'; then
  note "A page changed but expectedRoutes in test/support/dist.ts did not."
  FLAGGED=1
fi

if changed '^src/config/' && ! changed '^test/unit/(config|content)\.test\.ts$'; then
  note "src/config changed with no change to the config or content contract tests."
  FLAGGED=1
fi

if changed '^src/(components|layouts|styles)/' && ! changed '^test/'; then
  note "Components, layouts or styles changed with no test change."
  FLAGGED=1
fi

if [ "$FLAGGED" -eq 0 ]; then
  echo "  Nothing to flag - tests moved with the code."
fi
