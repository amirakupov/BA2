import express from 'express';
import cookieParser from "cookie-parser";
import {HOST, NODE_ENV, PORT} from "./infra/config/config.js";
import connectDB from "./infra/db/connectDB.js";
import cors from "cors";
import {buildRouter} from "./routes/apiRoutes.js";
import {buildAuthRouter} from "./routes/authRoutes.js";
import {container} from "./infra/container/container.js";
const app = express();
const appContainer = container();

app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // нужно для передачи cookie
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", buildAuthRouter());
app.use("/api", buildRouter(appContainer));

await connectDB();

appContainer.grpcServer.start(50051);

app.listen(PORT, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
    console.log(`Node environment: ${NODE_ENV}`);
    console.log(`gRPC stream server started on localhost:50051`);
});