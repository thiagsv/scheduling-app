import { db } from "../db/database"

export interface Shift {
    id: number
    start_time: string
    end_time: string
    employee_id: number | null
    employee_name?: string
}

export const create = (startTime: string, endTime: string, employeeId?: number | null) => {
    const stmt = db.prepare(`
        INSERT INTO shifts (start_time, end_time, employee_id)
        VALUES (?, ?, ?)
    `)

    const result = stmt.run(startTime, endTime, employeeId ?? null)

    return {
        id: result.lastInsertRowid as number,
        startTime,
        endTime,
        employeeId: employeeId ?? null,
    }
}

export const findByEmployeeId = (employeeId: number): Shift[] => {
    const stmt = db.prepare(`
        SELECT * FROM shifts WHERE employee_id = ?
    `)

    return stmt.all(employeeId) as Shift[]
}

export const listAll = (): Shift[] => {
    const stmt = db.prepare(`
        SELECT s.*, e.name as employee_name
        FROM shifts s
        LEFT JOIN employees e ON s.employee_id = e.id
    `)

    return stmt.all() as Shift[]
}
