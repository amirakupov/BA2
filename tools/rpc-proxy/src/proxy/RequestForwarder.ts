import type { Response } from "express";

const UPSTREAM_TIMEOUT_MS = 15_000;

export class RequestForwarder {
    constructor(private readonly targetUrl: string) {}

    async forward(body: Buffer, res: Response): Promise<number> {
        const start = Date.now();

        const upstream = await fetch(this.targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: Uint8Array.from(body),
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });

        const responseBody = await upstream.text();
        const durationMs = Date.now() - start;

        res.status(upstream.status);
        res.set("Content-Type", upstream.headers.get("Content-Type") ?? "application/json");
        res.send(responseBody);

        return durationMs;
    }
}
