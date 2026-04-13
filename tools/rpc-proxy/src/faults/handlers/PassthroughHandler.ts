import type { Request, Response } from "express";
import type { RequestForwarder } from "../../proxy/RequestForwarder.js";
import type { FaultHandler, JsonRpcRequest } from "../../types.js";

export class PassthroughHandler implements FaultHandler {
    constructor(private readonly forwarder: RequestForwarder) {}

    async handle(req: Request, res: Response, _rpc: JsonRpcRequest): Promise<void> {
        await this.forwarder.forward(req.body as Buffer, res);
    }
}
