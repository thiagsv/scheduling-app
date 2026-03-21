import { Command, ErrorResponse } from "../types";
import {
    DAYS,
    ROLES,
    INTENTS,
    IntentName,
    normalize,
    findBestMatch,
    getEmployeeNames
} from "./nluUtils";

const defaultError: ErrorResponse = {
    type: "error",
    message: "I understood what you tried to do, but some information is missing (like name, role, or day). Can you rewrite it?"
};

function detectIntent(words: string[]): IntentName | null {
    let bestIntent: IntentName | null = null;
    let bestScore = 0;

    const empNames = getEmployeeNames();

    for (const intent of INTENTS) {
        let score = 0;
        for (const keyword of intent.keywords) {
            if (words.includes(keyword)) score++;
        }
        
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

    return bestScore >= 1.5 ? bestIntent : null;
}

function extractEntities(intent: IntentName, words: string[]): Command | ErrorResponse {
    const missingInfoError: ErrorResponse = { type: "error", message: "Missing required information" };
    const empNames = getEmployeeNames();
    
    // Helper to find day
    const day = words.find(w => DAYS.includes(w)) || words.find(w => findBestMatch(w, DAYS, 2));
    const normalizedDay = day ? (DAYS.includes(day) ? day : findBestMatch(day, DAYS, 2)) : undefined;

    switch (intent) {
        case "create_schedule": {
            if (!normalizedDay) return missingInfoError;

            const roles: { role: string; count: number }[] = [];
            for (let i = 0; i < words.length; i++) {
                const count = parseInt(words[i], 10);
                if (!isNaN(count) && words[i + 1]) {
                    const role = ROLES.find(r => words[i+1].startsWith(r)) || findBestMatch(words[i+1], ROLES, 2);
                    if (role) roles.push({ role, count });
                }
            }

            if (roles.length === 0) {
                const foundEmp = words.map(w => findBestMatch(w, empNames, 2)).find(match => match);
                if (foundEmp) return { intent: "assign", employee: foundEmp, day: normalizedDay };
                return missingInfoError;
            }
            return { intent: "create_schedule", day: normalizedDay, roles };
        }

        case "assign": {
            const finalName = words.map(w => findBestMatch(w, empNames, 1)).find(m => m);
            if (!finalName || !normalizedDay) return missingInfoError;
            return { intent: "assign", employee: finalName, day: normalizedDay };
        }

        case "fill_schedule": {
            if (!normalizedDay) return missingInfoError;
            return { intent: "fill_schedule", day: normalizedDay };
        }

        case "swap": {
            const swapKeywords = ["swap", "replace", "change", "switch"];
            const actionIdx = words.findIndex(w => swapKeywords.includes(w));
            
            let from = actionIdx !== -1 && words[actionIdx + 1] ? findBestMatch(words[actionIdx + 1], empNames, 2) || words[actionIdx + 1] : undefined;
            
            const withIdx = words.findIndex(w => ["with", "for", "in", "on", "and", "by"].includes(w));
            let to = withIdx !== -1 && words[withIdx + 1] ? findBestMatch(words[withIdx + 1], empNames, 2) || words[withIdx + 1] : undefined;
            if (!to && actionIdx !== -1) to = findBestMatch(words[actionIdx + 2], empNames, 2) || words[actionIdx + 2];

            if (!from || !to) return missingInfoError;
            return { intent: "swap", from, to, day: normalizedDay };
        }

        case "create_employee": {
            const finalRole = words.slice().reverse().map(w => findBestMatch(w, ROLES, 1)).find(m => m);
            const stopwords = ["create", "add", "new", "hire", "employee", "worker", "user", "as", "a", "an", "the", "with", "role"];
            const finalName = words.find(w => !stopwords.includes(w) && !findBestMatch(w, ROLES, 1));
            
            if (!finalRole || !finalName) return missingInfoError;
            return { intent: "create_employee", name: finalName, role: finalRole };
        }

        case "update_employee": {
            let currentName = words.map(w => findBestMatch(w, empNames, 1)).find(m => m);
            if (!currentName) return missingInfoError;

            const nameIdx = words.indexOf(currentName);
            const newRole = words.filter((_, i) => i !== nameIdx).map(w => findBestMatch(w, ROLES, 1)).find(m => m);
            
            let newName: string | undefined;
            const toIdx = words.lastIndexOf("to");
            if (toIdx !== -1 && toIdx > nameIdx && words[toIdx + 1]) {
                if (!findBestMatch(words[toIdx+1], ROLES, 1) || words.includes("name")) {
                    newName = words[toIdx + 1];
                }
            }

            if (!newRole && !newName) return missingInfoError;
            return { intent: "update_employee", name: currentName, newName, newRole };
        }
        default: return missingInfoError;
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
        if (!intent) return fallbackMessage;
        return extractEntities(intent, words);
    } catch (error) {
        return fallbackMessage;
    }
}
