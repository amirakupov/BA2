"use client";

import { useState } from "react";
import { useMintStatusPolling } from "@/src/features/mint/hooks/useMintStatusPolling";
import MintStatusView from "@/src/features/mint/components/MintStatusView";

export default function MintStatusPolling() {
    const [orderId, setOrderId] = useState("1");
    const [wallet, setWallet] = useState("");
    const poll = useMintStatusPolling();

    return (
        <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto", display: "grid", gap: 16 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
                Mint Status — HTTP Polling
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
                    <button onClick={() => poll.claimAndPoll(orderId, wallet)} style={{ padding: "10px 14px" }}>
                        Claim + Poll
                    </button>
                    <button onClick={() => poll.startPollOnly(orderId, wallet)} style={{ padding: "10px 14px" }}>
                        Poll only
                    </button>
                    <button onClick={poll.stopPoll} style={{ padding: "10px 14px" }}>
                        Stop
                    </button>
                    <button onClick={poll.reset} style={{ padding: "10px 14px" }}>
                        Reset
                    </button>
                </div>
            </div>

            <MintStatusView
                connectionState={poll.connectionState}
                streamError={poll.streamError}
                claimResult={poll.claimResult}
                events={poll.events}
                hasTerminalEvent={poll.hasTerminalEvent}
            />
        </main>
    );
}
