git stat# TODO: Gaps and Next Steps for a Professional Research Study

## Current State Summary

The implementation includes:
- Backend (Express + gRPC) with `MintTrackerService`, `MintEventsBus`, `ClaimService`
- Two frontend transport hooks: `useMintStatus` (gRPC streaming) and `useMintStatusPolling` (HTTP 2s interval)
- RPC Proxy tool with fault injection (slow_rpc, timeout, rate_limit, connection_reset, intermittent)
- Solidity ERC1155 contract (`Naturo.sol`) deployable on Anvil
- Envoy proxy for gRPC-Web translation
- Per-event `emittedAt` / `receivedAt` / `latencyMs` tracking
- TTFF measurement in both hooks
- Event log persistence in PostgreSQL (`mint_event_logs`)

---

## 1. Metric Definitions: Alignment with Research Question

The research question specifies four metrics. Current implementation status:

| Metric | Defined? | Collected? | Aggregated? | Exported? |
|--------|----------|------------|-------------|-----------|
| **TTFF** (Time to First Feedback) | Partial | Partial | No | No |
| **Staleness p95** (event delivery delay) | No | Partial | No | No |
| **Completion Time p95** (claim to terminal event) | No | No | No | No |
| **Error Rate** (failed trials / total trials) | No | No | No | No |

### 1.1 TTFF (Time to First Feedback)

**Problem:** gRPC server sends a synthetic `CONNECTED` event immediately on stream open (`grpcServer.ts:60-70`). This will always be the first event for gRPC, making TTFF ~0ms. Polling has no equivalent. This creates an unfair comparison.

**Action:**
- Define TTFF as time from `claim()` call to the first **mint-related** event (`TX_SUBMITTED`, `TX_PENDING`, `TX_CONFIRMED`, or any `RPC_*` stage). Exclude `CONNECTED`.
- Adjust `appendEvent` / `appendEvents` to filter out `CONNECTED` from TTFF calculation.
- Alternatively, document explicitly in the paper that the `CONNECTED` event is a gRPC feature, and present TTFF both with and without it.

### 1.2 Staleness (p95)

**Definition needed:** For each event in a trial, `staleness = receivedAt - emittedAt`. The p95 staleness is the 95th percentile of all per-event staleness values across all events in all trials of a given (transport, scenario) combination.

**Current state:** `latencyMs` is already computed per event in both hooks. But:
- No aggregation across events/trials.
- No p95 computation.
- No export.

**Action:**
- Collect all `latencyMs` values per trial, export them.
- Compute p95 in post-processing (Python/R script).

### 1.3 Completion Time (p95)

**Definition needed:** `completionTime = timestamp(terminal event received) - timestamp(claim initiated)`. Terminal events: `TX_CONFIRMED` or `MINT_FAILED`.

**Current state:** Not computed. `startTime.current` exists but is only used for TTFF. The terminal event's `receivedAt` is recorded but not subtracted from start time.

**Action:**
- Add `completionTimeMs` to both hooks. When a terminal event arrives: `completionTimeMs = Date.now() - startTime.current`.
- Export per trial.

### 1.4 Error Rate

**Definition needed:** Percentage of trials where the final state is NOT `TX_CONFIRMED`. A trial is "failed" if:
- The stream/polling ended with `MINT_FAILED`.
- The stream broke (gRPC connection error) without reaching a terminal event.
- The polling encountered an unrecoverable HTTP error.
- Timeout was reached.

**Action:**
- Track `trialOutcome: "success" | "failure"` per trial.
- Record the reason for failure (timeout, stream error, MINT_FAILED, etc.).

---

## 2. Automated Test Harness (Critical Missing Piece)

Currently all testing is manual through the React UI. For a scientific experiment, you need a **headless programmatic test runner** that:

### 2.1 Test Runner Script (`tools/test-harness/`)

Create a Node.js script that:

```
for each scenario in [baseline, slow_rpc, timeout, rate_limit, connection_reset, intermittent]:
    activate scenario via RPC Proxy control API (POST /scenario/preset/:name)

    for each transport in [grpc, http_polling]:
        for trial = 1 to N:
            1. Create a fresh CLAIMABLE order (seed or API call)
            2. Record t_start = Date.now()
            3. IF grpc:  open gRPC stream + call /claim
               IF poll:  start polling loop + call /claim
            4. Collect all events with timestamps
            5. Record t_first_feedback, t_terminal, all latencyMs
            6. Compute: ttff, completionTime, per-event staleness
            7. Record trialOutcome (success/failure + reason)
            8. Write trial result to JSON/CSV
            9. Reset state: proxy stats, wait for DB idle

    deactivate scenario (DELETE /scenario)

Output: results/{scenario}_{transport}_{trial}.json
```

### 2.2 Sample Size

- Minimum **N = 30** trials per (scenario, transport) combination for statistical power.
- 6 scenarios x 2 transports x 30 trials = **360 trials minimum**.
- Ideally N = 50 for better p95 reliability (5th/95th percentile from 50 samples is more stable).

### 2.3 Trial Isolation

Between each trial:
- Create a new order (fresh `order_id`). Do NOT reuse orders.
- Reset RPC proxy stats (`POST /stats/reset`).
- Ensure the previous trial's tracker goroutine has completed (no leftover `MintTrackerService.track()` from prior trial).
- Brief cool-down period (1-2s) to avoid resource contention.

---

## 3. Infrastructure for Reproducibility

### 3.1 Full Docker Compose Stack

Currently only Envoy is in `docker-compose.yml`. Create a comprehensive stack:

```yaml
services:
  anvil:           # Local Ethereum node
  postgres:        # PostgreSQL
  backend:         # Express + gRPC server
  envoy:           # gRPC-Web proxy
  rpc-proxy:       # Fault injection proxy
```

### 3.2 Anvil Configuration

**Critical:** Simulating "long confirmation times" requires configurable block time.

- `anvil --block-time 12` (12-second blocks, similar to Ethereum mainnet)
- `anvil --block-time 0` (instant mining, for baseline fast path)
- Document which block time is used in each scenario.

Currently `MintTrackerService` polls every 2s with max 60 attempts. With 12s block time, a transaction needs ~12s to be mined. This is realistic and will produce meaningful TTFF/completion time differences.

**Action:**
- Add Anvil to docker-compose with configurable `--block-time`.
- Create a seed script that deploys the contract and creates N CLAIMABLE orders.

### 3.3 Database Seeding

Create `tools/seed.ts`:
- Deploy contract to Anvil
- Create N orders in CLAIMABLE state (e.g., 500 orders to have headroom)
- Each order has a unique `order_id`, same wallet, token_id=1, quantity=1

---

## 4. Missing Measurements

### 4.1 Per-Event Staleness Breakdown

Current `latencyMs` is a single number. For analysis, also record:
- `emittedAt` (server-side, from `MintEventsBus.publish`)
- `receivedAt` (client-side)
- `stage` (to analyze staleness by event type)

This is already partially in `UiMintEvent`. Just needs to be exported.

### 4.2 Message Count / Network Overhead

Record per trial:
- **HTTP polling:** total number of HTTP requests made (including empty responses)
- **gRPC streaming:** total number of gRPC messages received
- **Optional:** total bytes transferred (Content-Length for HTTP, message size for gRPC)

This is relevant for a secondary finding: resource efficiency comparison.

### 4.3 RPC Proxy Statistics per Trial

After each trial, fetch `GET /status` from the proxy control API and record:
- `totalRequests`
- `faultedRequests`
- `forwardedRequests`
- `byMethod` breakdown

This proves that the fault injection was actually applied during the trial.

---

## 5. Correctness Issues to Fix

### 5.1 Polling TTFF vs gRPC TTFF Comparability

**Problem:** In `useMintStatusPolling.ts:159`, polling starts *before* the claim call:
```ts
startPolling(orderId, wallet);  // starts immediately
const data = await api.claimOrder(...);  // then claims
```

The first poll will likely return empty results (no events yet because claim hasn't been sent). The TTFF timer starts at `claimAndPoll` entry, but the first "real" events only appear after the claim resolves and `MintTrackerService` starts publishing.

In `useMintStatus.ts:108`, gRPC stream also starts before claim:
```ts
const watchPromise = runStream(orderId, wallet, ac);
const data = await api.claimOrder(...);
```

This is symmetric, which is good. But both approaches record TTFF on the first event of *any* kind. For gRPC, the `CONNECTED` event fires immediately. For polling, the first successful poll with data fires after the claim + first tracker publish cycle.

**Action:**
- Filter TTFF to only count first mint-related event (not `CONNECTED`).

### 5.2 Clock Skew

`emittedAt` comes from the server, `receivedAt` from the client. If testing on localhost, clocks are identical (same machine). But document this as a limitation: in a real distributed deployment, NTP skew could affect staleness measurements.

**Action:** Add to the paper's "Threats to Validity" section.

### 5.3 gRPC Reconnection

**Problem:** If the gRPC stream breaks mid-flight (Envoy restart, network glitch), the client does NOT reconnect. The polling client naturally retries on every interval.

This is a valid finding but should be:
- Documented as a design decision.
- Optionally: implement retry logic (exponential backoff + reconnect) for gRPC to make the comparison fair, OR explicitly measure how the two transports behave differently when the transport layer itself fails (not just the RPC).

### 5.4 Polling Interval Hardcoded

`POLL_INTERVAL_MS = 2000` is hardcoded. The paper should:
- Justify this choice (common industry practice, balance between freshness and load).
- Optionally: test with 1s and 5s intervals as sensitivity analysis.

---

## 6. Fault Scenarios: Completeness Check

### Current scenarios vs research question requirements:

| Requirement from RQ | Proxy Fault | Implemented? | Notes |
|---------------------|-------------|--------------|-------|
| Long confirmation times | N/A (Anvil block-time) | **No** | Needs `--block-time 12` or higher |
| RPC delays | `slow_rpc` (4-8s) | Yes | |
| RPC timeouts | `timeout` (socket kill) | Yes | |
| Rate limiting (HTTP 429) | `rate_limit` | Yes | |
| Temporary RPC instability | `intermittent` (40% trigger rate) | Yes | |
| Connection reset | `connection_reset` | Yes | |

### Missing scenario: Long confirmation time

This is listed first in the research question but not implemented via the proxy. It requires Anvil's `--block-time` parameter.

**Action:**
- Configure Anvil with `--block-time 12` (or `--block-time 15`) for the "slow confirmation" scenario.
- This can be combined with other fault scenarios for compound testing.

### Recommended test matrix:

| # | Scenario Name | Anvil Block Time | RPC Proxy Fault | Description |
|---|---------------|------------------|-----------------|-------------|
| S1 | baseline_fast | 0 (instant) | baseline | Happy path, instant blocks |
| S2 | baseline_slow | 12s | baseline | Realistic block times, no RPC issues |
| S3 | slow_rpc | 12s | slow_rpc | 4-8s delay on every RPC call |
| S4 | timeout | 12s | timeout | RPC socket killed on every call |
| S5 | rate_limit | 12s | rate_limit | HTTP 429 on every RPC call |
| S6 | connection_reset | 12s | connection_reset | TCP RST on every call |
| S7 | intermittent | 12s | intermittent (40%) | Mixed: 40% slow_rpc, 60% normal |

7 scenarios x 2 transports x 30 trials = **420 trials**.

---

## 7. Data Export and Analysis

### 7.1 Raw Data Format

Each trial produces one JSON record:

```json
{
  "trial_id": 1,
  "scenario": "slow_rpc",
  "transport": "grpc",
  "order_id": 42,
  "started_at": "2026-04-08T10:00:00.000Z",
  "ttff_ms": 312,
  "completion_time_ms": 14520,
  "outcome": "success",
  "failure_reason": null,
  "event_count": 8,
  "poll_request_count": null,
  "events": [
    {
      "stage": "TX_SUBMITTED",
      "emitted_at": "...",
      "received_at": "...",
      "staleness_ms": 45
    }
  ],
  "proxy_stats": {
    "total": 6,
    "faulted": 6,
    "forwarded": 0
  }
}
```

### 7.2 Analysis Script (Python)

Create `tools/analysis/analyze.py`:

```python
# For each (scenario, transport) combination:
# - TTFF: median, mean, p95, p99
# - Staleness: p95 across all events in all trials
# - Completion Time: median, p95
# - Error Rate: count(outcome != "success") / total
# - Mann-Whitney U test: grpc vs polling per metric per scenario
# - Visualization: box plots, CDF plots
```

Libraries: `pandas`, `scipy.stats`, `matplotlib`, `seaborn`.

### 7.3 Statistical Tests

For each metric and each scenario, compare gRPC vs HTTP polling:
- **Mann-Whitney U test** (non-parametric, no normality assumption) for TTFF, staleness, completion time.
- **Fisher's exact test** or **Chi-squared test** for error rate (binary outcome).
- Report **effect size** (Cliff's delta or rank-biserial correlation).
- Report **95% confidence intervals** for medians.

---

## 8. Paper-Level Requirements

### 8.1 Experimental Setup Section

Document:
- Hardware: CPU, RAM, OS version, disk type
- Software versions: Node.js, Anvil, PostgreSQL, Envoy, protobuf
- Network: localhost (no real network latency), same machine for client/server
- Anvil block time per scenario
- RPC Proxy configuration per scenario
- Polling interval (2000ms) and justification
- gRPC streaming via Envoy gRPC-Web proxy
- Number of trials per combination
- Warm-up trials (discard first 5 per combination to avoid cold-start effects)

### 8.2 Threats to Validity

1. **Internal validity:**
   - Clock skew: not applicable on localhost, would be an issue in distributed setup.
   - gRPC `CONNECTED` event: if included in TTFF, gives gRPC unfair advantage.
   - No real network latency (all localhost).
   - Single-threaded event bus (no contention at scale).

2. **External validity:**
   - Anvil is not a real blockchain (no mempool congestion, no gas price fluctuation).
   - Single client (no concurrent user load).
   - Specific to ERC1155 Mint workflow.

3. **Construct validity:**
   - Staleness measured at application layer, not network layer.
   - "Perceived responsiveness" approximated by TTFF, not actual user perception study.

### 8.3 Reproducibility Package

Provide:
- `docker-compose.yml` for the full stack
- `tools/seed.ts` for database + contract setup
- `tools/test-harness/run.ts` for automated trial execution
- `tools/analysis/analyze.py` for statistical analysis
- `README` with exact steps to reproduce

---

## 9. Implementation Checklist

### Phase 1: Fix Measurement Code
- [ ] Add `completionTimeMs` to both hooks (or to the test harness client directly)
- [ ] Define and implement TTFF filter (exclude `CONNECTED` event)
- [ ] Add `pollRequestCount` counter to `useMintStatusPolling`
- [ ] Add `grpcMessageCount` counter to `useMintStatus`

### Phase 2: Build Test Harness
- [ ] Create `tools/test-harness/` with headless Node.js clients for both transports
- [ ] gRPC client: use `@grpc/grpc-js` directly (no browser, no Envoy needed)
- [ ] HTTP polling client: use `fetch` with same 2s interval logic
- [ ] Trial runner: orchestrates scenario activation, trial execution, data collection
- [ ] Data export: JSON per trial, CSV summary

### Phase 3: Infrastructure
- [ ] Add Anvil to `docker-compose.yml` with configurable `--block-time`
- [ ] Add PostgreSQL to `docker-compose.yml`
- [ ] Create `tools/seed.ts` to deploy contract + seed orders
- [ ] Add RPC Proxy to `docker-compose.yml`
- [ ] Ensure backend connects through RPC Proxy (set `CHAIN_RPC_URL=http://rpc-proxy:9545`)

### Phase 4: Run Experiment
- [ ] Define final scenario matrix (7 scenarios above)
- [ ] Run warm-up trials (5 per combination, discard)
- [ ] Run 30-50 trials per (scenario, transport) combination
- [ ] Collect proxy stats after each trial
- [ ] Verify data completeness (no missing trials)

### Phase 5: Analysis
- [ ] Write `tools/analysis/analyze.py`
- [ ] Compute descriptive statistics (median, mean, p95, p99, std)
- [ ] Run Mann-Whitney U tests for each metric per scenario
- [ ] Compute effect sizes (Cliff's delta)
- [ ] Generate box plots and CDF charts
- [ ] Generate a summary table for the paper

### Phase 6: Paper Sections
- [ ] Write "Experimental Setup" section
- [ ] Write "Results" section with tables and figures
- [ ] Write "Threats to Validity" section
- [ ] Write "Discussion" section interpreting results
- [ ] Reproducibility package (docker-compose + scripts + README)

---

## 10. Quick Wins (Can Be Done Immediately)

1. **Add Anvil `--block-time`** to your local startup command. Test with 12s blocks.
2. **Count poll requests** in `useMintStatusPolling.ts` (add a `requestCount` ref).
3. **Add `completionTimeMs`** to both hooks (trivial: `Date.now() - startTime.current` when terminal event arrives).
4. **Create a simple seed script** that inserts 100 CLAIMABLE orders into the database.
5. **Test each proxy scenario manually once** end-to-end and record observations. This gives you qualitative data before the automated harness is ready.
