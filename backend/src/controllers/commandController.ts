import { Request, Response } from "express";
import { executeCommand } from "../services/executionEngine";
import { interpretCommand } from "../services/intentInterpreter";
import { ErrorResponse, MessageResponse, QuestionResponse } from "../types";

function isErrorResponse(value: ErrorResponse | unknown): value is ErrorResponse {
    return typeof value === "object" && value !== null && "type" in value && value.type === "error";
}

function isQuestionResponse(value: QuestionResponse | unknown): value is QuestionResponse {
    return typeof value === "object" && value !== null && "type" in value && value.type === "question";
}

function isMessageResponse(value: MessageResponse | unknown): value is MessageResponse {
    return typeof value === "object" && value !== null && "type" in value && value.type === "message";
}

function describeSource(source: "llm" | "parser"): string {
    switch (source) {
        case "llm":
            return "LLM";
        case "parser":
            return "parser fallback";
    }
}

export const handleCommand = async (req: Request, res: Response) => {
    try {
        const { command } = req.body;

        if (typeof command !== "string" || !command.trim()) {
            res.status(400).json({ type: "error", message: "command is required in the body" });
            return;
        }

        const interpretation = await interpretCommand(command);

        if (isErrorResponse(interpretation)) {
            res.status(400).json(interpretation);
            return;
        }

        if (isQuestionResponse(interpretation)) {
            res.status(200).json(interpretation);
            return;
        }

        if (isMessageResponse(interpretation)) {
            res.status(200).json(interpretation);
            return;
        }

        executeCommand(interpretation.command);

        res.status(200).json({
            type: "command",
            intent: interpretation.command.intent,
            command: interpretation.command,
            source: interpretation.source,
            message: `Command executed: ${interpretation.command.intent} via ${describeSource(interpretation.source)}`
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unexpected server error";
        res.status(500).json({ type: "error", message });
    }
};
