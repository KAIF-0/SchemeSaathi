import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import LlmConfig from '../config/llm';

class LlmService {
    private readonly model = new ChatGoogleGenerativeAI({
        apiKey: LlmConfig.GOOGLE_API_KEY,
        model: LlmConfig.MODEL,
        temperature: LlmConfig.TEMPERATURE,
    });

    public async generate(systemPrompt: string, userPrompt: string): Promise<string> {
        const response = await this.model.invoke([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ]);

        if (typeof response.content === 'string') {
            return response.content.trim();
        }

        return JSON.stringify(response.content).trim();
    }
}

export default new LlmService();
