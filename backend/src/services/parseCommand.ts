export type Command =
    | { intent: "create_schedule"; day: string; roles: { role: string; count: number }[] }
    | { intent: "fill_schedule"; day: string }
    | { intent: "swap"; from: string; to: string; day?: string };

export type ErrorResponse = {
    type: "error";
    message: string;
};

const INTENTS = [
    { name: "create_schedule", keywords: ["create", "schedule", "shift"] },
    { name: "fill_schedule", keywords: ["fill", "complete", "schedule"] },
    { name: "swap", keywords: ["swap", "replace", "change"] },
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
            const day = words.find((w) => DAYS.includes(w));
            if (!day) return defaultError;

            const roles: { role: string; count: number }[] = [];
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const nextWord = words[i + 1];

                const count = parseInt(word, 10);
                if (!isNaN(count) && nextWord) {
                    const normalizedRole = ROLES.find((r) => nextWord.startsWith(r));
                    if (normalizedRole) {
                        roles.push({ role: normalizedRole, count });
                    }
                }
            }

            if (roles.length === 0) return defaultError;
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
