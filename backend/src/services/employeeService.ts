import { createEmployee, getEmployee, listAll, updateEmployee } from "../repositories/employeeRepository"

export const create = (name: string, role: string) => {
    if (!name) throw new Error("Name is required")
    if (!role) throw new Error("Role is required")
    return createEmployee(name, role)
}

export const get = (id: number) => {
    if (!id) throw new Error("Id is required")
    return getEmployee(id)
}

export const list = () => listAll()

export const update = (id: number, data: { name?: string, role?: string }) => {
    const existing = getEmployee(id) as any;
    if (!existing) throw new Error("Employee not found");

    const newName = data.name ?? existing.name;
    const newRole = data.role ?? existing.role;

    return updateEmployee(id, newName, newRole);
}