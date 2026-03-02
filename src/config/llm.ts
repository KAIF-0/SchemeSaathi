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
        return Bun.env.GEMINI_MODEL ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
    }

    public static get TEMPERATURE(): number {
        const raw = Bun.env.GEMINI_TEMPERATURE ?? process.env.GEMINI_TEMPERATURE ?? '0.2';
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0.2;
    }
}

export default LlmConfig;
