import { createEmployee, getEmployee, listAll } from "../repositories/employeeRepository"

export const create = (name: string, role: string) => {
    if (!name) {
        throw new Error("Name is required")
    }
    if (!role) {
        throw new Error("Role is required")
    }

    return createEmployee(name, role)
}

export const get = (id: number) => {
    if (!id) {
        throw new Error("Id is required")
    }

    return getEmployee(id)
}

export const list = () => {
    return listAll()
}