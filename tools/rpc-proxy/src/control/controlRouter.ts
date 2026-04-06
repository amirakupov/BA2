import { Router } from "express";
import type { ProxyState } from "../state/ProxyState.js";
import type { RequestLogger } from "../logging/RequestLogger.js";
import type { ScenarioConfig, FaultType } from "../types.js";

const PRESETS: Record<string, Omit<ScenarioConfig, "name">> = {
    baseline:         { fault: "baseline",         targetMethods: ["*"], intermittent: false },
    slow_rpc:         { fault: "slow_rpc",         targetMethods: ["*"], intermittent: false },
    timeout:          { fault: "timeout",          targetMethods: ["*"], intermittent: false },
    rate_limit:       { fault: "rate_limit",       targetMethods: ["*"], intermittent: false },
    connection_reset: { fault: "connection_reset", targetMethods: ["*"], intermittent: false },
    intermittent:     { fault: "slow_rpc",         targetMethods: ["*"], intermittent: true  },
};

const VALID_FAULTS = new Set<FaultType>([
    "baseline", "slow_rpc", "timeout", "rate_limit", "connection_reset",
]);

export function buildControlRouter(state: ProxyState, logger: RequestLogger): Router {
    const router = Router();

    // ── Health ──
    router.get("/health", (_req, res) => {
        res.json({ ok: true });
    });

    // ── Status ──
    router.get("/status", (_req, res) => {
        res.json({
            active: state.getScenario() !== null,
            scenario: state.getScenario(),
            stats: state.getStats(),
        });
    });

    // ── Activate custom scenario ──
    router.post("/scenario", (req, res) => {
        const body = req.body as Partial<ScenarioConfig>;

        if (!body.name || !body.fault || !VALID_FAULTS.has(body.fault)) {
            res.status(400).json({
                error: "Required: name (string), fault (baseline|slow_rpc|timeout|rate_limit|connection_reset)",
            });
            return;
        }

        const config: ScenarioConfig = {
            name: body.name,
            fault: body.fault,
            targetMethods: body.targetMethods ?? ["*"],
            intermittent: body.intermittent ?? false,
        };

        state.setScenario(config);
        logger.logScenarioChange(
            `SCENARIO ACTIVATED: ${config.name} (fault=${config.fault}, methods=${JSON.stringify(config.targetMethods)}, intermittent=${config.intermittent})`
        );
        res.json({ ok: true, scenario: config });
    });

    // ── Activate preset ──
    router.post("/scenario/preset/:name", (req, res) => {
        const presetName = req.params.name;
        const preset = PRESETS[presetName];

        if (!preset) {
            res.status(400).json({
                error: `Unknown preset: ${presetName}. Available: ${Object.keys(PRESETS).join(", ")}`,
            });
            return;
        }

        const overrides = (req.body ?? {}) as Partial<ScenarioConfig>;

        const config: ScenarioConfig = {
            name: presetName,
            fault: overrides.fault && VALID_FAULTS.has(overrides.fault) ? overrides.fault : preset.fault,
            targetMethods: overrides.targetMethods ?? preset.targetMethods,
            intermittent: overrides.intermittent ?? preset.intermittent,
        };

        state.setScenario(config);
        logger.logScenarioChange(
            `SCENARIO ACTIVATED: ${config.name} (fault=${config.fault}, methods=${JSON.stringify(config.targetMethods)}, intermittent=${config.intermittent})`
        );
        res.json({ ok: true, scenario: config });
    });

    // ── Deactivate ──
    router.delete("/scenario", (_req, res) => {
        state.clearScenario();
        logger.logScenarioChange("SCENARIO DEACTIVATED");
        res.json({ ok: true });
    });

    // ── Reset stats ──
    router.post("/stats/reset", (_req, res) => {
        state.resetStats();
        res.json({ ok: true });
    });

    return router;
}
