import { Request, Response } from "express"
import * as shiftRepository from "../repositories/shiftRepository"

export const list = (req: Request, res: Response) => {
    try {
        const shifts = shiftRepository.listAll()

        const normalizedShifts = shifts.map(shift => ({
            id: shift.id,
            day: shift.day,
            role: shift.role,
            employeeId: shift.employee_id,
            employeeName: shift.employee_name
        }))

        res.status(200).json(normalizedShifts)
    } catch (error: any) {
        res.status(400).json({ error: error.message })
    }
}
