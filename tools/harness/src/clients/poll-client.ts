import type { EventRecord } from "../types.js";

const API = process.env.API_URL ?? "http://localhost:3001/api";

export interface PollHandle {
    stop: () => void;
    getRequestCount: () => number;
}

export function startPolling(
    orderId: number,
    wallet: string,
    intervalMs: number,
    onEvents: (events: EventRecord[]) => void,
    onError: (err: Error) => void,
): PollHandle {
    let lastId = 0;
    let requestCount = 0;
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
        if (stopped) return;
        requestCount++;
        try {
            const params = new URLSearchParams({ wallet });
            if (lastId > 0) params.set("since_id", String(lastId));

            const res = await fetch(`${API}/orders/${orderId}/events?${params}`);
            const data = (await res.json()) as any;

            if (!data.ok) {
                if (!stopped) onError(new Error(data.reason || "Poll request failed"));
                return;
            }

            if (data.events.length > 0) {
                lastId = data.events[data.events.length - 1].id;

                const records: EventRecord[] = data.events.map((e: any) => {
                    const now = Date.now();
                    const parsed = Date.parse(e.emitted_at);
                    return {
                        stage: e.stage,
                        emittedAt: e.emitted_at,
                        receivedAt: new Date(now).toISOString(),
                        stalenessMs: Number.isNaN(parsed) ? -1 : now - parsed,
                    };
                });

                onEvents(records);
            }
        } catch (err) {
            if (!stopped) onError(err as Error);
        }
    };

    poll();
    timer = setInterval(poll, intervalMs);

    return {
        stop: () => {
            stopped = true;
            if (timer) clearInterval(timer);
        },
        getRequestCount: () => requestCount,
    };
}
