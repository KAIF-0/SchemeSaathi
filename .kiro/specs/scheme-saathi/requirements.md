# Requirements Document: SchemeSaathi

## Introduction

SchemeSaathi is an AI-powered WhatsApp chatbot designed to bridge the awareness gap between Indian citizens in rural and semi-urban areas and the thousands of government welfare schemes available to them. The system addresses the critical problem that intended beneficiaries often lack awareness or technical literacy to navigate complex government portals, resulting in low scheme uptake despite eligibility.

The chatbot provides a conversational, multilingual, voice-enabled interface that helps users discover eligible schemes through intelligent profile matching, understand scheme benefits and requirements, and receive step-by-step guidance for applications.

## Glossary

- **SchemeSaathi**: The AI-powered WhatsApp chatbot system
- **User**: A citizen interacting with the chatbot to discover welfare schemes
- **Scheme**: A government welfare program offering benefits to eligible citizens
- **Profile**: A collection of user attributes (age, gender, location, occupation, income, category) used for scheme matching
- **RAG_System**: Retrieval-Augmented Generation system that matches user profiles against scheme documents
- **Vector_Database**: Database storing embedded representations of scheme documents for semantic search
- **Conversation_Manager**: Component managing multi-turn conversational flows
- **Translation_Service**: Service providing multilingual support across English, Hindi, and regional languages
- **STT_Service**: Speech-to-Text service converting voice notes to text
- **TTS_Service**: Text-to-Speech service converting text responses to audio
- **WhatsApp_Gateway**: Interface layer connecting to WhatsApp via Twilio or Meta Cloud API
- **Scheme_Document**: PDF or text document containing official scheme notification and details
- **Eligibility_Criteria**: Set of conditions a user must meet to qualify for a scheme
- **Application_Guide**: Step-by-step instructions for applying to a specific scheme
- **Subscription**: User preference to receive alerts about new schemes matching their profile
- **Session**: A continuous interaction period between user and chatbot
- **Backend_API**: FastAPI or Flask server handling business logic
- **LLM**: Large Language Model (Gemini or GPT) powering conversational AI

## User Personas

### Persona 1: Ramesh the Farmer
- **Demographics**: 45-year-old male farmer from rural Maharashtra
- **Literacy**: Limited literacy, comfortable with basic Hindi and Marathi
- **Technology**: Uses WhatsApp daily for family communication, prefers voice messages
- **Income**: Annual income ₹80,000 from 2-acre farm
- **Category**: OBC (Other Backward Class)
- **Needs**: Agricultural subsidies, crop insurance, irrigation support schemes
- **Pain Points**: Cannot navigate government websites, unaware of available schemes, struggles with English forms
- **Scenario**: Ramesh hears about SchemeSaathi from his village sarpanch. He sends a voice message in Marathi asking "What schemes are available for farmers?" The bot guides him through profile creation via simple questions, then presents 3 relevant schemes including PM-KISAN and Pradhan Mantri Fasal Bima Yojana with application steps in Marathi.

### Persona 2: Lakshmi the Self-Help Group Member
- **Demographics**: 32-year-old woman from semi-urban Tamil Nadu
- **Literacy**: Completed 10th standard, reads Tamil and basic English
- **Technology**: Active WhatsApp user, comfortable with text and images
- **Income**: Household income ₹1,50,000, runs small tailoring business
- **Category**: SC (Scheduled Caste)
- **Needs**: Women entrepreneurship schemes, skill development programs, microfinance options
- **Pain Points**: Overwhelmed by scheme information, unsure about eligibility, needs guidance in Tamil
- **Scenario**: Lakshmi texts in Tamil asking about business loans for women. The bot collects her profile through conversational questions, identifies her eligibility for MUDRA Yojana and Stand-Up India, and provides detailed application guidance with document checklists.

### Persona 3: Arjun the Student
- **Demographics**: 19-year-old male college student from Uttar Pradesh
- **Literacy**: Fluent in Hindi and English
- **Technology**: Tech-savvy, uses WhatsApp extensively
- **Income**: Family income ₹2,00,000 annually
- **Category**: General category
- **Needs**: Scholarship schemes, skill development programs, education loans
- **Pain Points**: Unaware of lesser-known scholarships, misses application deadlines
- **Scenario**: Arjun texts in English asking about engineering scholarships. After profile creation, the bot matches him with National Scholarship Portal schemes and sets up subscription alerts for new education schemes.

## Requirements

### Requirement 1: User Profile Creation

**User Story:** As a user, I want to provide my personal details through simple conversational questions, so that the system can identify schemes relevant to me without filling complex forms.

#### Acceptance Criteria

1. WHEN a new user initiates conversation, THE Conversation_Manager SHALL greet the user and request their preferred language
2. WHEN a user selects a language, THE Conversation_Manager SHALL conduct the profile intake conversation in that language
3. THE Conversation_Manager SHALL collect the following profile attributes through conversational questions: age, gender, state of residence, district, occupation, annual income bracket, and caste category
4. WHEN a user provides an invalid response (e.g., age as text, negative income), THE Conversation_Manager SHALL request clarification with examples
5. WHEN all required profile attributes are collected, THE SchemeSaathi SHALL store the profile in the database and confirm completion to the user
6. WHEN a user provides partial information and stops responding, THE SchemeSaathi SHALL save the partial profile and resume from the last question when the user returns
7. THE Conversation_Manager SHALL allow users to skip optional fields (e.g., caste category) and continue with scheme matching

### Requirement 2: Multilingual Support

**User Story:** As a user with limited English proficiency, I want to interact with the chatbot in my native language, so that I can understand scheme information clearly.

#### Acceptance Criteria

1. THE SchemeSaathi SHALL support at least three languages: English, Hindi, and one regional language (Tamil or Marathi)
2. WHEN a user sends a message in any supported language, THE Translation_Service SHALL detect the language and process the message accordingly
3. WHEN generating responses, THE Translation_Service SHALL translate all scheme information, questions, and guidance into the user's preferred language
4. WHEN a user switches language mid-conversation, THE SchemeSaathi SHALL continue the conversation in the new language without losing context
5. THE Translation_Service SHALL preserve technical terms (scheme names, document types) in their original form while translating surrounding text
6. WHEN translation fails or is unavailable, THE SchemeSaathi SHALL respond in English and notify the user about the language limitation

### Requirement 3: Voice Input Processing

**User Story:** As a user with low literacy, I want to send voice messages instead of typing, so that I can interact with the chatbot despite reading/writing difficulties.

#### Acceptance Criteria

1. WHEN a user sends a voice note via WhatsApp, THE STT_Service SHALL convert the audio to text
2. THE STT_Service SHALL support voice input in all supported languages (English, Hindi, regional language)
3. WHEN voice transcription is complete, THE Conversation_Manager SHALL process the transcribed text as a regular message
4. WHEN voice transcription fails or audio quality is poor, THE SchemeSaathi SHALL request the user to resend the message or type their query
5. THE STT_Service SHALL handle audio files up to 60 seconds in duration
6. WHEN a user sends audio longer than 60 seconds, THE SchemeSaathi SHALL process the first 60 seconds and notify the user about the truncation

### Requirement 4: RAG-Based Scheme Matching

**User Story:** As a user, I want the system to automatically find government schemes I'm eligible for based on my profile, so that I don't miss out on benefits due to lack of awareness.

#### Acceptance Criteria

1. WHEN a user profile is complete, THE RAG_System SHALL query the Vector_Database with the user's profile attributes
2. THE RAG_System SHALL retrieve scheme documents that match the user's eligibility criteria with a relevance score above 0.7
3. THE RAG_System SHALL rank matched schemes by relevance score and present the top 5 schemes to the user
4. WHEN presenting schemes, THE SchemeSaathi SHALL include scheme name, brief description, key benefits, and eligibility summary for each scheme
5. THE RAG_System SHALL use semantic search to match user profiles against scheme eligibility criteria, not just keyword matching
6. WHEN no schemes match the user profile with score above 0.7, THE SchemeSaathi SHALL inform the user and suggest broadening their search or updating their profile
7. WHEN a user requests more schemes beyond the top 5, THE SchemeSaathi SHALL present the next 5 schemes in ranked order

### Requirement 5: Scheme Detail Retrieval

**User Story:** As a user, I want to get detailed information about a specific scheme, so that I can understand the benefits, eligibility requirements, and application process.

#### Acceptance Criteria

1. WHEN a user selects a scheme from the matched list, THE RAG_System SHALL retrieve the complete scheme document from the Vector_Database
2. THE SchemeSaathi SHALL present scheme details including: full scheme name, objective, benefits, detailed eligibility criteria, required documents, application process, and official website link
3. WHEN presenting scheme details, THE Translation_Service SHALL translate all content into the user's preferred language
4. THE SchemeSaathi SHALL format scheme details in a structured, easy-to-read WhatsApp message format with clear sections
5. WHEN a scheme document contains application deadlines, THE SchemeSaathi SHALL highlight the deadline prominently in the response
6. WHEN a user requests clarification about specific scheme aspects, THE LLM SHALL generate contextual answers based on the scheme document

### Requirement 6: Application Guidance

**User Story:** As a user, I want step-by-step guidance on how to apply for a scheme, so that I can complete the application process successfully.

#### Acceptance Criteria

1. WHEN a user requests application guidance for a scheme, THE SchemeSaathi SHALL provide a numbered step-by-step guide
2. THE Application_Guide SHALL include: where to apply (online portal URL or offline office address), required documents checklist, step-by-step application instructions, and helpline contact information
3. WHEN an application can be completed online, THE SchemeSaathi SHALL provide the direct application portal link
4. WHEN an application requires offline submission, THE SchemeSaathi SHALL provide the nearest office address based on the user's district
5. THE SchemeSaathi SHALL break down complex application processes into simple, actionable steps with clear language
6. WHEN a user asks questions during application guidance, THE LLM SHALL provide contextual answers based on the scheme's application process

### Requirement 7: Scheme Subscription and Alerts

**User Story:** As a user, I want to subscribe to notifications about new schemes matching my profile, so that I don't miss newly launched benefits.

#### Acceptance Criteria

1. WHEN a user completes profile creation, THE SchemeSaathi SHALL offer the option to subscribe to scheme alerts
2. WHEN a user subscribes, THE SchemeSaathi SHALL store the subscription preference with the user's profile
3. WHEN a new scheme document is added to the Vector_Database, THE SchemeSaathi SHALL match it against all subscribed user profiles
4. WHEN a new scheme matches a subscribed user's profile with relevance score above 0.7, THE SchemeSaathi SHALL send a WhatsApp notification to the user within 24 hours
5. THE notification SHALL include scheme name, brief description, and a prompt to get full details
6. WHEN a user wants to unsubscribe, THE SchemeSaathi SHALL process the unsubscribe request and confirm the change
7. THE SchemeSaathi SHALL limit notifications to a maximum of 3 schemes per week per user to avoid overwhelming users

### Requirement 8: Conversation Context Management

**User Story:** As a user, I want the chatbot to remember our conversation context, so that I don't have to repeat information and can have natural multi-turn conversations.

#### Acceptance Criteria

1. THE Conversation_Manager SHALL maintain conversation context for each user session
2. WHEN a user refers to previously mentioned information (e.g., "tell me more about the second scheme"), THE Conversation_Manager SHALL resolve the reference using conversation history
3. THE Conversation_Manager SHALL maintain session context for up to 24 hours of inactivity
4. WHEN a session expires after 24 hours, THE Conversation_Manager SHALL greet the user as a returning user and offer to resume or start fresh
5. THE Conversation_Manager SHALL store conversation history in the database for audit and improvement purposes
6. WHEN a user explicitly requests to start over, THE Conversation_Manager SHALL clear the current session context and begin a new conversation flow

### Requirement 9: WhatsApp Integration

**User Story:** As a user, I want to interact with SchemeSaathi through WhatsApp, so that I can use a familiar platform without installing new apps.

#### Acceptance Criteria

1. THE WhatsApp_Gateway SHALL receive incoming messages from users via Twilio API or Meta WhatsApp Cloud API
2. WHEN a message is received, THE WhatsApp_Gateway SHALL extract the message content, sender phone number, message type (text/audio/image), and timestamp
3. THE WhatsApp_Gateway SHALL forward the extracted message data to the Backend_API for processing
4. WHEN the Backend_API generates a response, THE WhatsApp_Gateway SHALL send the response to the user's WhatsApp number
5. THE WhatsApp_Gateway SHALL support sending text messages, formatted messages with line breaks, and audio files
6. WHEN sending long responses, THE WhatsApp_Gateway SHALL split messages into chunks of maximum 4096 characters
7. THE WhatsApp_Gateway SHALL handle webhook verification and security token validation as per WhatsApp API requirements

### Requirement 10: Vector Database Management

**User Story:** As a system administrator, I want to efficiently store and retrieve scheme documents, so that the RAG system can quickly match users with relevant schemes.

#### Acceptance Criteria

1. THE Vector_Database SHALL store embedded representations of all scheme documents with metadata (scheme name, state, category, last updated date)
2. WHEN a new scheme document is added, THE SchemeSaathi SHALL parse the document, generate embeddings using the LLM, and store them in the Vector_Database
3. THE Vector_Database SHALL support semantic similarity search with cosine similarity scoring
4. WHEN querying the Vector_Database, THE RAG_System SHALL retrieve results within 2 seconds for 95% of queries
5. THE Vector_Database SHALL support filtering by metadata (e.g., state-specific schemes, category-specific schemes)
6. WHEN a scheme document is updated, THE SchemeSaathi SHALL update the corresponding embeddings in the Vector_Database
7. THE Vector_Database SHALL maintain an index of at least 1000 scheme documents with efficient retrieval performance

### Requirement 11: User Data Privacy and Security

**User Story:** As a user, I want my personal information to be stored securely and used only for scheme matching, so that my privacy is protected.

#### Acceptance Criteria

1. THE SchemeSaathi SHALL encrypt all user profile data at rest using AES-256 encryption
2. THE SchemeSaathi SHALL encrypt all data in transit using TLS 1.2 or higher
3. THE Backend_API SHALL not store raw WhatsApp message content beyond 30 days
4. WHEN a user requests data deletion, THE SchemeSaathi SHALL delete all user profile data, conversation history, and subscription preferences within 7 days
5. THE SchemeSaathi SHALL not share user data with third parties except as required for service operation (WhatsApp API, translation API)
6. THE Backend_API SHALL implement rate limiting of 20 requests per minute per user to prevent abuse
7. THE SchemeSaathi SHALL log all data access events for security audit purposes

### Requirement 12: Error Handling and Fallback

**User Story:** As a user, I want the chatbot to handle errors gracefully and provide helpful guidance when something goes wrong, so that I can continue using the service.

#### Acceptance Criteria

1. WHEN the LLM service is unavailable, THE SchemeSaathi SHALL respond with a predefined message asking the user to try again later
2. WHEN the Vector_Database query fails, THE SchemeSaathi SHALL retry the query up to 3 times before notifying the user of the issue
3. WHEN the Translation_Service fails, THE SchemeSaathi SHALL fall back to English and inform the user about the temporary language limitation
4. WHEN the STT_Service fails to transcribe audio, THE SchemeSaathi SHALL request the user to resend the voice note or type their message
5. WHEN the user sends an unrecognized command or unclear message, THE LLM SHALL ask clarifying questions rather than returning an error
6. THE SchemeSaathi SHALL log all errors with context (user ID, timestamp, error type) for debugging and monitoring
7. WHEN system errors occur more than 3 times in a single session, THE SchemeSaathi SHALL offer to escalate to human support or provide a helpline number

### Requirement 13: Performance and Scalability

**User Story:** As a user, I want the chatbot to respond quickly to my queries, so that I can get information without long waits.

#### Acceptance Criteria

1. THE SchemeSaathi SHALL respond to text messages within 5 seconds for 95% of requests
2. THE STT_Service SHALL process voice notes and respond within 10 seconds for 90% of requests
3. THE Backend_API SHALL handle at least 100 concurrent user sessions without performance degradation
4. WHEN the RAG_System performs scheme matching, THE query execution time SHALL not exceed 3 seconds
5. THE WhatsApp_Gateway SHALL process incoming webhooks within 1 second to avoid timeout issues
6. THE SchemeSaathi SHALL implement caching for frequently accessed scheme documents to reduce database load
7. WHEN system load exceeds 80% capacity, THE Backend_API SHALL trigger auto-scaling to add additional server instances

### Requirement 14: Scheme Document Ingestion

**User Story:** As a system administrator, I want to easily add new scheme documents to the system, so that users can discover newly launched schemes.

#### Acceptance Criteria

1. THE SchemeSaathi SHALL provide an API endpoint for uploading scheme documents in PDF or text format
2. WHEN a scheme document is uploaded, THE SchemeSaathi SHALL extract text content, parse key information (scheme name, eligibility, benefits), and generate embeddings
3. THE SchemeSaathi SHALL validate that uploaded documents contain required fields (scheme name, eligibility criteria, benefits) before ingestion
4. WHEN document parsing fails, THE SchemeSaathi SHALL return a detailed error message indicating missing or malformed content
5. THE SchemeSaathi SHALL support batch upload of multiple scheme documents via a single API call
6. WHEN a scheme document is successfully ingested, THE SchemeSaathi SHALL trigger the subscription alert matching process for all subscribed users
7. THE SchemeSaathi SHALL maintain a log of all document ingestion events with timestamp, document name, and ingestion status

### Requirement 15: Analytics and Monitoring

**User Story:** As a system administrator, I want to monitor system usage and performance metrics, so that I can identify issues and improve the service.

#### Acceptance Criteria

1. THE SchemeSaathi SHALL track and store the following metrics: total users, daily active users, messages processed per day, schemes matched per day, and average response time
2. THE SchemeSaathi SHALL log all user interactions with metadata (user ID, message type, timestamp, language, response time)
3. THE Backend_API SHALL expose a metrics endpoint providing real-time system health status (API uptime, database connection status, external service status)
4. WHEN error rates exceed 5% of total requests, THE SchemeSaathi SHALL send an alert notification to administrators
5. THE SchemeSaathi SHALL generate daily summary reports including user engagement metrics and most queried schemes
6. THE SchemeSaathi SHALL track scheme application conversion rates (users who requested application guidance vs. total scheme views)
7. THE Backend_API SHALL implement health check endpoints that respond within 500ms for monitoring tools