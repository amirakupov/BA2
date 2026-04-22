const API = process.env.API_URL ?? "http://localhost:3001/api";
const CONTROL = process.env.CONTROL_URL ?? "http://localhost:9546";
const ANVIL = process.env.ANVIL_URL ?? "http://localhost:8545";

export async function createOrder(wallet: string, tokenId = 1): Promise<number> {
    const res = await fetch(`${API}/test/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, token_id: tokenId, quantity: 1, expected_amount: 0 }),
    });
    const data = await res.json() as any;
    if (!data.ok) throw new Error(`createOrder failed: ${JSON.stringify(data)}`);
    return data.order.id;
}

export async function makeClaimable(orderId: number): Promise<void> {
    const res = await fetch(`${API}/test/orders/${orderId}/claimable`, { method: "POST" });
    const data = await res.json() as any;
    if (!data.ok) throw new Error(`makeClaimable failed: ${JSON.stringify(data)}`);
}

export async function claim(orderId: number, wallet: string): Promise<any> {
    const res = await fetch(`${API}/orders/${orderId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
    });
    return res.json();
}

export async function activateScenario(name: string): Promise<void> {
    const res = await fetch(`${CONTROL}/scenario/preset/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });
    const data = await res.json() as any;
    if (!data.ok) throw new Error(`activateScenario failed: ${JSON.stringify(data)}`);
}

export async function deactivateScenario(): Promise<void> {
    await fetch(`${CONTROL}/scenario`, { method: "DELETE" });
}

export async function resetStats(): Promise<void> {
    await fetch(`${CONTROL}/stats/reset`, { method: "POST" });
}

export async function getProxyStats(): Promise<object> {
    const res = await fetch(`${CONTROL}/status`);
    return res.json() as Promise<object>;
}

export async function setAnvilMining(blockTimeSec: number): Promise<void> {
    if (blockTimeSec <= 0) {
        await anvilRpc("evm_setAutomine", [true]);
    } else {
        await anvilRpc("evm_setAutomine", [false]);
        await anvilRpc("evm_setIntervalMining", [blockTimeSec]);
    }
}

async function anvilRpc(method: string, params: unknown[]): Promise<unknown> {
    const res = await fetch(ANVIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const data = await res.json() as any;
    if (data.error) throw new Error(`anvil ${method}: ${JSON.stringify(data.error)}`);
    return data.result;
}
