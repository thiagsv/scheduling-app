import { Router } from "express"
import { createEmployee, getEmployee, listEmployees } from "../controllers/employeeController"

const router = Router()

router.post("/employees", createEmployee)
router.get("/employees", listEmployees)
router.get("/employees/:id", getEmployee)

export default router