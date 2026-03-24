import { Command, EmployeeContext, ErrorResponse, InterpretedCommand } from "../types";
import { coerceCommand } from "./commandValidation";
import { DAYS, INTENT_CATALOG, ROLES } from "./intentCatalog";
import { getEmployeeContext } from "./nluUtils";
import { parseCommand } from "./parseCommand";

type IntentInterpreterContext = {
    employees: EmployeeContext[];
};

type StandardLlmResponse = {
    command: unknown | null;
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

const STANDARD_LLM_RESPONSE_EXAMPLE = JSON.stringify(
    {
        command: {
            intent: "assign",
            employee: "Employee Name",
            day: "monday",
        },
        reason: null,
    },
    null,
    2,
);

const STANDARD_LLM_RESPONSE_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        command: {
            type: ["object", "null"],
            description:
                "A scheduling command object using full English field values, or null when the request is ambiguous.",
        },
        reason: {
            type: ["string", "null"],
            description:
                "A short explanation when command is null. Use null when a valid command is returned.",
        },
    },
    required: ["command", "reason"],
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
            "Use this exact response shape:",
            STANDARD_LLM_RESPONSE_EXAMPLE,
        ].join("\n"),
        userPrompt: [
            "Supported intents:",
            buildIntentSummary(),
            `Allowed days: ${DAYS.join(", ")}.`,
            `Allowed roles: ${ROLES.join(", ")}.`,
            `Known employees: ${employees}.`,
            `User request: ${input.trim()}.`,
            "If the request is ambiguous or incomplete, return {\"command\": null, \"reason\": \"short explanation\"}.",
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

    if (typeof value === "object" && "command" in value) {
        return value;
    }

    return null;
}

export async function interpretCommand(
    input: string,
): Promise<InterpretedCommand | ErrorResponse> {
    const context = createContext();

    if (llmClient) {
        try {
            const llmResponse = await llmClient.complete(buildLlmRequest(input, context));
            const parsedResponse = parseStandardLlmResponse(llmResponse);
            const command = parsedResponse ? coerceCommand(parsedResponse.command) : null;

            if (command) {
                return {
                    command,
                    source: "llm",
                };
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unknown LLM interpretation error";
            console.warn(`[intentInterpreter] LLM unavailable, using parser fallback: ${message}`);
        }
    }

    const parsedCommand = parseCommand(input);
    if ("type" in parsedCommand) {
        return parsedCommand;
    }

    return {
        command: parsedCommand,
        source: "parser",
    };
}
