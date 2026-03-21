import { db } from "../db/database";

export const getSchedule = () => {
    const shifts = db.prepare(`
        SELECT s.day, s.role, e.name 
        FROM shifts s 
        LEFT JOIN employees e ON s.employee_id = e.id
    `).all() as any[];

    const schedule: Record<string, Record<string, string[]>> = {};
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const BASE_ROLES = ["Cook", "Waiter", "Manager"];

    // Initialize full-week calendar view
    DAYS.forEach(day => {
        schedule[day] = {};
        BASE_ROLES.forEach(role => {
            schedule[day][role] = [];
        });
    });

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    for (const shift of shifts) {
        const dayStr = capitalize(shift.day);
        const roleStr = capitalize(shift.role);

        if (!schedule[dayStr]) {
            schedule[dayStr] = {};
        }

        if (!schedule[dayStr][roleStr]) {
            schedule[dayStr][roleStr] = [];
        }

        if (shift.name) {
            schedule[dayStr][roleStr].push(shift.name);
        } else {
            schedule[dayStr][roleStr].push("Empty Slot");
        }
    }

    return schedule;
};
