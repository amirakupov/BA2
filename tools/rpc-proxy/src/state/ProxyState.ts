import type { ScenarioConfig, ProxyStats } from "../types.js";

export class ProxyState {
    private scenario: ScenarioConfig | null = null;
    private stats: ProxyStats = this.emptyStats();

    getScenario(): ScenarioConfig | null {
        return this.scenario;
    }

    setScenario(config: ScenarioConfig): void {
        this.scenario = config;
    }

    clearScenario(): void {
        this.scenario = null;
    }

    getStats(): ProxyStats {
        return { ...this.stats, byMethod: { ...this.stats.byMethod } };
    }

    incrementTotal(method: string): void {
        this.stats.totalRequests++;
        this.stats.byMethod[method] = (this.stats.byMethod[method] ?? 0) + 1;
    }

    incrementFaulted(): void {
        this.stats.faultedRequests++;
    }

    incrementForwarded(): void {
        this.stats.forwardedRequests++;
    }

    resetStats(): void {
        this.stats = this.emptyStats();
    }

    private emptyStats(): ProxyStats {
        return { totalRequests: 0, faultedRequests: 0, forwardedRequests: 0, byMethod: {} };
    }
}
