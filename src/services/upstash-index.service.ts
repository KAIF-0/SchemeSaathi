import { Index } from '@upstash/vector';
import UpstashConfig from '../config/upstash';

class UpstashIndexService {
    public readonly memoryIndex: Index = new Index({
        url: UpstashConfig.MEMORY_VECTOR_REST_URL,
        token: UpstashConfig.MEMORY_VECTOR_REST_TOKEN,
    });

    public readonly schemeIndex: Index = new Index({
        url: UpstashConfig.SCHEME_VECTOR_REST_URL,
        token: UpstashConfig.SCHEME_VECTOR_REST_TOKEN,
    });
}

export default new UpstashIndexService();
