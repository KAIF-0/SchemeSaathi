import type { IntentType } from '../../state';

const validIntents: IntentType[] = ['scheme_query', 'memory_query', 'general_query', 'profile_update', 'unknown'];

export function getIntentLabels(): string {
    return validIntents.join(', ');
}

export function parseIntent(raw: string): IntentType {
    const normalized = raw.trim().toLowerCase();
    const direct = normalized.replace(/[^a-z_]/g, '');

    if (validIntents.includes(direct as IntentType)) {
        return direct as IntentType;
    }

    for (const intent of validIntents) {
        if (normalized.includes(intent)) {
            return intent;
        }
    }

    return 'unknown';
}

export function isProfileUpdateQuery(message: string): boolean {
    const normalized = message.trim().toLowerCase();
    if (!normalized) {
        return false;
    }

    const updateAction = /\b(update|change|modify|correct|edit)\b|अपडेट|बदल|चेंज|सुधार/.test(normalized);
    const profileField = /\b(name|age|gender|designation|occupation|profession|preferred\s*language|language)\b|नाम|उम्र|जेंडर|लिंग|पेशा|भाषा/.test(normalized);

    return updateAction && profileField;
}
