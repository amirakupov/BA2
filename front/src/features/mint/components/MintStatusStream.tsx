"use client";

import { useState } from "react";
import { useMintStatus } from "@/src/features/mint/hooks/useMintStatus";
import MintStatusView from "@/src/features/mint/components/MintStatusView";

export default function MintStatusStream() {
    const [orderId, setOrderId] = useState("1");
    const [wallet, setWallet] = useState("");
    const mint = useMintStatus();

    return (
        <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto", display: "grid", gap: 16 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
                Mint Status — gRPC Streaming
            </h1>

            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
                <label>
                    <div>Order ID</div>
                    <input
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        style={{ width: "100%", padding: 10, border: "1px solid #ccc" }}
                    />
                </label>
                <label>
                    <div>Wallet</div>
                    <input
                        value={wallet}
                        onChange={(e) => setWallet(e.target.value)}
                        placeholder="0x..."
                        style={{ width: "100%", padding: 10, border: "1px solid #ccc" }}
                    />
                </label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button onClick={() => mint.claimAndWatch(orderId, wallet)} style={{ padding: "10px 14px" }}>
                        Claim + Watch
                    </button>
                    <button onClick={() => mint.startWatchOnly(orderId, wallet)} style={{ padding: "10px 14px" }}>
                        Watch only
                    </button>
                    <button onClick={mint.stopWatch} style={{ padding: "10px 14px" }}>
                        Stop
                    </button>
                    <button onClick={mint.reset} style={{ padding: "10px 14px" }}>
                        Reset
                    </button>
                </div>
            </div>

            <MintStatusView {...mint} />
        </main>
    );
}
