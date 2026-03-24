import { Employee, Shift, Assignment } from "../types";

export function autoFill(
    shiftsToFill: Shift[],
    employees: Employee[],
    assignments: Assignment[],
    allShifts: Shift[],
): Assignment[] {
    const newAssignments: Assignment[] = [...assignments];

    for (const shift of shiftsToFill) {
        const alreadyAssigned = newAssignments.find((assignment) => assignment.shiftId === shift.id);
        if (alreadyAssigned) {
            continue;
        }

        const candidates = employees
            .filter((employee) => employee.role === shift.role)
            .filter((employee) => !isDoubleBooked(employee.id, shift, newAssignments, allShifts));

        if (candidates.length === 0) {
            continue;
        }

        const best = pickBestCandidate(candidates, newAssignments);

        newAssignments.push({
            employeeId: best.id,
            shiftId: shift.id,
        });
    }

    return newAssignments;
}

export function canAssign(
    employee: Employee,
    shift: Shift,
    assignments: Assignment[],
    shifts: Shift[],
): boolean {
    if (employee.role !== shift.role) return false;
    if (isDoubleBooked(employee.id, shift, assignments, shifts)) return false;
    return true;
}

export function isDoubleBooked(
    employeeId: number,
    shift: Shift,
    assignments: Assignment[],
    shifts: Shift[],
): boolean {
    return assignments.some((assignment) => {
        if (assignment.employeeId !== employeeId) return false;

        const otherShift = shifts.find((candidateShift) => candidateShift.id === assignment.shiftId);
        if (!otherShift) return false;

        return otherShift.day === shift.day;
    });
}

function pickBestCandidate(employees: Employee[], assignments: Assignment[]): Employee {
    const loadMap: Record<number, number> = {};

    for (const assignment of assignments) {
        loadMap[assignment.employeeId] = (loadMap[assignment.employeeId] || 0) + 1;
    }

    return [...employees].sort((a, b) => {
        return (loadMap[a.id] || 0) - (loadMap[b.id] || 0);
    })[0];
}
