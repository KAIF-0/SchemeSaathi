import type { AgentState } from '../state';
import upstashMemoryService from '../../services/upstash-memory.service';

export async function retrieveMemory(state: AgentState): Promise<Partial<AgentState>> {
    const namespace = upstashMemoryService.getNamespace(state.phoneNumber);
    const recentConversation = await upstashMemoryService.getRecentConversation(namespace, 6);
    const profile = await upstashMemoryService.getProfile(namespace);

    // console.log(`Retrieved memory for ${state.phoneNumber}:`, { recentConversation });

    const memoryContext = recentConversation
        .map((item) => `${item.role}: ${item.content}`)
        .join('\n');

    return {
        namespace,
        memoryContext,
        profile,
    };
}
