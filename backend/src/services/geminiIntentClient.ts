import { IntentLlmClient, IntentLlmRequest } from "./intentInterpreter";

type GeminiGenerateContentResponse = {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
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

    public async complete(request: IntentLlmRequest): Promise<string | null> {
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

        return data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text ?? null;
    }
}
