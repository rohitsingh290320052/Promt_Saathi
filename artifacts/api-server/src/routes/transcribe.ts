import { Router, type IRouter } from "express";
import { speechToText, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

router.post("/transcribe", async (req, res): Promise<void> => {
  if (!req.body || !Buffer.isBuffer(req.body)) {
    res.status(400).json({ error: "Expected raw audio bytes in request body" });
    return;
  }

  const audioBuffer: Buffer = req.body as Buffer;

  if (audioBuffer.length === 0) {
    res.status(400).json({ error: "Empty audio buffer" });
    return;
  }

  const { buffer, format } = await ensureCompatibleFormat(audioBuffer);
  const text = await speechToText(buffer, format);
  res.json({ text });
});

export default router;
