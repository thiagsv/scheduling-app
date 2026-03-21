import { Router } from "express"
import { list } from "../controllers/shiftController"

const router = Router()

router.get("/shifts", list)

export default router
