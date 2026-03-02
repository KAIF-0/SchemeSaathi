import type { AgentState } from '../state';
import upstashMemoryService from '../../services/upstash-memory.service';
import type { PreferredLanguage, ProfileData, ProfileField } from '../../services/upstash-memory.service';

const requiredFields: ProfileField[] = ['preferredLanguage', 'name', 'age', 'gender', 'designation'];

const bilingualLanguagePrompt = 'Which language do you prefer? Please reply with English or Hindi.\nआप कौन सी भाषा पसंद करते हैं? कृपया English या Hindi में जवाब दें।';

const englishFieldPrompts: Record<Exclude<ProfileField, 'preferredLanguage'>, string> = {
    name: 'Please share your full name to continue.',
    age: 'Please share your age in years to continue.',
    gender: 'Please share your gender (Male/Female/Other).',
    designation: 'Please share your current designation or occupation to continue.',
};

const hindiFieldPrompts: Record<Exclude<ProfileField, 'preferredLanguage'>, string> = {
    name: 'कृपया आगे बढ़ने के लिए अपना पूरा नाम बताइए।',
    age: 'कृपया अपनी उम्र (सालों में) बताइए।',
    gender: 'कृपया अपना जेंडर बताइए (पुरुष/महिला/अन्य)।',
    designation: 'कृपया अपना वर्तमान पेशा या पद बताइए।',
};

function detectPreferredLanguage(value: string): PreferredLanguage | null {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
        return null;
    }

    if (normalized.includes('english') || normalized.includes('inglish') || normalized.includes('अंग्रेज')) {
        return 'english';
    }

    if (normalized.includes('hindi') || normalized.includes('हिंदी') || normalized.includes('हिन्दी')) {
        return 'hindi';
    }

    return null;
}

function getPreferredLanguage(profile: ProfileData): PreferredLanguage {
    return profile.preferredLanguage === 'hindi' ? 'hindi' : 'english';
}

function getFieldPrompt(field: ProfileField, profile: ProfileData): string {
    if (field === 'preferredLanguage') {
        return bilingualLanguagePrompt;
    }

    const language = getPreferredLanguage(profile);
    return language === 'hindi' ? hindiFieldPrompts[field] : englishFieldPrompts[field];
}

function normalizeProfileFieldValue(field: ProfileField, value: string): string | number | null {
    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    if (field === 'preferredLanguage') {
        return detectPreferredLanguage(trimmed);
    }

    if (field === 'age') {
        const numericAge = Number(trimmed.replace(/[^\d]/g, ''));
        if (!Number.isFinite(numericAge) || numericAge <= 0 || numericAge > 120) {
            return null;
        }
        return numericAge;
    }

    return trimmed;
}

function getMissingField(profile: ProfileData): ProfileField | null {
    for (const field of requiredFields) {
        const value = profile[field];
        if (value === undefined || value === null || value === '') {
            return field;
        }
    }
    return null;
}

export async function validateProfile(state: AgentState): Promise<Partial<AgentState>> {
    const profile: ProfileData = { ...(state.profile ?? {}) };

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

    return {
        profile,
        missingField: null,
        shouldEndAfterValidation: false,
    };
}
