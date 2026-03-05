export interface RetrievedScheme {
    name: string;
    description: string;
    link: string;
}

interface ProfileLike {
    age?: number;
    gender?: string;
    designation?: string;
}

export function extractSchemes(matches: Array<{ data?: string; metadata?: Record<string, unknown> }>): RetrievedScheme[] {
    const schemes = matches.map((match) => {
        const metadata = match.metadata ?? {};
        const name = typeof metadata.name === 'string' && metadata.name.trim()
            ? metadata.name.trim()
            : 'Scheme';
        const description = typeof metadata.desc === 'string' && metadata.desc.trim()
            ? metadata.desc.trim()
            : (typeof match.data === 'string' ? match.data : '');
        const link = typeof metadata.link === 'string' ? metadata.link.trim() : '';

        return { name, description, link };
    });

    const seenLinks = new Set<string>();
    return schemes.filter((scheme) => {
        if (!scheme.link) {
            return true;
        }
        if (seenLinks.has(scheme.link)) {
            return false;
        }
        seenLinks.add(scheme.link);
        return true;
    });
}

export function getDetailSchemeName(schemeQueryText: string): string | null {
    const trimmed = schemeQueryText.trim();
    if (!trimmed.startsWith('DETAIL::')) {
        return null;
    }

    const name = trimmed.slice('DETAIL::'.length).trim();
    return name || null;
}

export function buildProfileAwareSearchQuery(baseQuery: string, profile: ProfileLike): string {
    const profileParts: string[] = [];
    if (typeof profile.age === 'number') {
        profileParts.push(`age ${profile.age}`);
    }
    if (typeof profile.gender === 'string' && profile.gender.trim()) {
        profileParts.push(`gender ${profile.gender.trim()}`);
    }
    if (typeof profile.designation === 'string' && profile.designation.trim()) {
        profileParts.push(`occupation ${profile.designation.trim()}`);
    }

    if (profileParts.length === 0) {
        return baseQuery;
    }

    return `${baseQuery} for profile ${profileParts.join(', ')}`;
}
