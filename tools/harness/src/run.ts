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

// Default output path: results/<scenario>_<transport>.jsonl
const outDir = path.resolve("results");
mkdirSync(outDir, { recursive: true });
const outFile = values.out || path.join(outDir, `${scenario}_${transport}.jsonl`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    console.log(`\n=== ${scenario} / ${transport} / ${totalTrials} trials (+${warmup} warmup) ===`);
    console.log(`    output: ${outFile}\n`);

    // Activate fault scenario on RPC proxy
    await api.activateScenario(scenario);

    // Clear output file
    writeFileSync(outFile, "");

    for (let i = -warmup; i < totalTrials; i++) {
        const isWarmup = i < 0;
        const label = isWarmup
            ? `warmup ${warmup + i + 1}/${warmup}`
            : `trial ${i + 1}/${totalTrials}`;

        // Fresh order for each trial
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
        });

        const ttff = result.ttffMs !== null ? `${result.ttffMs.toFixed(0)}ms` : "n/a";
        const comp = result.completionTimeMs !== null ? `${result.completionTimeMs.toFixed(0)}ms` : "n/a";
        console.log(`${result.outcome}  ttff=${ttff}  completion=${comp}  events=${result.eventCount}`);

        // Only write non-warmup trials
        if (!isWarmup) {
            appendFileSync(outFile, JSON.stringify(result) + "\n");
        }

        // Cooldown between trials
        await sleep(2000);
    }

    // Deactivate scenario
    await api.deactivateScenario();

    console.log(`\nDone. ${totalTrials} trials saved to ${outFile}`);
    process.exit(0);
}

main().catch((err) => {
    console.error("\nFatal error:", err);
    process.exit(1);
});
