import { EventEmitter } from "node:events";
import { EventLogRepository } from "../repo/EventLogRepository.js";

export interface MintEventPayload {
    stage: string;
    order_status?: string;
    mint_status?: string;
    tx_hash?: string;
    block_number?: number;
    confirmations?: number;
    message?: string;
    error?: string;
}

export class MintEventsBus {
    private readonly emitter = new EventEmitter();

    constructor(private readonly eventLogRepo: EventLogRepository) {}

    publish(orderId: number, event: MintEventPayload) {
        const emitted_at = new Date();

        this.eventLogRepo
            .create({
                order_id: orderId,
                stage: event.stage,
                order_status: event.order_status ?? "",
                mint_status: event.mint_status ?? "",
                tx_hash: event.tx_hash ?? "",
                block_number: event.block_number ?? 0,
                confirmations: event.confirmations ?? 0,
                message: event.message ?? "",
                error: event.error ?? "",
                emitted_at,
            })
            .catch((err) => console.error("EventLog write failed:", err));

        const fullEvent = { ...event, emitted_at: emitted_at.toISOString() };
        console.log("Publishing event for orderId", orderId, fullEvent);
        this.emitter.emit(`mint:${orderId}`, fullEvent);
    }

    subscribe(orderId: number, listener: (event: any) => void) {
        console.log("Subscribe event for orderId", orderId);
        this.emitter.on(`mint:${orderId}`, listener);
    }

    unsubscribe(orderId: number, listener: (event: any) => void) {
        console.log("Unsubscribe event for orderId", orderId);
        this.emitter.off(`mint:${orderId}`, listener);
    }
}