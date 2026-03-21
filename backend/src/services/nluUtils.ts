import { db } from "../db/database";

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const ROLES = ["cook", "waiter", "manager", "cleaner", "dishwasher", "host"];

export const INTENTS = [
    { name: "create_schedule", keywords: ["create", "schedule", "shift"] },
    { name: "fill_schedule", keywords: ["fill", "complete", "schedule"] },
    { name: "swap", keywords: ["swap", "replace", "switch"] },
    { name: "assign", keywords: ["assign", "put", "add", "set", "allocate"] },
    { name: "create_employee", keywords: ["create", "add", "new", "hire", "employee", "worker", "user"] },
    { name: "update_employee", keywords: ["update", "edit", "change", "employee", "role", "name"] }
] as const;

export type IntentName = (typeof INTENTS)[number]["name"];

export function normalize(input: string): string[] {
    return input
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .trim()
        .split(/\s+/);
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

export function getEmployeeNames(): string[] {
    try {
        const emps = db.prepare("SELECT name FROM employees").all() as any[];
        return emps.map(e => e.name.toLowerCase());
    } catch {
        return [];
    }
}
