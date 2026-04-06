import {OrderRepository} from "../../repo/OrderRepository.js";
import {MintRepository} from "../../repo/MintRepository.js";
import {EventLogRepository} from "../../repo/EventLogRepository.js";
import {NaturoMinter} from "../../services/NaturoMinter.js";
import {PaymentService} from "../../services/PaymentService.js";
import {ClaimService} from "../../services/ClaimService.js";
import {IPNService} from "../../services/IPNService.js";
import {PaymentController} from "../../controllers/PaymentController.js";
import {ClaimController} from "../../controllers/ClaimController.js";
import {IPNHookController} from "../../controllers/IPNHookController.js";
import {NowPaymentsClient} from "../../services/clients/NowPaymentsClient.js";
import {NOWPAYMENTS_API_KEY} from "../config/config.js";
import {MintTrackerService} from "../../services/MintTrackerService.js";
import {MintEventsBus} from "../../services/MintEventBus.js";
import {GrpcServer} from "../grpc/grpcServer.js";
import {PhaseService} from "../../services/PhaseService.js";
import {OrderStatusController} from "../../controllers/OrderStatusController.js";

export function container(){
    const ordersRepo = new OrderRepository();
    const mintsRepo = new MintRepository();
    const eventLogRepo = new EventLogRepository();
    const minter = new NaturoMinter();
    const np = new NowPaymentsClient(NOWPAYMENTS_API_KEY!);
    const eventsBus = new MintEventsBus(eventLogRepo);
    const tracker = new MintTrackerService(ordersRepo, mintsRepo, minter, eventsBus);

    const paymentService = new PaymentService(ordersRepo, np);
    const phaseService = new PhaseService(minter);
    const claimService = new ClaimService(ordersRepo, mintsRepo, minter, tracker, eventsBus);
    const ipnService = new IPNService(ordersRepo);

    const grpcServer = new GrpcServer(eventsBus, ordersRepo, mintsRepo);

    return{
        paymentController: new PaymentController(paymentService, phaseService),
        claimController: new ClaimController(claimService),
        ipnHookController: new IPNHookController(ipnService),
        orderStatusController: new OrderStatusController(ordersRepo, mintsRepo, eventLogRepo),
        ordersRepo,
        mintsRepo,
        grpcServer,
    }
}