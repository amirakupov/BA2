#!/usr/bin/env bash
set -euo pipefail

SCENARIOS="baseline slow_rpc timeout rate_limit connection_reset intermittent"
TRANSPORTS="grpc http_poll"
TRIALS="${1:-50}"
WARMUP="${2:-5}"

echo "Running full experiment matrix: ${TRIALS} trials + ${WARMUP} warmup per combination"
echo ""

for scenario in $SCENARIOS; do
  for transport in $TRANSPORTS; do
    echo "────────────────────────────────────────"
    npx tsx src/run.ts \
      --transport "$transport" \
      --scenario "$scenario" \
      --trials "$TRIALS" \
      --warmup "$WARMUP"
    echo ""
  done
done

echo "========================================"
echo "All experiments complete."
echo "Results in: results/"
ls -lh results/*.jsonl
