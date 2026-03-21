import { createEmployee, getEmployee, listAll } from "../repositories/employeeRepository"

export const create = (name: string) => {
    if (!name) {
        throw new Error("Name is required")
    }

    return createEmployee(name)
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