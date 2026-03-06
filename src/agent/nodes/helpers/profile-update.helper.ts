import type { ProfileData, ProfileField } from '../../../services/upstash-memory.service';
import { getPreferredLanguage } from './profile.helper';

export interface ProfileUpdateItem {
    field: ProfileField;
    value: string;
}

interface RawProfileUpdateItem {
    field?: string;
    value?: string;
}

interface RawProfileUpdateExtraction {
    updates?: RawProfileUpdateItem[];
    unknownFields?: string[];
}

export interface ParsedProfileUpdateExtraction {
    updates: ProfileUpdateItem[];
    unknownFields: string[];
}

function normalizeField(field: string): ProfileField | null {
    const normalized = field.trim().toLowerCase();

    if (normalized === 'designation' || normalized === 'occupation' || normalized === 'profession') {
        return 'designation';
    }

    if (normalized === 'name') {
        return 'name';
    }

    if (normalized === 'age') {
        return 'age';
    }

    if (normalized === 'gender') {
        return 'gender';
    }

    if (normalized === 'preferredlanguage' || normalized === 'preferred_language' || normalized === 'language') {
        return 'preferredLanguage';
    }

    return null;
}

export function buildProfileUpdateExtractionPrompt(profile: ProfileData, userMessage: string): string {
    const language = getPreferredLanguage(profile);

    return [
        `Preferred response language: ${language === 'hindi' ? 'Hindi' : 'English'}`,
        `Current profile: ${JSON.stringify(profile)}`,
        `User message: ${userMessage}`,
        'Extract all profile updates from user message.',
        'Allowed fields only: preferredLanguage, name, age, gender, designation.',
        'Return strict JSON only in this format:',
        '{"updates":[{"field":"name","value":"Rahul"}],"unknownFields":["address"]}',
        'Rules:',
        '- Include multiple updates if user updates multiple fields in one message.',
        '- Put unsupported fields (for example address, income, city) in unknownFields.',
        '- For language updates, use preferredLanguage field and value exactly user-provided text.',
        '- If no update found, return {"updates":[],"unknownFields":[]}.',
    ].join('\n');
}

export function parseProfileUpdateExtraction(raw: string): ParsedProfileUpdateExtraction {
    let parsed: RawProfileUpdateExtraction = {};

    try {
        parsed = JSON.parse(raw) as RawProfileUpdateExtraction;
    } catch {
        const jsonBlock = raw.match(/\{[\s\S]*\}/);
        if (jsonBlock?.[0]) {
            try {
                parsed = JSON.parse(jsonBlock[0]) as RawProfileUpdateExtraction;
            } catch {
                parsed = {};
            }
        }
    }

    const updates: ProfileUpdateItem[] = Array.isArray(parsed.updates)
        ? parsed.updates
            .map((item) => {
                const field = typeof item?.field === 'string' ? normalizeField(item.field) : null;
                const value = typeof item?.value === 'string' ? item.value.trim() : '';

                if (!field || !value) {
                    return null;
                }

                return { field, value };
            })
            .filter((item): item is ProfileUpdateItem => item !== null)
        : [];

    const unknownFields = Array.isArray(parsed.unknownFields)
        ? parsed.unknownFields
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item) => item.trim())
        : [];

    return {
        updates,
        unknownFields,
    };
}

export function buildProfileUpdateHelpMessage(profile: ProfileData): string {
    const language = getPreferredLanguage(profile);

    if (language === 'hindi') {
        return 'आप प्रोफ़ाइल अपडेट ऐसे कर सकते हैं: "मेरी उम्र 56 कर दो", "मेरा नाम राहुल कर दो", "मेरी भाषा हिंदी से अंग्रेज़ी कर दो"।';
    }

    return 'You can update profile like: "update my age to 56", "change my name to Rahul", "update my preferred language from Hindi to English".';
}

function getFieldLabel(field: ProfileField, language: 'english' | 'hindi'): string {
    if (language === 'hindi') {
        const map: Record<ProfileField, string> = {
            preferredLanguage: 'पसंदीदा भाषा',
            name: 'नाम',
            age: 'उम्र',
            gender: 'जेंडर',
            designation: 'पेशा/पद',
        };
        return map[field];
    }

    return field === 'preferredLanguage' ? 'preferred language' : field;
}

export function buildProfileUpdatedMessage(
    profile: ProfileData,
    updates: Array<{ field: ProfileField; value: string | number }>
): string {
    const language = getPreferredLanguage(profile);

    if (updates.length === 0) {
        return language === 'hindi'
            ? 'कोई अपडेट लागू नहीं हो पाया। कृपया फिर से कोशिश करें।'
            : 'No updates could be applied. Please try again.';
    }

    if (language === 'hindi') {
        const changes = updates
            .map((item) => `- ${getFieldLabel(item.field, language)}: ${item.value}`)
            .join('\n');
        return `ठीक है, आपकी प्रोफ़ाइल अपडेट कर दी गई है:\n${changes}`;
    }

    const changes = updates
        .map((item) => `- ${getFieldLabel(item.field, language)}: ${item.value}`)
        .join('\n');
    return `Done. I have updated your profile:\n${changes}`;
}

export function buildInvalidProfileUpdateValueMessage(profile: ProfileData, field: ProfileField): string {
    const language = getPreferredLanguage(profile);

    if (language === 'hindi') {
        const hints: Record<ProfileField, string> = {
            preferredLanguage: 'कृपया भाषा English या Hindi में बताइए।',
            name: 'कृपया सही पूरा नाम बताइए।',
            age: 'कृपया सही उम्र (सालों में) बताइए।',
            gender: 'कृपया जेंडर Male/Female/Other बताइए।',
            designation: 'कृपया सही पेशा या पद बताइए।',
        };

        return `यह वैल्यू सही नहीं लगी। ${hints[field]}`;
    }

    const hints: Record<ProfileField, string> = {
        preferredLanguage: 'Please use English or Hindi.',
        name: 'Please share a valid full name.',
        age: 'Please share a valid age in years.',
        gender: 'Please use Male/Female/Other.',
        designation: 'Please share a valid occupation/designation.',
    };

    return `That value does not look valid. ${hints[field]}`;
}

export function buildUnknownFieldMessage(profile: ProfileData, unknownFields: string[]): string {
    const language = getPreferredLanguage(profile);
    const fieldList = unknownFields.join(', ');

    if (language === 'hindi') {
        return `मैं इन फ़ील्ड्स को अपडेट नहीं कर सकता/सकती: ${fieldList}। आप इनमें से अपडेट कर सकते हैं: नाम, उम्र, जेंडर, पेशा/पद, पसंदीदा भाषा।`;
    }

    return `I cannot update these fields: ${fieldList}. You can update: name, age, gender, designation, preferred language.`;
}

