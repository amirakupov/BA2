import * as dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3001;
export const HOST = process.env.HOST;
export const NODE_ENV = process.env.NODE_ENV;
export const DB_URL = process.env.DB_URL || "";

export const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
export const NOWPAYMENTS_IPN_URL = process.env.NOWPAYMENTS_IPN_URL;
export const NOWPAYMENTS_NOTIFICATION_KEY = process.env.NOWPAYMENTS_NOTIFICATION_KEY;

export const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
export const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
export const DOMAIN = process.env.DOMAIN || "localhost:3000";