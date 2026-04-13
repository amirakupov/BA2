import type { Request, Response } from "express";
import type { FaultHandler, JsonRpcRequest } from "../../types.js";

export class ConnectionResetHandler implements FaultHandler {
    async handle(req: Request, _res: Response, _rpc: JsonRpcRequest): Promise<void> {
        req.socket.destroy();
    }
}
