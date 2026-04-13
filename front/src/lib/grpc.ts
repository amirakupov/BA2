"use client";

import { createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";

import { MintStatusService } from "@/src/gen/mint-status_pb";

export const grpcBaseUrl = "http://localhost:8080";

export const transport = createGrpcWebTransport({
    baseUrl: grpcBaseUrl,
});

export const mintStatusClient = createClient(MintStatusService, transport);