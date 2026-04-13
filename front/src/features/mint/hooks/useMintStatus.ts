"use client";

import { useMemo, useRef, useState } from "react";
import { ClaimResponse, UiMintEvent } from "@/src/features/mint/types";
import { mintStatusClient } from "@/src/lib/grpc";
import { api } from "@/src/lib/api";
import {State} from "@/src/features/mint/hooks/types";

export type ConnectionState = State;

export type UseMintStatusReturn = {
    events: UiMintEvent[];
    connectionState: ConnectionState;
    streamError: string;
    claimResult: ClaimResponse | null;
    hasTerminalEvent: boolean;
    claimAndWatch: (orderId: string, wallet: string) => Promise<void>;
    startWatchOnly: (orderId: string, wallet: string) => Promise<void>;
    stopWatch: () => void;
    reset: () => void;
    ttffMs: number | null;
};

export function useMintStatus(): UseMintStatusReturn {
    const [events, setEvents] = useState<UiMintEvent[]>([]);
    const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
    const [claimResult, setClaimResult] = useState<ClaimResponse | null>(null);
    const [streamError, setStreamError] = useState<string>("");
    const abortRef = useRef<AbortController | null>(null);

    // Time to first feedback
    const startTime = useRef<number | null>(null);
    const ttffRecorded = useRef(false);
    const [ttffMs, setTtffMs] = useState<number | null>(null);

    const hasTerminalEvent = useMemo(
        () => events.some((e) => e.stage === "TX_CONFIRMED" || e.stage === "MINT_FAILED"),
        [events]
    );

    function mapLatency(emittedAt?: string): number | null {
        if (!emittedAt) return null;
        const emitted = Date.parse(emittedAt);
        if (Number.isNaN(emitted)) return null;
        return Date.now() - emitted;
    }

    function appendEvent(raw: any) {
        const now = Date.now();
        const receivedAt = new Date(now).toISOString();

        if (!ttffRecorded.current && startTime.current !== null) {
            setTtffMs(now - startTime.current);
            ttffRecorded.current = true;
        }
        const item: UiMintEvent = {
            stage: raw.stage ?? "",
            orderStatus: raw.orderStatus ?? raw.order_status ?? "",
            mintStatus: raw.mintStatus ?? raw.mint_status ?? "",
            txHash: raw.txHash ?? raw.tx_hash ?? "",
            blockNumber: raw.blockNumber ?? raw.block_number ?? 0,
            confirmations: raw.confirmations ?? 0,
            message: raw.message ?? "",
            error: raw.error ?? "",
            emittedAt: raw.emittedAt ?? raw.emitted_at ?? "",
            receivedAt,
            latencyMs: mapLatency(raw.emittedAt ?? raw.emitted_at),
        };
        setEvents((prev) => [...prev, item]);
    }

    async function runStream(orderId: string, wallet: string, ac: AbortController) {
        try {
            setConnectionState("streaming");
            const stream = mintStatusClient.watchMintStatus(
                { orderId: BigInt(orderId), wallet },
                { signal: ac.signal }
            );
            for await (const msg of stream) {
                appendEvent(msg);
            }
            setConnectionState("closed");
        } catch (err: any) {
            if (ac.signal.aborted) {
                setConnectionState("closed");
                return;
            }
            setConnectionState("error");
            setStreamError(String(err?.message || err));
        }
    }

    async function claimAndWatch(orderId: string, wallet: string) {

        startTime.current = Date.now();
        ttffRecorded.current = false;
        setTtffMs(null);

        setEvents([]);
        setClaimResult(null);
        setStreamError("");
        setConnectionState("claiming");

        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        const watchPromise = runStream(orderId, wallet, ac);

        try {
            const data = await api.claimOrder(Number(orderId), wallet) as ClaimResponse;
            setClaimResult(data);
            if (!data.ok) throw new Error(data.reason || "Claim failed");
        } catch (err: any) {
            setConnectionState("error");
            setStreamError(String(err?.message || err));
            ac.abort();
        }

        await watchPromise;
    }

    async function startWatchOnly(orderId: string, wallet: string) {
        setStreamError("");

        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        await runStream(orderId, wallet, ac);
    }

    function stopWatch() {
        abortRef.current?.abort();
        abortRef.current = null;
        setConnectionState("closed");
    }

    function reset() {
        startTime.current = null;
        ttffRecorded.current = false;
        setTtffMs(null);
        abortRef.current?.abort();
        abortRef.current = null;
        setEvents([]);
        setClaimResult(null);
        setStreamError("");
        setConnectionState("idle");
    }

    return {
        events,
        connectionState,
        streamError,
        claimResult,
        hasTerminalEvent,
        claimAndWatch,
        startWatchOnly,
        stopWatch,
        reset,
        ttffMs,
    };
}
