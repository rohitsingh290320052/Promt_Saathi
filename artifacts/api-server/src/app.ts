import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());

app.use(
  "/api/transcribe",
  express.raw({
    type: ["audio/*", "application/octet-stream"],
    limit: "50mb",
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "PromtSaathi API",
  });
});

// Health endpoint for Railway
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
  });
});

// Optional API root
app.get("/api", (_req, res) => {
  res.status(200).json({
    message: "PromtSaathi API is running",
  });
});

app.use("/api", router);

export default app;