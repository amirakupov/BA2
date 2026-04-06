import { MintRepository } from "../repo/MintRepository.js";
import { OrderRepository } from "../repo/OrderRepository.js";
import { NaturoMinter } from "./NaturoMinter.js";
import { MintStatus } from "../enums/MintStatus.js";
import { OrderStatus } from "../enums/OrderStatus.js";
import { MintEventsBus } from "./MintEventBus.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MintTrackerService {
    constructor(
        private readonly ordersRepo: OrderRepository,
        private readonly mintsRepo: MintRepository,
        private readonly minter: NaturoMinter,
        private readonly eventsBus: MintEventsBus
    ) {}

    async track(orderId: number, txHash: string) {
        const pollIntervalMs = 2000;
        const maxAttempts = 60;

        try {
            await this.mintsRepo.updateByOrderId(orderId, {
                status: MintStatus.TX_PENDING,
            });

            this.eventsBus.publish(orderId, {
                stage: "TX_PENDING",
                order_status: OrderStatus.MINTING,
                mint_status: MintStatus.TX_PENDING,
                confirmations: 0,
                block_number: 0,
                tx_hash: txHash,
                message: "Waiting for blockchain confirmation",
                error: "",
            });

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const startedAt = Date.now();
                    const receipt = await this.minter.getReceipt(txHash);
                    const durationMs = Date.now() - startedAt;

                    if (durationMs > 3000) {
                        this.eventsBus.publish(orderId, {
                            stage: "RPC_DELAY",
                            order_status: OrderStatus.MINTING,
                            mint_status: MintStatus.TX_PENDING,
                            confirmations: 0,
                            block_number: 0,
                            tx_hash: txHash,
                            message: `Slow RPC response: ${durationMs} ms`,
                            error: "",
                        });
                    }

                    if (!receipt) {
                        this.eventsBus.publish(orderId, {
                            stage: "TX_PENDING",
                            order_status: OrderStatus.MINTING,
                            mint_status: MintStatus.TX_PENDING,
                            confirmations: 0,
                            block_number: 0,
                            tx_hash: txHash,
                            message: `Transaction still pending (attempt ${attempt})`,
                            error: "",
                        });

                        await sleep(pollIntervalMs);
                        continue;
                    }

                    if (receipt.status !== 1) {
                        await this.mintsRepo.updateByOrderId(orderId, {
                            status: MintStatus.FAILED,
                            error: "Transaction reverted",
                        });

                        await this.ordersRepo.updateById(orderId, {
                            status: OrderStatus.CLAIMABLE,
                        });

                        this.eventsBus.publish(orderId, {
                            stage: "MINT_FAILED",
                            order_status: OrderStatus.CLAIMABLE,
                            mint_status: MintStatus.FAILED,
                            confirmations: 0,
                            block_number: receipt.blockNumber ?? 0,
                            tx_hash: txHash,
                            message: "Transaction reverted",
                            error: "Transaction reverted",
                        });

                        return;
                    }

                    const confirmations = await this.minter.getConfirmations(txHash);

                    await this.mintsRepo.updateByOrderId(orderId, {
                        status: MintStatus.CONFIRMED,
                        block_number: receipt.blockNumber,
                        confirmations,
                        confirmed_at: new Date(),
                    });

                    await this.ordersRepo.updateById(orderId, {
                        status: OrderStatus.FULFILLED,
                    });

                    this.eventsBus.publish(orderId, {
                        stage: "TX_CONFIRMED",
                        order_status: OrderStatus.FULFILLED,
                        mint_status: MintStatus.CONFIRMED,
                        tx_hash: txHash,
                        block_number: receipt.blockNumber ?? 0,
                        confirmations,
                        message: "NFT minted successfully",
                        error: "",
                    });

                    return;
                } catch (rpcError: any) {
                    const msg = String(rpcError?.message || rpcError || "");
                    const lower = msg.toLowerCase();

                    let stage = "RPC_ERROR";

                    if (lower.includes("timeout")) {
                        stage = "RPC_TIMEOUT";
                    } else if (lower.includes("429") || lower.includes("rate")) {
                        stage = "RPC_RATE_LIMIT";
                    } else if (
                        lower.includes("network") ||
                        lower.includes("socket") ||
                        lower.includes("connect") ||
                        lower.includes("econnreset") ||
                        lower.includes("unavailable")
                    ) {
                        stage = "RPC_UNAVAILABLE";
                    }

                    this.eventsBus.publish(orderId, {
                        stage,
                        order_status: OrderStatus.MINTING,
                        mint_status: MintStatus.TX_PENDING,
                        confirmations: 0,
                        block_number: 0,
                        tx_hash: txHash,
                        message: `RPC problem while checking transaction status (attempt ${attempt})`,
                        error: msg,
                    });

                    await sleep(pollIntervalMs);
                }
            }

            await this.mintsRepo.updateByOrderId(orderId, {
                status: MintStatus.FAILED,
                error: "Tracking timeout: confirmation not observed in time",
            });

            await this.ordersRepo.updateById(orderId, {
                status: OrderStatus.CLAIMABLE,
            });

            this.eventsBus.publish(orderId, {
                stage: "MINT_FAILED",
                order_status: OrderStatus.CLAIMABLE,
                mint_status: MintStatus.FAILED,
                confirmations: 0,
                block_number: 0,
                tx_hash: txHash,
                message: "Tracking timeout",
                error: "Tracking timeout: confirmation not observed in time",
            });
        } catch (error) {
            await this.mintsRepo.updateByOrderId(orderId, {
                status: MintStatus.FAILED,
                error: String(error),
            });

            await this.ordersRepo.updateById(orderId, {
                status: OrderStatus.CLAIMABLE,
            });

            this.eventsBus.publish(orderId, {
                stage: "MINT_FAILED",
                order_status: OrderStatus.CLAIMABLE,
                mint_status: MintStatus.FAILED,
                confirmations: 0,
                block_number: 0,
                tx_hash: txHash,
                message: "Mint tracking failed",
                error: String(error),
            });
        }
    }
}