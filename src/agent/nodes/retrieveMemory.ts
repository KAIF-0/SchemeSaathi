import type { AgentState } from '../state';
import upstashMemoryService from '../../services/upstash-memory.service';

export async function retrieveMemory(state: AgentState): Promise<Partial<AgentState>> {
    const namespace = upstashMemoryService.getNamespace(state.phoneNumber);
    const recentConversation = await upstashMemoryService.getRecentConversation(namespace, 10);
    const profile = await upstashMemoryService.getProfile(namespace);

    const memoryContext = recentConversation
        .map((item) => `${item.role}: ${item.content}`)
        .join('\n');

    return {
        namespace,
        memoryContext,
        profile,
    };
}
