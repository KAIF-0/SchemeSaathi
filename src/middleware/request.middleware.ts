import type { Context } from "hono";
import { HTTPException } from 'hono/http-exception'

class RequestMiddleware {
    public static error(err: Error | HTTPException | unknown, c: Context) {
        if (err instanceof HTTPException) {
            return c.json(
                {
                    success: false,
                    message: err.message || "Request Failed!",
                },
                err.status
            );
        }

        const errorMessage = err instanceof Error ? err.message : "Internal Server Error!";
        console.error(errorMessage);
        return c.json(
            {
                success: false,
                message: errorMessage,
            },
            500
        );
    }

    public static notFound(c: Context) {
        return c.json(
            {
                success: false,
                message: "Not Found!",
            },
            404
        );
    }
}

export default RequestMiddleware;