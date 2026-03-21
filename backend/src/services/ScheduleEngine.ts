import { Employee, Shift, Assignment } from "../types";

export class ScheduleEngine {
  autoFill(shiftsToFill: Shift[], employees: Employee[], assignments: Assignment[], allShifts: Shift[]): Assignment[] {
    const newAssignments: Assignment[] = [...assignments];

    for (const shift of shiftsToFill) {
      const alreadyAssigned = newAssignments.find(a => a.shiftId === shift.id);
      if (alreadyAssigned) continue;

      const candidates = employees
        .filter(e => e.role === shift.role)
        .filter(e => !this.isDoubleBooked(e.id, shift, newAssignments, allShifts));

      if (candidates.length === 0) continue;

      const best = this.pickBestCandidate(candidates, newAssignments);

      newAssignments.push({
        employeeId: best.id,
        shiftId: shift.id
      });
    }

    return newAssignments;
  }

  canAssign(employee: Employee, shift: Shift, assignments: Assignment[], shifts: Shift[]): boolean {
    if (employee.role !== shift.role) return false;
    if (this.isDoubleBooked(employee.id, shift, assignments, shifts)) return false;
    return true;
  }

  public isDoubleBooked(
    employeeId: number,
    shift: Shift,
    assignments: Assignment[],
    shifts: Shift[]
  ): boolean {
    return assignments.some(a => {
      if (a.employeeId !== employeeId) return false;

      const otherShift = shifts.find(s => s.id === a.shiftId);
      if (!otherShift) return false; // If not in the provided shifts, it's not on the same day/timeframe
      
      return otherShift.day === shift.day;
    });
  }

  private pickBestCandidate(employees: Employee[], assignments: Assignment[]): Employee {
    const loadMap: Record<number, number> = {};

    for (const a of assignments) {
      loadMap[a.employeeId] = (loadMap[a.employeeId] || 0) + 1;
    }

    return [...employees].sort((a, b) => {
      return (loadMap[a.id] || 0) - (loadMap[b.id] || 0);
    })[0];
  }
}
