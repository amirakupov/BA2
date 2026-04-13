"use client";
import dynamic from "next/dynamic";

const PurchasePage = dynamic(
    () => import("@/src/features/order/components/PurchasePage"),
    { ssr: false }
);

export default function PurchasePageClient() {
    return <PurchasePage />;
}