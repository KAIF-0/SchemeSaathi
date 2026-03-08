# Design Document: SchemeSaathi (Current Implementation)

## Overview

SchemeSaathi is implemented as a Bun + TypeScript service using Hono for HTTP handling and LangGraph for agent orchestration. The application processes incoming Twilio WhatsApp messages, retrieves user memory/profile from Upstash Vector, classifies intent, optionally performs scheme retrieval, generates a final response with Gemini / AWS Bedrock, and returns TwiML XML.

## Implemented Architecture

```text
+------------------+
| WhatsApp User    |
+--------+---------+
         |
         v
+------------------+
| Twilio WhatsApp  |
+--------+---------+
         |
         v
+------------------------------+
| Hono API                     |
| POST /api/v1/webhook         |
+---------------+--------------+
                |
                v
+------------------------------+
| WebhookController            |
| - parse body                 |
| - normalize sender/text      |
+---------------+--------------+
                |
                v
+------------------------------+
| MessageService               |
| - runWhatsappAgent()         |
| - timeout fallback           |
+---------------+--------------+
                |
                v
+------------------------------+
| LangGraph Orchestrator       |
| retrieveMemory               |
| validateProfile              |
| intentClassifier             |
| memoryQuery/profileUpdate/   |
| schemeRAG/respond            |
| updateMemory                 |
+---------------+--------------+
                |
                v
+------------------------------+
| Twilio TWiML XML Response    |
+------------------------------+
```

## Runtime Components

### 1. API Layer
- Framework: Hono
- Routes:
  - `GET /api/v1/`
  - `POST /api/v1/webhook`
- Controller: `src/controllers/webhook.controller.ts`

### 2. Messaging Layer
- Twilio payload parsing: `src/services/twilio-whatsapp.service.ts`
- TwiML generation: same service via `MessagingResponse`

### 3. Agent Orchestration
- Graph definition: `src/agent/graph.ts`
- State definition: `src/agent/state.ts`
- Node files:
  - `retrieveMemory.ts`
  - `validateProfile.ts`
  - `intentClassifier.ts`
  - `memoryQuery.ts`
  - `profileUpdate.ts`
  - `schemeRAG.ts`
  - `respond.ts`
  - `updateMemory.ts`

### 4. LLM Layer
- Service: `src/services/llm.ts`
- Provider: Gemini / AWS Bedrock (current implementation uses Google Gemini via `@langchain/google-genai`)
- Config: `src/config/llm.ts`
  - `GOOGLE_API_KEY`
  - `GEMINI_MODEL` (default `gemini-3.1-flash-lite-preview`)
  - `GEMINI_TEMPERATURE`
  - `GEMINI_TIMEOUT_MS`

### 5. Persistence Layer
- Client: `@upstash/vector`
- Service: `src/services/upstash-index.service.ts`
- Memory/profile abstraction: `src/services/upstash-memory.service.ts`
- Namespaces:
  - per-user: `whatsapp_<normalized_phone>`
  - schemes: `schemes_index` (or `UPSTASH_SCHEMES_NAMESPACE`)

## Data Flow

### Inbound Request Flow
1. Twilio posts form body to `POST /api/v1/webhook`.
2. Controller extracts `From` and `Body`.
3. Twilio service normalizes phone number and text.
4. Message service calls `runWhatsappAgent`.
5. Agent returns text reply.
6. Controller returns TwiML XML with the reply.

### Agent Internal Flow
1. `retrieveMemory` loads recent conversation and stored profile.
2. `validateProfile` asks for missing profile fields or continues.
3. `intentClassifier` routes request by intent.
4. `memoryQuery` handles memory-based Q/A and ordinal references.
5. `profileUpdate` updates supported profile fields.
6. `schemeRAG` queries schemes and drafts retrieval-grounded response.
7. `respond` finalizes response when needed.
8. `updateMemory` stores user/assistant exchange.

## Current Profile Model

Stored profile keys:
- `preferredLanguage`
- `name`
- `age`
- `gender`
- `designation`
- `pendingField` (used during intake)

Supported profile update fields mirror the same set.

## Current Limitations

1. Audio transcription is not implemented.
2. Only text messages are processed from webhook payload.
3. No dedicated translation microservice; language behavior is prompt-level.
4. No PostgreSQL/Redis storage in current code.
5. No subscription alerting workflow.
6. No metrics endpoint or advanced observability yet.

## Future Design Additions

### Audio Transcription (Planned)
A future STT pipeline will:
1. Accept Twilio media metadata for audio messages.
2. Download media securely.
3. Transcribe to text with Whisper (or equivalent).
4. Reuse existing agent graph pipeline with transcribed text.

### Additional Platform Capabilities (Planned)
- Rich multilingual translation service integration
- Subscriptions and push notifications
- Security hardening (rate limiting, auditing)
- Analytics and monitoring endpoints

## Deployment Notes

- Entry point: `index.ts`
- Runtime command: `bun run start`
- Container support: `Dockerfile` and `docker-compose.yml`
- Reverse proxy configuration: `Caddyfile`
