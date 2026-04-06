import express from "express";
import type { Server } from "node:http";
import type { ProxyState } from "../state/ProxyState.js";
import type { RequestLogger } from "../logging/RequestLogger.js";
import { buildControlRouter } from "./controlRouter.js";

export class ControlServer {
    private readonly app = express();

    constructor(
        private readonly state: ProxyState,
        private readonly logger: RequestLogger
    ) {
        this.app.use(express.json());
        this.app.use(buildControlRouter(this.state, this.logger));
    }

    listen(port: number): Server {
        return this.app.listen(port, () => {
            this.logger.logScenarioChange(`Control API listening on :${port}`);
        });
    }
}
