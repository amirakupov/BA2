import type { Request, Response } from "express";
import type { FaultHandler, JsonRpcRequest } from "../../types.js";

export class RateLimitHandler implements FaultHandler {
    async handle(_req: Request, res: Response, rpc: JsonRpcRequest): Promise<void> {
        res.status(429).json({
            jsonrpc: "2.0",
            id: rpc.id,
            error: {
                code: -32005,
                message: "rate limit exceeded, please slow down",
            },
        });
    }
}
