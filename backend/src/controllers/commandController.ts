import { Request, Response } from "express";
import { parseCommand } from "../services/parseCommand";
import { executeCommand } from "../services/executionEngine";

export const handleCommand = (req: Request, res: Response) => {
    try {
        const { command } = req.body;

        if (!command) {
            res.status(400).json({ type: "error", message: "command is required in the body" });
            return;
        }

        const parsedResult = parseCommand(command);

        if ("type" in parsedResult && parsedResult.type === "error") {
            res.status(400).json(parsedResult);
            return;
        }

        const validCommand = parsedResult as any;

        // Action the command in the database
        const result = executeCommand(validCommand);

        res.status(200).json({
            intent: validCommand.intent,
            schedule: result.schedule,
            employees: result.employees,
            message: `Command executed: ${validCommand.intent}`
        });

    } catch (error: any) {
        res.status(500).json({ type: "error", message: error.message });
    }
};
