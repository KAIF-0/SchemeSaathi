# Implementation Plan: SchemeSaathi (Updated)

## Overview

This task plan tracks the real status of the current Bun + TypeScript codebase and defines next milestones. Items marked complete are already implemented in this repository.

## Completed Foundation

- [x] 1. Set up Bun + TypeScript runtime and project structure
- [x] 2. Implement Hono server and base routing (`/api/v1`)
- [x] 3. Implement Twilio webhook parsing and TwiML response generation
- [x] 4. Add LangGraph orchestration scaffold and agent state model
- [x] 5. Implement agent nodes for memory retrieval, profile validation, intent routing, response, and memory update
- [x] 6. Integrate Gemini / AWS Bedrock LLM service with timeout handling
- [x] 7. Integrate Upstash Vector for memory and scheme indexes
- [x] 8. Add scheme seeding and cleanup scripts
- [x] 9. Implement profile update extraction workflow
- [x] 10. Implement memory-aware reference resolution for follow-up queries

## In Progress Improvements

- [ ] 11. Expand profile schema beyond current fields
  - Add state, district, income bracket, and category
  - Update validation prompts and normalization logic
  - Update query construction in `schemeRAG`

- [ ] 12. Improve scheme result quality and explainability
  - Add score-based filtering and deterministic result formatting
  - Enforce stronger scheme-detail output sections

## Future Tasks (Explicitly Deferred)

- [ ] 13. Audio transcription support (future)
  - Accept audio media from Twilio webhook payload
  - Download and transcribe using Whisper (or equivalent STT)
  - Route transcript through existing graph
  - Add fallback UX for failed transcription

- [ ] 14. Translation service integration
  - Add Bhashini or Google Translate adapter layer
  - Move language handling from prompt-only to service-backed translation

- [ ] 15. Subscription and alerting pipeline
  - Persist subscription preferences
  - Match newly ingested schemes against subscribed users
  - Send capped outbound notifications

- [ ] 16. Ingestion API and admin workflows
  - Add endpoints for document upload/batch upload
  - Parse and validate documents before indexing

- [ ] 17. Security hardening
  - Add request rate limiting
  - Add webhook verification/security checks
  - Add data retention controls

- [ ] 18. Observability and operations
  - Add structured logs and error taxonomy
  - Add health and metrics endpoints
  - Add alerting hooks

- [ ] 19. Testing strategy expansion
  - Add unit tests for each node/helper
  - Add integration tests for full webhook -> agent flow
  - Add regression tests for profile and intent edge cases

## Suggested Execution Order

1. Expand profile schema and update retrieval prompts.
2. Stabilize scheme response quality and formatting.
3. Add tests around current core behavior.
4. Implement audio transcription (future task 13).
5. Build subscription, security, and observability layers.

## Notes

- The current system is production-usable for text-only WhatsApp interactions.
- Audio transcription is intentionally postponed and should be handled as a dedicated milestone.
- This plan supersedes the previous Python/FastAPI-oriented task list for this repository.
