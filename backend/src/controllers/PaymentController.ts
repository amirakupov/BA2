import {PaymentService} from "../services/PaymentService.js";
import type { Request, Response } from "express";

export class PaymentController {

    private readonly paymentService: PaymentService;

    constructor(paymentService: PaymentService){
        this.paymentService = paymentService;
    }

    public createPayment = async (req: Request, res: Response) =>
    {
        try {
            const dto = req.body;
            const result = await this.paymentService.executePayment(dto);
            return res.json(result);
        } catch (error) {
            console.log("Error at payment creation: ", error);
            return res.status(400).json({ok: false, reason: String(error)});
        }
    }
}