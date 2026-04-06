import { createAuth } from "thirdweb/auth";
import { createThirdwebClient } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { ADMIN_PRIVATE_KEY, DOMAIN, THIRDWEB_SECRET_KEY } from "../config/config.js";

const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY! });

const adminAccount = privateKeyToAccount({
    client,
    privateKey: ADMIN_PRIVATE_KEY!,
});

export const thirdwebAuth = createAuth({
    domain: DOMAIN!,
    adminAccount,
    client,
});
