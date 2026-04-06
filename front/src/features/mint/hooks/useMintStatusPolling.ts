"use client";

import { useMemo, useRef, useState } from "react";
import { ClaimResponse, UiMintEvent } from "@/src/features/mint/types";
import { api } from "@/src/lib/api";
import {State} from "@/src/features/mint/hooks/types";

export type PollingState = State;

export type UseMintStatusPollingReturn = {
    events: UiMintEvent[];
    connectionState: PollingState;
    streamError: string;
    claimResult: ClaimResponse | null;
    hasTerminalEvent: boolean;
    claimAndPoll: (orderId: string, wallet: string) => Promise<void>;
    startPollOnly: (orderId: string, wallet: string) => void;
    stopPoll: () => void;
    reset: () => void;
    ttffMs: number | null;
};

type EventLogEntry = {
    stage: string;
    order_status: string;
    mint_status: string;
    tx_hash: string;
    block_number: number;
    confirmations: number;
    message: string;
    error: string;
    emitted_at: string;
};

type EventsResponse = {
    ok: boolean;
    order_id: number;
    events: EventLogEntry[];
    reason?: string;
};

const TERMINAL_STAGES = ["TX_CONFIRMED", "MINT_FAILED"];
const POLL_INTERVAL_MS = 2000;

function isTerminalStage(stage: string): boolean {
    return TERMINAL_STAGES.includes(stage);
}

export function useMintStatusPolling(): UseMintStatusPollingReturn {
    const [events, setEvents] = useState<UiMintEvent[]>([]);
    const [connectionState, setConnectionState] = useState<PollingState>("idle");
    const [claimResult, setClaimResult] = useState<ClaimResponse | null>(null);
    const [streamError, setStreamError] = useState<string>("");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastEmittedAtRef = useRef<string>("");
    const stoppedRef = useRef(false);

    // Time to first feedback
    const startTime = useRef<number | null>(null);
    const ttffRecorded = useRef(false);
    const [ttffMs, setTtffMs] = useState<number | null>(null);

    const hasTerminalEvent = useMemo(
        () => events.some((e) => isTerminalStage(e.stage)),
        [events]
    );

    function appendEvents(entries: EventLogEntry[]) {
        const now = Date.now();
        const receivedAt = new Date(now).toISOString();

        if (!ttffRecorded.current && startTime.current !== null && entries.length > 0) {
            setTtffMs(now - startTime.current);
            ttffRecorded.current = true;
        }
        const newItems: UiMintEvent[] = entries.map((entry) => {
            const parsed = Date.parse(entry.emitted_at);
            const latencyMs = Number.isNaN(parsed) ? null : Date.now() - parsed;
            return {
                stage: entry.stage,
                orderStatus: entry.order_status,
                mintStatus: entry.mint_status,
                txHash: entry.tx_hash,
                blockNumber: entry.block_number,
                confirmations: entry.confirmations,
                message: entry.message,
                error: entry.error,
                emittedAt: entry.emitted_at,
                receivedAt,
                latencyMs,
            };
        });
        setEvents((prev) => [...prev, ...newItems]);
    }

    function clearTimer() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }

    function startPolling(orderId: string, wallet: string) {
        clearTimer();
        stoppedRef.current = false;
        setConnectionState("polling");
        lastEmittedAtRef.current = "";

        const poll = async () => {
            if (stoppedRef.current) return;
            try {
                const res = (await api.getOrderEvents(
                    orderId,
                    wallet,
                    lastEmittedAtRef.current || undefined
                )) as EventsResponse;

                if (!res.ok) {
                    setConnectionState("error");
                    setStreamError(res.reason || "Poll request failed");
                    clearTimer();
                    return;
                }

                if (res.events.length > 0) {
                    const lastEntry = res.events[res.events.length - 1];
                    lastEmittedAtRef.current = lastEntry.emitted_at;
                    appendEvents(res.events);

                    if (res.events.some((e) => isTerminalStage(e.stage))) {
                        clearTimer();
                        setConnectionState("closed");
                    }
                }
            } catch (err: any) {
                if (stoppedRef.current) return;
                setConnectionState("error");
                setStreamError(String(err?.message || err));
                clearTimer();
            }
        };

        poll();
        timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }

    async function claimAndPoll(orderId: string, wallet: string) {

        startTime.current = Date.now();
        ttffRecorded.current = false;
        setTtffMs(null);


        setEvents([]);
        setClaimResult(null);
        setStreamError("");
        setConnectionState("claiming");
        stoppedRef.current = false;
        startPolling(orderId, wallet);
        try {
            const data = (await api.claimOrder(Number(orderId), wallet)) as ClaimResponse;
            setClaimResult(data);
            if (!data.ok) throw new Error(data.reason || "Claim failed");
        } catch (err: any) {
            setConnectionState("error");
            setStreamError(String(err?.message || err));
            stopPoll();
        }
    }

    function startPollOnly(orderId: string, wallet: string) {
        setStreamError("");
        startPolling(orderId, wallet);
    }

    function stopPoll() {
        stoppedRef.current = true;
        clearTimer();
        setConnectionState("closed");
    }

    function reset() {

        startTime.current = null;
        ttffRecorded.current = false;
        setTtffMs(null);

        stoppedRef.current = true;
        clearTimer();
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
        claimAndPoll,
        startPollOnly,
        stopPoll,
        reset,
        ttffMs
    };
}
