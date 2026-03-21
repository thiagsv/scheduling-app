import { Router } from "express"
import { createEmployee, getEmployee, listEmployees, updateEmployee } from "../controllers/employeeController"

const router = Router()

router.post("/employees", createEmployee)
router.get("/employees", listEmployees)
router.get("/employees/:id", getEmployee)
router.put("/employees/:id", updateEmployee)
router.patch("/employees/:id", updateEmployee)

export default router