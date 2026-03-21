import { create, findByEmployeeId, listAll, Shift } from "../repositories/shiftRepository"
import { get as getEmployee } from "./employeeService"

export const createShift = (startTime: string, endTime: string, employeeId?: number | null) => {
    // 1. startTime must be before endTime
    if (new Date(startTime) >= new Date(endTime)) {
        throw new Error("startTime must be before endTime")
    }

    if (employeeId) {
        // 2. If employeeId is provided: Check if the employee exists
        const employee = getEmployee(employeeId)
        if (!employee) {
            throw new Error(`Employee with ID ${employeeId} not found`)
        }

        // 3. Prevent overlapping shifts for the same employee
        const existingShifts = findByEmployeeId(employeeId)
        const newStart = new Date(startTime).getTime()
        const newEnd = new Date(endTime).getTime()

        const hasOverlap = existingShifts.some(shift => {
            const shiftStart = new Date(shift.start_time).getTime()
            const shiftEnd = new Date(shift.end_time).getTime()
            
            // Overlap logic: existing.startTime < newEndTime AND existing.endTime > newStartTime
            return shiftStart < newEnd && shiftEnd > newStart
        })

        if (hasOverlap) {
            throw new Error("The employee already has a shift that overlaps with this time interval")
        }
    }

    // 4. Allow shifts WITHOUT employeeId (unassigned shifts)
    return create(startTime, endTime, employeeId)
}

export const listShifts = () => {
    return listAll()
}
