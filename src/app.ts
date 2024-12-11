import express from "express";
import bodyParser from "body-parser";
import transcriptRoutes from "./routes/transcriptRoute"; // Relative path for route import
import OpenAI from "openai";

export const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/transcript", transcriptRoutes);
