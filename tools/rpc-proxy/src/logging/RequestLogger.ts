import type { RequestLogEntry } from "../types.js";

export class RequestLogger {
    log(entry: RequestLogEntry): void {
        process.stdout.write(JSON.stringify(entry) + "\n");

        const time = entry.timestamp.slice(11, 23);
        const action = entry.faultApplied
            ? `FAULT ${entry.faultType}`
            : "PASS";
        process.stderr.write(
            `[${time}] ${entry.rpcMethod} #${entry.rpcId ?? "?"} -> ${action} (${entry.durationMs}ms)\n`
        );
    }

    logScenarioChange(message: string): void {
        const time = new Date().toISOString().slice(11, 23);
        process.stderr.write(`[${time}] ${message}\n`);
    }
}
