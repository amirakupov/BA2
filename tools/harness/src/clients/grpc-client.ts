import { createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { MintStatusService } from "../gen/mint-status_pb.js";
import type { EventRecord } from "../types.js";

const ENVOY_URL = process.env.ENVOY_URL ?? "http://localhost:8080";

const transport = createGrpcWebTransport({
    baseUrl: ENVOY_URL,
});

const client = createClient(MintStatusService, transport);

export interface GrpcHandle {
    cancel: () => void;
    done: Promise<void>;
}

export function watchGrpc(
    orderId: number,
    wallet: string,
    onEvent: (event: EventRecord, raw: any) => void,
    onEnd: () => void,
    onError: (err: Error) => void,
): GrpcHandle {
    const ac = new AbortController();

    const done = (async () => {
        try {
            const stream = client.watchMintStatus(
                { orderId: BigInt(orderId), wallet, sinceEventId: 0n },
                { signal: ac.signal },
            );

            for await (const msg of stream) {
                const now = Date.now();
                const receivedAt = new Date(now).toISOString();
                const emittedAt = msg.emittedAt ?? "";
                const parsed = Date.parse(emittedAt);

                onEvent(
                    {
                        stage: msg.stage ?? "",
                        emittedAt,
                        receivedAt,
                        stalenessMs: Number.isNaN(parsed) ? -1 : now - parsed,
                    },
                    msg,
                );
            }

            onEnd();
        } catch (err: any) {
            if (ac.signal.aborted) {
                onEnd();
                return;
            }
            onError(err instanceof Error ? err : new Error(String(err)));
        }
    })();

    return {
        cancel: () => ac.abort(),
        done,
    };
}
