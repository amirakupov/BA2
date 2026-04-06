import type { Request, Response } from "express";

// ── Fault types ──

export type FaultType =
    | "baseline"
    | "slow_rpc"
    | "timeout"
    | "rate_limit"
    | "connection_reset";

// ── Scenario configuration ──

export interface ScenarioConfig {
    readonly name: string;
    readonly fault: FaultType;
    readonly targetMethods: readonly string[];
    readonly intermittent: boolean;
}

// ── Parsed JSON-RPC request ──

export interface JsonRpcRequest {
    readonly jsonrpc: string;
    readonly id: number | string | null;
    readonly method: string;
    readonly params?: unknown[];
}

// ── Fault decision (output of FaultEngine) ──

export interface FaultDecision {
    readonly apply: boolean;
    readonly fault: FaultType;
    readonly reason: string;
}

// ── Request log entry ──

export interface RequestLogEntry {
    readonly timestamp: string;
    readonly rpcMethod: string;
    readonly rpcId: number | string | null;
    readonly scenario: string;
    readonly faultApplied: boolean;
    readonly faultType: FaultType;
    readonly durationMs: number;
    readonly outcome: "forwarded" | "faulted" | "error";
}

// ── Proxy statistics ──

export interface ProxyStats {
    totalRequests: number;
    faultedRequests: number;
    forwardedRequests: number;
    byMethod: Record<string, number>;
}

// ── Fault handler interface ──

export interface FaultHandler {
    handle(req: Request, res: Response, rpcRequest: JsonRpcRequest): Promise<void>;
}
