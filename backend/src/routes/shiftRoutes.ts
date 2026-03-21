import { Router } from "express"
import { create, list } from "../controllers/shiftController"

const router = Router()

router.post("/shifts", create)
router.get("/shifts", list)

export default router
