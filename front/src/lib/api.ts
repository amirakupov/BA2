const BASE = process.env.NEXT_PUBLIC_API_URL;

function post(url: string, body: unknown) {
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
    }).then((r) => r.json());
}

function get(url: string) {
    return fetch(url, {
        method: "GET",
        credentials: "include",
    }).then((r) => r.json());
}

export const api = {
    createPayment: (dto: { wallet: string }) =>
        post(`${BASE}/create-payment`, dto),

    claimOrder: (id: number, wallet: string) =>
        post(`${BASE}/orders/${id}/claim`, { wallet }),

    getOrder: (id: string, wallet: string) =>
        get(`${BASE}/orders/${id}?wallet=${encodeURIComponent(wallet)}`),

    getOrderEvents: (id: string, wallet: string, sinceId?: number) => {
        const params = new URLSearchParams({ wallet });
        if (sinceId !== undefined) params.set("since_id", String(sinceId));
        return get(`${BASE}/orders/${id}/events?${params.toString()}`);
    },
};
