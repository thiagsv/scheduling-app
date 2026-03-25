import { IntentLlmClient, IntentLlmRequest } from "./intentInterpreter";
import { IntentToolCall } from "./intentTools";

type GeminiGenerateContentResponse = {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
                functionCall?: {
                    name?: string;
                    args?: unknown;
                };
            }>;
        };
    }>;
    promptFeedback?: {
        blockReason?: string;
    };
};

export class GeminiIntentClient implements IntentLlmClient {
    public constructor(
        private readonly apiKey: string,
        private readonly model = "gemini-2.5-flash",
        private readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta",
    ) {}

    public async complete(request: IntentLlmRequest): Promise<string | IntentToolCall | null> {
        const response = await fetch(
            `${this.baseUrl}/models/${this.model}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": this.apiKey,
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: request.systemPrompt }],
                    },
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: request.userPrompt }],
                        },
                    ],
                    tools: request.tools.length > 0
                        ? [
                            {
                                functionDeclarations: request.tools.map((tool) => ({
                                    name: tool.name,
                                    description: tool.description,
                                    parametersJsonSchema: tool.parameters,
                                })),
                            },
                        ]
                        : undefined,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseJsonSchema: request.responseSchema,
                    },
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`Gemini request failed with status ${response.status}`);
        }

        const data = (await response.json()) as GeminiGenerateContentResponse;

        if (data.promptFeedback?.blockReason) {
            throw new Error(`Gemini blocked the prompt: ${data.promptFeedback.blockReason}`);
        }

        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const functionCallPart = parts.find((part) => part.functionCall?.name);

        if (functionCallPart?.functionCall?.name) {
            return {
                type: "tool_call",
                toolName: functionCallPart.functionCall.name,
                toolArguments: functionCallPart.functionCall.args ?? null,
            };
        }

        return parts.find((part) => part.text)?.text ?? null;
    }
}
