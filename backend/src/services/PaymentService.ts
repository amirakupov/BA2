import {OrderRepository} from "../repo/OrderRepository.js";
import {NOWPAYMENTS_IPN_URL} from "../infra/config/config.js";
import {PaymentRequestDto} from "../dto/PaymentRequestDto.js";
import {PaymentResponseDto} from "../dto/PaymentResponseDto.js";
import {MockPaymentsClient} from "./clients/MockPaymentsClient.js";

export class PaymentService {
    private readonly orderRepository: OrderRepository;
    private readonly np: MockPaymentsClient;
    constructor(orderRepository: OrderRepository, np: MockPaymentsClient) {
        this.orderRepository = orderRepository;
        this.np = np;
    }

    public async executePayment(req: PaymentRequestDto): Promise<PaymentResponseDto> {
        if (req.pay_currency.toLowerCase() !== "usdc") {
            throw new Error("Only USDC payments are allowed");
        }
        const quantity = req.quantity && req.quantity > 0 ? req.quantity : 1;
        const order = await this.orderRepository.create({
            wallet: req.wallet,
            token_id: req.token_id,
            quantity,
            expected_amount: req.price_amount,
            status: "CREATED",
        });
        const ipnCallback = NOWPAYMENTS_IPN_URL!;
        const body = {
            price_amount: req.price_amount,
            price_currency: req.price_currency,
            pay_currency: req.pay_currency,
            order_id: order.id,
            order_description: `Order ${order.id} token=${req.token_id} qty=${quantity}`,
            ipn_callback_url: ipnCallback,
        };
        const raw = await this.np.createPayment(body);
        const paymentId = raw?.payment_id;

        if (!paymentId) throw new Error("NOWPayments response missing payment_id");

        await this.orderRepository.updateById(order.id, {
            nowpayments_payment_id: String(paymentId),
            status: "INVOICE_CREATED",
        });

        return {
            payment_id: String(paymentId),
            payment_status: raw?.payment_status,
            payment_url: raw.payment_url,
        };
    }
}