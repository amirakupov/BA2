import {PaymentService} from "../services/PaymentService.js";
import type { Request, Response } from "express";
import {PhaseService} from "../services/PhaseService.js";

export class PaymentController {

    private readonly paymentService: PaymentService;
    private readonly phaseService: PhaseService;

    constructor(paymentService: PaymentService, phaseService: PhaseService){
        this.paymentService = paymentService;
        this.phaseService = phaseService;
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
    };
    public getNftPhases = async (req: Request, res: Response) => {
        try {
            const getPhases = await this.phaseService.getAllPhases();
            return res.json({ok: true, phases: getPhases});
        }catch(error){
            console.log("Error at get phases: ", error);
            return res.status(400).json({ok: false, reason: String(error)});
        }
    }
}