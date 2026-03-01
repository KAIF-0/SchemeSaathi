class EnvConfig {
    private static getRequiredEnv(key: string): string {
        const value = Bun.env[key];
        // console.log(key, value);
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }

        return value;
    }

    public static get WHATSAPP_VERIFY_TOKEN(): string {
        return this.getRequiredEnv('WHATSAPP_VERIFY_TOKEN');
    }

    public static get WHATSAPP_ACCESS_TOKEN(): string {
        return this.getRequiredEnv('WHATSAPP_ACCESS_TOKEN');
    }

    public static get WHATSAPP_PHONE_NUMBER_ID(): string {
        return this.getRequiredEnv('WHATSAPP_PHONE_NUMBER_ID');
    }
}

export default EnvConfig;
