import { OrderRepository } from "../repo/OrderRepository.js";
import { MintRepository } from "../repo/MintRepository.js";
import { Minter } from "./Minter.js";
import { MintTrackerService } from "./MintTrackerService.js";
import {OrderStatus} from "../enums/OrderStatus.js";
import {MintStatus} from "../enums/MintStatus.js";
import {MintEventsBus} from "./MintEventBus.js";

export class ClaimService {
    private readonly ordersRepo: OrderRepository;
    private readonly mintsRepo: MintRepository;
    private readonly minter: Minter;
    private readonly tracker: MintTrackerService;
    private readonly eventsBus: MintEventsBus;

    constructor(
        ordersRepo: OrderRepository,
        mintsRepo: MintRepository,
        minter: Minter,
        tracker: MintTrackerService,
        eventsBus: MintEventsBus
    ) {
        this.ordersRepo = ordersRepo;
        this.mintsRepo = mintsRepo;
        this.minter = minter;
        this.tracker = tracker;
        this.eventsBus = eventsBus;
    }

    async claim(orderId: number, wallet: string) {
        const order = await this.ordersRepo.findById(orderId);
        if (!order) throw new Error("Order not found");

        if (order.wallet.toLowerCase() !== wallet.toLowerCase()) {
            throw new Error("Wallet mismatch");
        }

        const existing = await this.mintsRepo.findByOrderId(orderId);
        const isRetryAfterFailure = existing?.status === MintStatus.FAILED;
        if (existing && !isRetryAfterFailure) {
            return {
                ok: true,
                tx_hash: existing.tx_hash,
                mint_status: existing.status,
            };
        }

        const locked = await this.ordersRepo.markMintingIfClaimable(orderId);
        if (!locked) {
            throw new Error("Order not claimable or already being minted");
        }

        try {
            const txHash = await this.minter.submitMint(
                order.wallet,
                order.token_id,
                order.quantity
            );

            if (isRetryAfterFailure) {
                await this.mintsRepo.updateByOrderId(orderId, {
                    tx_hash: txHash,
                    status: MintStatus.TX_SUBMITTED,
                    submitted_at: new Date(),
                });
            } else {
                await this.mintsRepo.create({
                    order_id: orderId,
                    tx_hash: txHash,
                    status: MintStatus.TX_SUBMITTED,
                    submitted_at: new Date(),
                });
            }

            await this.eventsBus.publish(orderId, {
                stage: "TX_SUBMITTED",
                order_status: OrderStatus.MINTING,
                mint_status: MintStatus.TX_SUBMITTED,
                tx_hash: txHash,
                confirmations: 0,
                block_number: 0,
                message: "Transaction submitted",
                error: "",
            });

            void this.tracker.track(orderId, txHash);

            return {
                ok: true,
                tx_hash: txHash,
                mint_status: MintStatus.TX_SUBMITTED,
            };
        } catch (error) {
            await this.ordersRepo.updateById(orderId, {
                status: OrderStatus.CLAIMABLE,
            });

            if (existing) {
                await this.mintsRepo.updateByOrderId(orderId, {
                    tx_hash: "0x",
                    status: MintStatus.FAILED,
                    error: String(error),
                });
            } else {
                await this.mintsRepo.create({
                    order_id: orderId,
                    tx_hash: "0x",
                    status: MintStatus.FAILED,
                    error: String(error),
                });
            }
            throw error;
        }
    }
}
