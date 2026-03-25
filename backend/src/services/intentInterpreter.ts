import {
    Command,
    CommandInterpretationResult,
    EmployeeContext,
    ErrorResponse,
    InterpretedCommand,
    MessageResponse,
    QuestionResponse,
} from "../types";
import { coerceCommand } from "./commandValidation";
import { DAYS, INTENT_CATALOG, ROLES } from "./intentCatalog";
import { getEmployeeContext } from "./nluUtils";
import {
    MISSING_INFO_ERROR_MESSAGE,
    PARSE_FALLBACK_MESSAGE,
    parseCommand,
} from "./parseCommand";

type IntentInterpreterContext = {
    employees: EmployeeContext[];
};

type StandardLlmResponse = {
    type?: "command" | "question" | "message";
    command?: unknown | null;
    question?: string | null;
    message?: string | null;
    reason?: string | null;
};

export type IntentLlmRequest = {
    systemPrompt: string;
    userPrompt: string;
    responseSchema: Record<string, unknown>;
};

export interface IntentLlmClient {
    complete(request: IntentLlmRequest): Promise<string | StandardLlmResponse | null>;
}

const STANDARD_COMMAND_RESPONSE_EXAMPLE = JSON.stringify(
    {
        type: "command",
        command: {
            intent: "create_schedule",
            day: "monday",
            roles: [{ role: "cook", count: 1 }],
        },
        question: null,
        message: null,
    },
    null,
    2,
);

const STANDARD_QUESTION_RESPONSE_EXAMPLE = JSON.stringify(
    {
        type: "question",
        command: null,
        question: "Which roles and counts do you want on Monday?",
        message: null,
    },
    null,
    2,
);

const STANDARD_MESSAGE_RESPONSE_EXAMPLE = JSON.stringify(
    {
        type: "message",
        command: null,
        question: null,
        message: "I could not find an employee with that name.",
    },
    null,
    2,
);

const STANDARD_LLM_RESPONSE_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        type: {
            type: "string",
            enum: ["command", "question", "message"],
        },
        command: {
            type: ["object", "null"],
            description: "A scheduling command object using full English field values.",
        },
        question: {
            type: ["string", "null"],
            description: "A short follow-up question when more information is required.",
        },
        message: {
            type: ["string", "null"],
            description: "A short assistant message when no command should be executed.",
        },
    },
    required: ["type", "command", "question", "message"],
} as const;

let llmClient: IntentLlmClient | null = null;

export function configureIntentLlmClient(client: IntentLlmClient | null): void {
    llmClient = client;
}

function createContext(): IntentInterpreterContext {
    return {
        employees: getEmployeeContext(),
    };
}

function buildIntentSummary(): string {
    return INTENT_CATALOG.map((intent) => {
        const required = intent.requiredParameters.map((parameter) => parameter.name).join(", ") || "none";
        const optional = intent.optionalParameters.map((parameter) => parameter.name).join(", ") || "none";

        return `- ${intent.name}: ${intent.description} Required: ${required}. Optional: ${optional}.`;
    }).join("\n");
}

function buildLlmRequest(
    input: string,
    context: IntentInterpreterContext,
): IntentLlmRequest {
    const employees = context.employees.length > 0
        ? context.employees.map((employee) => `${employee.name} (${employee.role})`).join(", ")
        : "none";

    return {
        systemPrompt: [
            "You convert workforce scheduling requests into JSON commands.",
            "Always write in English.",
            "Use full intent, day, and role names in the JSON response.",
            "Return only valid JSON.",
            "The input may include an original request, a follow-up question, and the user's follow-up answer. Combine all of them before deciding.",
            "For create_schedule, one role/count pair is enough to return a valid command.",
            "Do not ask for every possible role. Only ask for the missing role/count information needed to create a valid command.",
            "Do not invent specific roles in a follow-up question. Ask generically for roles and counts unless the user already named the roles.",
            "Return one of these shapes:",
            STANDARD_COMMAND_RESPONSE_EXAMPLE,
            STANDARD_QUESTION_RESPONSE_EXAMPLE,
            STANDARD_MESSAGE_RESPONSE_EXAMPLE,
        ].join("\n"),
        userPrompt: [
            "Supported intents:",
            buildIntentSummary(),
            `Allowed days: ${DAYS.join(", ")}.`,
            `Allowed roles: ${ROLES.join(", ")}.`,
            `Known employees: ${employees}.`,
            `User request: ${input.trim()}.`,
            "If the request is a follow-up answer, combine it with the earlier request and question.",
            "A create_schedule command is valid when the day is known and at least one role/count pair is known.",
            "Only include roles that the user actually provided.",
            "If you have enough information, return a command.",
            "If information is missing, return exactly one short follow-up question.",
            "If the request should not be executed, return a short message.",
        ].join("\n\n"),
        responseSchema: STANDARD_LLM_RESPONSE_SCHEMA,
    };
}

function parseStandardLlmResponse(
    value: string | StandardLlmResponse | null,
): StandardLlmResponse | null {
    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        try {
            return JSON.parse(value) as StandardLlmResponse;
        } catch {
            return null;
        }
    }

    if (typeof value === "object") {
        const candidate = value as Record<string, unknown>;
        if (
            "type" in candidate ||
            "command" in candidate ||
            "question" in candidate ||
            "message" in candidate ||
            "reason" in candidate
        ) {
            return value as StandardLlmResponse;
        }
    }

    return null;
}

function asNonEmptyString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseLlmResult(
    response: StandardLlmResponse | null,
): InterpretedCommand | QuestionResponse | MessageResponse | null {
    if (!response) {
        return null;
    }

    const command = coerceCommand(response.command);
    if (command) {
        return {
            command,
            source: "llm",
        };
    }

    const question = asNonEmptyString(response.question) ?? asNonEmptyString(response.reason);
    if (response.type === "question" && question) {
        return {
            type: "question",
            question,
            source: "llm",
        };
    }

    const message = asNonEmptyString(response.message);
    if (response.type === "message" && message) {
        return {
            type: "message",
            message,
            source: "llm",
        };
    }

    if (question) {
        return {
            type: "question",
            question,
            source: "llm",
        };
    }

    return null;
}

function createParserFollowUp(): QuestionResponse {
    return {
        type: "question",
        question: "I need one more detail before I can continue. Which employee, role, or day should I use?",
        source: "parser",
    };
}

export async function interpretCommand(
    input: string,
): Promise<CommandInterpretationResult> {
    const context = createContext();

    if (llmClient) {
        try {
            const llmResponse = await llmClient.complete(buildLlmRequest(input, context));
            const parsedResponse = parseStandardLlmResponse(llmResponse);
            const llmResult = parseLlmResult(parsedResponse);

            if (llmResult) {
                return llmResult;
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unknown LLM interpretation error";
            console.warn(`[intentInterpreter] LLM unavailable, using parser fallback: ${message}`);
        }
    }

    const parsedCommand = parseCommand(input);
    if ("type" in parsedCommand) {
        if (parsedCommand.message === MISSING_INFO_ERROR_MESSAGE) {
            return createParserFollowUp();
        }

        if (parsedCommand.message === PARSE_FALLBACK_MESSAGE) {
            return {
                type: "message",
                message: parsedCommand.message,
                source: "parser",
            };
        }

        return parsedCommand as ErrorResponse;
    }

    return {
        command: parsedCommand,
        source: "parser",
    };
}
