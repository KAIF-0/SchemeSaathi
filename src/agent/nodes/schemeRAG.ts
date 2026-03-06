import type { AgentState } from '../state';
import upstashMemoryService from '../../services/upstash-memory.service';
import llmService from '../../services/llm';
import AppConfig from '../../config/app';
import {
    buildProfileAwareSearchQuery,
    extractSchemes,
    getDetailSchemeName,
} from './helpers/scheme.helper';

export async function schemeRAG(state: AgentState): Promise<Partial<AgentState>> {
    if (!state.requiresSchemeRag) {
        return {
            ragContext: '',
        };
    }

    const detailSchemeName = getDetailSchemeName(state.schemeQueryText || '');
    const baseQuery = detailSchemeName
        ? `${detailSchemeName} detailed eligibility benefits required documents step by step process official link`
        : (state.schemeQueryText || state.userMessage || '').trim();
    const searchQuery = detailSchemeName
        ? baseQuery
        : buildProfileAwareSearchQuery(baseQuery, state.profile ?? {});
    const matches = await upstashMemoryService.querySchemes(searchQuery, 5);
    const retrievedSchemes = extractSchemes(matches);

    const schemesContext = retrievedSchemes
        .map((scheme, index) => {
            return [
                `Scheme ${index + 1}:`,
                `Name: ${scheme.name}`,
                `Description: ${scheme.description}`,
                `Link: ${scheme.link || 'N/A'}`,
            ].join('\n');
        })
        .join('\n\n');

    const preferredLanguage = state.profile?.preferredLanguage === 'hindi' ? 'Hindi' : 'English';

    const ragAnswer = await llmService.generate(
        `You are ${AppConfig.APP_NAME}. You provide Indian government scheme guidance based only on retrieved scheme snippets and user profile.`,
        [
            `Respond strictly in ${preferredLanguage}.`,
            `User profile: ${JSON.stringify(state.profile ?? {})}`,
            `User question: ${searchQuery}`,
            `Retrieved schemes:\n${schemesContext || 'No relevant schemes found.'}`,
            detailSchemeName
                ? `Explain ONLY this scheme in detail: ${detailSchemeName}. Do not include any other scheme.`
                : 'Generate a concise, practical answer suitable for WhatsApp text.',
            detailSchemeName
                ? 'Include short sections for eligibility, benefits, required documents, and how to apply. Include one official link.'
                : 'Recommend top most relevant schemes clearly with short reasons. Provide the direct link for ONLY the schemes you have recommended, exactly as it appears in the retrieved snippet.',
        ].join('\n\n')
    );

    return {
        ragContext: ragAnswer.trim(),
    };
}
