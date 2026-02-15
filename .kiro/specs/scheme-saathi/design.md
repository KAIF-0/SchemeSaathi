# Design Document: SchemeSaathi

## Overview

SchemeSaathi is a conversational AI system that connects Indian citizens with government welfare schemes through WhatsApp. The system architecture follows a microservices pattern with clear separation between the messaging interface, business logic, AI orchestration, and data storage layers.

The core innovation is a RAG (Retrieval-Augmented Generation) pipeline that semantically matches user profiles against a vector database of scheme documents, enabling personalized scheme discovery without requiring users to navigate complex government portals.

### Key Design Principles

1. **Conversational First**: All interactions are designed as natural conversations, not form-filling
2. **Multilingual by Default**: Translation is integrated at every layer, not bolted on
3. **Voice-Enabled**: Voice input is a first-class citizen, not an afterthought
4. **Stateful Sessions**: Conversation context is maintained across multiple turns
5. **Graceful Degradation**: System continues functioning when external services fail
6. **Privacy-Preserving**: User data is encrypted and retained only as long as necessary

## Architecture

### System Components

```
┌─────────────┐
│   WhatsApp  │
│    Users    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              WhatsApp Gateway Layer                      │
│  (Twilio API / Meta WhatsApp Cloud API)                 │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (FastAPI/Flask)                 │
│                                                           │
│  ┌─────────────────┐  ┌──────────────────┐             │
│  │  Conversation   │  │   Translation    │             │
│  │    Manager      │  │     Service      │             │
│  └────────┬────────┘  └────────┬─────────┘             │
│           │                     │                        │
│           ▼                     ▼                        │
│  ┌─────────────────────────────────────┐               │
│  │      LLM Orchestration Layer        │               │
│  │         (LangChain)                 │               │
│  └────────┬────────────────────────────┘               │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────┐  ┌──────────────────┐             │
│  │   RAG System    │  │   STT/TTS        │             │
│  │                 │  │   Services       │             │
│  └────────┬────────┘  └──────────────────┘             │
└───────────┼──────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                  Data Layer                              │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │   Vector DB  │  │    Redis     │  │
│  │  (User Data) │  │  (Schemes)   │  │  (Sessions)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│              External Services                           │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Gemini/GPT  │  │  Bhashini/   │  │   Whisper    │  │
│  │     API      │  │  Google      │  │     STT      │  │
│  │              │  │  Translate   │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**User Message Flow:**
1. User sends message (text/voice) via WhatsApp
2. WhatsApp Gateway receives webhook, extracts message data
3. Backend API routes message to Conversation Manager
4. If voice: STT Service converts audio to text
5. Translation Service detects language and translates to English for processing
6. Conversation Manager determines intent and current conversation state
7. RAG System queries Vector Database if scheme matching is needed
8. LLM generates contextual response using retrieved scheme data
9. Translation Service translates response to user's language
10. Backend API sends response via WhatsApp Gateway
11. User receives message on WhatsApp

**Scheme Matching Flow:**
1. User completes profile (age, gender, location, occupation, income, category)
2. Conversation Manager constructs profile query
3. RAG System generates embedding for user profile
4. Vector Database performs semantic similarity search
5. Top K schemes retrieved with relevance scores
6. LLM formats scheme summaries in user's language
7. User receives ranked list of matching schemes

**Document Ingestion Flow:**
1. Admin uploads scheme PDF via API endpoint
2. Document parser extracts text and metadata
3. Text chunker splits document into semantic chunks
4. Embedding model generates vectors for each chunk
5. Vectors stored in Vector Database with metadata
6. Subscription matcher runs against all subscribed users
7. Matching users receive WhatsApp notifications

## Components and Interfaces

### 1. WhatsApp Gateway

**Responsibilities:**
- Receive incoming WhatsApp messages via webhook
- Send outgoing messages to users
- Handle media files (voice notes, images)
- Manage webhook verification and security

**Interface:**

```python
class WhatsAppGateway:
    def receive_message(webhook_data: dict) -> Message:
        """
        Extract message from WhatsApp webhook payload
        Returns: Message object with content, sender, type, timestamp
        """
        pass
    
    def send_text_message(phone_number: str, text: str) -> bool:
        """
        Send text message to user
        Handles message chunking if text > 4096 chars
        Returns: Success status
        """
        pass
    
    def send_audio_message(phone_number: str, audio_url: str) -> bool:
        """
        Send audio file to user
        Returns: Success status
        """
        pass
    
    def download_media(media_id: str) -> bytes:
        """
        Download voice note or image from WhatsApp
        Returns: Binary media content
        """
        pass
```

**Configuration:**
- Webhook URL: `/webhook/whatsapp`
- Verify token: Environment variable `WHATSAPP_VERIFY_TOKEN`
- API credentials: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` or `META_ACCESS_TOKEN`

### 2. Conversation Manager

**Responsibilities:**
- Maintain conversation state for each user
- Route messages to appropriate handlers based on intent
- Manage multi-turn conversation flows (profile creation, scheme exploration)
- Resolve contextual references ("the second scheme", "tell me more")

**Interface:**

```python
class ConversationManager:
    def process_message(user_id: str, message: str, language: str) -> Response:
        """
        Process user message in context of current conversation state
        Returns: Response object with text and next state
        """
        pass
    
    def get_session(user_id: str) -> Session:
        """
        Retrieve or create session for user
        Returns: Session object with conversation history and state
        """
        pass
    
    def update_session(user_id: str, state: dict, history: list) -> None:
        """
        Update session state and conversation history
        """
        pass
    
    def clear_session(user_id: str) -> None:
        """
        Clear session context (user requested restart)
        """
        pass
```

**State Machine:**

```
START → LANGUAGE_SELECTION → PROFILE_INTAKE → PROFILE_COMPLETE
                                    ↓
                              SCHEME_MATCHING → SCHEME_DETAILS → APPLICATION_GUIDANCE
                                    ↓
                              SUBSCRIPTION_OFFER → SUBSCRIBED
```

**Session Storage:**
- Redis for active sessions (24-hour TTL)
- PostgreSQL for conversation history (30-day retention)

### 3. Translation Service

**Responsibilities:**
- Detect language of incoming messages
- Translate user messages to English for processing
- Translate system responses to user's preferred language
- Preserve technical terms and scheme names

**Interface:**

```python
class TranslationService:
    def detect_language(text: str) -> str:
        """
        Detect language of input text
        Returns: ISO 639-1 language code (en, hi, ta, mr)
        """
        pass
    
    def translate_to_english(text: str, source_lang: str) -> str:
        """
        Translate text to English for processing
        Returns: English text
        """
        pass
    
    def translate_from_english(text: str, target_lang: str) -> str:
        """
        Translate English response to target language
        Preserves scheme names and technical terms
        Returns: Translated text
        """
        pass
```

**Implementation Options:**
- Primary: Bhashini API (AI4Bharat) for Indian languages
- Fallback: Google Translate API
- Caching: Store common translations in Redis

### 4. STT/TTS Services

**Responsibilities:**
- Convert voice notes to text (Speech-to-Text)
- Convert text responses to audio (Text-to-Speech)
- Support multiple languages

**Interface:**

```python
class STTService:
    def transcribe_audio(audio_bytes: bytes, language: str) -> str:
        """
        Transcribe audio to text
        Supports up to 60 seconds of audio
        Returns: Transcribed text
        """
        pass

class TTSService:
    def synthesize_speech(text: str, language: str) -> bytes:
        """
        Convert text to speech audio
        Returns: Audio bytes (MP3 format)
        """
        pass
```

**Implementation:**
- STT: OpenAI Whisper API
- TTS: Basic TTS service (Google TTS or similar)
- Audio format: MP3, max 60 seconds

### 5. RAG System

**Responsibilities:**
- Generate embeddings for user profiles and queries
- Query vector database for relevant schemes
- Rank and filter results by relevance score
- Provide context to LLM for response generation

**Interface:**

```python
class RAGSystem:
    def match_schemes(profile: UserProfile, top_k: int = 5) -> List[SchemeMatch]:
        """
        Match user profile against scheme database
        Returns: List of schemes with relevance scores, sorted by score
        """
        pass
    
    def get_scheme_details(scheme_id: str) -> SchemeDocument:
        """
        Retrieve full scheme document
        Returns: Complete scheme information
        """
        pass
    
    def generate_embedding(text: str) -> List[float]:
        """
        Generate embedding vector for text
        Returns: 768 or 1536-dimensional vector (depending on model)
        """
        pass
    
    def search_schemes(query: str, filters: dict, top_k: int) -> List[SchemeMatch]:
        """
        Semantic search with metadata filters
        Returns: Matching schemes with scores
        """
        pass
```

**Embedding Model:**
- Gemini: `text-embedding-004` (768 dimensions)
- OpenAI: `text-embedding-3-small` (1536 dimensions)

**Relevance Threshold:** 0.7 (cosine similarity)

### 6. Vector Database

**Responsibilities:**
- Store scheme document embeddings
- Perform fast semantic similarity search
- Support metadata filtering
- Handle document updates and deletions

**Schema:**

```python
class SchemeVector:
    id: str  # Unique scheme identifier
    embedding: List[float]  # Vector representation
    metadata: dict  # {
        #   "scheme_name": str,
        #   "state": str,
        #   "category": str,  # agriculture, education, health, etc.
        #   "eligibility_age_min": int,
        #   "eligibility_age_max": int,
        #   "eligibility_gender": str,  # male, female, all
        #   "eligibility_income_max": int,
        #   "eligibility_categories": List[str],  # SC, ST, OBC, General
        #   "last_updated": datetime
        # }
    content: str  # Original text chunk
```

**Implementation Options:**
- Pinecone: Managed, scalable, good for production
- ChromaDB: Open-source, good for development and small scale

**Indexing Strategy:**
- Chunk size: 500 tokens with 50-token overlap
- Index type: HNSW (Hierarchical Navigable Small World)
- Distance metric: Cosine similarity

### 7. LLM Orchestration (LangChain)

**Responsibilities:**
- Orchestrate LLM calls with proper prompts
- Manage conversation chains
- Integrate RAG retrieval with generation
- Handle prompt templates for different conversation stages

**Prompt Templates:**

```python
PROFILE_INTAKE_PROMPT = """
You are SchemeSaathi, a helpful assistant helping users discover government schemes.
Current conversation stage: {stage}
User's language: {language}
Conversation history: {history}

Ask the user for their {next_field} in a friendly, conversational way.
If they provided invalid input, explain the issue and ask again with examples.
"""

SCHEME_MATCHING_PROMPT = """
You are SchemeSaathi. Based on the user's profile, present the top matching schemes.

User Profile:
{profile}

Matching Schemes:
{schemes}

Present these schemes in a clear, numbered list with:
1. Scheme name
2. Brief description (1-2 sentences)
3. Key benefit
4. Eligibility summary

Keep the tone friendly and encouraging.
"""

SCHEME_DETAILS_PROMPT = """
You are SchemeSaathi. Provide detailed information about the requested scheme.

Scheme Document:
{scheme_document}

User Question: {user_question}

Provide comprehensive details including:
- Full scheme name and objective
- Detailed benefits
- Complete eligibility criteria
- Required documents
- Application process overview
- Official website link

Format the response clearly with sections.
"""

APPLICATION_GUIDANCE_PROMPT = """
You are SchemeSaathi. Provide step-by-step application guidance.

Scheme: {scheme_name}
Application Process: {application_process}
User's District: {district}

Provide:
1. Numbered step-by-step instructions
2. Required documents checklist
3. Application portal link or office address
4. Helpline contact information

Make instructions simple and actionable.
"""
```

### 8. Database Schema (PostgreSQL)

**Users Table:**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    preferred_language VARCHAR(5) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Profiles Table:**

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender VARCHAR(10),
    state VARCHAR(50),
    district VARCHAR(50),
    occupation VARCHAR(100),
    annual_income INTEGER,
    caste_category VARCHAR(20),
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Conversations Table:**

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(10) NOT NULL,  -- 'user' or 'bot'
    content TEXT NOT NULL,
    language VARCHAR(5),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB  -- {intent, state, response_time_ms}
);

CREATE INDEX idx_conversations_user_timestamp 
ON conversations(user_id, timestamp DESC);
```

**Subscriptions Table:**

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_notification_sent TIMESTAMP,
    notification_count_this_week INTEGER DEFAULT 0
);
```

**Schemes Table (Metadata):**

```sql
CREATE TABLE schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_name VARCHAR(255) NOT NULL,
    state VARCHAR(50),
    category VARCHAR(50),
    document_url TEXT,
    vector_db_id VARCHAR(100) UNIQUE,  -- Reference to vector DB
    ingestion_status VARCHAR(20),  -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Analytics Table:**

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,  -- 'message_received', 'scheme_matched', 'application_guidance_requested'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_type_timestamp 
ON analytics_events(event_type, timestamp DESC);
```

## Data Models

### Core Data Models

```python
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
from enum import Enum

class MessageType(Enum):
    TEXT = "text"
    AUDIO = "audio"
    IMAGE = "image"

class ConversationState(Enum):
    START = "start"
    LANGUAGE_SELECTION = "language_selection"
    PROFILE_INTAKE = "profile_intake"
    PROFILE_COMPLETE = "profile_complete"
    SCHEME_MATCHING = "scheme_matching"
    SCHEME_DETAILS = "scheme_details"
    APPLICATION_GUIDANCE = "application_guidance"
    SUBSCRIPTION_OFFER = "subscription_offer"

@dataclass
class Message:
    sender_phone: str
    content: str
    message_type: MessageType
    timestamp: datetime
    media_url: Optional[str] = None

@dataclass
class UserProfile:
    user_id: str
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[int] = None
    caste_category: Optional[str] = None
    is_complete: bool = False
    
    def to_query_string(self) -> str:
        """Convert profile to natural language query for RAG"""
        parts = []
        if self.age:
            parts.append(f"{self.age} years old")
        if self.gender:
            parts.append(self.gender)
        if self.occupation:
            parts.append(f"working as {self.occupation}")
        if self.state and self.district:
            parts.append(f"from {self.district}, {self.state}")
        if self.annual_income:
            parts.append(f"annual income ₹{self.annual_income}")
        if self.caste_category:
            parts.append(f"category {self.caste_category}")
        return " ".join(parts)

@dataclass
class Session:
    user_id: str
    state: ConversationState
    language: str
    conversation_history: List[dict]
    context: dict  # Temporary context like "last_schemes_shown", "current_scheme_id"
    created_at: datetime
    last_updated: datetime

@dataclass
class SchemeMatch:
    scheme_id: str
    scheme_name: str
    description: str
    key_benefits: str
    eligibility_summary: str
    relevance_score: float
    
@dataclass
class SchemeDocument:
    scheme_id: str
    scheme_name: str
    objective: str
    benefits: List[str]
    eligibility_criteria: dict
    required_documents: List[str]
    application_process: str
    official_website: str
    helpline: Optional[str]
    state: Optional[str]
    category: str

@dataclass
class Response:
    text: str
    next_state: ConversationState
    audio_url: Optional[str] = None
    metadata: dict = None
```

### API Request/Response Models

```python
from pydantic import BaseModel

class WebhookRequest(BaseModel):
    """WhatsApp webhook payload"""
    entry: List[dict]
    
class SendMessageRequest(BaseModel):
    phone_number: str
    message: str
    
class UploadSchemeRequest(BaseModel):
    scheme_name: str
    state: Optional[str]
    category: str
    document_url: str
    
class UploadSchemeResponse(BaseModel):
    scheme_id: str
    status: str
    message: str
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Profile Management Properties

**Property 1: Language selection determines conversation language**
*For any* supported language selected by a user, all subsequent conversation messages should be conducted in that language until the user changes it.
**Validates: Requirements 1.2**

**Property 2: Profile collection completeness**
*For any* user completing the profile intake flow, the system should collect and store all required profile attributes (age, gender, state, district, occupation, annual income, caste category) in the database.
**Validates: Requirements 1.3, 1.5**

**Property 3: Invalid input handling**
*For any* invalid profile input (negative age, non-numeric income, invalid state name), the system should request clarification with examples rather than accepting the invalid data.
**Validates: Requirements 1.4**

**Property 4: Session persistence across interruptions**
*For any* partial profile where the user stops responding, when the user returns within 24 hours, the system should resume from the last unanswered question without requiring the user to re-enter previous information.
**Validates: Requirements 1.6**

**Property 5: Optional field skipping**
*For any* optional profile field (such as caste category), if the user skips it, the system should continue to scheme matching without treating it as an error.
**Validates: Requirements 1.7**

### Translation and Multilingual Properties

**Property 6: Comprehensive translation across all interactions**
*For any* user message in a supported language and any system response, the Translation_Service should detect the input language correctly and translate all responses (scheme information, questions, guidance) into the user's preferred language.
**Validates: Requirements 2.2, 2.3, 5.3**

**Property 7: Language switching preserves context**
*For any* conversation where the user switches from language A to language B, the conversation context (profile data, current schemes, conversation history) should remain intact and continue in language B.
**Validates: Requirements 2.4**

**Property 8: Technical term preservation**
*For any* translation containing technical terms (scheme names like "PM-KISAN", document types like "Aadhaar"), these terms should remain in their original form while surrounding text is translated.
**Validates: Requirements 2.5**

### Voice Processing Properties

**Property 9: Voice transcription to text**
*For any* valid audio file up to 60 seconds in a supported language, the STT_Service should convert it to text that can be processed as a regular message.
**Validates: Requirements 3.1, 3.2, 3.5**

**Property 10: Voice and text equivalence**
*For any* message content, whether sent as voice or text, the Conversation_Manager should process it identically and produce equivalent responses.
**Validates: Requirements 3.3**

### RAG and Scheme Matching Properties

**Property 11: Complete profile triggers scheme matching**
*For any* user profile marked as complete, the RAG_System should automatically query the Vector_Database with the profile attributes.
**Validates: Requirements 4.1**

**Property 12: Relevance score filtering**
*For any* scheme matching query, all returned schemes should have a relevance score above 0.7 (cosine similarity threshold).
**Validates: Requirements 4.2**

**Property 13: Scheme ranking and limiting**
*For any* scheme matching result set, the presented schemes should be sorted by relevance score in descending order and limited to the top 5 schemes.
**Validates: Requirements 4.3**

**Property 14: Scheme information completeness**
*For any* scheme presented to the user (whether in summary or detail view), the response should include all required fields: scheme name, description, benefits, and eligibility criteria.
**Validates: Requirements 4.4, 5.2**

**Property 15: Pagination maintains sort order**
*For any* request for additional schemes beyond the initial 5, the next batch should continue the relevance score ordering from where the previous batch ended.
**Validates: Requirements 4.7**

**Property 16: Scheme detail retrieval**
*For any* valid scheme ID selected by a user, the RAG_System should retrieve the complete scheme document from the Vector_Database.
**Validates: Requirements 5.1**

**Property 17: Deadline highlighting**
*For any* scheme document containing an application deadline, the deadline should appear prominently in the formatted response to the user.
**Validates: Requirements 5.5**

**Property 18: Contextual clarification**
*For any* user question about a specific scheme, the LLM response should reference information from that scheme's document rather than generic information.
**Validates: Requirements 5.6**

### Application Guidance Properties

**Property 19: Numbered step format**
*For any* application guidance request, the response should contain a numbered list of steps (1, 2, 3, ...) rather than unstructured text.
**Validates: Requirements 6.1**

**Property 20: Application guidance completeness**
*For any* application guidance response, it should include all required sections: where to apply, required documents checklist, step-by-step instructions, and helpline contact information.
**Validates: Requirements 6.2**

**Property 21: Online application links**
*For any* scheme with online application capability, the guidance should include a direct URL to the application portal.
**Validates: Requirements 6.3**

**Property 22: Location-based office addresses**
*For any* scheme requiring offline submission, the guidance should include an office address matching the user's district from their profile.
**Validates: Requirements 6.4**

**Property 23: Contextual application Q&A**
*For any* user question during application guidance, the LLM response should reference the specific scheme's application process rather than generic application advice.
**Validates: Requirements 6.6**

### Subscription and Notification Properties

**Property 24: Subscription offer after profile completion**
*For any* user who completes profile creation, the system should offer the option to subscribe to scheme alerts.
**Validates: Requirements 7.1**

**Property 25: End-to-end subscription flow**
*For any* user who subscribes, when a new scheme document is added that matches their profile with score > 0.7, the system should send a WhatsApp notification within 24 hours containing scheme name, brief description, and prompt for details.
**Validates: Requirements 7.2, 7.3, 7.4, 7.5, 14.6**

**Property 26: Unsubscribe processing**
*For any* subscribed user who requests to unsubscribe, the system should update their subscription status to inactive and confirm the change.
**Validates: Requirements 7.6**

**Property 27: Notification rate limiting**
*For any* subscribed user, the system should send at most 3 scheme notifications per 7-day period, regardless of how many schemes match their profile.
**Validates: Requirements 7.7**

### Conversation Context Properties

**Property 28: Context persistence within session**
*For any* user session, conversation context (profile data, last schemes shown, current scheme being discussed) should persist across multiple messages within the 24-hour session window.
**Validates: Requirements 8.1**

**Property 29: Reference resolution**
*For any* user message containing a reference to previous context (e.g., "the second scheme", "that one"), the Conversation_Manager should resolve it using conversation history to identify the correct scheme.
**Validates: Requirements 8.2**

**Property 30: Session timeout duration**
*For any* user session, the context should remain available for 24 hours from the last message, after which it should expire.
**Validates: Requirements 8.3**

**Property 31: Session reset**
*For any* user who explicitly requests to start over, the system should clear all current session context and begin a new conversation flow from the language selection stage.
**Validates: Requirements 8.6**

### WhatsApp Integration Properties

**Property 32: Message field extraction**
*For any* incoming WhatsApp webhook, the WhatsApp_Gateway should extract all required fields: message content, sender phone number, message type, and timestamp.
**Validates: Requirements 9.2**

**Property 33: Message type support**
*For any* message type (text, formatted text with line breaks, audio file), the WhatsApp_Gateway should successfully send it to the user's WhatsApp number.
**Validates: Requirements 9.5**

**Property 34: Long message chunking**
*For any* response text exceeding 4096 characters, the WhatsApp_Gateway should split it into multiple messages, each under 4096 characters, maintaining the original order.
**Validates: Requirements 9.6**

**Property 35: Webhook security validation**
*For any* incoming webhook request with an invalid security token, the WhatsApp_Gateway should reject it and not process the message.
**Validates: Requirements 9.7**

### Vector Database Properties

**Property 36: Document ingestion with metadata**
*For any* scheme document uploaded to the system, the Vector_Database should store embeddings along with all required metadata fields: scheme name, state, category, and last updated date.
**Validates: Requirements 10.1, 10.2**

**Property 37: Cosine similarity scoring**
*For any* semantic search query, the Vector_Database should return results with cosine similarity scores between 0 and 1.
**Validates: Requirements 10.3**

**Property 38: Metadata filtering**
*For any* search query with metadata filters (e.g., state="Maharashtra", category="agriculture"), all returned results should match the specified filter criteria.
**Validates: Requirements 10.5**

**Property 39: Embedding updates**
*For any* existing scheme document that is updated, the new embeddings should replace the old embeddings in the Vector_Database, not create duplicates.
**Validates: Requirements 10.6**

### Security and Privacy Properties

**Property 40: Data encryption at rest**
*For any* user profile data stored in the database, it should be encrypted using AES-256 encryption.
**Validates: Requirements 11.1**

**Property 41: TLS encryption in transit**
*For any* API request to the Backend_API, the connection should use TLS 1.2 or higher.
**Validates: Requirements 11.2**

**Property 42: Message retention limit**
*For any* conversation message older than 30 days, it should be automatically deleted from the database.
**Validates: Requirements 11.3**

**Property 43: Complete data deletion**
*For any* user who requests data deletion, all associated data (profile, conversation history, subscription preferences) should be removed from the database within 7 days.
**Validates: Requirements 11.4**

**Property 44: Rate limiting enforcement**
*For any* user making more than 20 requests in a 60-second window, subsequent requests should be rejected with a rate limit error.
**Validates: Requirements 11.6**

**Property 45: Comprehensive audit logging**
*For any* data access event, error occurrence, document ingestion, or user interaction, the system should create a log entry with timestamp, user ID (if applicable), event type, and relevant metadata.
**Validates: Requirements 8.5, 11.7, 12.6, 14.7, 15.2**

### Error Handling Properties

**Property 46: Database query retry logic**
*For any* Vector_Database query that fails, the system should retry up to 3 times before returning an error to the user.
**Validates: Requirements 12.2**

**Property 47: Graceful unclear input handling**
*For any* user message that doesn't match a recognized intent or command, the LLM should respond with clarifying questions rather than an error message.
**Validates: Requirements 12.5**

**Property 48: Error escalation threshold**
*For any* user session where system errors occur more than 3 times, the system should offer to escalate to human support or provide a helpline number.
**Validates: Requirements 12.7**

### Caching and Performance Properties

**Property 49: Scheme document caching**
*For any* scheme document accessed multiple times within a short period, subsequent accesses should retrieve from cache rather than querying the Vector_Database.
**Validates: Requirements 13.6**

### Document Ingestion Properties

**Property 50: Document upload API availability**
*For any* valid scheme document (PDF or text format) submitted to the upload endpoint, the API should accept it and begin processing.
**Validates: Requirements 14.1**

**Property 51: Document parsing and embedding**
*For any* uploaded scheme document, the system should extract text, parse key information (scheme name, eligibility, benefits), generate embeddings, and store them in the Vector_Database.
**Validates: Requirements 14.2**

**Property 52: Document validation**
*For any* uploaded document missing required fields (scheme name, eligibility criteria, or benefits), the system should reject it with a detailed error message indicating which fields are missing.
**Validates: Requirements 14.3**

**Property 53: Batch upload processing**
*For any* batch upload containing N scheme documents, the system should process all N documents and return the ingestion status for each.
**Validates: Requirements 14.5**

### Analytics and Monitoring Properties

**Property 54: Comprehensive metrics tracking**
*For any* system operation, the analytics system should track and update relevant metrics including total users, daily active users, messages processed, schemes matched, and conversion rates.
**Validates: Requirements 15.1, 15.6**

**Property 55: Health check endpoint**
*For any* request to the health check endpoint, it should return current system status including API uptime, database connection status, and external service availability.
**Validates: Requirements 15.3**

**Property 56: Error rate alerting**
*For any* time period where error rate exceeds 5% of total requests, the system should send an alert notification to administrators.
**Validates: Requirements 15.4**

**Property 57: Daily report generation**
*For any* day of system operation, a summary report should be generated including user engagement metrics and most queried schemes.
**Validates: Requirements 15.5**

## Error Handling

### Error Categories and Responses

**1. External Service Failures**

- **LLM Service Unavailable**: Return predefined fallback message: "I'm having trouble processing your request right now. Please try again in a few minutes."
- **Translation Service Failure**: Fall back to English and notify user: "Translation is temporarily unavailable. Responding in English."
- **STT Service Failure**: Request alternative input: "I couldn't understand the voice message. Please try sending it again or type your message."
- **Vector Database Unavailable**: Retry up to 3 times with exponential backoff (1s, 2s, 4s), then notify user

**2. Input Validation Errors**

- **Invalid Profile Data**: Provide specific feedback with examples (e.g., "Age should be a number between 1 and 120. Please enter your age.")
- **Unsupported Language**: Inform user of supported languages and ask them to choose
- **Oversized Audio**: Process first 60 seconds and notify: "Your voice message was longer than 60 seconds. I processed the first minute. Please send shorter messages."

**3. Data Errors**

- **Scheme Not Found**: "I couldn't find details for that scheme. Please try selecting from the list again."
- **Empty Search Results**: "I couldn't find schemes matching your profile. Try updating your profile or broadening your search criteria."
- **Missing Required Fields**: Provide clear error message indicating which fields are missing

**4. Rate Limiting**

- **Too Many Requests**: "You're sending messages too quickly. Please wait a moment and try again."
- **Daily Notification Limit**: Silently queue additional notifications for next week

**5. Session Errors**

- **Expired Session**: "Welcome back! Your previous session expired. Would you like to resume where you left off or start fresh?"
- **Corrupted Session Data**: Clear session and restart: "Let's start fresh. What language would you prefer?"

### Error Logging

All errors should be logged with:
- Timestamp
- User ID (if available)
- Error type and category
- Error message
- Stack trace (for system errors)
- Request context (current conversation state, last message)

### Retry Strategies

- **Vector Database Queries**: 3 retries with exponential backoff
- **LLM API Calls**: 2 retries with 1-second delay
- **Translation API**: 2 retries, then fall back to English
- **WhatsApp API**: 3 retries for message sending

### Circuit Breaker Pattern

Implement circuit breakers for external services:
- **Open**: After 5 consecutive failures, stop calling service for 60 seconds
- **Half-Open**: After 60 seconds, allow 1 test request
- **Closed**: If test succeeds, resume normal operation

## Testing Strategy

### Dual Testing Approach

SchemeSaathi requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of profile intake flows
- Edge cases (empty input, boundary values, special characters)
- Error conditions (service failures, invalid data)
- Integration points between components
- Specific scheme matching scenarios

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Translation correctness across random text samples
- Profile validation across random invalid inputs
- Scheme matching across random user profiles
- Message chunking across random text lengths

### Property-Based Testing Configuration

**Framework**: Use `hypothesis` for Python

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `# Feature: scheme-saathi, Property {N}: {property_text}`
- Custom generators for domain objects (UserProfile, SchemeDocument, Message)

**Example Property Test Structure**:

```python
from hypothesis import given, strategies as st
import pytest

# Feature: scheme-saathi, Property 2: Profile collection completeness
@given(
    age=st.integers(min_value=1, max_value=120),
    gender=st.sampled_from(['male', 'female', 'other']),
    state=st.sampled_from(['Maharashtra', 'Tamil Nadu', 'Uttar Pradesh']),
    # ... other profile fields
)
def test_profile_collection_completeness(age, gender, state, ...):
    """
    For any user completing the profile intake flow,
    the system should collect and store all required profile attributes.
    """
    # Simulate profile intake conversation
    profile = simulate_profile_intake(age, gender, state, ...)
    
    # Verify all fields are collected
    assert profile.age == age
    assert profile.gender == gender
    assert profile.state == state
    # ... verify all fields
    
    # Verify stored in database
    stored_profile = db.get_profile(profile.user_id)
    assert stored_profile is not None
    assert stored_profile.is_complete == True
```

### Unit Testing Strategy

**Component-Level Tests**:

1. **WhatsApp Gateway**
   - Test webhook parsing with sample payloads
   - Test message sending with different content types
   - Test message chunking with specific long texts
   - Test security token validation

2. **Conversation Manager**
   - Test state transitions through conversation flow
   - Test context resolution with specific references
   - Test session persistence and expiration
   - Test multi-turn conversations

3. **Translation Service**
   - Test language detection with sample texts
   - Test translation with known input/output pairs
   - Test technical term preservation
   - Test fallback to English on failure

4. **STT/TTS Services**
   - Test audio transcription with sample files
   - Test language support with different audio samples
   - Test error handling for corrupted audio

5. **RAG System**
   - Test embedding generation
   - Test scheme matching with known profiles
   - Test relevance score filtering
   - Test ranking and pagination

6. **Vector Database**
   - Test document ingestion
   - Test semantic search
   - Test metadata filtering
   - Test updates and deletions

### Integration Testing

**End-to-End Flows**:
1. New user profile creation → scheme matching → scheme details → application guidance
2. Voice message → transcription → translation → response
3. Document upload → embedding → subscription matching → notification
4. Session interruption → resume → completion

**External Service Mocking**:
- Mock Twilio/Meta WhatsApp API
- Mock Gemini/GPT API
- Mock Bhashini/Google Translate API
- Mock Whisper STT API

### Test Data

**Synthetic Scheme Documents**:
- Create 50-100 synthetic scheme documents covering different categories
- Include schemes with various eligibility criteria
- Include both online and offline application processes

**Test User Profiles**:
- Create diverse test profiles matching different personas
- Include edge cases (very young, very old, high income, low income)
- Include profiles that match no schemes

**Conversation Scenarios**:
- Happy path conversations
- Conversations with errors and retries
- Conversations with language switching
- Conversations with unclear input

### Performance Testing

**Load Testing**:
- Simulate 100 concurrent users
- Measure response times under load
- Verify auto-scaling triggers

**Stress Testing**:
- Test with 1000+ scheme documents
- Test with 10,000+ user profiles
- Measure Vector Database query performance

### Security Testing

- Test rate limiting enforcement
- Test data encryption at rest and in transit
- Test webhook security validation
- Test SQL injection prevention
- Test data deletion completeness

### Monitoring and Observability

**Metrics to Track**:
- Request latency (p50, p95, p99)
- Error rates by category
- External service availability
- Database query performance
- Cache hit rates

**Alerts**:
- Error rate > 5%
- Response time > 10 seconds
- External service unavailable
- Database connection failures

**Dashboards**:
- Real-time user activity
- Scheme matching success rates
- Conversation completion rates
- System health status