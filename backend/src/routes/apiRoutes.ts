import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";

export function buildRouter(appContainer: any) {
    const router = Router();

    const {
        paymentController,
        claimController,
        orderStatusController,
        ordersRepo,
    } = appContainer;

    router.post("/create-payment", requireAuth, paymentController.createPayment);
    router.post("/orders/:id/claim", requireAuth, claimController.claim);

    router.get("/orders/:id", requireAuth, orderStatusController.getStatus);
    router.get("/orders/:id/events", requireAuth, orderStatusController.getEvents);

    router.get("/phases", requireAuth, paymentController.getNftPhases);

    router.post("/test/orders/:id/claimable", async (req, res) => {
        const id = Number(req.params.id);
        const order = await ordersRepo.updateById(id, { status: "CLAIMABLE" });
        res.json({ ok: true, order });
    });

    router.post("/test/orders", async (req, res) => {
        const { wallet, token_id, quantity = 1, expected_amount = 0 } = req.body;
        const order = await ordersRepo.create({
            wallet,
            token_id,
            quantity,
            expected_amount,
            status: "CREATED",
        });
        res.json({ ok: true, order });
    });

    return router;
}