export type Command =
    | { intent: "create_schedule"; day: string; roles: { role: string; count: number }[] }
    | { intent: "fill_schedule"; day: string }
    | { intent: "swap"; from: string; to: string; day?: string }
    | { intent: "assign"; employee: string; day: string }
    | { intent: "create_employee"; name: string; role: string }
    | { intent: "update_employee"; name: string; newName?: string; newRole?: string };

export type ErrorResponse = {
    type: "error";
    message: string;
};

const defaultError: ErrorResponse = {
    type: "error",
    message: "I understood what you tried to do, but some information is missing (like name, role, or day). Can you rewrite it?"
};

const INTENTS = [
    { name: "create_schedule", keywords: ["create", "schedule", "shift"] },
    { name: "fill_schedule", keywords: ["fill", "complete", "schedule"] },
    { name: "swap", keywords: ["swap", "replace", "switch"] },
    { name: "assign", keywords: ["assign", "put", "add", "set", "allocate"] },
    { name: "create_employee", keywords: ["create", "add", "new", "hire", "employee", "worker", "user"] },
    { name: "update_employee", keywords: ["update", "edit", "change", "employee", "role", "name"] }
] as const;

type IntentName = (typeof INTENTS)[number]["name"];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const ROLES = ["cook", "waiter", "manager", "cleaner"]; 

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

    const empNames = getEmployeeNames();

    for (const intent of INTENTS) {
        let score = 0;
        for (const keyword of intent.keywords) {
            if (words.includes(keyword)) {
                score++;
            }
        }
        
        // Context boosters
        for (const word of words) {
            if (DAYS.includes(word) || ROLES.includes(word) || findBestMatch(word, empNames, 1)) {
                score += 0.5;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestIntent = intent.name;
        }
    }

    if (bestScore < 1.5) {
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

        case "assign": {
            const empNames = getEmployeeNames();
            let finalName: string | undefined;
            for (const w of words) {
                const match = findBestMatch(w, empNames, 1);
                if (match) {
                    finalName = match;
                    break;
                }
            }

            let day = words.find((w) => DAYS.includes(w));
            if (!day) {
                const fuzzyDay = words.find(w => findBestMatch(w, DAYS, 2));
                day = fuzzyDay ? findBestMatch(fuzzyDay, DAYS, 2) || undefined : undefined;
            }

            if (!finalName || !day) return defaultError;

            return { intent: "assign", employee: finalName, day };
        }

        case "fill_schedule": {
            const day = words.find((w) => DAYS.includes(w));
            if (!day) return defaultError;

            return { intent: "fill_schedule", day };
        }

        case "swap": {
            const empNames = getEmployeeNames();
            const swapKeywords = ["swap", "replace", "change", "switch"];
            const actionWord = words.find((w) => swapKeywords.includes(w));
            const actionIdx = actionWord ? words.indexOf(actionWord) : -1;

            let from: string | undefined;
            if (actionIdx !== -1 && words[actionIdx + 1]) {
                from = findBestMatch(words[actionIdx + 1], empNames, 2) || words[actionIdx + 1];
            }
            
            let to: string | undefined;
            const withIdx = words.findIndex((w) => ["with", "for", "in", "on", "and", "by"].includes(w));
            if (withIdx !== -1 && words[withIdx + 1]) {
                to = findBestMatch(words[withIdx + 1], empNames, 2) || words[withIdx + 1];
            } else if (actionIdx !== -1 && words[actionIdx + 2]) {
                to = findBestMatch(words[actionIdx + 2], empNames, 2) || words[actionIdx + 2];
            }

            let day = words.find((w) => DAYS.includes(w));
            if (!day) {
                const fuzzyDay = words.find(w => findBestMatch(w, DAYS, 2));
                day = fuzzyDay ? findBestMatch(fuzzyDay, DAYS, 2) || undefined : undefined;
            }

            if (!from || !to) {
                return defaultError;
            }

            return { intent: "swap", from, to, day };
        }
        case "create_employee": {
            const stopwords = ["create", "add", "new", "hire", "employee", "worker", "user", "as", "a", "an", "the", "with", "role"];
            let finalRole: string | undefined;
            for (let i = words.length - 1; i >= 0; i--) {
                const match = findBestMatch(words[i], ROLES, 1);
                if (match) {
                    finalRole = match;
                    break;
                }
            }
            if (!finalRole) return defaultError;

            let finalName: string | undefined;
            for (const w of words) {
                if (!stopwords.includes(w) && findBestMatch(w, ROLES, 1) === null) {
                    finalName = w;
                    break;
                }
            }
            if (!finalName) return defaultError;

            return { intent: "create_employee", name: finalName, role: finalRole };
        }
        case "update_employee": {
            const empNames = getEmployeeNames();
            let currentName: string | undefined;
            let nameIdx = -1;

            // Find current employee name
            for (let i = 0; i < words.length; i++) {
                const match = findBestMatch(words[i], empNames, 1);
                if (match) {
                    currentName = match;
                    nameIdx = i;
                    break;
                }
            }
            if (!currentName) return defaultError;

            let newRole: string | undefined;
            let newName: string | undefined;

            // Detection of what to update
            const hasNameKeyword = words.includes("name");

            // Look for new role
            for (let i = words.length - 1; i >= 0; i--) {
                if (i === nameIdx) continue; 
                const match = findBestMatch(words[i], ROLES, 1);
                if (match) {
                    newRole = match;
                    break;
                }
            }

            // Look for new name (improved search)
            if (hasNameKeyword || words.includes("to")) {
                const toIdx = words.lastIndexOf("to");
                if (toIdx !== -1 && toIdx > nameIdx && words[toIdx + 1]) {
                    const candidateName = words[toIdx + 1];
                    // If candidate name is actually a role, ignore it as a name unless 'name' keyword was explicit
                    const isRole = findBestMatch(candidateName, ROLES, 1);
                    if (!isRole || hasNameKeyword) {
                        newName = candidateName;
                    }
                }
            }

            if (!newRole && !newName) return defaultError;

            return { intent: "update_employee", name: currentName, newName, newRole };
        }
        default:
            return defaultError;
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
