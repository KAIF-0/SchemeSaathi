import app from "./src/main"

Bun.serve({
    port: 5000,
    fetch: app.fetch,
})