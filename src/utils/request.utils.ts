import type { Context, Next } from 'hono';
import { HTTPException } from "hono/http-exception";

class RequestUtils {
    public static asyncHandler(func: (c: Context, next: Next) => Response | Promise<Response>) {
        return async (c: Context, next: Next) => {
            try {
                return await func(c, next);
            } catch (err) {
                if (err instanceof HTTPException) {
                    throw err;
                }

                const message = err instanceof Error ? err.message : "Internal Server Error!";
                throw new HTTPException(500, { message });
            }
        };
    }
}
export default RequestUtils;