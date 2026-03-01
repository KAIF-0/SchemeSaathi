import { Hono } from 'hono';
import WebhookController from '../controllers/webhook.controller';
import RequestUtils from '../utils/request.utils';

class AppRoutes {
    public static app = new Hono();

    static {
        AppRoutes.register();
    }

    private static register() {
        this.app.get('/', RequestUtils.asyncHandler(async (c) => {
            return c.json({
                success: true,
                message: 'OK',
            });
        }));

        this.app.get('/webhook', RequestUtils.asyncHandler(async (c) => WebhookController.verify(c)));
        this.app.post('/webhook', RequestUtils.asyncHandler(async (c) => WebhookController.receive(c)));
    }
}

export default AppRoutes;
