import type { AgentState } from '../state';
import upstashMemoryService from '../../services/upstash-memory.service';
import llmService from '../../services/llm';

export async function schemeRAG(state: AgentState): Promise<Partial<AgentState>> {
    if (!state.requiresSchemeRag) {
        return {
            ragContext: '',
        };
    }

    const matches = await upstashMemoryService.querySchemes(state.userMessage, 5);

    const schemesContext = matches
        .map((match, index) => {
            const text = typeof match.data === 'string' ? match.data : '';
            return `Scheme ${index + 1}: ${text}`;
        })
        .join('\n\n');

    const preferredLanguage = state.profile?.preferredLanguage === 'hindi' ? 'Hindi' : 'English';

    const ragAnswer = await llmService.generate(
        'You provide Indian government scheme guidance based only on retrieved scheme snippets and user profile.',
        [
            `Respond strictly in ${preferredLanguage}.`,
            `User profile: ${JSON.stringify(state.profile ?? {})}`,
            `User question: ${state.userMessage}`,
            `Retrieved schemes:\n${schemesContext || 'No relevant schemes found.'}`,
            'Generate a concise, practical answer suitable for WhatsApp text.',
        ].join('\n\n')
    );

    return {
        ragContext: ragAnswer,
    };
}
