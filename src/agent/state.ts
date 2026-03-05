import { Annotation } from '@langchain/langgraph';
import type { ProfileData, ProfileField } from '../services/upstash-memory.service';

export type IntentType = 'scheme_query' | 'memory_query' | 'general_query' | 'profile_update' | 'unknown';

export interface AgentInput {
    phoneNumber: string;
    message: string;
}

export const AgentStateAnnotation = Annotation.Root({
    phoneNumber: Annotation<string>(),
    namespace: Annotation<string>(),
    userMessage: Annotation<string>(),
    memoryContext: Annotation<string>(),
    profile: Annotation<ProfileData>(),
    missingField: Annotation<ProfileField | null>(),
    intent: Annotation<IntentType>(),
    requiresSchemeRag: Annotation<boolean>(),
    schemeQueryText: Annotation<string>(),
    ragContext: Annotation<string>(),
    finalResponse: Annotation<string>(),
    shouldEndAfterValidation: Annotation<boolean>(),
});

export type AgentState = typeof AgentStateAnnotation.State;
