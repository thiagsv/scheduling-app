import { Command } from "../types";
import { coerceCommand } from "./commandValidation";

export const SUBMIT_SCHEDULING_COMMAND_TOOL_NAME = "submitSchedulingCommand";

export type IntentToolCall = {
    type: "tool_call";
    toolName: string;
    toolArguments: unknown;
};

export function executeIntentToolCall(toolCall: IntentToolCall): Command | null {
    if (toolCall.toolName !== SUBMIT_SCHEDULING_COMMAND_TOOL_NAME) {
        return null;
    }

    return coerceCommand(toolCall.toolArguments);
}
