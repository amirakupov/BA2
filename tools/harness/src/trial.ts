import * as api from "./clients/api-client.js";
import { watchGrpc } from "./clients/grpc-client.js";
import { startPolling } from "./clients/poll-client.js";
import type { TrialConfig, TrialResult, EventRecord } from "./types.js";

const TERMINAL_STAGES = ["TX_CONFIRMED", "MINT_FAILED"];

export async function runTrial(config: TrialConfig): Promise<TrialResult> {
    const events: EventRecord[] = [];
    let ttffMs: number | null = null;
    let completionTimeMs: number | null = null;
    let requestCount = 0;
    let messageCount = 0;
    const startedAt = new Date().toISOString();
    const t0 = performance.now();
    let finished = false;

    return new Promise<TrialResult>(async (resolve) => {
        const finish = async (outcome: TrialResult["outcome"], reason = "") => {
            if (finished) return;
            finished = true;
            clearTimeout(timeoutTimer);

            // Stop transport
            if (cancelTransport) cancelTransport();

            const proxyStats = await api.getProxyStats().catch(() => ({}));

            resolve({
                trialId: `${config.scenario}_${config.transport}_${String(config.trialNumber).padStart(3, "0")}`,
                transport: config.transport,
                scenario: config.scenario,
                orderId: config.orderId,
                startedAt,
                ttffMs,
                completionTimeMs,
                outcome,
                failureReason: reason,
                eventCount: events.length,
                requestCount,
                messageCount,
                events,
                proxyStats,
            });
        };

        const recordEvent = (event: EventRecord) => {
            events.push(event);

            const isMintRelated = event.stage !== "CONNECTED";
            if (ttffMs === null && isMintRelated) {
                ttffMs = performance.now() - t0;
            }

            if (TERMINAL_STAGES.includes(event.stage)) {
                completionTimeMs = performance.now() - t0;
                const outcome = event.stage === "TX_CONFIRMED" ? "success" : "mint_failed";
                finish(outcome);
            }
        };

        // Timeout guard
        const timeoutTimer = setTimeout(
            () => finish("timeout", `trial timeout after ${config.timeoutMs}ms`),
            config.timeoutMs,
        );

        // Start transport BEFORE claim (same as frontend hooks do)
        let cancelTransport: (() => void) | null = null;

        if (config.transport === "grpc") {
            const handle = watchGrpc(
                config.orderId,
                config.wallet,
                (ev) => {
                    messageCount++;
                    recordEvent(ev);
                },
                () => {
                    if (!finished) finish("stream_error", "stream ended before terminal event");
                },
                (err) => {
                    if (!finished) finish("stream_error", err.message);
                },
            );
            cancelTransport = handle.cancel;
        } else {
            const handle = startPolling(
                config.orderId,
                config.wallet,
                config.pollIntervalMs,
                (evs) => {
                    requestCount = handle.getRequestCount();
                    evs.forEach(recordEvent);
                },
                (err) => {
                    if (!finished) finish("poll_error", err.message);
                },
            );
            cancelTransport = handle.stop;
        }

        // Claim — triggers the mint workflow on the backend
        try {
            const result = await api.claim(config.orderId, config.wallet);
            if (!result.ok) {
                finish("stream_error", `claim rejected: ${result.reason || "unknown"}`);
            }
        } catch (err: any) {
            finish("stream_error", `claim failed: ${err.message}`);
        }
    });
}
