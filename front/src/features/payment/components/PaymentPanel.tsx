import { api } from "@/src/lib/api";

type Props = {
    wallet: string;
    onPaymentCreated: (orderId: number) => void;
};

export default function PaymentPanel({ wallet, onPaymentCreated }: Props) {
    async function handleBuy() {
        const { orderId, invoiceUrl } = await api.createPayment({ wallet });
        onPaymentCreated(orderId);
    }
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <h2>Purchase Item</h2>
            <button onClick={handleBuy} style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}>
                Buy for USDC
            </button>
        </div>
    );
}
