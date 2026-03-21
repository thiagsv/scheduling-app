import { db } from "../db/database"

export const createEmployee = (name: string) => {
    const stmt = db.prepare(`
        INSERT INTO employees (name)
        VALUES (?)
    `)

    const result = stmt.run(name)

    return {
        id: result.lastInsertRowid,
        name,
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