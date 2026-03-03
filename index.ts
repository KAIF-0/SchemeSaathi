import app from "./src/main"

Bun.serve({
    port: 8080,
    fetch: app.fetch,
})