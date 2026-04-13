import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "node:path";
import { OrderRepository } from "../../repo/OrderRepository.js";
import { MintRepository } from "../../repo/MintRepository.js";
import {MintEventsBus} from "../../services/MintEventBus.js";

const PROTO_PATH = path.resolve("src/infra/grpc/proto/mint-status.proto");

export class GrpcServer {
    constructor(
        private readonly eventsBus: MintEventsBus,
        private readonly ordersRepo: OrderRepository,
        private readonly mintsRepo: MintRepository
    ) {}

    start(port: number) {
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });

        const proto = grpc.loadPackageDefinition(packageDefinition) as any;

        const server = new grpc.Server();

        server.addService(proto.mintstatus.MintStatusService.service, {
            WatchMintStatus: this.watchMintStatus.bind(this),
        });

        server.bindAsync(
            `0.0.0.0:${port}`,
            grpc.ServerCredentials.createInsecure(),
            (err) => {
                if (err) throw err;
                server.start();
                console.log(`gRPC stream server started on ${port}`);
            }
        );
    }

    private async watchMintStatus(call: any) {
        const orderId = Number(call.request.order_id);
        const wallet = String(call.request.wallet || "").trim();

        const order = await this.ordersRepo.findById(orderId);
        if (!order || order.wallet.toLowerCase() !== wallet.toLowerCase()) {
            call.destroy({
                code: grpc.status.PERMISSION_DENIED,
                details: "Invalid order or wallet",
            } as any);
            return;
        }

        const mint = await this.mintsRepo.findByOrderId(orderId);

        call.write({
            stage: "CONNECTED",
            order_status: order.status,
            mint_status: mint?.status || "",
            tx_hash: mint?.tx_hash || "",
            block_number: mint?.block_number || 0,
            confirmations: mint?.confirmations || 0,
            message: "Stream connected",
            error: "",
            emitted_at: new Date().toISOString(),
        });

        const isTerminal =
            order.status === "FULFILLED" ||
            mint?.status === "CONFIRMED" ||
            mint?.status === "FAILED";

        if (isTerminal) {
            call.end();
            return;
        }

        const listener = (event: any) => {
            call.write({
                stage: event.stage || "",
                order_status: event.order_status || "",
                mint_status: event.mint_status || "",
                tx_hash: event.tx_hash || "",
                block_number: event.block_number || 0,
                confirmations: event.confirmations || 0,
                message: event.message || "",
                error: event.error || "",
                emitted_at: event.emitted_at || new Date().toISOString(),
            });
            if (event.stage === "TX_CONFIRMED" || event.stage === "MINT_FAILED") {
                this.eventsBus.unsubscribe(orderId, listener);
                call.end();
            }
        };

        this.eventsBus.subscribe(orderId, listener);

        call.on("cancelled", () => {
            this.eventsBus.unsubscribe(orderId, listener);
        });

        call.on("close", () => {
            this.eventsBus.unsubscribe(orderId, listener);
        });

        call.on("error", () => {
            this.eventsBus.unsubscribe(orderId, listener);
        });
    }
}