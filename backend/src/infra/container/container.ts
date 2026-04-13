import {OrderRepository} from "../../repo/OrderRepository.js";
import {MintRepository} from "../../repo/MintRepository.js";
import {EventLogRepository} from "../../repo/EventLogRepository.js";
import {Minter} from "../../services/Minter.js";
import {PaymentService} from "../../services/PaymentService.js";
import {ClaimService} from "../../services/ClaimService.js";
import {PaymentController} from "../../controllers/PaymentController.js";
import {ClaimController} from "../../controllers/ClaimController.js";
import {MintTrackerService} from "../../services/MintTrackerService.js";
import {MintEventsBus} from "../../services/MintEventBus.js";
import {GrpcServer} from "../grpc/grpcServer.js";
import {OrderStatusController} from "../../controllers/OrderStatusController.js";
import {MockPaymentsClient} from "../../services/clients/MockPaymentsClient.js";

export function container(){
    const ordersRepo = new OrderRepository();
    const mintsRepo = new MintRepository();
    const eventLogRepo = new EventLogRepository();
    const minter = new Minter();
    const eventsBus = new MintEventsBus(eventLogRepo);
    const tracker = new MintTrackerService(ordersRepo, mintsRepo, minter, eventsBus);
    const mockPayment = new MockPaymentsClient()

    const paymentService = new PaymentService(ordersRepo, mockPayment);
    const claimService = new ClaimService(ordersRepo, mintsRepo, minter, tracker, eventsBus);

    const grpcServer = new GrpcServer(eventsBus, ordersRepo, mintsRepo);

    return{
        paymentController: new PaymentController(paymentService),
        claimController: new ClaimController(claimService),
        orderStatusController: new OrderStatusController(ordersRepo, mintsRepo, eventLogRepo),
        ordersRepo,
        mintsRepo,
        grpcServer,
    }
}