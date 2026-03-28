import { ChatOpenAI } from '@langchain/openai';
import LlmConfig from '../config/llm';

export class LlmTimeoutError extends Error {
    constructor(timeoutMs: number) {
        super(`LLM request timed out after ${timeoutMs}ms`);
        this.name = 'LlmTimeoutError';
    }
}

class LlmService {
    private readonly model = new ChatOpenAI({
        apiKey: LlmConfig.OPENAI_API_KEY,
        model: LlmConfig.MODEL,
        configuration: {
            baseURL: LlmConfig.BASE_URL,
        },
        temperature: LlmConfig.TEMPERATURE,
    });

    public async generate(systemPrompt: string, userPrompt: string): Promise<string> {
        const timeoutMs = LlmConfig.TIMEOUT_MS;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        let response;
        try {
            response = await this.model.invoke([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ], {
                signal: controller.signal,
            });
        } catch (error) {
            if (controller.signal.aborted) {
                throw new LlmTimeoutError(timeoutMs);
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }

        if (typeof response.content === 'string') {
            return response.content.trim();
        }

        return JSON.stringify(response.content).trim();
    }
}

export default new LlmService();
