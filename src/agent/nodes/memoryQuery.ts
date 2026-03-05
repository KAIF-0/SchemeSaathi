import type { AgentState } from '../state';
import llmService from '../../services/llm';
import { buildDetailQuery, resolveReferencedScheme } from './helpers/memory-query.helper';

export async function memoryQuery(state: AgentState): Promise<Partial<AgentState>> {
    const referencedScheme = resolveReferencedScheme(state.userMessage, state.memoryContext || '');

    if (referencedScheme) {
        return {
            requiresSchemeRag: true,
            schemeQueryText: buildDetailQuery(referencedScheme.name),
        };
    }

    const preferredLanguage = state.profile?.preferredLanguage === 'hindi' ? 'Hindi' : 'English';
    const memoryResponse = await llmService.generate(
        'You answer only from chat history context. If history lacks details, politely say that and ask the user to clarify.',
        [
            `Respond strictly in ${preferredLanguage}.`,
            `Chat memory context: ${state.memoryContext || 'none'}`,
            `User message: ${state.userMessage}`,
            'Keep the answer concise and WhatsApp-friendly.',
        ].join('\n')
    );

    return {
        finalResponse: memoryResponse.trim(),
        requiresSchemeRag: false,
        schemeQueryText: '',
    };
}
