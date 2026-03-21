import { Router } from "express";
import { getSchedule } from "../services/scheduleService";

const router = Router();

router.get("/schedule", (req, res) => {
    try {
        const schedule = getSchedule();
        res.status(200).json(schedule);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
