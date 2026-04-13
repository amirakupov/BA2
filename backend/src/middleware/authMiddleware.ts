import type { Request, Response, NextFunction } from "express";
import { thirdwebAuth } from "../infra/auth/thirdwebAuth.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const jwt = req.cookies?.jwt as string | undefined;
    if (!jwt) {
        return res.status(401).json({ ok: false, reason: "Not authenticated" });
    }

    const { valid, parsedJWT } = await thirdwebAuth.verifyJWT({ jwt });
    if (!valid || !parsedJWT) {
        return res.status(401).json({ ok: false, reason: "Invalid session" });
    }

    req.user = { address: parsedJWT.sub };
    next();
}

declare global {
    namespace Express {
        interface Request {
            user?: { address: string };
        }
    }
}
