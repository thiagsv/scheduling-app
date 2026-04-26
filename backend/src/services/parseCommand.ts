import { Command, Day, ErrorResponse, IntentName, RoleCount } from "../types";
import { INTENT_CATALOG } from "./intentCatalog";
import {
    findBestMatch,
    findDay,
    findRole,
    getEmployeeNames,
    normalize,
    resolveEmployeeName,
} from "./nluUtils";

export const MISSING_INFO_ERROR_MESSAGE =
    "I understood the intent, but some information is missing. Try including the employee, role, or day.";

export const PARSE_FALLBACK_MESSAGE =
    "I didn’t understand that. Try: 'create schedule saturday 2 cooks'.";

const missingInfoError: ErrorResponse = {
    type: "error",
    message: MISSING_INFO_ERROR_MESSAGE,
};

const fallbackMessage: ErrorResponse = {
    type: "error",
    message: PARSE_FALLBACK_MESSAGE,
};

function detectIntent(words: string[]): IntentName | null {
    let bestIntent: IntentName | null = null;
    let bestScore = 0;
    const employeeNames = getEmployeeNames();

    for (const intent of INTENT_CATALOG) {
        let score = 0;

        for (const keyword of intent.keywords) {
            if (words.includes(keyword)) {
                score += 1;
            }
        }

        for (const word of words) {
            if (findDay(word) || findRole(word) || findBestMatch(word, employeeNames, 1)) {
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

function findNormalizedDay(words: string[]): Day | undefined {
    for (const word of words) {
        const day = findDay(word);
        if (day) {
            return day;
        }
    }

    return undefined;
}

function collectEmployeeMentions(words: string[]): string[] {
    const matches = new Map<string, string>();

    for (let i = 0; i < words.length; i++) {
        const candidates = [words[i]];
        if (words[i + 1]) {
            candidates.push(`${words[i]} ${words[i + 1]}`);
        }

        for (const candidate of candidates) {
            const resolved = resolveEmployeeName(candidate, candidate.includes(" ") ? 3 : 2);
            if (resolved) {
                matches.set(resolved.toLowerCase(), resolved);
            }
        }
    }

    return [...matches.values()];
}

function findFirstEmployee(words: string[], excluded: string[] = []): string | undefined {
    const excludedSet = new Set(excluded.map((name) => name.toLowerCase()));
    return collectEmployeeMentions(words).find(
        (employee) => !excludedSet.has(employee.toLowerCase()),
    );
}

function extractRoleCounts(words: string[]): RoleCount[] {
    const roles: RoleCount[] = [];

    for (let index = 0; index < words.length; index++) {
        const count = /^\d+$/.test(words[index]) ? Number(words[index]) : undefined;
        if (!count || !words[index + 1]) {
            continue;
        }

        const role = findRole(words[index + 1]);
        if (!role) {
            continue;
        }

        roles.push({ role, count });
    }

    return roles;
}

function extractCreateEmployeeName(words: string[]): string | undefined {
    const markerIdx = words.findIndex((word) =>
        ["called", "named"].includes(word),
    );

    if (markerIdx !== -1 && words[markerIdx + 1] && !findRole(words[markerIdx + 1])) {
        return words[markerIdx + 1];
    }

    const stopwords = new Set([
        "create",
        "add",
        "new",
        "hire",
        "employee",
        "worker",
        "user",
        "as",
        "a",
        "an",
        "the",
        "with",
        "role",
    ]);

    return words.find((word) => !stopwords.has(word) && !findRole(word));
}

function extractNewName(words: string[]): string | undefined {
    for (let index = 0; index < words.length; index++) {
        const word = words[index];
        const nextWord = words[index + 1];

        if (!nextWord) {
            continue;
        }

        if (word === "to") {
            if (!findRole(nextWord) || words.includes("name")) {
                return nextWord;
            }
        }
    }

    return undefined;
}

function extractEntities(intent: IntentName, words: string[]): Command | ErrorResponse {
    const normalizedDay = findNormalizedDay(words);

    switch (intent) {
        case "create_schedule": {
            if (!normalizedDay) {
                return missingInfoError;
            }

            const roles = extractRoleCounts(words);
            if (roles.length === 0) {
                const employee = findFirstEmployee(words);
                return employee
                    ? { intent: "assign", employee, day: normalizedDay }
                    : missingInfoError;
            }

            return { intent: "create_schedule", day: normalizedDay, roles };
        }

        case "assign": {
            const employee = findFirstEmployee(words);
            if (!employee || !normalizedDay) {
                return missingInfoError;
            }

            return { intent: "assign", employee, day: normalizedDay };
        }

        case "fill_schedule": {
            const employee = findFirstEmployee(words);
            if (employee) {
                const command: Command = { intent: "assign", employee };
                if (normalizedDay) {
                    command.day = normalizedDay;
                }
                return command;
            }

            const role = words.map((word) => findRole(word)).find((value) => value);
            const command: Command = { intent: "fill_schedule" };

            if (normalizedDay) {
                command.day = normalizedDay;
            }

            if (role) {
                command.role = role;
            }

            return command;
        }

        case "swap": {
            const employees = collectEmployeeMentions(words);
            const from = employees[0];
            const to = employees.find((employee) => employee.toLowerCase() !== from?.toLowerCase());

            if (!from || !to) {
                return missingInfoError;
            }

            const command: Command = { intent: "swap", from, to };
            if (normalizedDay) {
                command.day = normalizedDay;
            }
            return command;
        }

        case "create_employee": {
            const role = words
                .slice()
                .reverse()
                .map((word) => findRole(word))
                .find((value) => value);
            const name = extractCreateEmployeeName(words);

            if (!role || !name) {
                return missingInfoError;
            }

            return { intent: "create_employee", name, role };
        }

        case "update_employee": {
            const currentName = findFirstEmployee(words);
            if (!currentName) {
                return missingInfoError;
            }

            const newRole = words
                .map((word) => findRole(word))
                .find((role) => role);
            const newName = extractNewName(words);

            if (!newRole && !newName) {
                return missingInfoError;
            }

            const command: Command = { intent: "update_employee", name: currentName };
            if (newName) {
                command.newName = newName;
            }
            if (newRole) {
                command.newRole = newRole;
            }

            return command;
        }

        default:
            return missingInfoError;
    }
}

export function parseCommand(input: string): Command | ErrorResponse {
    try {
        const words = normalize(input);
        const intent = detectIntent(words);
        if (!intent) {
            return fallbackMessage;
        }

        return extractEntities(intent, words);
    } catch {
        return fallbackMessage;
    }
}
