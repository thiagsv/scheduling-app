import { db } from "../db/database";
import { Day, EmployeeContext, Role } from "../types";
import { DAY_ALIASES, ROLE_ALIASES } from "./intentCatalog";

export function normalizeText(input: string): string {
    return input
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=`~()]/g, " ")
        .replace(/[-_]/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

export function normalize(input: string): string[] {
    const normalized = normalizeText(input);
    return normalized ? normalized.split(/\s+/).filter(Boolean) : [];
}

export function getLevenshteinDistance(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= a.length; i++) matrix[i] = [i];
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
        }
    }
    return matrix[a.length][b.length];
}

export function findBestMatch(word: string, candidates: string[], maxDist = 2): string | undefined {
    const allowedDist = word.length <= 3 ? 0 : maxDist;
    for (const c of candidates) {
        if (getLevenshteinDistance(word, c) <= allowedDist) return c;
    }
    return undefined;
}

export function findBestAlias<T extends string>(
    value: string,
    aliases: Record<string, T>,
    maxDist = 1,
): T | undefined {
    const normalizedValue = normalizeText(value);
    if (!normalizedValue) {
        return undefined;
    }

    const exactMatch = aliases[normalizedValue];
    if (exactMatch) {
        return exactMatch;
    }

    const aliasMatch = findBestMatch(
        normalizedValue,
        Object.keys(aliases).filter(
            (alias) =>
                alias.length > 3 && Math.abs(alias.length - normalizedValue.length) <= maxDist + 1,
        ),
        maxDist,
    );
    return aliasMatch ? aliases[aliasMatch] : undefined;
}

export function findDay(value: string): Day | undefined {
    return findBestAlias(value, DAY_ALIASES, 1);
}

export function findRole(value: string): Role | undefined {
    return findBestAlias(value, ROLE_ALIASES, 1);
}

export function getEmployeeContext(): EmployeeContext[] {
    try {
        return db
            .prepare("SELECT name, role FROM employees ORDER BY name COLLATE NOCASE")
            .all() as EmployeeContext[];
    } catch {
        return [];
    }
}

export function getEmployeeNames(): string[] {
    return getEmployeeContext().map((employee) => normalizeText(employee.name));
}

export function resolveEmployeeName(value: string, maxDist = 2): string | undefined {
    const normalizedValue = normalizeText(value);
    if (!normalizedValue) {
        return undefined;
    }

    const employees = getEmployeeContext();
    const namesByNormalized = new Map(
        employees.map((employee) => [normalizeText(employee.name), employee.name]),
    );

    const exact = namesByNormalized.get(normalizedValue);
    if (exact) {
        return exact;
    }

    const candidate = findBestMatch(normalizedValue, [...namesByNormalized.keys()], maxDist);
    return candidate ? namesByNormalized.get(candidate) : undefined;
}
