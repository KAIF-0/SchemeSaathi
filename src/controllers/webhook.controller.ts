import type { Context } from 'hono';
import EnvConfig from '../config/env.config';
import type { WhatsAppWebhookPayload } from '../types/webhook.types';
import WhatsAppService from '../services/whatsapp.service';

class WebhookController {
    private static readonly whatsAppService = new WhatsAppService(
        EnvConfig.WHATSAPP_ACCESS_TOKEN,
        EnvConfig.WHATSAPP_PHONE_NUMBER_ID
    );

    public static verify(c: Context) {
        const mode = c.req.query('hub.mode');
        const token = c.req.query('hub.verify_token');
        const challenge = c.req.query('hub.challenge');

        if (mode === 'subscribe' && token === EnvConfig.WHATSAPP_VERIFY_TOKEN && challenge) {
            return c.text(challenge, 200);
        }

        return c.text('Forbidden', 403);
    }

    public static async receive(c: Context): Promise<Response> {
        const payload = await c.req.json<WhatsAppWebhookPayload>();
        const incomingMessage = WebhookController.whatsAppService.parseIncomingMessage(payload);

        if (!incomingMessage) {
            return c.body(null, 200);
        }

        // console.log(incomingMessage.text);

        const reply = `You said: ${incomingMessage.text}`;
        await WebhookController.whatsAppService.sendTextMessage(incomingMessage.from, reply);

        return c.body(null, 200);
    }
}

export default WebhookController;
