import type { ProxyState } from "../state/ProxyState.js";
import type { FaultDecision } from "../types.js";

export class FaultEngine {
    constructor(private readonly state: ProxyState) {}

    evaluate(method: string): FaultDecision {
        const scenario = this.state.getScenario();

        if (!scenario || scenario.fault === "baseline") {
            return { apply: false, fault: "baseline", reason: "no active fault scenario" };
        }

        const targeted =
            scenario.targetMethods.includes("*") ||
            scenario.targetMethods.includes(method);

        if (!targeted) {
            return { apply: false, fault: "baseline", reason: `method ${method} not targeted` };
        }

        if (scenario.intermittent) {
            const roll = Math.random();
            if (roll >= 0.4) {
                return {
                    apply: false,
                    fault: "baseline",
                    reason: `intermittent skip (roll=${roll.toFixed(3)})`,
                };
            }
        }

        return { apply: true, fault: scenario.fault, reason: `scenario: ${scenario.name}` };
    }
}
