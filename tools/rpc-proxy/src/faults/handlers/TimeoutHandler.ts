import type { Request, Response } from "express";
import type { FaultHandler, JsonRpcRequest } from "../../types.js";

const CLEANUP_AFTER_MS = 120_000;

export class TimeoutHandler implements FaultHandler {
    async handle(req: Request, _res: Response, _rpc: JsonRpcRequest): Promise<void> {
        await new Promise<void>((resolve) => {
            const timer = setTimeout(() => {
                req.socket.destroy();
                resolve();
            }, CLEANUP_AFTER_MS);

            req.socket.once("close", () => {
                clearTimeout(timer);
                resolve();
            });
        });
    }
}
