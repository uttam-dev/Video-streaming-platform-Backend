import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
console.log(import.meta.url);
console.log(__filename);

const __dirname = path.dirname(__filename);
console.log(__dirname);

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

app.use(express.static(path.join(__dirname, "..", "public"))); // Corrected path for static files

app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

//routes
import userRoute from "./routes/user.routes.js";
import { log } from "console";
app.use("/user", userRoute);
app.use("/api/v1/user", userRoute);

export default app;
