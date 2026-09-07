#!/usr/bin/env bash

cloc src \
  --by-file-by-lang \
  --not-match-f='(\.test\.|package.*\.json|^tsconfig|^eslint*|^README|^vitest)' \
  --exclude-dir=\
node_modules,\
dist,\
coverage,\
test,\
scripts;
