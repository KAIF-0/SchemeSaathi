import type { AgentState } from '../state';
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

    return {};
}
