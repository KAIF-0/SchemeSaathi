class UpstashConfig {
    private static getRequiredEnv(key: string): string {
        const value = Bun.env[key] ?? process.env[key];
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }

    public static get MEMORY_VECTOR_REST_URL(): string {
        return this.getRequiredEnv('UPSTASH_WHATSAPP_AGENT_MEMORY_VECTOR_REST_URL');
    }

    public static get MEMORY_VECTOR_REST_TOKEN(): string {
        return this.getRequiredEnv('UPSTASH_WHATSAPP_AGENT_MEMORY_VECTOR_REST_TOKEN');
    }

    public static get SCHEME_VECTOR_REST_URL(): string {
        return this.getRequiredEnv('UPSTASH_SCHEME_INDEX_VECTOR_REST_URL');
    }

    public static get SCHEME_VECTOR_REST_TOKEN(): string {
        return this.getRequiredEnv('UPSTASH_SCHEME_INDEX_VECTOR_REST_TOKEN');
    }

    public static get SCHEMES_NAMESPACE(): string {
        return Bun.env.UPSTASH_SCHEMES_NAMESPACE ?? process.env.UPSTASH_SCHEMES_NAMESPACE ?? 'schemes_index';
    }

    public static get NAMESPACE_PREFIX(): string {
        return 'whatsapp_';
    }
}

export default UpstashConfig;
