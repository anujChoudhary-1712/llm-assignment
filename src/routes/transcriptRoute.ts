import { Router } from "express";
import { processTranscript } from "../controllers/transcriptcontroller";

const router = Router();

router.post("/process-video", processTranscript);

export default router;
