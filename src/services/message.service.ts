import { runWhatsappAgent } from '../agent/graph.ts';

class MessageService {
    public async generateReply(phoneNumber: string, incomingText: string): Promise<string> {
        return runWhatsappAgent({
            phoneNumber,
            message: incomingText,
        });
    }
}

export default MessageService;
