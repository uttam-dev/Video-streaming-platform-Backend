import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "..", "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//routes
import { errorHandler } from "./middlewares/error.middleware.js";
import userRoute from "./routes/user.routes.js";
import videoRoute from "./routes/video.routes.js";
import tweetRoute from "./routes/tweet.routes.js";
import subscriptionRoute from "./routes/subscription.routes.js";
import playlistRoute from "./routes/playlist.routes.js";

app.use("/user", userRoute);

app.use("/api/v1/user", userRoute);
app.use("/api/v1/video", videoRoute);
app.use("/api/v1/tweet", tweetRoute);
app.use("/api/v1/subscription", subscriptionRoute);
app.use("/api/v1/playlist", playlistRoute);

// app.use(errorHandler);
export default app;
