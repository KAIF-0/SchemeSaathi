FROM oven/bun:1 AS builder
WORKDIR /app
COPY ./package.json ./bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 8080
CMD ["bun", "run", "start"]