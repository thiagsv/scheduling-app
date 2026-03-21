import { Router } from "express";
import { handleCommand } from "../controllers/commandController";

const router = Router();

router.post("/command", handleCommand);

export default router;
