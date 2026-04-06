import express from "express";
import type { Server } from "node:http";
import type { Request, Response } from "express";
import type { FaultEngine } from "../faults/FaultEngine.js";
import type { RequestForwarder } from "./RequestForwarder.js";
import type { RequestLogger } from "../logging/RequestLogger.js";
import type { ProxyState } from "../state/ProxyState.js";
import type { FaultHandler, FaultType, JsonRpcRequest } from "../types.js";

import { PassthroughHandler } from "../faults/handlers/PassthroughHandler.js";
import { DelayHandler } from "../faults/handlers/DelayHandler.js";
import { TimeoutHandler } from "../faults/handlers/TimeoutHandler.js";
import { RateLimitHandler } from "../faults/handlers/RateLimitHandler.js";
import { ConnectionResetHandler } from "../faults/handlers/ConnectionResetHandler.js";

export class ProxyServer {
    private readonly app = express();
    private readonly handlers: Map<FaultType, FaultHandler>;
    private readonly passthrough: PassthroughHandler;

    constructor(
        private readonly engine: FaultEngine,
        private readonly forwarder: RequestForwarder,
        private readonly logger: RequestLogger,
        private readonly state: ProxyState
    ) {
        this.passthrough = new PassthroughHandler(forwarder);
        this.handlers = new Map<FaultType, FaultHandler>([
            ["slow_rpc", new DelayHandler(forwarder)],
            ["timeout", new TimeoutHandler()],
            ["rate_limit", new RateLimitHandler()],
            ["connection_reset", new ConnectionResetHandler()],
        ]);

        this.app.use(express.raw({ type: "*/*" }));
        this.app.post("/", this.handleRequest);
    }

    listen(port: number): Server {
        const server = this.app.listen(port, () => {
            this.logger.logScenarioChange(`RPC Proxy listening on :${port}`);
        });
        server.requestTimeout = 0;
        server.headersTimeout = 0;
        return server;
    }

    private handleRequest = async (req: Request, res: Response): Promise<void> => {
        const start = Date.now();

        let rpc: JsonRpcRequest;
        try {
            const parsed = JSON.parse((req.body as Buffer).toString());
            rpc = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch {
            res.status(400).json({ error: "Invalid JSON-RPC body" });
            return;
        }

        this.state.incrementTotal(rpc.method);
        const decision = this.engine.evaluate(rpc.method);

        try {
            if (decision.apply) {
                const handler = this.handlers.get(decision.fault);
                if (!handler) {
                    await this.passthrough.handle(req, res, rpc);
                    this.state.incrementForwarded();
                } else {
                    await handler.handle(req, res, rpc);
                    this.state.incrementFaulted();
                }
            } else {
                await this.passthrough.handle(req, res, rpc);
                this.state.incrementForwarded();
            }

            this.logger.log({
                timestamp: new Date().toISOString(),
                rpcMethod: rpc.method,
                rpcId: rpc.id,
                scenario: this.state.getScenario()?.name ?? "none",
                faultApplied: decision.apply,
                faultType: decision.fault,
                durationMs: Date.now() - start,
                outcome: decision.apply ? "faulted" : "forwarded",
            });
        } catch (err) {
            this.logger.log({
                timestamp: new Date().toISOString(),
                rpcMethod: rpc.method,
                rpcId: rpc.id,
                scenario: this.state.getScenario()?.name ?? "none",
                faultApplied: decision.apply,
                faultType: decision.fault,
                durationMs: Date.now() - start,
                outcome: "error",
            });

            if (!res.headersSent) {
                res.status(502).json({
                    jsonrpc: "2.0",
                    id: rpc.id,
                    error: { code: -32603, message: `Upstream error: ${String(err)}` },
                });
            }
        }
    };
}
