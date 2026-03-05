class LlmConfig {
    private static getRequiredEnv(key: string): string {
        const value = Bun.env[key] ?? process.env[key];
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }

    public static get GOOGLE_API_KEY(): string {
        return this.getRequiredEnv('GOOGLE_API_KEY');
    }

    public static get MODEL(): string {
        return Bun.env.GEMINI_MODEL ?? process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite-preview';
    }

    public static get TEMPERATURE(): number {
        const raw = Bun.env.GEMINI_TEMPERATURE ?? process.env.GEMINI_TEMPERATURE ?? '0.2';
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0.2;
    }

    public static get TIMEOUT_MS(): number {
        const raw = Bun.env.GEMINI_TIMEOUT_MS ?? process.env.GEMINI_TIMEOUT_MS ?? '10000';
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 10000;
    }
}

export default LlmConfig;
