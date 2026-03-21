export type Command =
    | { intent: "create_schedule"; day: string; roles: { role: string; count: number }[] }
    | { intent: "fill_schedule"; day: string }
    | { intent: "swap"; from: string; to: string; day?: string }
    | { intent: "assign"; employee: string; day: string }
    | { intent: "create_employee"; name: string; role: string }
    | { intent: "update_employee"; name: string; role: string };

export type ErrorResponse = {
    type: "error";
    message: string;
};

const INTENTS = [
    { name: "create_schedule", keywords: ["create", "schedule", "shift"] },
    { name: "fill_schedule", keywords: ["fill", "complete", "schedule"] },
    { name: "swap", keywords: ["swap", "replace", "change"] },
    { name: "create_employee", keywords: ["create", "add", "new", "hire", "employee", "worker", "user"] },
    { name: "update_employee", keywords: ["update", "edit", "change", "employee", "role"] }
] as const;

type IntentName = (typeof INTENTS)[number]["name"];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const ROLES = ["cook", "waiter", "manager", "cleaner", "employee", "worker"]; 

function normalize(input: string): string[] {
    return input
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .trim()
        .split(/\s+/);
}

function getLevenshteinDistance(a: string, b: string): number {
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

function findBestMatch(word: string, candidates: string[], maxDist = 2): string | null {
    const allowedDist = word.length <= 3 ? 0 : maxDist;
    for (const c of candidates) {
        if (getLevenshteinDistance(word, c) <= allowedDist) return c;
    }
    return null;
}

import { db } from "../db/database";

function getEmployeeNames(): string[] {
    try {
        const emps = db.prepare("SELECT name FROM employees").all() as any[];
        return emps.map(e => e.name.toLowerCase());
    } catch {
        return [];
    }
}

function detectIntent(words: string[]): IntentName | null {
    let bestIntent: IntentName | null = null;
    let bestScore = 0;

    for (const intent of INTENTS) {
        let score = 0;
        for (const keyword of intent.keywords) {
            if (words.includes(keyword)) {
                score++;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestIntent = intent.name;
        }
    }

    if (bestScore < 2) {
        return null;
    }

    return bestIntent;
}

function extractEntities(intent: IntentName, words: string[]): Command | ErrorResponse {
    const defaultError: ErrorResponse = {
        type: "error",
        message: "Missing required information"
    };

    switch (intent) {
        case "create_schedule": {
            let day = words.find((w) => DAYS.includes(w));
            if (!day) {
                const fuzzyDay = words.find(w => findBestMatch(w, DAYS, 2));
                day = fuzzyDay ? findBestMatch(fuzzyDay, DAYS, 2) || undefined : undefined;
            }
            if (!day) return defaultError;

            const roles: { role: string; count: number }[] = [];
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const nextWord = words[i + 1];

                const count = parseInt(word, 10);
                if (!isNaN(count) && nextWord) {
                    const normalizedRole = ROLES.find((r) => nextWord.startsWith(r)) 
                                        || findBestMatch(nextWord, ROLES, 2);
                    if (normalizedRole) {
                        roles.push({ role: normalizedRole, count });
                    }
                }
            }

            if (roles.length === 0) {
                // Handle "create schedule saturday with jhon"
                const empNames = getEmployeeNames();
                let foundEmp = null;
                for (const w of words) {
                    foundEmp = findBestMatch(w, empNames, 2);
                    if (foundEmp) break;
                }
                
                if (foundEmp) {
                    return { intent: "assign", employee: foundEmp, day };
                }
                
                return defaultError;
            }
            
            return { intent: "create_schedule", day, roles };
        }

        case "fill_schedule": {
            const day = words.find((w) => DAYS.includes(w));
            if (!day) return defaultError;

            return { intent: "fill_schedule", day };
        }

        case "swap": {
            const swapKeywords = ["swap", "replace", "change"];
            const actionWord = words.find((w) => swapKeywords.includes(w));
            const actionIdx = actionWord ? words.indexOf(actionWord) : -1;

            const from = words[actionIdx + 1];
            
            let to;
            const withIdx = words.findIndex((w) => ["with", "for", "in", "on"].includes(w));
            if (withIdx !== -1) {
                to = words[withIdx + 1];
            } else {
                to = words[actionIdx + 2];
            }

            const day = words.find((w) => DAYS.includes(w));

            if (!from || !to) {
                return defaultError;
            }

            return { intent: "swap", from, to, day };
        }
    }
}

export function parseCommand(input: string): Command | ErrorResponse {
    const fallbackMessage: ErrorResponse = {
        type: "error",
        message: "I didn’t understand that. Try something like: 'create schedule saturday 2 cooks'",
    };

    try {
        const words = normalize(input);
        const intent = detectIntent(words);

        if (!intent) {
            return fallbackMessage;
        }

        return extractEntities(intent, words);
    } catch (error) {
        return fallbackMessage;
    }
}
