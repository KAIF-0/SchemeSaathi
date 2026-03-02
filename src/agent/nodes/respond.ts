import type { AgentState } from '../state';
import llmService from '../../services/llm';

export async function respond(state: AgentState): Promise<Partial<AgentState>> {
    if (state.finalResponse) {
        return {
            finalResponse: state.finalResponse,
        };
    }

    if (state.intent === 'scheme_query' && state.ragContext) {
        return {
            finalResponse: state.ragContext,
        };
    }

    const preferredLanguage = state.profile?.preferredLanguage === 'hindi' ? 'Hindi' : 'English';

    const response = await llmService.generate(
        'You are a helpful WhatsApp assistant for Indian welfare scheme support. Return plain text only with no markdown.',
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
