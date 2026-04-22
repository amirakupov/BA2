export type Transport = "grpc" | "http_poll";

export type Scenario =
    | "baseline"
    | "baseline_slow"
    | "slow_rpc"
    | "timeout"
    | "rate_limit"
    | "connection_reset"
    | "intermittent";

export interface TrialConfig {
    transport: Transport;
    scenario: Scenario;
    trialNumber: number;
    orderId: number;
    wallet: string;
    pollIntervalMs: number;
    timeoutMs: number;
    blockTimeSec: number;
}

export interface EventRecord {
    stage: string;
    emittedAt: string;
    receivedAt: string;
    stalenessMs: number;
}

export interface TrialResult {
    trialId: string;
    transport: Transport;
    scenario: Scenario;
    orderId: number;
    startedAt: string;
    ttffMs: number | null;
    completionTimeMs: number | null;
    outcome: "success" | "timeout" | "stream_error" | "poll_error" | "mint_failed";
    failureReason: string;
    eventCount: number;
    requestCount: number;
    messageCount: number;
    blockTimeSec: number;
    events: EventRecord[];
    proxyStats: object;
}
