export interface WhatsAppMessage {
    from: string;
    text?: {
        body?: string;
    };
}

export interface WhatsAppWebhookPayload {
    entry?: Array<{
        changes?: Array<{
            value?: {
                messages?: WhatsAppMessage[];
            };
        }>;
    }>;
}

export interface ParsedIncomingMessage {
    from: string;
    text: string;
}
