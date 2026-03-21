import { db } from "../db/database";
import { Command, Employee, Shift, Assignment } from "../types";
import { ScheduleEngine } from "./ScheduleEngine";

const engine = new ScheduleEngine();

export const executeCommand = (command: Command) => {
    switch (command.intent) {
        case "create_schedule": {
            db.prepare(`DELETE FROM shifts WHERE day = ?`).run(command.day);
            const insert = db.prepare(`INSERT INTO shifts (day, role, employee_id) VALUES (?, ?, NULL)`);
            for (const r of command.roles) {
                for (let i = 0; i < r.count; i++) {
                    insert.run(command.day, r.role);
                }
            }
            break;
        }
        case "assign": {
            const emp = db.prepare(`SELECT * FROM employees WHERE name = ? COLLATE NOCASE`).get(command.employee) as any;
            if (!emp) throw new Error("Employee not found for assignment");

            const allShifts = db.prepare(`SELECT id, role, day, employee_id FROM shifts`).all() as (Shift & { employee_id: number | null })[];
            
            const assignToDay = (day: string) => {
                const currentAssignments: Assignment[] = allShifts
                    .filter(s => s.employee_id !== null)
                    .map(s => ({ employeeId: s.employee_id!, shiftId: s.id }));

                // Prevent double booking
                if (engine.isDoubleBooked(emp.id, { day } as Shift, currentAssignments, allShifts)) {
                    return; // Skip if already booked on this day
                }

                // Try to fill an existing empty slot
                const emptySlot = allShifts.find(s => s.day === day && s.role === emp.role && s.employee_id === null);

                if (emptySlot) {
                    db.prepare(`UPDATE shifts SET employee_id = ? WHERE id = ?`).run(emp.id, emptySlot.id);
                    emptySlot.employee_id = emp.id; // Update local state for subsequent checks
                } else if (command.intent === "assign") {
                    // Only create a new slot if intent was explicitly 'assign' with a day
                    // If it was a generic 'fill John', we only fill existing slots
                    if (command.day) {
                        db.prepare(`INSERT INTO shifts (day, role, employee_id) VALUES (?, ?, ?)`).run(day, emp.role, emp.id);
                    }
                }
            };

            if (command.day) {
                assignToDay(command.day);
            } else {
                // Fill all empty slots for this employee's role across all days
                const days = [...new Set(allShifts.map(s => s.day))];
                for (const d of days) {
                    assignToDay(d);
                }
            }
            break;
        }
        case "fill_schedule": {
            const allEmployees = db.prepare(`SELECT id, role FROM employees`).all() as Employee[];
            const allShifts = db.prepare(`SELECT id, role, day, employee_id FROM shifts`).all() as (Shift & { employee_id: number | null })[];

            const currentAssignments: Assignment[] = allShifts
                .filter(s => s.employee_id !== null)
                .map(s => ({ employeeId: s.employee_id!, shiftId: s.id }));

            let shiftsToFill = command.day 
                ? allShifts.filter(s => s.day === command.day)
                : allShifts;

            if (command.role) {
                shiftsToFill = shiftsToFill.filter(s => s.role === command.role);
            }

            const newAssignments = engine.autoFill(shiftsToFill, allEmployees, currentAssignments, allShifts);

            const assign = db.prepare(`UPDATE shifts SET employee_id = ? WHERE id = ?`);

            // Apply only the new assignments
            for (const assignment of newAssignments) {
                const shift = allShifts.find(s => s.id === assignment.shiftId);
                if (shift && shift.employee_id === null) {
                    assign.run(assignment.employeeId, assignment.shiftId);
                }
            }
            break;
        }
        case "swap": {
            const fromEmp = db.prepare(`SELECT * FROM employees WHERE name = ? COLLATE NOCASE`).get(command.from) as any;
            const toEmp = db.prepare(`SELECT * FROM employees WHERE name = ? COLLATE NOCASE`).get(command.to) as any;

            if (!fromEmp || !toEmp) {
                throw new Error("Employees not found in database.");
            }

            const allShifts = db.prepare(`SELECT id, role, day, employee_id FROM shifts`).all() as (Shift & { employee_id: number | null })[];
            const currentAssignments: Assignment[] = allShifts
                .filter(s => s.employee_id !== null)
                .map(s => ({ employeeId: s.employee_id!, shiftId: s.id }));

            if (command.day) {
                const shiftToSwap = allShifts.find(s => s.day === command.day && s.employee_id === fromEmp.id);
                if (!shiftToSwap) throw new Error(`${fromEmp.name} has no shift on ${command.day}.`);

                if (toEmp.role !== shiftToSwap.role) {
                    throw new Error(`${toEmp.name} cannot work as ${shiftToSwap.role}.`);
                }

                if (engine.isDoubleBooked(toEmp.id, shiftToSwap, currentAssignments, allShifts)) {
                    throw new Error(`${toEmp.name} is already scheduled on ${command.day}.`);
                }

                db.prepare(`UPDATE shifts SET employee_id = ? WHERE id = ?`).run(toEmp.id, shiftToSwap.id);
            } else {
                const fromShifts = allShifts.filter(s => s.employee_id === fromEmp.id);
                for (const shift of fromShifts) {
                    if (toEmp.role !== shift.role) {
                        throw new Error(`${toEmp.name} cannot replace ${fromEmp.name} on ${shift.day} (${shift.role}).`);
                    }
                    if (engine.isDoubleBooked(toEmp.id, shift, currentAssignments, allShifts)) {
                        throw new Error(`${toEmp.name} is already scheduled on ${shift.day}.`);
                    }
                }
                db.prepare(`UPDATE shifts SET employee_id = ? WHERE employee_id = ?`).run(toEmp.id, fromEmp.id);
            }
            break;
        }
        case "create_employee": {
            const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.substring(1);
            db.prepare(`INSERT INTO employees (name, role) VALUES (?, ?)`).run(capitalize(command.name), command.role);
            break;
        }
        case "update_employee": {
            const emp = db.prepare(`SELECT * FROM employees WHERE name = ? COLLATE NOCASE`).get(command.name) as any;
            if (!emp) throw new Error("Employee not found");

            if (command.newRole) {
                db.prepare(`UPDATE employees SET role = ? WHERE id = ?`).run(command.newRole, emp.id);
            }
            if (command.newName) {
                const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.substring(1);
                db.prepare(`UPDATE employees SET name = ? WHERE id = ?`).run(capitalize(command.newName), emp.id);
            }
            break;
        }
    }

    return { success: true };
};
