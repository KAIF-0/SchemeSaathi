# Requirements Document: SchemeSaathi (Current Implementation)

## Purpose

This document reflects the **currently implemented** SchemeSaathi backend in this repository. It also marks planned items that are intentionally deferred.

## System Scope

SchemeSaathi is a WhatsApp-first assistant for Indian government scheme discovery.

Current implementation scope:
- Text-based WhatsApp interactions via Twilio webhook
- LangGraph orchestration for profile, intent, memory, and scheme retrieval
- English/Hindi response behavior using LLM prompting
- Per-user memory and profile persistence in Upstash Vector
- Scheme retrieval from Upstash Vector scheme index

Out of current scope (future):
- Audio transcription (STT)
- Text-to-speech (TTS)
- Subscription alerts
- Dedicated translation API service
- PostgreSQL/Redis-based persistence and analytics stack

## Functional Requirements (Implemented)

### Requirement 1: WhatsApp Webhook Processing
1. The API shall expose a webhook endpoint at `POST /api/v1/webhook`.
2. The webhook parser shall accept Twilio form fields `From` and `Body`.
3. If message text is empty or sender is missing, the API shall return an empty valid TwiML response.
4. For valid text input, the API shall route processing to the message service.

### Requirement 2: Agent-Orchestrated Message Processing
1. Message handling shall use LangGraph state orchestration.
2. The graph shall run nodes in this sequence with conditional branching:
   - `retrieveMemory -> validateProfile -> intentClassifier -> (memoryQuery|profileUpdate|schemeRAG|respond) -> updateMemory`
3. The final text response shall be returned as TwiML.

### Requirement 3: Profile Collection
1. The system shall collect these required profile fields:
   - `preferredLanguage`, `name`, `age`, `gender`, `designation`
2. The system shall ask for missing fields one by one.
3. The system shall persist profile in Upstash under id `profile` in the user namespace.
4. The system shall validate field values and reprompt when invalid.

### Requirement 4: Intent Classification and Routing
1. The system shall classify user intent into one of:
   - `scheme_query`, `memory_query`, `general_query`, `profile_update`, `unknown`
2. `memory_query` intent shall be routed to `memoryQuery`.
3. `profile_update` intent shall be routed to `profileUpdate`.
4. `scheme_query` intent shall set `requiresSchemeRag = true` and route to `schemeRAG`.

### Requirement 5: Scheme Retrieval (RAG)
1. The system shall query Upstash scheme index with top-k retrieval (`k=5`).
2. The system shall build profile-aware search text from user message and available profile fields.
3. The system shall generate a concise WhatsApp-friendly response using retrieved scheme snippets.
4. For detail-style references, the system shall build a detail query and return structured guidance style text.

### Requirement 6: Conversation Memory
1. The system shall store user-assistant exchange after every successful response.
2. The system shall retrieve recent conversation context for prompt grounding.
3. The system shall support ordinal reference resolution (for example first/second scheme) from prior assistant messages.

### Requirement 7: Language Behavior
1. The system shall support profile-level preference between English and Hindi.
2. The system shall generate responses in preferred language.
3. The language preference shall be used for prompts and fallbacks.

### Requirement 8: LLM Timeout Fallback
1. If LLM request times out, the system shall return a safe fallback message.
2. Fallback text shall use Hindi when profile preference is Hindi; otherwise English.

## Non-Functional Requirements (Current)

### Requirement 9: Runtime and Framework
1. Service shall run on Bun runtime.
2. API framework shall be Hono.
3. Default listening port shall be `8080`.

### Requirement 10: Storage
1. User memory/profile shall be persisted in Upstash Vector memory index using per-user namespace.
2. Scheme corpus shall be stored in Upstash Vector scheme index namespace.

### Requirement 11: Operational Scripts
1. The repository shall provide script to seed schemes to vector index.
2. The repository shall provide scripts to clean scheme and memory indexes.

## Deferred Requirements (Future)

### Future Requirement A: Audio Transcription (STT)
1. System will accept WhatsApp audio media messages.
2. System will transcribe audio (Whisper or equivalent) into text.
3. Transcribed text will enter the same LangGraph flow as text messages.
4. This is a planned feature and is not implemented yet.

### Future Requirement B: Translation Service Integration
1. Dedicated translation service integration (Bhashini/Google Translate) will be added.
2. Additional regional languages will be introduced beyond English/Hindi.

### Future Requirement C: Subscription and Alerts
1. Users will be able to opt into alerts for newly matching schemes.
2. Notification workflows and throttling will be introduced.

### Future Requirement D: Security, Analytics, and Governance
1. Request rate limiting, audit logging, and metrics endpoints will be added.
2. Data retention and deletion workflows will be formalized.

## Traceability to Current Source

Core implementation files:
- `src/controllers/webhook.controller.ts`
- `src/services/message.service.ts`
- `src/services/twilio-whatsapp.service.ts`
- `src/agent/graph.ts`
- `src/agent/state.ts`
- `src/agent/nodes/*.ts`
- `src/services/upstash-memory.service.ts`
- `src/services/upstash-index.service.ts`
- `src/services/llm.ts`
