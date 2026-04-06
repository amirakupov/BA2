import Orders from "../models/Orders.js";

export class OrderRepository {
    async create(data: {
        wallet: string;
        token_id: number;
        quantity: number;
        expected_amount: number;
        status: string;
    }) {
        return Orders.create(data as any);
    }

    async updateById(id: number, patch: Partial<{
        nowpayments_payment_id: string;
        invoice_url: string;
        status: string;
    }>) {
        await Orders.update(patch, { where: { id } });
    }
    async findById(id: number) {
        return Orders.findByPk(id);
    }
    async markMintingIfClaimable(id: number): Promise<boolean>{

        const [updated] = await Orders.update(
            { status: "MINTING" },
            { where: { id, status: "CLAIMABLE" } }
        );
        return updated === 1;
    }
}
