#!/usr/bin/env bash
set -u
export CI=1
export PLAYWRIGHT_JSON_OUTPUT_FILE='C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/b2-3-smoke.json'
echo "CI=$CI"
CI=1 npm run test:smoke -- --reporter=list,json --output='C:/Users/Admin/.t3/local-drafts/p7b-prB2/builder-b2/b2-3-smoke-artifacts'

