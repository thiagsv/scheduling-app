import { Request, Response } from "express";
import { parseCommand } from "../services/parseCommand";

export const handleCommand = (req: Request, res: Response) => {
    try {
        const { command } = req.body;

        if (!command) {
            res.status(400).json({
                type: "error",
                message: "Command is required",
            });
            return;
        }

        const result = parseCommand(command);

        if ("type" in result && result.type === "error") {
            res.status(400).json(result);
            return;
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            type: "error",
            message: "Internal server error",
        });
    }
};
