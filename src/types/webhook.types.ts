export interface TwilioWebhookBody {
    Body?: string;
    From?: string;
}

export interface ParsedIncomingMessage {
    from: string;
    phoneNumber: string;
    text: string;
}
