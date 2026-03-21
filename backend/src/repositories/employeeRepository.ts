import { db } from "../db/database"

export const createEmployee = (name: string, role: string) => {
    const stmt = db.prepare(`
        INSERT INTO employees (name, role)
        VALUES (?, ?)
    `)

    const result = stmt.run(name, role)

    return {
        id: result.lastInsertRowid,
        name,
        role,
    }
}

export const getEmployee = (id: number) => {
    const stmt = db.prepare(`
        SELECT * FROM employees WHERE id = ?
    `)

    const result = stmt.get(id)

    return result
}

export const listAll = () => {
    const stmt = db.prepare(`
        SELECT * FROM employees
    `)

    return stmt.all()
}

export const updateEmployee = (id: number, name: string, role: string) => {
    const stmt = db.prepare(`
        UPDATE employees SET name = ?, role = ? WHERE id = ?
    `)
    const result = stmt.run(name, role, id)
    if (result.changes === 0) return null;
    return { id, name, role }
}