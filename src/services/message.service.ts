import { runWhatsappAgent } from '../agent/graph.ts';
import upstashMemoryService from './upstash-memory.service';
import { LlmTimeoutError } from './llm';

class MessageService {
    public async generateReply(phoneNumber: string, incomingText: string): Promise<string> {
        try {
            const reply = await runWhatsappAgent({
                phoneNumber,
                message: incomingText,
            });

            if (!reply.trim()) {
                return this.getTimeoutFallback(phoneNumber);
            }

            return reply;
        } catch (error) {
            if (error instanceof LlmTimeoutError) {
                return this.getTimeoutFallback(phoneNumber);
            }
            throw error;
        }
    }

    private async getTimeoutFallback(phoneNumber: string): Promise<string> {
        try {
            const namespace = upstashMemoryService.getNamespace(phoneNumber);
            const profile = await upstashMemoryService.getProfile(namespace);
            const preferredLanguage = profile.preferredLanguage === 'hindi' ? 'hindi' : 'english';

            if (preferredLanguage === 'hindi') {
                return 'माफ़ कीजिए, एजेंट अभी जवाब नहीं दे रहा है। कृपया थोड़ी देर बाद फिर से कोशिश करें।';
            }

            return 'Sorry, the agent is not responding right now. Please try again later.';
        } catch {
            return 'Sorry, the agent is not responding right now. Please try again later.';
        }
    }
}

export default MessageService;
