import { Request, Response } from "express"
import { createShift, listShifts } from "../services/shiftService"

export const create = (req: Request, res: Response) => {
    try {
        const { startTime, endTime, employeeId } = req.body

        if (!startTime || !endTime) {
            res.status(400).json({ error: "startTime and endTime are required" })
            return
        }

        const shift = createShift(startTime, endTime, employeeId)

        res.status(201).json(shift)
    } catch (error: any) {
        res.status(400).json({ error: error.message })
    }
}

export const list = (req: Request, res: Response) => {
    try {
        const shifts = listShifts()

        // Normalize to camelCase
        const normalizedShifts = shifts.map(shift => ({
            id: shift.id,
            startTime: shift.start_time,
            endTime: shift.end_time,
            employeeId: shift.employee_id,
            employeeName: shift.employee_name
        }))

        res.status(200).json(normalizedShifts)
    } catch (error: any) {
        res.status(400).json({ error: error.message })
    }
}
