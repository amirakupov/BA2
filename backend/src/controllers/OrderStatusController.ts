import type { Request, Response } from "express";
import { OrderRepository } from "../repo/OrderRepository.js";
import { MintRepository } from "../repo/MintRepository.js";
import { EventLogRepository } from "../repo/EventLogRepository.js";

export class OrderStatusController {
    constructor(
        private readonly ordersRepo: OrderRepository,
        private readonly mintsRepo: MintRepository,
        private readonly eventLogRepo: EventLogRepository
    ) {}

    public getStatus = async (req: Request, res: Response) => {
        try {
            const orderId = Number(req.params.id);
            const wallet = String(req.query.wallet || "").trim();

            if (!orderId || !wallet) {
                return res.status(400).json({ ok: false, reason: "Missing orderId or wallet" });
            }

            const order = await this.ordersRepo.findById(orderId);
            if (!order) {
                return res.status(404).json({ ok: false, reason: "Order not found" });
            }

            if (order.wallet.toLowerCase() !== wallet.toLowerCase()) {
                return res.status(403).json({ ok: false, reason: "Wallet mismatch" });
            }

            const mint = await this.mintsRepo.findByOrderId(orderId);
            const latestLog = await this.eventLogRepo.findLatestByOrderId(orderId);

            return res.json({
                ok: true,
                order_id: orderId,
                order_status: order.status,
                mint_status: mint?.status || "",
                tx_hash: mint?.tx_hash || "",
                block_number: mint?.block_number || 0,
                confirmations: mint?.confirmations || 0,
                error: mint?.error || "",
                updated_at: mint?.updatedAt?.toISOString() || order.updatedAt?.toISOString() || "",
                emitted_at: latestLog?.emitted_at?.toISOString() || "",
            });
        } catch (error) {
            return res.status(500).json({ ok: false, reason: String(error) });
        }
    };

    public getEvents = async (req: Request, res: Response) => {
        try {
            const orderId = Number(req.params.id);
            const wallet = String(req.query.wallet || "").trim();
            const sinceParam = String(req.query.since || "").trim();

            if (!orderId || !wallet) {
                return res.status(400).json({ ok: false, reason: "Missing orderId or wallet" });
            }

            const order = await this.ordersRepo.findById(orderId);
            if (!order) {
                return res.status(404).json({ ok: false, reason: "Order not found" });
            }

            if (order.wallet.toLowerCase() !== wallet.toLowerCase()) {
                return res.status(403).json({ ok: false, reason: "Wallet mismatch" });
            }

            let logs;
            if (sinceParam) {
                const sinceDate = new Date(sinceParam);
                if (isNaN(sinceDate.getTime())) {
                    return res.status(400).json({ ok: false, reason: "Invalid since timestamp" });
                }
                logs = await this.eventLogRepo.findByOrderIdSince(orderId, sinceDate);
            } else {
                logs = await this.eventLogRepo.findAllByOrderId(orderId);
            }

            return res.json({
                ok: true,
                order_id: orderId,
                events: logs.map((log) => ({
                    stage: log.stage,
                    order_status: log.order_status,
                    mint_status: log.mint_status,
                    tx_hash: log.tx_hash,
                    block_number: log.block_number,
                    confirmations: log.confirmations,
                    message: log.message,
                    error: log.error,
                    emitted_at: log.emitted_at.toISOString(),
                })),
            });
        } catch (error) {
            return res.status(500).json({ ok: false, reason: String(error) });
        }
    };
}