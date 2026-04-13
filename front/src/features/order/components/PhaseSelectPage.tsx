"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

type PhaseStatus = "active" | "soon" | "soldout";

type Phase = {
    id: number;
    price: number;
    total: number;
    minted: number;
    status: PhaseStatus;
};

const PHASES: Phase[] = [
    { id: 1, price: 200, total: 2400, minted: 847,  status: "active"  },
    { id: 2, price: 250, total: 2400, minted: 0,    status: "soon"    },
    { id: 3, price: 300, total: 2400, minted: 0,    status: "soon"    },
    { id: 4, price: 350, total: 2400, minted: 0,    status: "soon"    },
    { id: 5, price: 400, total: 2400, minted: 2400, status: "soldout" },
];

function PhaseSelectContent() {
    const searchParams = useSearchParams();
    const [selectedId, setSelectedId] = useState(1);
    const [quantity, setQuantity] = useState(1);
    const [refCode, setRefCode] = useState(searchParams.get("ref") ?? "");

    const phase = PHASES.find(p => p.id === selectedId)!;
    const remaining = phase.total - phase.minted;
    const total = phase.price * quantity;

    return (
        <div style={{
            minHeight: "100vh",
            background: "#09090e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            padding: "40px 20px",
        }}>
            {/* Grid */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
                    "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
            }} />

            {/* Glow */}
            <div style={{
                position: "absolute", pointerEvents: "none",
                width: 800, height: 400, borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 70%)",
                top: "40%", left: "50%", transform: "translate(-50%, -50%)",
            }} />

            <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 900 }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <p style={{
                        margin: "0 0 10px", fontSize: 11, letterSpacing: "0.2em",
                        textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
                    }}>
                        NĀTURO
                    </p>
                    <h1 style={{
                        margin: 0, fontSize: 32, fontWeight: 800,
                        color: "#fff", letterSpacing: "-0.03em",
                    }}>
                        Select Your Phase
                    </h1>
                </div>

                {/* Phase cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
                    {PHASES.map(p => (
                        <PhaseCard
                            key={p.id}
                            phase={p}
                            selected={selectedId === p.id}
                            onSelect={() => {
                                if (p.status === "active") {
                                    setSelectedId(p.id);
                                    setQuantity(1);
                                }
                            }}
                        />
                    ))}
                </div>

                {/* Summary panel */}
                <div style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 20,
                    padding: "24px 28px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: 20,
                    alignItems: "end",
                }}>
                    {/* Quantity */}
                    <div>
                        <label style={labelStyle}>Quantity</label>
                        <div style={{
                            display: "flex", alignItems: "center",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10, overflow: "hidden",
                            background: "rgba(255,255,255,0.04)",
                        }}>
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                style={qBtnStyle}
                            >−</button>
                            <span style={{ flex: 1, textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                                  {quantity}
                              </span>
                            <button
                                onClick={() => setQuantity(q => Math.min(remaining, q + 1))}
                                style={qBtnStyle}
                            >+</button>
                        </div>
                    </div>

                    {/* Referral */}
                    <div>
                        <label style={labelStyle}>Referral Code</label>
                        <input
                            value={refCode}
                            onChange={e => setRefCode(e.target.value.toUpperCase())}
                            placeholder="Optional"
                            style={{
                                width: "100%", height: 44, boxSizing: "border-box",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 10, padding: "0 14px",
                                color: "#fff", fontSize: 14, fontWeight: 600,
                                letterSpacing: "0.05em", outline: "none",
                            }}
                        />
                    </div>

                    {/* Total */}
                    <div>
                        <label style={labelStyle}>Total</label>
                        <div style={{ height: 44, display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
                                  {total.toLocaleString()}
                              </span>
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                                  USDC
                              </span>
                        </div>
                    </div>

                    {/* Button */}
                    <button
                        onClick={() => console.log({ phaseId: selectedId, quantity, refCode, total })}
                        style={{
                            height: 44, padding: "0 28px", whiteSpace: "nowrap",
                            background: "linear-gradient(135deg, #22c55e, #15803d)",
                            border: "none", borderRadius: 10,
                            color: "#fff", fontWeight: 700, fontSize: 15,
                            cursor: "pointer",
                            boxShadow: "0 0 24px rgba(34,197,94,0.25)",
                        }}
                    >
                        Proceed to Payment →
                    </button>
                </div>
            </div>
        </div>
    );
}

function PhaseCard({ phase, selected, onSelect }: {
    phase: Phase;
    selected: boolean;
    onSelect: () => void;
}) {
    const remaining = phase.total - phase.minted;
    const pct = (phase.minted / phase.total) * 100;

    const statusCfg: Record<PhaseStatus, { label: string; color: string; bg: string }> = {
        active:  { label: "Active",   color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
        soon:    { label: "Soon",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
        soldout: { label: "Sold Out", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
    };
    const s = statusCfg[phase.status];
    const canSelect = phase.status === "active";

    return (
        <div
            onClick={onSelect}
            style={{
                padding: "18px 14px",
                borderRadius: 16,
                border: selected
                    ? "1px solid rgba(34,197,94,0.55)"
                    : "1px solid rgba(255,255,255,0.07)",
                background: selected
                    ? "rgba(34,197,94,0.06)"
                    : "rgba(255,255,255,0.025)",
                boxShadow: selected ? "0 0 24px rgba(34,197,94,0.1)" : "none",
                cursor: canSelect ? "pointer" : "default",
                opacity: phase.status === "soldout" ? 0.45 : 1,
                display: "flex", flexDirection: "column", gap: 14,
                transition: "all 0.15s ease",
            }}
        >
            {/* Phase + badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
                      PHASE {phase.id}
                  </span>
                <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                    padding: "3px 6px", borderRadius: 999,
                    color: s.color, background: s.bg,
                }}>
                      {s.label.toUpperCase()}
                  </span>
            </div>

            {/* Price */}
            <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {phase.price}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginTop: 3 }}>
                    USDC / NFT
                </div>
            </div>

            {/* Supply */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Left</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                          {remaining.toLocaleString()}
                      </span>
                </div>
                <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{
                        height: "100%", width: `${pct}%`, borderRadius: 999,
                        background: phase.status === "soldout"
                            ? "#6b7280"
                            : "linear-gradient(90deg, #22c55e, #16a34a)",
                    }} />
                </div>
            </div>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: 10,
    fontSize: 11, color: "rgba(255,255,255,0.35)",
    letterSpacing: "0.12em", textTransform: "uppercase",
};

const qBtnStyle: React.CSSProperties = {
    width: 40, height: 44, background: "none", border: "none",
    color: "rgba(255,255,255,0.5)", fontSize: 20, cursor: "pointer",
};

export default function PhaseSelectPage() {
    return (
        <Suspense>
            <PhaseSelectContent />
        </Suspense>
    );
}