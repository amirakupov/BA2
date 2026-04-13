import { Op } from "sequelize";
import EventLog, { EventLogCreationAttributes } from "../models/EventLogs.js";

export class EventLogRepository {
    async create(data: EventLogCreationAttributes) {
        return EventLog.create(data);
    }

    async findLatestByOrderId(orderId: number) {
        return EventLog.findOne({
            where: { order_id: orderId },
            order: [["emitted_at", "DESC"]],
        });
    }

    async findByOrderIdSince(orderId: number, since: Date) {
        return EventLog.findAll({
            where: {
                order_id: orderId,
                emitted_at: { [Op.gt]: since },
            },
            order: [["emitted_at", "ASC"]],
        });
    }

    async findAllByOrderId(orderId: number) {
        return EventLog.findAll({
            where: { order_id: orderId },
            order: [["emitted_at", "ASC"]],
        });
    }
}
