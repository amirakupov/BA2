export type UiMintEvent = {
    stage: string;
    orderStatus: string;
    mintStatus: string;
    txHash: string;
    blockNumber: bigint | number;
    confirmations: bigint | number;
    message: string;
    error: string;
    emittedAt: string;
    receivedAt: string;
    latencyMs: number | null;
};

export type ClaimResponse = {
    ok: boolean;
    tx_hash?: string;
    mint_status?: string;
    reason?: string;
};

export type OrderStatus =
    | "PENDING"
    | "PAID"
    | "CLAIMABLE"
    | "FULFILLING"
    | "FULFILLED"
    | "FAILED";

export type Order = {
    id: number;
    status: OrderStatus;
    wallet: string;
    amount: string;
    chain: string;
    createdAt: string;
};
