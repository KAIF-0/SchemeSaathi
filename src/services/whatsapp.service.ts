import type { ParsedIncomingMessage, WhatsAppWebhookPayload } from '../types/webhook.types';

class WhatsAppService {
    private readonly baseUrl = 'https://graph.facebook.com/v18.0';

    constructor(
        private readonly accessToken: string,
        private readonly phoneNumberId: string
    ) {}

    public parseIncomingMessage(payload: WhatsAppWebhookPayload): ParsedIncomingMessage | null {
        const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (!message?.from) {
            return null;
        }

        const text = message.text?.body?.trim();
        if (!text) {
            return null;
        }

        return {
            from: message.from,
            text,
        };
    }

    public async sendTextMessage(to: string, body: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to,
                text: { body },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`WhatsApp API failed (${response.status}): ${errorBody}`);
        }
    }
}

export default WhatsAppService;
