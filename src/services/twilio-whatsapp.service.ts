import twilio from 'twilio';
import type { ParsedIncomingMessage, TwilioWebhookBody } from '../types/webhook.types';

class TwilioWhatsAppService {
    public parseIncomingMessage(payload: TwilioWebhookBody): ParsedIncomingMessage | null {
        const from = payload.From?.trim();
        const text = payload.Body?.trim();

        if (!from || !text) {
            return null;
        }

        const phoneNumber = this.extractPhoneNumber(from);

        return {
            from,
            phoneNumber,
            text,
        };
    }

    private extractPhoneNumber(from: string): string {
        const normalized = from.replace(/^whatsapp:/i, '').trim();
        return normalized.replace(/[^\d+]/g, '');
    }

    public createXmlResponse(reply?: string): string {
        const twiml = new twilio.twiml.MessagingResponse();

        if (reply) {
            twiml.message(reply);
        }

        return twiml.toString();
    }
}

export default TwilioWhatsAppService;
