import type { Request, Response } from "express";
import type { FaultHandler, JsonRpcRequest } from "../../types.js";

const CLEANUP_AFTER_MS = 120_000;

export class TimeoutHandler implements FaultHandler {
    async handle(req: Request, _res: Response, _rpc: JsonRpcRequest): Promise<void> {
        // Don't respond at all — ethers.js will throw a timeout error.
        // Safety cleanup: destroy socket after 120s to prevent memory leaks.
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
