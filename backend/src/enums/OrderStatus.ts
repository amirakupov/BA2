export const OrderStatus = {
    CREATED: "CREATED",
    INVOICE_CREATED: "INVOICE_CREATED",
    CLAIMABLE: "CLAIMABLE",
    MINTING: "MINTING",
    FULFILLED: "FULFILLED",
    FAILED: "FAILED",
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];