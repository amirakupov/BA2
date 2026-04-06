"use client";

import { use } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/src/lib/thirdweb";
import { useOrderStatus } from "@/src/features/order/hooks/useOrderStatus";
import { useMintStatus } from "@/src/features/mint/hooks/useMintStatus";
import MintStatusView from "@/src/features/mint/components/MintStatusView";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const account = useActiveAccount();
    const wallet = account?.address ?? "";
    const { order, loading, error } = useOrderStatus(id, wallet);
    const mint = useMintStatus();

    if (!account) {
        return (
            <main style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
                    Order #{id}
                </h1>
                <p style={{ marginBottom: 16, color: "#6b7280" }}>
                    Connect your wallet to claim this NFT.
                </p>
                <ConnectButton client={client} />
            </main>
        );
    }

    if (loading) {
        return (
            <main style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
                <p>Loading order...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
                <p style={{ color: "#dc2626" }}>Error: {error}</p>
            </main>
        );
    }

    if (!order) {
        return (
            <main style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
                <p>Order not found.</p>
            </main>
        );
    }

    const isIdle = mint.connectionState === "idle";
    const isMinting = !isIdle;

    return (
        <main style={{ padding: 24, maxWidth: 800, margin: "0 auto", display: "grid", gap: 24 }}>
            <div>
                <h1 style={{ fontSize: 28, fontWeight: 700 }}>Order #{id}</h1>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                    <OrderStatusBadge status={order.status} />
                    <span style={{ color: "#6b7280", fontSize: 14 }}>
                        {new Date(order.createdAt).toLocaleString()}
                    </span>
                </div>
            </div>

            {order.status === "CLAIMABLE" && isIdle && (
                <div
                    style={{
                        padding: 20,
                        border: "1px solid #16a34a",
                        borderRadius: 12,
                        background: "#f0fdf4",
                    }}
                >
                    <p style={{ marginBottom: 12, color: "#166534", fontWeight: 600 }}>
                        Your payment is confirmed. You can now claim your NFT.
                    </p>
                    <button
                        onClick={() => mint.claimAndWatch(id, wallet)}
                        style={{
                            padding: "12px 24px",
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 16,
                            cursor: "pointer",
                        }}
                    >
                        Claim NFT
                    </button>
                </div>
            )}

            {order.status === "PENDING" && (
                <div style={{ padding: 16, border: "1px solid #f59e0b", borderRadius: 12, background: "#fffbeb" }}>
                    <p style={{ color: "#92400e" }}>
                        Waiting for payment confirmation. This page will update automatically.
                    </p>
                </div>
            )}

            {order.status === "FULFILLED" && (
                <div style={{ padding: 16, border: "1px solid #16a34a", borderRadius: 12, background: "#dcfce7" }}>
                    <p style={{ color: "#166534", fontWeight: 600 }}>NFT successfully minted!</p>
                </div>
            )}

            {order.status === "FAILED" && (
                <div style={{ padding: 16, border: "1px solid #dc2626", borderRadius: 12, background: "#fee2e2" }}>
                    <p style={{ color: "#991b1b" }}>This order has failed. Please contact support.</p>
                </div>
            )}

            {isMinting && (
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Minting status</h2>
                        {mint.connectionState !== "closed" && (
                            <button
                                onClick={mint.stopWatch}
                                style={{ padding: "6px 12px", fontSize: 13, cursor: "pointer" }}
                            >
                                Stop
                            </button>
                        )}
                    </div>
                    <MintStatusView
                        connectionState={mint.connectionState}
                        streamError={mint.streamError}
                        claimResult={mint.claimResult}
                        events={mint.events}
                        hasTerminalEvent={mint.hasTerminalEvent}
                    />
                </div>
            )}
        </main>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; fg: string; border: string }> = {
        PENDING:    { bg: "#fffbeb", fg: "#92400e", border: "#f59e0b" },
        PAID:       { bg: "#eff6ff", fg: "#1d4ed8", border: "#3b82f6" },
        CLAIMABLE:  { bg: "#f0fdf4", fg: "#166534", border: "#16a34a" },
        FULFILLING: { bg: "#eff6ff", fg: "#1d4ed8", border: "#3b82f6" },
        FULFILLED:  { bg: "#dcfce7", fg: "#166534", border: "#16a34a" },
        FAILED:     { bg: "#fee2e2", fg: "#991b1b", border: "#dc2626" },
    };

    const s = styles[status] ?? { bg: "#f3f4f6", fg: "#111827", border: "#d1d5db" };

    return (
        <span
            style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${s.border}`,
                background: s.bg,
                color: s.fg,
                fontWeight: 700,
                fontSize: 13,
            }}
        >
            {status}
        </span>
    );
}
