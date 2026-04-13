import {OrderRepository} from "../../repo/OrderRepository.js";

export class MockPaymentsClient {
    private ordersRepo: OrderRepository | null = null;

    setOrdersRepo(repo: OrderRepository) {
        this.ordersRepo = repo;
    }

    async createPayment(body: any): Promise<any> {
        const fakeId = `mock_${Date.now()}`;
        const orderId = body.order_id;

        console.log(`Invoice created for order ${orderId} (${fakeId})`);

        // simulate IPN after 5 seconds
        if (this.ordersRepo) {
            const repo = this.ordersRepo;
            setTimeout(async () => {
                try {
                    await repo.updateById(orderId, { status: "CLAIMABLE" });
                    console.log(`Order ${orderId} → CLAIMABLE (auto-confirmed)`);
                } catch (e) {
                    console.error(`Failed to auto-confirm order ${orderId}:`, e);
                }
            }, 5000);
        }

        return {
            id: fakeId,
            invoice_url: `http://localhost:3000/order/${orderId}?mock_payment=true`,
            status: "waiting",
        };
    }
}
