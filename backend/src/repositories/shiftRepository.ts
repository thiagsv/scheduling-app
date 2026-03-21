import { db } from "../db/database"

export interface Shift {
    id: number
    day: string
    role: string
    employee_id: number | null
    employee_name?: string
}

export const clearDay = (day: string) => {
    const stmt = db.prepare(`DELETE FROM shifts WHERE day = ?`)
    return stmt.run(day)
}

export const createEmptySlot = (day: string, role: string) => {
    const stmt = db.prepare(`
        INSERT INTO shifts (day, role, employee_id)
        VALUES (?, ?, NULL)
    `)
    return stmt.run(day, role)
}

export const assignShift = (shiftId: number, employeeId: number | null) => {
    const stmt = db.prepare(`
        UPDATE shifts SET employee_id = ? WHERE id = ?
    `)
    return stmt.run(employeeId, shiftId)
}

export const listAll = (): Shift[] => {
    const stmt = db.prepare(`
        SELECT s.*, e.name as employee_name
        FROM shifts s
        LEFT JOIN employees e ON s.employee_id = e.id
    `)
    return stmt.all() as Shift[]
}
