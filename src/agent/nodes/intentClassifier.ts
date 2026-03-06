import type { AgentState, IntentType } from '../state';
import llmService from '../../services/llm';
import { getIntentLabels, parseIntent } from './helpers/intent.helper';

export async function intentClassifier(state: AgentState): Promise<Partial<AgentState>> {
    const prompt = [
        `User message: ${state.userMessage}`,
        `Profile: ${JSON.stringify(state.profile ?? {})}`,
        `Memory: ${state.memoryContext || 'none'}`,
        'Classify intent into exactly one label:',
        getIntentLabels(),
        'If user asks about previously suggested schemes, previously shared results, or first/second scheme details, return memory_query.',
        'Return only the label.',
    ].join('\n');

    const rawIntent = await llmService.generate(
        'You classify user intents for a WhatsApp welfare assistant.',
        prompt
    );

    const intent = parseIntent(rawIntent);
    console.log(`Classified intent: ${intent}`);

    return {
        intent,
        requiresSchemeRag: intent === 'scheme_query',
        schemeQueryText: '',
    };
}
