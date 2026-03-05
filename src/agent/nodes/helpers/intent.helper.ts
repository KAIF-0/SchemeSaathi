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
