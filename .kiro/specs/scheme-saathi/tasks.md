# Implementation Plan: SchemeSaathi

## Overview

This implementation plan breaks down the SchemeSaathi WhatsApp chatbot into incremental, testable steps. The approach follows a bottom-up strategy: building core data models and utilities first, then implementing individual components, and finally wiring everything together into the complete system.

The implementation uses Python with FastAPI for the backend, LangChain for LLM orchestration, and integrates with external services (Twilio/Meta for WhatsApp, Gemini/GPT for LLM, Bhashini for translation, Whisper for STT).

## Tasks

- [ ] 1. Set up project structure and core dependencies
  - Create Python project with FastAPI
  - Set up virtual environment and requirements.txt
  - Configure environment variables for API keys (Twilio, Gemini, Bhashini, Whisper)
  - Set up PostgreSQL database connection
  - Set up Redis for session management
  - Initialize project structure: `/app`, `/app/models`, `/app/services`, `/app/api`, `/tests`
  - _Requirements: All requirements (infrastructure setup)_

- [ ] 2. Implement core data models and database schema
  - [ ] 2.1 Create SQLAlchemy models for Users, Profiles, Conversations, Subscriptions, Schemes, Analytics tables
    - Implement all models from design document database schema
    - Add indexes for performance (user_id, timestamp)
    - _Requirements: 1.5, 7.2, 8.5, 11.1_
  
  - [ ] 2.2 Create Pydantic models for API requests/responses and domain objects
    - Implement Message, UserProfile, Session, SchemeMatch, SchemeDocument, Response classes
    - Add validation rules for profile fields
    - _Requirements: 1.3, 1.4, 4.4, 5.2_
  
  - [ ]* 2.3 Write property test for profile validation
    - **Property 3: Invalid input handling**
    - **Validates: Requirements 1.4**
  
  - [ ] 2.4 Create database migration scripts using Alembic
    - Initialize Alembic
    - Create initial migration for all tables
    - _Requirements: All requirements (infrastructure)_

- [ ] 3. Implement Translation Service
  - [ ] 3.1 Create TranslationService class with Bhashini API integration
    - Implement detect_language(), translate_to_english(), translate_from_english()
    - Add fallback to Google Translate API
    - Implement technical term preservation logic
    - Add Redis caching for common translations
    - _Requirements: 2.2, 2.3, 2.5, 2.6_
  
  - [ ]* 3.2 Write property test for comprehensive translation
    - **Property 6: Comprehensive translation across all interactions**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ]* 3.3 Write property test for technical term preservation
    - **Property 8: Technical term preservation**
    - **Validates: Requirements 2.5**
  
  - [ ]* 3.4 Write unit tests for translation fallback behavior
    - Test fallback to English when Bhashini fails
    - Test error notification to user
    - _Requirements: 2.6_

- [ ] 4. Implement STT/TTS Services
  - [ ] 4.1 Create STTService class with OpenAI Whisper integration
    - Implement transcribe_audio() with language support
    - Handle audio duration limits (60 seconds)
    - Add error handling for transcription failures
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_
  
  - [ ] 4.2 Create TTSService class for text-to-speech
    - Implement synthesize_speech() with language support
    - _Requirements: Voice output (optional feature)_
  
  - [ ]* 4.3 Write property test for voice transcription
    - **Property 9: Voice transcription to text**
    - **Validates: Requirements 3.1, 3.2, 3.5**
  
  - [ ]* 4.4 Write property test for voice and text equivalence
    - **Property 10: Voice and text equivalence**
    - **Validates: Requirements 3.3**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Vector Database integration
  - [ ] 6.1 Set up Pinecone or ChromaDB connection
    - Configure vector database client
    - Create index with appropriate dimensions (768 for Gemini or 1536 for OpenAI)
    - Set up HNSW indexing with cosine similarity
    - _Requirements: 10.1, 10.3, 10.7_
  
  - [ ] 6.2 Create VectorDatabase class with CRUD operations
    - Implement store_scheme_document() with metadata
    - Implement semantic_search() with metadata filtering
    - Implement update_scheme_document()
    - Implement delete_scheme_document()
    - _Requirements: 10.1, 10.2, 10.5, 10.6_
  
  - [ ]* 6.3 Write property test for document ingestion with metadata
    - **Property 36: Document ingestion with metadata**
    - **Validates: Requirements 10.1, 10.2**
  
  - [ ]* 6.4 Write property test for metadata filtering
    - **Property 38: Metadata filtering**
    - **Validates: Requirements 10.5**
  
  - [ ]* 6.5 Write property test for embedding updates
    - **Property 39: Embedding updates**
    - **Validates: Requirements 10.6**

- [ ] 7. Implement RAG System
  - [ ] 7.1 Create RAGSystem class with LLM integration
    - Implement generate_embedding() using Gemini or OpenAI
    - Implement match_schemes() with profile-to-query conversion
    - Implement get_scheme_details()
    - Implement search_schemes() with filtering
    - Add relevance score threshold filtering (0.7)
    - _Requirements: 4.1, 4.2, 4.3, 5.1_
  
  - [ ]* 7.2 Write property test for complete profile triggers matching
    - **Property 11: Complete profile triggers scheme matching**
    - **Validates: Requirements 4.1**
  
  - [ ]* 7.3 Write property test for relevance score filtering
    - **Property 12: Relevance score filtering**
    - **Validates: Requirements 4.2**
  
  - [ ]* 7.4 Write property test for scheme ranking and limiting
    - **Property 13: Scheme ranking and limiting**
    - **Validates: Requirements 4.3**
  
  - [ ]* 7.5 Write property test for pagination maintains sort order
    - **Property 15: Pagination maintains sort order**
    - **Validates: Requirements 4.7**

- [ ] 8. Implement LLM Orchestration with LangChain
  - [ ] 8.1 Create prompt templates for different conversation stages
    - Implement PROFILE_INTAKE_PROMPT
    - Implement SCHEME_MATCHING_PROMPT
    - Implement SCHEME_DETAILS_PROMPT
    - Implement APPLICATION_GUIDANCE_PROMPT
    - _Requirements: 1.1, 1.2, 4.4, 5.2, 6.1, 6.2_
  
  - [ ] 8.2 Create LLMOrchestrator class using LangChain
    - Implement generate_response() with prompt selection based on conversation state
    - Integrate RAG retrieval with generation
    - Add conversation chain management
    - _Requirements: 5.6, 6.6_
  
  - [ ]* 8.3 Write property test for contextual clarification
    - **Property 18: Contextual clarification**
    - **Validates: Requirements 5.6**
  
  - [ ]* 8.4 Write property test for contextual application Q&A
    - **Property 23: Contextual application Q&A**
    - **Validates: Requirements 6.6**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Conversation Manager
  - [ ] 10.1 Create Session management with Redis
    - Implement get_session(), update_session(), clear_session()
    - Set 24-hour TTL for sessions
    - Implement session persistence to PostgreSQL
    - _Requirements: 8.1, 8.3, 8.5, 8.6_
  
  - [ ] 10.2 Create ConversationManager class with state machine
    - Implement state transitions (START → LANGUAGE_SELECTION → PROFILE_INTAKE → etc.)
    - Implement process_message() with intent routing
    - Implement reference resolution for contextual queries
    - Integrate with TranslationService and LLMOrchestrator
    - _Requirements: 1.1, 1.2, 1.6, 8.2_
  
  - [ ]* 10.3 Write property test for language selection determines conversation language
    - **Property 1: Language selection determines conversation language**
    - **Validates: Requirements 1.2**
  
  - [ ]* 10.4 Write property test for profile collection completeness
    - **Property 2: Profile collection completeness**
    - **Validates: Requirements 1.3, 1.5**
  
  - [ ]* 10.5 Write property test for session persistence across interruptions
    - **Property 4: Session persistence across interruptions**
    - **Validates: Requirements 1.6**
  
  - [ ]* 10.6 Write property test for optional field skipping
    - **Property 5: Optional field skipping**
    - **Validates: Requirements 1.7**
  
  - [ ]* 10.7 Write property test for language switching preserves context
    - **Property 7: Language switching preserves context**
    - **Validates: Requirements 2.4**
  
  - [ ]* 10.8 Write property test for context persistence within session
    - **Property 28: Context persistence within session**
    - **Validates: Requirements 8.1**
  
  - [ ]* 10.9 Write property test for reference resolution
    - **Property 29: Reference resolution**
    - **Validates: Requirements 8.2**
  
  - [ ]* 10.10 Write property test for session timeout duration
    - **Property 30: Session timeout duration**
    - **Validates: Requirements 8.3**
  
  - [ ]* 10.11 Write property test for session reset
    - **Property 31: Session reset**
    - **Validates: Requirements 8.6**

- [ ] 11. Implement WhatsApp Gateway
  - [ ] 11.1 Create WhatsAppGateway class with Twilio/Meta API integration
    - Implement receive_message() for webhook parsing
    - Implement send_text_message() with chunking for long messages
    - Implement send_audio_message()
    - Implement download_media() for voice notes
    - Add webhook verification and security token validation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [ ]* 11.2 Write property test for message field extraction
    - **Property 32: Message field extraction**
    - **Validates: Requirements 9.2**
  
  - [ ]* 11.3 Write property test for message type support
    - **Property 33: Message type support**
    - **Validates: Requirements 9.5**
  
  - [ ]* 11.4 Write property test for long message chunking
    - **Property 34: Long message chunking**
    - **Validates: Requirements 9.6**
  
  - [ ]* 11.5 Write property test for webhook security validation
    - **Property 35: Webhook security validation**
    - **Validates: Requirements 9.7**

- [ ] 12. Implement scheme presentation and guidance logic
  - [ ] 12.1 Create SchemePresenter class for formatting scheme information
    - Implement format_scheme_summary() with all required fields
    - Implement format_scheme_details() with all required fields
    - Implement format_application_guidance() with numbered steps
    - Add deadline highlighting logic
    - Add location-based office address lookup
    - _Requirements: 4.4, 5.2, 5.5, 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 12.2 Write property test for scheme information completeness
    - **Property 14: Scheme information completeness**
    - **Validates: Requirements 4.4, 5.2**
  
  - [ ]* 12.3 Write property test for deadline highlighting
    - **Property 17: Deadline highlighting**
    - **Validates: Requirements 5.5**
  
  - [ ]* 12.4 Write property test for numbered step format
    - **Property 19: Numbered step format**
    - **Validates: Requirements 6.1**
  
  - [ ]* 12.5 Write property test for application guidance completeness
    - **Property 20: Application guidance completeness**
    - **Validates: Requirements 6.2**
  
  - [ ]* 12.6 Write property test for online application links
    - **Property 21: Online application links**
    - **Validates: Requirements 6.3**
  
  - [ ]* 12.7 Write property test for location-based office addresses
    - **Property 22: Location-based office addresses**
    - **Validates: Requirements 6.4**

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement subscription and notification system
  - [ ] 14.1 Create SubscriptionManager class
    - Implement subscribe_user()
    - Implement unsubscribe_user()
    - Implement match_new_scheme_against_subscribers()
    - Implement send_notification() with rate limiting (3 per week)
    - Add notification queue management
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ]* 14.2 Write property test for subscription offer after profile completion
    - **Property 24: Subscription offer after profile completion**
    - **Validates: Requirements 7.1**
  
  - [ ]* 14.3 Write property test for end-to-end subscription flow
    - **Property 25: End-to-end subscription flow**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**
  
  - [ ]* 14.4 Write property test for unsubscribe processing
    - **Property 26: Unsubscribe processing**
    - **Validates: Requirements 7.6**
  
  - [ ]* 14.5 Write property test for notification rate limiting
    - **Property 27: Notification rate limiting**
    - **Validates: Requirements 7.7**

- [ ] 15. Implement document ingestion system
  - [ ] 15.1 Create DocumentIngestion class
    - Implement upload_scheme_document() API endpoint
    - Implement parse_document() for PDF and text extraction
    - Implement validate_document() for required fields
    - Implement chunk_document() with 500-token chunks and 50-token overlap
    - Integrate with RAGSystem for embedding generation
    - Integrate with SubscriptionManager for notification triggering
    - Add batch upload support
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_
  
  - [ ]* 15.2 Write property test for document upload API availability
    - **Property 50: Document upload API availability**
    - **Validates: Requirements 14.1**
  
  - [ ]* 15.3 Write property test for document parsing and embedding
    - **Property 51: Document parsing and embedding**
    - **Validates: Requirements 14.2**
  
  - [ ]* 15.4 Write property test for document validation
    - **Property 52: Document validation**
    - **Validates: Requirements 14.3**
  
  - [ ]* 15.5 Write property test for batch upload processing
    - **Property 53: Batch upload processing**
    - **Validates: Requirements 14.5**

- [ ] 16. Implement security and privacy features
  - [ ] 16.1 Add data encryption at rest
    - Implement AES-256 encryption for user profile data
    - Add encryption/decryption utilities
    - _Requirements: 11.1_
  
  - [ ] 16.2 Configure TLS for API endpoints
    - Set up TLS 1.2+ for FastAPI
    - _Requirements: 11.2_
  
  - [ ] 16.3 Implement data retention and deletion
    - Create background job for deleting messages older than 30 days
    - Implement delete_user_data() for complete data deletion
    - _Requirements: 11.3, 11.4_
  
  - [ ] 16.4 Implement rate limiting middleware
    - Add rate limiting (20 requests per minute per user)
    - _Requirements: 11.6_
  
  - [ ]* 16.5 Write property test for data encryption at rest
    - **Property 40: Data encryption at rest**
    - **Validates: Requirements 11.1**
  
  - [ ]* 16.6 Write property test for message retention limit
    - **Property 42: Message retention limit**
    - **Validates: Requirements 11.3**
  
  - [ ]* 16.7 Write property test for complete data deletion
    - **Property 43: Complete data deletion**
    - **Validates: Requirements 11.4**
  
  - [ ]* 16.8 Write property test for rate limiting enforcement
    - **Property 44: Rate limiting enforcement**
    - **Validates: Requirements 11.6**

- [ ] 17. Implement error handling and resilience
  - [ ] 17.1 Add retry logic for external services
    - Implement retry with exponential backoff for Vector Database (3 retries)
    - Implement retry for LLM API (2 retries)
    - Implement retry for Translation API (2 retries) with fallback to English
    - _Requirements: 12.2, 12.3_
  
  - [ ] 17.2 Implement circuit breaker pattern
    - Add circuit breaker for external services (open after 5 failures, 60s timeout)
    - _Requirements: 12.1, 12.3, 12.4_
  
  - [ ] 17.3 Add graceful error handling
    - Implement fallback messages for service unavailability
    - Implement clarifying questions for unclear input
    - Implement error escalation after 3 errors in session
    - _Requirements: 12.1, 12.3, 12.4, 12.5, 12.7_
  
  - [ ]* 17.4 Write property test for database query retry logic
    - **Property 46: Database query retry logic**
    - **Validates: Requirements 12.2**
  
  - [ ]* 17.5 Write property test for graceful unclear input handling
    - **Property 47: Graceful unclear input handling**
    - **Validates: Requirements 12.5**
  
  - [ ]* 17.6 Write property test for error escalation threshold
    - **Property 48: Error escalation threshold**
    - **Validates: Requirements 12.7**

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Implement logging and analytics
  - [ ] 19.1 Create comprehensive logging system
    - Implement audit logging for data access events
    - Implement error logging with context
    - Implement interaction logging
    - Implement document ingestion logging
    - _Requirements: 11.7, 12.6, 14.7, 15.2_
  
  - [ ] 19.2 Create AnalyticsService class
    - Implement track_event() for all event types
    - Implement calculate_metrics() for daily/weekly metrics
    - Implement generate_daily_report()
    - Track: total users, DAU, messages processed, schemes matched, conversion rates
    - _Requirements: 15.1, 15.5, 15.6_
  
  - [ ] 19.3 Create health check and monitoring endpoints
    - Implement /health endpoint with system status
    - Implement /metrics endpoint with real-time metrics
    - Add alerting for error rates > 5%
    - _Requirements: 15.3, 15.4_
  
  - [ ]* 19.4 Write property test for comprehensive audit logging
    - **Property 45: Comprehensive audit logging**
    - **Validates: Requirements 8.5, 11.7, 12.6, 14.7, 15.2**
  
  - [ ]* 19.5 Write property test for comprehensive metrics tracking
    - **Property 54: Comprehensive metrics tracking**
    - **Validates: Requirements 15.1, 15.6**
  
  - [ ]* 19.6 Write property test for health check endpoint
    - **Property 55: Health check endpoint**
    - **Validates: Requirements 15.3**
  
  - [ ]* 19.7 Write property test for error rate alerting
    - **Property 56: Error rate alerting**
    - **Validates: Requirements 15.4**
  
  - [ ]* 19.8 Write property test for daily report generation
    - **Property 57: Daily report generation**
    - **Validates: Requirements 15.5**

- [ ] 20. Implement caching layer
  - [ ] 20.1 Add Redis caching for scheme documents
    - Implement cache_scheme_document()
    - Implement get_cached_scheme()
    - Set appropriate TTL for cached documents
    - _Requirements: 13.6_
  
  - [ ] 20.2 Add caching for translations
    - Cache common translations in Redis
    - _Requirements: 2.2, 2.3_
  
  - [ ]* 20.3 Write property test for scheme document caching
    - **Property 49: Scheme document caching**
    - **Validates: Requirements 13.6**

- [ ] 21. Create FastAPI application and wire all components
  - [ ] 21.1 Create main FastAPI application
    - Set up FastAPI app with middleware (CORS, rate limiting, logging)
    - Configure dependency injection for services
    - _Requirements: All requirements_
  
  - [ ] 21.2 Create API endpoints
    - POST /webhook/whatsapp - WhatsApp webhook handler
    - POST /api/schemes/upload - Scheme document upload
    - POST /api/schemes/batch-upload - Batch scheme upload
    - GET /health - Health check
    - GET /metrics - Metrics endpoint
    - _Requirements: 9.1, 14.1, 14.5, 15.3_
  
  - [ ] 21.3 Wire all components together
    - Connect WhatsAppGateway → ConversationManager → RAGSystem → LLMOrchestrator
    - Connect DocumentIngestion → RAGSystem → SubscriptionManager
    - Connect all services to database and Redis
    - _Requirements: All requirements_
  
  - [ ]* 21.4 Write integration tests for end-to-end flows
    - Test: New user → profile creation → scheme matching → scheme details → application guidance
    - Test: Voice message → transcription → translation → response
    - Test: Document upload → embedding → subscription matching → notification
    - Test: Session interruption → resume → completion
    - _Requirements: All requirements_

- [ ] 22. Create deployment configuration
  - [ ] 22.1 Create Dockerfile and docker-compose.yml
    - Set up containers for FastAPI, PostgreSQL, Redis
    - _Requirements: Infrastructure_
  
  - [ ] 22.2 Create deployment scripts for Render/Railway/AWS Lambda
    - Configure environment variables
    - Set up database migrations
    - _Requirements: Infrastructure_
  
  - [ ] 22.3 Create initial scheme document dataset
    - Collect 50-100 real or synthetic scheme documents
    - Upload via batch API
    - _Requirements: 10.7, 14.1_

- [ ] 23. Final checkpoint - Ensure all tests pass and system is ready
  - Run all unit tests and property tests
  - Run integration tests
  - Verify all 57 correctness properties are tested
  - Test with real WhatsApp account
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across random inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a bottom-up approach: data models → services → integration → deployment
- All 57 correctness properties from the design document are covered by property-based tests
