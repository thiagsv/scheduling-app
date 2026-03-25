import { Command } from "../types";
import { coerceCommand } from "./commandValidation";
import { DAYS, ROLES } from "./intentCatalog";

export const SUBMIT_SCHEDULING_COMMAND_TOOL_NAME = "submitSchedulingCommand";

export type IntentToolName = typeof SUBMIT_SCHEDULING_COMMAND_TOOL_NAME;

export type IntentToolDefinition = {
    name: IntentToolName;
    description: string;
    parameters: Record<string, unknown>;
};

export type IntentToolCall = {
    type: "tool_call";
    toolName: string;
    toolArguments: unknown;
};

const roleCountItemSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        role: {
            type: "string",
            enum: ROLES,
        },
        count: {
            type: "integer",
            minimum: 1,
        },
    },
    required: ["role", "count"],
} as const;

export const SUBMIT_SCHEDULING_COMMAND_TOOL: IntentToolDefinition = {
    name: SUBMIT_SCHEDULING_COMMAND_TOOL_NAME,
    description:
        "Submits a validated scheduling command when the request already contains all required information.",
    parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
            intent: {
                type: "string",
                enum: [
                    "create_schedule",
                    "fill_schedule",
                    "assign",
                    "swap",
                    "create_employee",
                    "update_employee",
                ],
            },
            day: {
                type: "string",
                enum: DAYS,
            },
            role: {
                type: "string",
                enum: ROLES,
            },
            roles: {
                type: "array",
                items: roleCountItemSchema,
            },
            employee: {
                type: "string",
            },
            from: {
                type: "string",
            },
            to: {
                type: "string",
            },
            name: {
                type: "string",
            },
            newName: {
                type: "string",
            },
            newRole: {
                type: "string",
                enum: ROLES,
            },
        },
        required: ["intent"],
    },
};

export function executeIntentToolCall(toolCall: IntentToolCall): Command | null {
    if (toolCall.toolName !== SUBMIT_SCHEDULING_COMMAND_TOOL_NAME) {
        return null;
    }

    return coerceCommand(toolCall.toolArguments);
}
