import {
    CommandInterpretationResult,
    EmployeeContext,
    ErrorResponse,
    InterpretedCommand,
    MessageResponse,
    QuestionResponse,
} from "../types";
import { DAYS, INTENT_CATALOG, ROLES } from "./intentCatalog";
import {
    executeIntentToolCall,
    SUBMIT_SCHEDULING_COMMAND_TOOL_NAME,
} from "./intentTools";
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
    type?: "tool_call" | "question" | "message";
    toolName?: string | null;
    toolArguments?: unknown | null;
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

const STANDARD_TOOL_CALL_RESPONSE_EXAMPLE = JSON.stringify(
    {
        type: "tool_call",
        toolName: SUBMIT_SCHEDULING_COMMAND_TOOL_NAME,
        toolArguments: {
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
        toolName: null,
        toolArguments: null,
        question: "Which roles and counts do you want on Monday?",
        message: null,
    },
    null,
    2,
);

const STANDARD_MESSAGE_RESPONSE_EXAMPLE = JSON.stringify(
    {
        type: "message",
        toolName: null,
        toolArguments: null,
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
            enum: ["tool_call", "question", "message"],
        },
        toolName: {
            type: ["string", "null"],
            description: "The tool name to execute when type is tool_call.",
        },
        toolArguments: {
            type: ["object", "null"],
            description: "Arguments for the selected tool when type is tool_call.",
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
    required: ["type", "toolName", "toolArguments", "question", "message"],
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

function buildInterpretationRules(): string {
    return [
        `- Prefer a tool_call to ${SUBMIT_SCHEDULING_COMMAND_TOOL_NAME} when all required fields for the matched intent are present.`,
        "- Return a question when the request matches a supported intent but required information is missing.",
        "- Never ask for optional fields just because they were omitted.",
        "- Use known employees to ground employee names. Do not invent employees.",
        "- If a word does not match a known employee, do not assume it is an employee name.",
        "- fill_schedule is valid with no day and no role filters.",
        "- assign is valid with an employee only. The day is optional.",
        "- update_employee is valid when the employee name is known and at least one of newName or newRole is present.",
        "- create_schedule is valid when the day is known and at least one role/count pair is known.",
        "- swap needs two employee names. If one is missing, ask for it.",
        "- create_employee needs both a name and a role. If one is missing, ask for it.",
        "- Prefer fill_schedule when the user asks to fill, complete, or fully staff a schedule.",
        "- Prefer create_schedule only when the user is defining schedule capacity with role/count pairs.",
    ].join("\n");
}

function buildLanguageHints(): string {
    return [
        "- 'fill schedule', 'complete schedule', and 'full schedule' usually mean fill_schedule.",
        "- 'full schedule monday' means fill_schedule with day = monday.",
        "- 'full schedule monday with cook' means fill_schedule with day = monday and role = cook.",
        "- 'swap monday' means swap is intended, but two employee names are still required.",
        "- 'swap' without two employee names should return a follow-up question.",
        "- 'create schedule monday' without counts should ask for roles and counts instead of creating a partial command.",
        "- If the user names one valid employee in a swap request but not the other, ask for the missing employee.",
    ].join("\n");
}

function buildDecisionExamples(): string {
    return [
        'User request: "Fill schedule"',
        JSON.stringify(
            {
                type: "tool_call",
                toolName: SUBMIT_SCHEDULING_COMMAND_TOOL_NAME,
                toolArguments: {
                    intent: "fill_schedule",
                },
                question: null,
                message: null,
            },
            null,
            2,
        ),
        'User request: "Full schedule monday"',
        JSON.stringify(
            {
                type: "tool_call",
                toolName: SUBMIT_SCHEDULING_COMMAND_TOOL_NAME,
                toolArguments: {
                    intent: "fill_schedule",
                    day: "monday",
                },
                question: null,
                message: null,
            },
            null,
            2,
        ),
        'User request: "Full schedule monday with cook"',
        JSON.stringify(
            {
                type: "tool_call",
                toolName: SUBMIT_SCHEDULING_COMMAND_TOOL_NAME,
                toolArguments: {
                    intent: "fill_schedule",
                    day: "monday",
                    role: "cook",
                },
                question: null,
                message: null,
            },
            null,
            2,
        ),
        'User request: "Swap"',
        JSON.stringify(
            {
                type: "question",
                toolName: null,
                toolArguments: null,
                question: "Which two employees should I swap?",
                message: null,
            },
            null,
            2,
        ),
        'User request: "Swap monday"',
        JSON.stringify(
            {
                type: "question",
                toolName: null,
                toolArguments: null,
                question: "Which two employees should I swap on Monday?",
                message: null,
            },
            null,
            2,
        ),
        'User request: "Swap cookies on monday"',
        JSON.stringify(
            {
                type: "question",
                toolName: null,
                toolArguments: null,
                question: "Which two employees should I swap on Monday?",
                message: null,
            },
            null,
            2,
        ),
        'User request: "Create schedule monday"',
        STANDARD_QUESTION_RESPONSE_EXAMPLE,
    ].join("\n");
}

function buildSystemPrompt(): string {
    return [
        "You convert workforce scheduling requests into JSON commands.",
        "Always write in English.",
        "Use full intent, day, and role names in the JSON response.",
        "Return only valid JSON.",
        "The input may include an original request, a follow-up question, and the user's follow-up answer. Combine all of them before deciding.",
        `When enough information is available, return a tool_call for ${SUBMIT_SCHEDULING_COMMAND_TOOL_NAME}.`,
        "For create_schedule, one role/count pair is enough to return a valid command.",
        "Do not ask for every possible role. Only ask for the missing role/count information needed to create a valid command.",
        "Do not invent specific roles in a follow-up question. Ask generically for roles and counts unless the user already named the roles.",
        "Language hints:",
        buildLanguageHints(),
        "Return one of these shapes:",
        STANDARD_TOOL_CALL_RESPONSE_EXAMPLE,
        STANDARD_QUESTION_RESPONSE_EXAMPLE,
        STANDARD_MESSAGE_RESPONSE_EXAMPLE,
        "Decision examples:",
        buildDecisionExamples(),
    ].join("\n");
}

function buildUserPrompt(input: string, context: IntentInterpreterContext): string {
    const employees = context.employees.length > 0
        ? context.employees.map((employee) => `${employee.name} (${employee.role})`).join(", ")
        : "none";

    return [
        "Supported intents:",
        buildIntentSummary(),
        "Interpretation rules:",
        buildInterpretationRules(),
        `Allowed days: ${DAYS.join(", ")}.`,
        `Allowed roles: ${ROLES.join(", ")}.`,
        `Known employees: ${employees}.`,
        `Available tool: ${SUBMIT_SCHEDULING_COMMAND_TOOL_NAME}.`,
        `User request: ${input.trim()}.`,
        "If the request is a follow-up answer, combine it with the earlier request and question.",
        "Only include roles that the user actually provided.",
        `If you have enough information, return a tool_call for ${SUBMIT_SCHEDULING_COMMAND_TOOL_NAME}.`,
        "If information is missing, return exactly one short follow-up question.",
        "If the request should not be executed, return a short message.",
    ].join("\n\n");
}

function buildLlmRequest(
    input: string,
    context: IntentInterpreterContext,
): IntentLlmRequest {
    return {
        systemPrompt: buildSystemPrompt(),
        userPrompt: buildUserPrompt(input, context),
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
            "toolName" in candidate ||
            "toolArguments" in candidate ||
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

    if (response.type === "tool_call" && typeof response.toolName === "string") {
        const toolCommand = executeIntentToolCall({
            type: "tool_call",
            toolName: response.toolName,
            toolArguments: response.toolArguments,
        });

        if (toolCommand) {
            return {
                command: toolCommand,
                source: "llm",
            };
        }
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
            return {
                type: "message",
                message: parsedCommand.message,
                source: "parser",
            };
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
