import type { Request, Response } from "express";
import type { RequestForwarder } from "../../proxy/RequestForwarder.js";
import type { FaultHandler, JsonRpcRequest } from "../../types.js";

const MIN_DELAY_MS = 4000;
const MAX_DELAY_MS = 8000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class DelayHandler implements FaultHandler {
    constructor(private readonly forwarder: RequestForwarder) {}

    async handle(req: Request, res: Response, _rpc: JsonRpcRequest): Promise<void> {
        const delay = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
        await sleep(delay);
        await this.forwarder.forward(req.body as Buffer, res);
    }
}
