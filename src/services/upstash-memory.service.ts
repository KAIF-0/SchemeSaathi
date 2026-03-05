import UpstashConfig from '../config/upstash';
import upstashIndexService from './upstash-index.service';

export type MemoryRole = 'user' | 'assistant' | 'exchange' | 'profile';

export interface ProfileData {
    preferredLanguage?: PreferredLanguage;
    name?: string;
    age?: number;
    gender?: string;
    designation?: string;
    pendingField?: ProfileField;
}

export type PreferredLanguage = 'english' | 'hindi';

export type ProfileField = 'preferredLanguage' | 'name' | 'age' | 'gender' | 'designation';

interface UpstashVectorMatch {
    id?: string;
    data?: string;
    metadata?: Record<string, unknown>;
}

interface MemoryRecord {
    role: MemoryRole;
    content: string;
    timestamp: string;
}

class UpstashMemoryService {
    public getNamespace(phoneNumber: string): string {
        const normalized = phoneNumber.replace(/[^\d+]/g, '');
        return `${UpstashConfig.NAMESPACE_PREFIX}${normalized}`;
    }

    public async getRecentConversation(namespace: string, limit = 10): Promise<MemoryRecord[]> {
        const fetchLimit = Math.max(limit * 4, 40);
        const rows = await this.range(namespace, fetchLimit);
        // console.log(rows)
        const conversationRows = rows.filter((item) => {
            const role = item.metadata?.role;
            return role === 'user' || role === 'assistant' || role === 'exchange';
        });

        const parsed = this.expandConversationRows(conversationRows);

        if (parsed.length > 0) {
            return this.selectLatestByTimestamp(parsed, limit);
        }

        const fallbackQuery = await this.query(namespace, 'recent conversation', fetchLimit);
        const fallbackParsed = this.expandConversationRows(fallbackQuery);
        return this.selectLatestByTimestamp(fallbackParsed, limit);
    }

    public async upsertConversationExchange(namespace: string, userMessage: string, assistantMessage: string): Promise<void> {
        const timestamp = new Date().toISOString();
        const id = `${timestamp}_exchange_${Math.random().toString(36).slice(2, 10)}`;
        const content = `user: ${userMessage}\nassistant: ${assistantMessage}`;

        await this.upsert(namespace, [
            {
                id,
                data: content,
                metadata: {
                    role: 'exchange',
                    timestamp,
                    userMessage,
                    assistantMessage,
                },
            },
        ]);
    }

    public async getProfile(namespace: string): Promise<ProfileData> {
        const fetched = await this.fetchById(namespace, 'profile');
        if (!fetched?.data) {
            return {};
        }

        try {
            const parsed = JSON.parse(fetched.data) as ProfileData;
            return parsed ?? {};
        } catch {
            return {};
        }
    }

    public async upsertProfile(namespace: string, profile: ProfileData): Promise<void> {
        const timestamp = new Date().toISOString();
        await this.upsert(namespace, [
            {
                id: 'profile',
                data: JSON.stringify(profile),
                metadata: {
                    role: 'profile',
                    timestamp,
                },
            },
        ]);
    }

    public async querySchemes(question: string, topK = 5): Promise<UpstashVectorMatch[]> {
        return this.query(UpstashConfig.SCHEMES_NAMESPACE, question, topK, 'scheme');
    }

    private async upsert(
        namespace: string,
        vectors: Array<{
            id: string;
            data: string;
            metadata: Record<string, unknown>;
        }>
    ): Promise<void> {
        const batch = vectors.map((item) => ({
                id: item.id,
                data: item.data,
                metadata: item.metadata,
            }));

        await upstashIndexService.memoryIndex.upsert(batch, { namespace });
    }

    private async query(
        namespace: string,
        data: string,
        topK: number,
        target: 'memory' | 'scheme' = 'memory'
    ): Promise<UpstashVectorMatch[]> {
        const index = target === 'scheme'
            ? upstashIndexService.schemeIndex
            : upstashIndexService.memoryIndex;

        const response = await index.query({
            data,
            topK,
            includeData: true,
            includeMetadata: true,
        }, { namespace });

        return this.normalizeMatches(response);
    }

    private async range(namespace: string, limit: number): Promise<UpstashVectorMatch[]> {
        const response = await upstashIndexService.memoryIndex.range({
            cursor: 0,
            limit,
            includeData: true,
            includeMetadata: true,
        }, { namespace });

        return this.normalizeMatches(response);
    }

    private selectLatestByTimestamp(rows: MemoryRecord[], limit: number): MemoryRecord[] {
        if (rows.length <= limit) {
            return rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        }

        const sortedDesc = [...rows].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        const latest = sortedDesc.slice(0, limit);
        return latest.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    private async fetchById(namespace: string, id: string): Promise<UpstashVectorMatch | null> {
        const response = await upstashIndexService.memoryIndex.fetch(
            [id],
            { namespace, includeData: true, includeMetadata: true }
        );

        const matches = this.normalizeMatches(response);
        return matches[0] ?? null;
    }

    private normalizeMatches(candidate: unknown): UpstashVectorMatch[] {
        if (Array.isArray(candidate)) {
            return candidate
                .map((item) => this.toVectorMatch(item))
                .filter((item): item is UpstashVectorMatch => item !== null);
        }

        if (candidate && typeof candidate === 'object') {
            const record = candidate as Record<string, unknown>;
            const nested = record.result ?? record.matches ?? record.vectors;
            if (Array.isArray(nested)) {
                return nested
                    .map((item) => this.toVectorMatch(item))
                    .filter((item): item is UpstashVectorMatch => item !== null);
            }
        }

        return [];
    }

    private expandConversationRows(rows: UpstashVectorMatch[]): MemoryRecord[] {
        const expanded: MemoryRecord[] = [];

        for (const item of rows) {
            const role = item.metadata?.role;
            const timestamp = item.metadata?.timestamp;
            if (typeof role !== 'string' || typeof timestamp !== 'string') {
                continue;
            }

            if (role === 'exchange') {
                const userMessage = typeof item.metadata?.userMessage === 'string' ? item.metadata.userMessage : '';
                const assistantMessage = typeof item.metadata?.assistantMessage === 'string' ? item.metadata.assistantMessage : '';

                if (userMessage) {
                    expanded.push({
                        role: 'user',
                        content: userMessage,
                        timestamp,
                    });
                }

                if (assistantMessage) {
                    expanded.push({
                        role: 'assistant',
                        content: assistantMessage,
                        timestamp,
                    });
                }

                continue;
            }

            expanded.push({
                role: role as MemoryRole,
                content: typeof item.data === 'string' ? item.data : '',
                timestamp,
            });
        }

        return expanded.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    private toVectorMatch(raw: unknown): UpstashVectorMatch | null {
        if (!raw || typeof raw !== 'object') {
            return null;
        }

        const record = raw as Record<string, unknown>;
        const metadata = record.metadata;

        return {
            id: typeof record.id === 'string' ? record.id : undefined,
            data: typeof record.data === 'string' ? record.data : undefined,
            metadata: metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : undefined,
        };
    }
}

export default new UpstashMemoryService();
