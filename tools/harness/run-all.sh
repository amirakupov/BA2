#!/usr/bin/env bash
set -euo pipefail

TRANSPORTS="grpc http_poll"
TRIALS="${1:-50}"
WARMUP="${2:-5}"

echo "Running full experiment matrix: ${TRIALS} trials + ${WARMUP} warmup per combination"
echo ""

# Scenario definitions: "name:block_time"
# block_time=0  → Anvil automine (instant blocks)
# block_time=12 → Anvil interval mining (12s blocks, like Ethereum mainnet)
SCENARIOS=(
  "baseline:0"
  "baseline_slow:12"
  "slow_rpc:12"
  "timeout:12"
  "rate_limit:12"
  "connection_reset:12"
  "intermittent:12"
  "intermittent_timeout:12"
  "intermittent_rate_limit:12"
  "intermittent_conn_reset:12"
)

for entry in "${SCENARIOS[@]}"; do
  scenario="${entry%%:*}"
  block_time="${entry##*:}"

  for transport in $TRANSPORTS; do
    npx tsx src/run.ts \
      --transport "$transport" \
      --scenario "$scenario" \
      --trials "$TRIALS" \
      --warmup "$WARMUP" \
      --blockTime "$block_time"
    echo ""
  done
done

echo "done"
ls -lh results/*.jsonl
