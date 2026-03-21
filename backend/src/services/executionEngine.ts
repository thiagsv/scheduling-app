import { db } from "../db/database";
import { Command } from "./parseCommand";
import { getSchedule } from "./scheduleService";

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
            
            // PREVENT DOUBLE BOOKING
            const existingShift = db.prepare(`SELECT id FROM shifts WHERE day = ? AND employee_id = ?`).get(command.day, emp.id);
            if (existingShift) throw new Error(`${emp.name} is already scheduled on ${command.day}.`);

            // Try to fill an existing empty slot
            const emptySlot = db.prepare(`SELECT id FROM shifts WHERE day = ? AND role = ? AND employee_id IS NULL LIMIT 1`).get(command.day, emp.role) as any;
            
            if (emptySlot) {
                db.prepare(`UPDATE shifts SET employee_id = ? WHERE id = ?`).run(emp.id, emptySlot.id);
            } else {
                // Or create a new slot specifically forced for them
                db.prepare(`INSERT INTO shifts (day, role, employee_id) VALUES (?, ?, ?)`).run(command.day, emp.role, emp.id);
            }
            break;
        }
        case "fill_schedule": {
            const emptySlots = db.prepare(`SELECT * FROM shifts WHERE day = ? AND employee_id IS NULL`).all(command.day) as any[];
            const assign = db.prepare(`UPDATE shifts SET employee_id = ? WHERE id = ?`);

            for (const slot of emptySlots) {
                const availableEmployee = db.prepare(`
                    SELECT id FROM employees 
                    WHERE role = ? 
                    AND id NOT IN (SELECT employee_id FROM shifts WHERE day = ? AND employee_id IS NOT NULL)
                    LIMIT 1
                `).get(slot.role, command.day) as any;

                if (availableEmployee) {
                    assign.run(availableEmployee.id, slot.id);
                }
            }
            break;
        }
        case "swap": {
            const fromEmp = db.prepare(`SELECT id FROM employees WHERE name = ? COLLATE NOCASE`).get(command.from) as any;
            const toEmp = db.prepare(`SELECT id, role, name FROM employees WHERE name = ? COLLATE NOCASE`).get(command.to) as any;

            if (!fromEmp || !toEmp) {
                throw new Error("Employees not found in database.");
            }

            if (command.day) {
                const existingShift = db.prepare(`SELECT id FROM shifts WHERE day = ? AND employee_id = ?`).get(command.day, toEmp.id);
                if (existingShift) throw new Error(`${toEmp.name} is already scheduled on ${command.day}.`);
                db.prepare(`UPDATE shifts SET employee_id = ? WHERE employee_id = ? AND day = ?`).run(toEmp.id, fromEmp.id, command.day);
            } else {
                const fromShifts = db.prepare(`SELECT day FROM shifts WHERE employee_id = ?`).all(fromEmp.id) as any[];
                for (const shift of fromShifts) {
                    const existing = db.prepare(`SELECT id FROM shifts WHERE day = ? AND employee_id = ?`).get(shift.day, toEmp.id);
                    if (existing) throw new Error(`${toEmp.name} is already scheduled on ${shift.day}.`);
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
