import { parseArgs } from "node:util";
import { appendFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import * as api from "./clients/api-client.js";
import { runTrial } from "./trial.js";
import type { Scenario, Transport } from "./types.js";

const { values } = parseArgs({
    options: {
        transport:    { type: "string", default: "grpc" },
        scenario:     { type: "string", default: "baseline" },
        trials:       { type: "string", default: "50" },
        warmup:       { type: "string", default: "5" },
        wallet:       { type: "string", default: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" },
        pollInterval: { type: "string", default: "2000" },
        timeout:      { type: "string", default: "90000" },
        blockTime:    { type: "string", default: "0" },
        out:          { type: "string", default: "" },
    },
});

const transport = values.transport as Transport;
const scenario = values.scenario as Scenario;
const totalTrials = Number(values.trials);
const warmup = Number(values.warmup);
const wallet = values.wallet!;
const pollIntervalMs = Number(values.pollInterval);
const timeoutMs = Number(values.timeout);
const blockTimeSec = Number(values.blockTime);

const outDir = path.resolve("results");
mkdirSync(outDir, { recursive: true });
const outFile = values.out || path.join(outDir, `${scenario}_${transport}.jsonl`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    console.log(`\n=== ${scenario} / ${transport} / ${totalTrials} trials (+${warmup} warmup) ===`);
    console.log(`    block-time: ${blockTimeSec}s  output: ${outFile}\n`);

    await api.setAnvilMining(blockTimeSec);

    // Scenarios where fault must activate AFTER claim (to let submitMint succeed)
    const LATE_ACTIVATION = new Set(["intermittent_timeout", "intermittent_rate_limit", "intermittent_conn_reset"]);
    const isLateActivation = LATE_ACTIVATION.has(scenario);

    // Activate fault scenario on RPC proxy
    // baseline_slow uses baseline proxy preset (fault comes from slow block time, not proxy)
    const proxyPreset = scenario === "baseline_slow" ? "baseline" : scenario;
    if (isLateActivation) {
        await api.activateScenario("baseline");
    } else {
        await api.activateScenario(proxyPreset);
    }

    // Clear output file
    writeFileSync(outFile, "");

    for (let i = -warmup; i < totalTrials; i++) {
        const isWarmup = i < 0;
        const label = isWarmup
            ? `warmup ${warmup + i + 1}/${warmup}`
            : `trial ${i + 1}/${totalTrials}`;

        // Fresh order for each trial
        // For late-activation scenarios, ensure proxy is on baseline before claim
        if (isLateActivation) {
            await api.activateScenario("baseline");
        }
        await api.resetStats();
        const orderId = await api.createOrder(wallet);
        await api.makeClaimable(orderId);

        process.stdout.write(`  ${label} — order #${orderId} ... `);

        const result = await runTrial({
            transport,
            scenario,
            trialNumber: isWarmup ? -(warmup + i) : i + 1,
            orderId,
            wallet,
            pollIntervalMs,
            timeoutMs,
            blockTimeSec,
            activateAfterClaim: isLateActivation ? proxyPreset : undefined,
        });

        const ttff = result.ttffMs !== null ? `${result.ttffMs.toFixed(0)}ms` : "n/a";
        const comp = result.completionTimeMs !== null ? `${result.completionTimeMs.toFixed(0)}ms` : "n/a";
        console.log(`${result.outcome}  ttff=${ttff}  completion=${comp}  events=${result.eventCount}`);

        if (!isWarmup) {
            appendFileSync(outFile, JSON.stringify(result) + "\n");
        }

        await sleep(2000);
    }

    await api.deactivateScenario();
    await api.setAnvilMining(0);

    console.log(`\nDone. ${totalTrials} trials saved to ${outFile}`);
    process.exit(0);
}

main().catch((err) => {
    console.error("\nFatal error:", err);
    process.exit(1);
});
