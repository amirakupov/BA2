import WalletConnectButton from "@/src/features/wallet/components/ConnectButton";

export default function ConnectScreen() {
    return (
        <div style={{
            minHeight: "100vh",
            background: "#09090e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
        }}>
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
                    "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute",
                width: 560,
                height: 560,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 70%)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                animation: "glow-pulse 4s ease-in-out infinite",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 32,
                padding: "48px 40px",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 24,
                background: "rgba(255,255,255,0.025)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                width: "90%",
                maxWidth: 400,
                textAlign: "center",
            }}>
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    boxShadow: "0 0 32px rgba(34,197,94,0.35)",
                }}>
                    ◈
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: 38,
                        fontWeight: 800,
                        color: "#ffffff",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                    }}>
                        NFT
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                    }}>
                        NFT minting
                    </p>
                </div>
                <div style={{
                    width: "100%",
                    height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
                    <p style={{
                        margin: 0,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.45)",
                        lineHeight: 1.6,
                    }}>
                        Connect your wallet to access<br /> the app
                    </p>
                    <WalletConnectButton />
                </div>
            </div>
        </div>
    );
}