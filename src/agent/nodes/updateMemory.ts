import type { AgentState } from '../state';
import llmService from '../../services/llm';
import upstashMemoryService from '../../services/upstash-memory.service';

export async function updateMemory(state: AgentState): Promise<Partial<AgentState>> {
    const responseText = state.finalResponse?.trim();
    if (!responseText) {
        return {};
    }

    await upstashMemoryService.upsertConversationExchange(
        state.namespace,
        state.userMessage,
        responseText
    );

    const userTurnCount = await upstashMemoryService.incrementUserTurn(state.namespace);
    if (userTurnCount % 5 === 0) {
        const recentConversation = await upstashMemoryService.getRecentConversation(state.namespace, 10);
        const transcript = recentConversation
            .map((item) => `${item.role}: ${item.content}`)
            .join('\n');

        const summary = await llmService.generate(
            'Summarize the conversation for memory retrieval. Keep it concise and factual.',
            transcript
        );

        await upstashMemoryService.upsertSummary(state.namespace, summary);
    }

    return {};
}
