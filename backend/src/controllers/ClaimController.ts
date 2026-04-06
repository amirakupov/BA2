import {ClaimService} from "../services/ClaimService.js";
import type { Request, Response } from "express";
import {isAddress} from "ethers";

export class ClaimController {
    private readonly claimService: ClaimService;
    constructor(claimService: ClaimService){
        this.claimService = claimService;
    }
    public claim = async (req: Request, res: Response) => {
        try {
            const orderId = Number(req.params.id);
            const wallet = String(req.body.wallet || "").trim();
            if (!orderId || !wallet) {
                return res.status(400).json({ok: false, reason: "Missing order id or wallet"});
            }
            if (!isAddress(wallet)) {
                return res.status(400).json({ok: false, reason: "Invalid wallet address"});
            }
            const result = await this.claimService.claim(orderId, wallet);
            return res.json(result);
        } catch (error) {
            console.log(error);
            return res.status(400).json({ok: false, reason: String(error)});
        }
    }

}