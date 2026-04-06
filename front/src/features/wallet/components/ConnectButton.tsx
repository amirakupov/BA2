import { ConnectButton } from "thirdweb/react";
import { client } from "@/src/lib/thirdweb";

const AUTH_BASE = process.env.NEXT_PUBLIC_API_URL + "/auth";

export default function WalletConnectButton() {
    return (
        <ConnectButton
            client={client}
            connectButton={{
                label: "Connect Wallet",
                style: {
                    background: "linear-gradient(135deg, #22c55e, #15803d)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 15,
                    padding: "14px 0",
                    width: "100%",
                    cursor: "pointer",
                    boxShadow: "0 0 20px rgba(34,197,94,0.25)",
                },
            }}
            auth={{
                isLoggedIn: async () => {
                    const res = await fetch(`${AUTH_BASE}/me`, { credentials: "include" });
                    return res.ok;
                },
                getLoginPayload: async ({ address }) => {
                    const res = await fetch(`${AUTH_BASE}/payload?address=${address}`, {
                        credentials: "include",
                    });
                    return res.json();
                },
                doLogin: async (params) => {
                    await fetch(`${AUTH_BASE}/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(params),
                    });
                },
                doLogout: async () => {
                    await fetch(`${AUTH_BASE}/logout`, {
                        method: "POST",
                        credentials: "include",
                    });
                },
            }}
        />
    );
}
