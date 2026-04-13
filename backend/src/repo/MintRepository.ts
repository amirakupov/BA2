import Mints, {MintsAttributes} from "../models/Mints.js";

export class MintRepository {
    async findByOrderId(orderId: number) {
        return Mints.findOne({ where: { order_id: orderId } });
    }

    async create(data: { order_id: number; tx_hash: string; status: string; error?: string, submitted_at?: Date }) {
        return Mints.create(data as any);
    }

    async updateByOrderId(orderId: number, patch: Partial<MintsAttributes>) {
        await Mints.update(patch, { where: { order_id: orderId } });
        return await this.findByOrderId(orderId);
    }
}