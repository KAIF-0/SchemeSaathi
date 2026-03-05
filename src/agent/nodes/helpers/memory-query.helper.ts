interface ReferencedScheme {
    name: string;
    link?: string;
}

function cleanSchemeName(raw: string): string {
    const withoutMarkdown = raw.replace(/\*\*/g, '').replace(/\*/g, '').trim();
    const beforeColon = withoutMarkdown.split(':')[0]?.trim() ?? '';
    return beforeColon.replace(/\s+/g, ' ').trim();
}

function detectOrdinalIndex(message: string): number | null {
    const normalized = message.toLowerCase();

    const ordinalPatterns: Array<{ pattern: RegExp; index: number }> = [
        { pattern: /\bfirst\b|\b1st\b|\bone\b|\bपहला\b|\bपहली\b|\bपहले\b/, index: 0 },
        { pattern: /\bsecond\b|\b2nd\b|\btwo\b|\bदूसरा\b|\bदूसरी\b|\bदूसरे\b/, index: 1 },
        { pattern: /\bthird\b|\b3rd\b|\bthree\b|\bतीसरा\b|\bतीसरी\b|\bतीसरे\b/, index: 2 },
        { pattern: /\bfourth\b|\b4th\b|\bfour\b|\bचौथा\b|\bचौथी\b/, index: 3 },
        { pattern: /\bfifth\b|\b5th\b|\bfive\b|\bपांचवां\b|\bपाँचवां\b/, index: 4 },
    ];

    for (const item of ordinalPatterns) {
        if (item.pattern.test(normalized)) {
            return item.index;
        }
    }

    return null;
}

function extractSchemesFromMemory(memoryContext: string): ReferencedScheme[] {
    const lines = memoryContext.split('\n').map((line) => line.trim()).filter(Boolean);
    const results: ReferencedScheme[] = [];

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (!line) {
            continue;
        }

        const listMatch = line.match(/^\d+\.\s+(.+)$/);
        if (!listMatch) {
            continue;
        }

        const capturedName = listMatch[1];
        if (!capturedName) {
            continue;
        }

        const possibleName = cleanSchemeName(capturedName);
        if (!possibleName || possibleName.toLowerCase().startsWith('http')) {
            continue;
        }

        const nextLine = lines[index + 1] ?? '';
        const directLinkMatch = nextLine.match(/https?:\/\/\S+/i);
        const link = directLinkMatch ? directLinkMatch[0] : undefined;

        results.push({
            name: possibleName,
            link,
        });
    }

    return results.slice(-5);
}

export function resolveReferencedScheme(userMessage: string, memoryContext: string): ReferencedScheme | null {
    const ordinalIndex = detectOrdinalIndex(userMessage);
    if (ordinalIndex === null) {
        return null;
    }

    const schemes = extractSchemesFromMemory(memoryContext);
    return schemes[ordinalIndex] ?? null;
}

export function buildDetailQuery(schemeName: string): string {
    return `DETAIL::${schemeName}`;
}
