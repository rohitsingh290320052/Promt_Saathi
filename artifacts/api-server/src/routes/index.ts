import { Router, type IRouter } from "express";
import healthRouter from "./health";
import promptsRouter from "./prompts";
import openaiRouter from "./openai";
import agentsRouter from "./agents";
import transcribeRouter from "./transcribe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(promptsRouter);
router.use(openaiRouter);
router.use(agentsRouter);
router.use(transcribeRouter);

export default router;
