import { Request, Response } from "express";
import { executeCommand } from "../services/executionEngine";
import { interpretCommand } from "../services/intentInterpreter";
import { ErrorResponse } from "../types";

function isErrorResponse(value: ErrorResponse | unknown): value is ErrorResponse {
    return typeof value === "object" && value !== null && "type" in value && value.type === "error";
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

        executeCommand(interpretation.command);

        res.status(200).json({
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
