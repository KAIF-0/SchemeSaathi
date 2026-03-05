import type { AgentState } from '../state';
import upstashMemoryService from '../../services/upstash-memory.service';
import type { ProfileData } from '../../services/upstash-memory.service';
import {
    getFieldPrompt,
    getMissingField,
    normalizeProfileFieldValue,
} from './helpers/profile.helper';

export async function validateProfile(state: AgentState): Promise<Partial<AgentState>> {
    const profile: ProfileData = { ...(state.profile ?? {}) };
    const hadPendingField = Boolean(profile.pendingField);

    if (profile.pendingField) {
        const updatedValue = normalizeProfileFieldValue(profile.pendingField, state.userMessage);

        if (updatedValue === null) {
            return {
                profile,
                missingField: profile.pendingField,
                shouldEndAfterValidation: true,
                finalResponse: getFieldPrompt(profile.pendingField, profile),
            };
        }

        profile[profile.pendingField] = updatedValue as never;
        profile.pendingField = undefined;
        await upstashMemoryService.upsertProfile(state.namespace, profile);
    }

    const missingField = getMissingField(profile);

    if (missingField) {
        profile.pendingField = missingField;
        await upstashMemoryService.upsertProfile(state.namespace, profile);

        return {
            profile,
            missingField,
            shouldEndAfterValidation: true,
            finalResponse: getFieldPrompt(missingField, profile),
        };
    }

    if (hadPendingField) {
        const language = profile.preferredLanguage === 'hindi' ? 'hindi' : 'english';
        const completionResponse = language === 'hindi'
            ? 'धन्यवाद! आपकी प्रोफ़ाइल पूरी हो गई है। SchemeSaathi आपको सरकारी योजनाओं के बारे में जानकारी देकर और सही योजनाएँ सुझाकर मदद कर सकता है।'
            : 'Thank you for completing your profile! SchemeSaathi can now help you discover and understand government schemes that are right for you.';

        return {
            profile,
            missingField: null,
            shouldEndAfterValidation: true,
            finalResponse: completionResponse,
        };
    }

    return {
        profile,
        missingField: null,
        shouldEndAfterValidation: false,
    };
}
