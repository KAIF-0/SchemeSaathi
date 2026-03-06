import type { AgentState } from '../state';
import llmService from '../../services/llm';
import upstashMemoryService, { type ProfileField } from '../../services/upstash-memory.service';
import {
    buildInvalidProfileUpdateValueMessage,
    buildProfileUpdateExtractionPrompt,
    buildProfileUpdatedMessage,
    buildProfileUpdateHelpMessage,
    buildUnknownFieldMessage,
    parseProfileUpdateExtraction,
} from './helpers/profile-update.helper';
import { normalizeProfileFieldValue } from './helpers/profile.helper';

export async function profileUpdate(state: AgentState): Promise<Partial<AgentState>> {
    const profile = { ...(state.profile ?? {}) };
    const extractionPrompt = buildProfileUpdateExtractionPrompt(profile, state.userMessage);
    const extractionRaw = await llmService.generate(
        'You are an information extraction engine. Return strict JSON only.',
        extractionPrompt
    );
    const extraction = parseProfileUpdateExtraction(extractionRaw);

    if (extraction.updates.length === 0) {
        if (extraction.unknownFields.length > 0) {
            return {
                finalResponse: buildUnknownFieldMessage(profile, extraction.unknownFields),
                requiresSchemeRag: false,
                schemeQueryText: '',
            };
        }

        return {
            finalResponse: buildProfileUpdateHelpMessage(profile),
            requiresSchemeRag: false,
            schemeQueryText: '',
        };
    }

    const appliedUpdates: Array<{ field: ProfileField; value: string | number }> = [];

    for (const update of extraction.updates) {
        const normalizedValue = normalizeProfileFieldValue(update.field, update.value);
        if (normalizedValue === null) {
            return {
                finalResponse: buildInvalidProfileUpdateValueMessage(profile, update.field),
                requiresSchemeRag: false,
                schemeQueryText: '',
            };
        }

        profile[update.field] = normalizedValue as never;
        appliedUpdates.push({ field: update.field, value: normalizedValue });
    }

    await upstashMemoryService.upsertProfile(state.namespace, profile);

    let finalResponse = buildProfileUpdatedMessage(profile, appliedUpdates);
    if (extraction.unknownFields.length > 0) {
        finalResponse = `${finalResponse}\n\n${buildUnknownFieldMessage(profile, extraction.unknownFields)}`;
    }

    return {
        profile,
        finalResponse,
        requiresSchemeRag: false,
        schemeQueryText: '',
    };
}
