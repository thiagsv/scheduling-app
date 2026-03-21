import { Request, Response } from "express"
import { create, get, list } from "../services/employeeService"

export const createEmployee = (req: Request, res: Response) => {
    try {
        const { name } = req.body

        const employee = create(name)

        res.status(201).json(employee)
    } catch (error: any) {
        res.status(400).json({ error: error.message })
    }
}

export const getEmployee = (req: Request, res: Response) => {
    try {
        const { id } = req.params

        const employee = get(Number(id))

        if (!employee) {
            res.status(404).json({ error: "Employee not found" })
            return
        }

        res.status(200).json(employee)
    } catch (error: any) {
        res.status(400).json({ error: error.message })
    }
}

export const listEmployees = (req: Request, res: Response) => {
    try {
        const employees = list()

        res.status(200).json(employees)
    } catch (error: any) {
        res.status(400).json({ error: error.message })
    }
}