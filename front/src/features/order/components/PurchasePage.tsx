"use client";

import { useActiveAccount } from "thirdweb/react";
import ConnectScreen from "@/src/features/wallet/components/ConnectScreen";
import PhaseSelectPage from "@/src/features/order/components/PhaseSelectPage";

export default function PurchasePage() {
    const account = useActiveAccount();

    if (!account) return <ConnectScreen />;

    return (
        <PhaseSelectPage/>
    );
}


