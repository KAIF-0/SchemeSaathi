import type { AgentState, IntentType } from '../state';
import llmService from '../../services/llm';

const validIntents: IntentType[] = ['scheme_query', 'general_query', 'profile_update', 'unknown'];

function parseIntent(raw: string): IntentType {
    const normalized = raw.trim().toLowerCase();
    const direct = normalized.replace(/[^a-z_]/g, '');

    if (validIntents.includes(direct as IntentType)) {
        return direct as IntentType;
    }

    for (const intent of validIntents) {
        if (normalized.includes(intent)) {
            return intent;
        }
    }

    return 'unknown';
}

export async function intentClassifier(state: AgentState): Promise<Partial<AgentState>> {
    const prompt = [
        `User message: ${state.userMessage}`,
        `Profile: ${JSON.stringify(state.profile ?? {})}`,
        `Memory: ${state.memoryContext || 'none'}`,
        'Classify intent into exactly one label:',
        'scheme_query, general_query, profile_update, unknown',
        'Return only the label.',
    ].join('\n');

    const rawIntent = await llmService.generate(
        'You classify user intents for a WhatsApp welfare assistant.',
        prompt
    );

    const intent = parseIntent(rawIntent);

    return {
        intent,
        requiresSchemeRag: intent === 'scheme_query',
    };
}
