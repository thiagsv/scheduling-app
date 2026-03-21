import { Request, Response } from "express"
import { list } from "../services/employeeService"

export const listEmployees = (req: Request, res: Response) => {
    try {
        const employees = list()
        res.status(200).json(employees)
    } catch (error: any) {
        res.status(400).json({ error: error.message })
    }
}