import { Hono } from 'hono'
import AppRoutes from './routes/app.routes';
import RequestMiddleware from './middleware/request.middleware';
import { logger } from 'hono/logger';

const app = new Hono();
app.use(logger());

app.route("/api/v1", AppRoutes.app);

//for error 500 (middleware)
app.onError(RequestMiddleware.error);

//for 404 (middleware)
app.notFound(RequestMiddleware.notFound);

export default app