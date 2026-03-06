import type { AgentState } from '../state';
import llmService from '../../services/llm';
import AppConfig from '../../config/app';

export async function respond(state: AgentState): Promise<Partial<AgentState>> {
    if (state.finalResponse) {
        return {
            finalResponse: state.finalResponse,
        };
    }

    if (state.ragContext) {
        return {
            finalResponse: state.ragContext,
        };
    }
    // console.log(state.memoryContext);
    const preferredLanguage = state.profile?.preferredLanguage === 'hindi' ? 'Hindi' : 'English';
    const response = await llmService.generate(
        `You are ${AppConfig.APP_NAME}, a helpful WhatsApp assistant for Indian welfare scheme support. Return plain text only with no markdown.`,
        [
            `Respond strictly in ${preferredLanguage}.`,
            `User profile: ${JSON.stringify(state.profile ?? {})}`,
            `Recent context: ${state.memoryContext || 'none'}`,
            `Intent: ${state.intent}`,
            `User message: ${state.userMessage}`,
            'Respond in a short, friendly WhatsApp style.',
        ].join('\n')
    );

    return {
        finalResponse: response.replace(/[*_`#>-]/g, '').trim(),
    };
}
