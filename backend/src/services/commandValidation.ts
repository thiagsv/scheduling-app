import { Command, Day, Role } from "../types";
import { findDay, findRole, resolveEmployeeName } from "./nluUtils";

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

function asNonEmptyString(value: unknown): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function asPositiveInteger(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
        return value;
    }

    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        const parsed = Number(value.trim());
        return parsed > 0 ? parsed : undefined;
    }

    return undefined;
}

function normalizeDay(value: unknown): Day | undefined {
    const day = asNonEmptyString(value);
    return day ? findDay(day) : undefined;
}

function normalizeRole(value: unknown): Role | undefined {
    const role = asNonEmptyString(value);
    return role ? findRole(role) : undefined;
}

function normalizeEmployee(value: unknown): string | undefined {
    const employee = asNonEmptyString(value);
    if (!employee) {
        return undefined;
    }

    return resolveEmployeeName(employee, 2) ?? employee;
}

function normalizeOptionalDay(value: unknown): Day | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    return normalizeDay(value);
}

function normalizeOptionalRole(value: unknown): Role | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    return normalizeRole(value);
}

export function coerceCommand(candidate: unknown): Command | null {
    if (!isRecord(candidate) || typeof candidate.intent !== "string") {
        return null;
    }

    switch (candidate.intent) {
        case "create_schedule": {
            const day = normalizeDay(candidate.day);
            if (!day || !Array.isArray(candidate.roles)) {
                return null;
            }

            const roles = candidate.roles
                .map((roleCount) => {
                    if (!isRecord(roleCount)) {
                        return null;
                    }

                    const role = normalizeRole(roleCount.role);
                    const count = asPositiveInteger(roleCount.count);
                    if (!role || !count) {
                        return null;
                    }

                    return { role, count };
                })
                .filter((roleCount): roleCount is NonNullable<typeof roleCount> => roleCount !== null);

            if (roles.length === 0) {
                return null;
            }

            return { intent: "create_schedule", day, roles };
        }

        case "fill_schedule": {
            const day = normalizeOptionalDay(candidate.day);
            const role = normalizeOptionalRole(candidate.role);
            const command: Command = { intent: "fill_schedule" };

            if (day) {
                command.day = day;
            }

            if (role) {
                command.role = role;
            }

            return command;
        }

        case "swap": {
            const from = normalizeEmployee(candidate.from);
            const to = normalizeEmployee(candidate.to);
            const day = normalizeOptionalDay(candidate.day);

            if (!from || !to) {
                return null;
            }

            const command: Command = { intent: "swap", from, to };
            if (day) {
                command.day = day;
            }

            return command;
        }

        case "assign": {
            const employee = normalizeEmployee(candidate.employee);
            const day = normalizeOptionalDay(candidate.day);

            if (!employee) {
                return null;
            }

            const command: Command = { intent: "assign", employee };
            if (day) {
                command.day = day;
            }

            return command;
        }

        case "create_employee": {
            const name = asNonEmptyString(candidate.name);
            const role = normalizeRole(candidate.role);

            if (!name || !role) {
                return null;
            }

            return { intent: "create_employee", name, role };
        }

        case "update_employee": {
            const name = normalizeEmployee(candidate.name);
            const newName = asNonEmptyString(candidate.newName);
            const newRole = normalizeOptionalRole(candidate.newRole);

            if (!name || (!newName && !newRole)) {
                return null;
            }

            const command: Command = { intent: "update_employee", name };
            if (newName) {
                command.newName = newName;
            }
            if (newRole) {
                command.newRole = newRole;
            }

            return command;
        }

        default:
            return null;
    }
}
