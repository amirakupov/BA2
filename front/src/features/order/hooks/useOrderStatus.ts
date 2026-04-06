"use client";

import { useEffect, useRef, useState } from "react";
import { Order } from "@/src/features/mint/types";
import { api } from "@/src/lib/api";

const TERMINAL_STATUSES = new Set(["FULFILLED", "FAILED"]);
const POLL_INTERVAL_MS = 5000;

type UseOrderStatusReturn = {
    order: Order | null;
    loading: boolean;
    error: string;
    refresh: () => void;
};

export function useOrderStatus(orderId: string, walletId: string): UseOrderStatusReturn {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const orderRef = useRef<Order | null>(null);

    async function fetchOrder(signal: AbortSignal) {
        try {
            const data = await api.getOrder(orderId, walletId);
            if (signal.aborted) return;
            setOrder(data);
            orderRef.current = data;
            setError("");
        } catch (err: any) {
            if (signal.aborted) return;
            setError(String(err?.message || err));
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }

    useEffect(() => {
        const ac = new AbortController();

        fetchOrder(ac.signal);

        const interval = setInterval(() => {
            if (!TERMINAL_STATUSES.has(orderRef.current?.status ?? "")) {
                fetchOrder(ac.signal);
            }
        }, POLL_INTERVAL_MS);

        return () => {
            ac.abort();
            clearInterval(interval);
        };
    }, [orderId]);

    function refresh() {
        setLoading(true);
        const ac = new AbortController();
        fetchOrder(ac.signal);
    }

    return { order, loading, error, refresh };
}
