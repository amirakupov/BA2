import { ProxyState } from "./state/ProxyState.js";
import { RequestLogger } from "./logging/RequestLogger.js";
import { RequestForwarder } from "./proxy/RequestForwarder.js";
import { FaultEngine } from "./faults/FaultEngine.js";
import { ProxyServer } from "./proxy/ProxyServer.js";
import { ControlServer } from "./control/ControlServer.js";

const PROXY_PORT = Number(process.env.PROXY_PORT ?? 9545);
const CONTROL_PORT = Number(process.env.CONTROL_PORT ?? 9546);
const TARGET_RPC = process.env.TARGET_RPC ?? "http://127.0.0.1:8545";

// ── Dependency wiring ──

const state = new ProxyState();
const logger = new RequestLogger();
const forwarder = new RequestForwarder(TARGET_RPC);
const engine = new FaultEngine(state);

const proxyServer = new ProxyServer(engine, forwarder, logger, state);
const controlServer = new ControlServer(state, logger);

// ── Start ──

proxyServer.listen(PROXY_PORT);
controlServer.listen(CONTROL_PORT);

logger.logScenarioChange(`Forwarding to ${TARGET_RPC}`);
