"use client";

import { ClaimResponse, UiMintEvent } from "@/src/features/mint/types";
import {State} from "@/src/features/mint/hooks/types";

type Props = {
    connectionState: State;
    streamError: string;
    claimResult: ClaimResponse | null;
    events: UiMintEvent[];
    hasTerminalEvent: boolean;
};

function connectionStyles(state: State) {
    switch (state) {
        case "idle":     return { bg: "#f3f4f6", fg: "#111827", border: "#d1d5db" };
        case "claiming": return { bg: "#fffbeb", fg: "#92400e", border: "#f59e0b" };
        case "polling":   return { bg: "#f0fdf4", fg: "#166534", border: "#86efac" };
        case "streaming":return { bg: "#eff6ff", fg: "#1d4ed8", border: "#3b82f6" };
        case "closed":   return { bg: "#dcfce7", fg: "#166534", border: "#16a34a" };
        case "error":    return { bg: "#fee2e2", fg: "#991b1b", border: "#dc2626" };
    }
}

function stageStyles(stage: string, error: string) {
    if (error) return { bg: "#fee2e2", fg: "#991b1b", border: "#dc2626" };
    switch (stage) {
        case "TX_CONFIRMED": return { bg: "#000000", fg: "#166534", border: "#16a34a" };
        case "MINT_FAILED":  return { bg: "#000000", fg: "#991b1b", border: "#dc2626" };
        case "CONNECTED":    return { bg: "#000000", fg: "#1d4ed8", border: "#3b82f6" };
        default:             return { bg: "#000000", fg: "#e5e7eb", border: "#e5e7eb" };
    }
}

export default function MintStatusView({
    connectionState,
    streamError,
    claimResult,
    events,
    hasTerminalEvent,
}: Props) {
    const latestEvent = events.length ? events[events.length - 1] : null;
    const cs = connectionStyles(connectionState);

    return (
        <div style={{ display: "grid", gap: 16 }}>
            <section>
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>Connection</h2>
                <div
                    style={{
                        border: `1px solid ${cs.border}`,
                        background: cs.bg,
                        color: cs.fg,
                        padding: "10px 12px",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                    }}
                >
                    <div style={{ fontWeight: 800 }}>State: {connectionState}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                        {hasTerminalEvent ? "Terminal event received" : " "}
                    </div>
                </div>
                {streamError && (
                    <p style={{ color: "#dc2626", marginTop: 8 }}>Error: {streamError}</p>
                )}
            </section>

            <section>
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>Claim result</h2>
                {claimResult ? (
                    <div
                        style={{
                            padding: 12,
                            borderRadius: 10,
                            border: `1px solid ${claimResult.ok ? "#16a34a" : "#dc2626"}`,
                            background: claimResult.ok ? "#dcfce7" : "#fee2e2",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 8,
                            }}
                        >
                            <div style={{ fontWeight: 800, color: "black" }}>
                                {claimResult.ok ? "Claim OK" : "Claim FAILED"}
                            </div>
                            {claimResult.mint_status && (
                                <div style={{ fontSize: 12, color: "black", opacity: 0.9 }}>
                                    Mint: {claimResult.mint_status}
                                </div>
                            )}
                        </div>
                        <div style={{ display: "grid", gap: 6, color: "black" }}>
                            <div>
                                <strong>Tx hash:</strong>{" "}
                                <span style={{ wordBreak: "break-all" }}>
                                    {claimResult.tx_hash || "-"}
                                </span>
                            </div>
                            <div>
                                <strong>Mint status:</strong> {claimResult.mint_status || "-"}
                            </div>
                            {claimResult.reason && (
                                <div style={{ color: "#991b1b" }}>
                                    <strong>Reason:</strong>{" "}
                                    <span style={{ wordBreak: "break-word" }}>{claimResult.reason}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <p style={{ color: "#6b7280" }}>No claim yet.</p>
                )}
            </section>

            {latestEvent && (
                <section>
                    <h2 style={{ fontSize: 20, fontWeight: 600 }}>Latest event</h2>
                    <div
                        style={{
                            marginTop: 10,
                            padding: 12,
                            borderRadius: 10,
                            border: `1px solid ${stageStyles(latestEvent.stage, latestEvent.error).border}`,
                            background: stageStyles(latestEvent.stage, latestEvent.error).bg,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ fontWeight: 900 }}>{latestEvent.stage || "-"}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{latestEvent.receivedAt}</div>
                        </div>
                        <div style={{ display: "grid", gap: 6 }}>
                            <div><strong>Order status:</strong> {latestEvent.orderStatus}</div>
                            <div><strong>Mint status:</strong> {latestEvent.mintStatus}</div>
                            <div>
                                <strong>Tx hash:</strong>{" "}
                                <span style={{ wordBreak: "break-all", color: "black" }}>
                                    {latestEvent.txHash || "-"}
                                </span>
                            </div>
                            <div style={{ color: latestEvent.error ? "#dc2626" : "#6b7280" }}>
                                <strong>Error:</strong> {latestEvent.error || "-"}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section>
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>Event timeline</h2>
                {events.length === 0 ? (
                    <p>No events yet.</p>
                ) : (
                    <div style={{ display: "grid", gap: 12, maxHeight: 520, overflowY: "auto", paddingRight: 6 }}>
                        {events.map((e, index) => {
                            const s = stageStyles(e.stage, e.error);
                            return (
                                <div
                                    key={`${e.stage}-${e.emittedAt}-${index}`}
                                    style={{ border: `1px solid ${s.border}`, borderRadius: 8, padding: 12, background: s.bg }}
                                >
                                    <div style={{ marginBottom: 8 }}>
                                        <strong>Stage:</strong>{" "}
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "2px 8px",
                                                borderRadius: 999,
                                                border: `1px solid ${s.border}`,
                                                background: s.bg,
                                                color: s.fg,
                                                fontWeight: 900,
                                                fontSize: 12,
                                            }}
                                        >
                                            {e.stage || "-"}
                                        </span>
                                    </div>
                                    <div><strong>Order status:</strong> {e.orderStatus}</div>
                                    <div><strong>Mint status:</strong> {e.mintStatus}</div>
                                    <div>
                                        <strong>Tx hash:</strong>{" "}
                                        <span style={{ wordBreak: "break-all", color: "black" }}>{e.txHash || "-"}</span>
                                    </div>
                                    <div><strong>Block:</strong> {String(e.blockNumber)}</div>
                                    <div><strong>Confirmations:</strong> {String(e.confirmations)}</div>
                                    <div><strong>Message:</strong> {e.message || "-"}</div>
                                    <div>
                                        <strong>Error:</strong>{" "}
                                        <span style={{ color: e.error ? "#dc2626" : "#6b7280", wordBreak: "break-word" }}>
                                            {e.error || "-"}
                                        </span>
                                    </div>
                                    <div><strong>Emitted at:</strong> {e.emittedAt || "-"}</div>
                                    <div><strong>Received at:</strong> {e.receivedAt}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
