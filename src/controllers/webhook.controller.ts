import type { Context } from 'hono';
import type { TwilioWebhookBody } from '../types/webhook.types';
import MessageService from '../services/message.service';
import TwilioWhatsAppService from '../services/twilio-whatsapp.service';

class WebhookController {
    private static readonly twilioWhatsAppService = new TwilioWhatsAppService();
    private static readonly messageService = new MessageService();

    public static async receive(c: Context): Promise<Response> {
        const rawBody = await c.req.parseBody();
        const payload: TwilioWebhookBody = {
            Body: WebhookController.getFormField(rawBody, 'Body'),
            From: WebhookController.getFormField(rawBody, 'From'),
        };

        const incomingMessage = WebhookController.twilioWhatsAppService.parseIncomingMessage(payload);

        if (!incomingMessage) {
            const emptyXmlResponse = WebhookController.twilioWhatsAppService.createXmlResponse();
            return c.body(emptyXmlResponse, 200, {
                'Content-Type': 'text/xml',
            });
        }

        console.log('Message from:', incomingMessage.from);
        console.log('Text:', incomingMessage.text);

        let reply: string;
        try {
            reply = await WebhookController.messageService.generateReply(
                incomingMessage.phoneNumber,
                incomingMessage.text
            );
        } catch (error) {
            console.error('Failed to generate reply:', error);
            reply = 'Sorry, I am facing a temporary delay. Please try again in a moment.';
        }
        const xmlResponse = WebhookController.twilioWhatsAppService.createXmlResponse(reply);

        return c.body(xmlResponse, 200, {
            'Content-Type': 'text/xml',
        });
    }

    private static getFormField(
        formBody: Record<string, string | File | (string | File)[]>,
        key: string
    ): string | undefined {
        const value = formBody[key];

        if (typeof value === 'string') {
            return value;
        }

        return undefined;
    }
}

export default WebhookController;
