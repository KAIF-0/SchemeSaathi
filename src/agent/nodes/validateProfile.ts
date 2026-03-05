import type { AgentState } from '../state';
import upstashMemoryService from '../../services/upstash-memory.service';
import type { PreferredLanguage, ProfileData, ProfileField } from '../../services/upstash-memory.service';

const requiredFields: ProfileField[] = ['preferredLanguage', 'name', 'age', 'gender', 'designation'];

const bilingualLanguagePrompt = 'Welcome to SchemeSaathi! I am here to help you find the right government schemes. Which language do you prefer? Please reply with English or Hindi.\n\nस्कीमसाथी में आपका स्वागत है! मैं आपके लिए सही सरकारी योजनाएँ ढूँढने में मदद करने के लिए यहाँ हूँ। आप कौन सी भाषा पसंद करते हैं? कृपया English या Hindi में जवाब दें।';

const englishFieldPrompts: Record<Exclude<ProfileField, 'preferredLanguage'>, string> = {
    name: 'Thanks for sharing. Could you please tell me your full name?',
    age: 'Great. May I know your age in years?',
    gender: 'Thank you. Please tell me your gender (Male/Female/Other).',
    designation: 'Almost done. Please share your current designation or occupation.',
};

const hindiFieldPrompts: Record<Exclude<ProfileField, 'preferredLanguage'>, string> = {
    name: 'धन्यवाद। कृपया अपना पूरा नाम बताइए।',
    age: 'बहुत बढ़िया। कृपया अपनी उम्र (सालों में) बताइए।',
    gender: 'धन्यवाद। कृपया अपना जेंडर बताइए (पुरुष/महिला/अन्य)।',
    designation: 'लगभग हो गया। कृपया अपना वर्तमान पेशा या पद बताइए।',
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
        if (!isValidAgeInput(trimmed)) {
            return null;
        }

        const numericAge = Number(trimmed.replace(/[^\d]/g, ''));
        if (!Number.isFinite(numericAge) || numericAge <= 0 || numericAge > 120) {
            return null;
        }
        return numericAge;
    }

    if (field === 'name') {
        if (!isValidNameInput(trimmed)) {
            return null;
        }
        return trimmed;
    }

    if (field === 'gender') {
        const normalizedGender = normalizeGender(trimmed);
        return normalizedGender;
    }

    if (field === 'designation') {
        if (!isValidDesignationInput(trimmed)) {
            return null;
        }
        return trimmed;
    }

    return trimmed;
}

function isValidAgeInput(value: string): boolean {
    const normalized = value.toLowerCase();
    const hasAgeHint = normalized.includes('year') || normalized.includes('yrs') || normalized.includes('age') || normalized.includes('साल') || normalized.includes('उम्र');
    const numericPart = value.replace(/[^\d]/g, '');
    if (numericPart.length === 0) {
        return false;
    }

    if (/[^\d\s.,/-a-zA-Z\u0900-\u097F]/.test(value)) {
        return false;
    }

    if (/[a-zA-Z\u0900-\u097F]/.test(value) && !hasAgeHint) {
        return false;
    }

    return true;
}

function isValidNameInput(value: string): boolean {
    if (value.length < 2 || value.length > 60) {
        return false;
    }

    if (/\d/.test(value)) {
        return false;
    }

    if (!/[a-zA-Z\u0900-\u097F]/.test(value)) {
        return false;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'male' || normalized === 'female' || normalized === 'other' || normalized === 'पुरुष' || normalized === 'महिला' || normalized === 'अन्य') {
        return false;
    }

    return true;
}

function normalizeGender(value: string): string | null {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
        return null;
    }

    if (normalized === 'male' || normalized === 'm' || normalized === 'पुरुष') {
        return 'Male';
    }

    if (normalized === 'female' || normalized === 'f' || normalized === 'महिला') {
        return 'Female';
    }

    if (normalized === 'other' || normalized === 'others' || normalized === 'o' || normalized === 'अन्य') {
        return 'Other';
    }

    return null;
}

function isValidDesignationInput(value: string): boolean {
    if (value.length < 2 || value.length > 80) {
        return false;
    }

    if (!/[a-zA-Z\u0900-\u097F]/.test(value)) {
        return false;
    }

    if (/^\d+$/.test(value)) {
        return false;
    }

    return true;
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
