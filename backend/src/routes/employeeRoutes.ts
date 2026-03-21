import { Router } from "express"
import { listEmployees } from "../controllers/employeeController"

const router = Router()

router.get("/employees", listEmployees)

export default router