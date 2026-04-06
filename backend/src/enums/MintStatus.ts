export const MintStatus = {
    TX_SUBMITTED: "TX_SUBMITTED",
    TX_PENDING: "TX_PENDING",
    CONFIRMED: "CONFIRMED",
    FAILED: "FAILED",
} as const;

export type MintStatus = typeof MintStatus[keyof typeof MintStatus];