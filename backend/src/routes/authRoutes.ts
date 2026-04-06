import { Router, type Request, type Response } from "express";
import { thirdwebAuth } from "../infra/auth/thirdwebAuth.js";

export function buildAuthRouter(): Router {
    const router = Router();

    router.get("/payload", async (req: Request, res: Response) => {
        try {
            const address = String(req.query.address || "").trim();
            if (!address) {
                return res.status(400).json({ ok: false, reason: "Missing address" });
            }
            const payload = await thirdwebAuth.generatePayload({ address });
            return res.json(payload);
        } catch (error) {
            return res.status(500).json({ ok: false, reason: String(error) });
        }
    });

    router.post("/login", async (req: Request, res: Response) => {
        try {
            const { payload, signature } = req.body;
            if (!payload || !signature) {
                return res.status(400).json({ ok: false, reason: "Missing payload or signature" });
            }

            const result = await thirdwebAuth.verifyPayload({ payload, signature });
            if (!result.valid) {
                return res.status(401).json({ ok: false, reason: result.error });
            }

            const jwt = await thirdwebAuth.generateJWT({ payload: result.payload });

            res.cookie("jwt", jwt, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.json({ ok: true, address: result.payload.sub });
        } catch (error) {
            return res.status(500).json({ ok: false, reason: String(error) });
        }
    });

    router.get("/me", async (req: Request, res: Response) => {
        try {
            const jwt = req.cookies?.jwt as string | undefined;
            if (!jwt) return res.status(401).json({ ok: false });

            const { valid, parsedJWT } = await thirdwebAuth.verifyJWT({ jwt });
            if (!valid || !parsedJWT) return res.status(401).json({ ok: false });

            return res.json({ ok: true, address: parsedJWT.sub });
        } catch {
            return res.status(401).json({ ok: false });
        }
    });

    router.post("/logout", (_req: Request, res: Response) => {
        res.clearCookie("jwt");
        return res.json({ ok: true });
    });

    return router;
}
