class LlmConfig {
    private static getRequiredEnv(key: string): string {
        const value = Bun.env[key] ?? process.env[key];
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }

    public static get OPENAI_API_KEY(): string {
        return Bun.env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? this.getRequiredEnv('GOOGLE_API_KEY');
    }

    public static get MODEL(): string {
        return Bun.env.OPENAI_MODEL ?? process.env.OPENAI_MODEL ?? Bun.env.GEMINI_MODEL ?? process.env.GEMINI_MODEL ?? 'gpt-4o-mini';
    }

    public static get BASE_URL(): string {
        return Bun.env.OPENAI_BASE_URL
            ?? process.env.OPENAI_BASE_URL
            ?? Bun.env.OPENAPI_BASE_URL
            ?? process.env.OPENAPI_BASE_URL
            ?? 'https://api.sarvam.ai/v1';
    }

    public static get TEMPERATURE(): number {
        const raw = Bun.env.OPENAI_TEMPERATURE ?? process.env.OPENAI_TEMPERATURE ?? Bun.env.GEMINI_TEMPERATURE ?? process.env.GEMINI_TEMPERATURE ?? '0.2';
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0.2;
    }

    public static get TIMEOUT_MS(): number {
        const raw = Bun.env.OPENAI_TIMEOUT_MS ?? process.env.OPENAI_TIMEOUT_MS ?? Bun.env.GEMINI_TIMEOUT_MS ?? process.env.GEMINI_TIMEOUT_MS ?? '10000';
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 10000;
    }
}

export default LlmConfig;
