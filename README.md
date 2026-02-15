# SchemeSaathi 🇮🇳

> Bridging the gap between citizens and government benefits via AI-powered WhatsApp accessibility

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

SchemeSaathi is a multilingual, AI-driven WhatsApp chatbot designed to help rural and semi-urban Indian citizens discover, understand, and apply for government welfare schemes. While thousands of schemes exist, intended beneficiaries often lack awareness or technical literacy to navigate complex government portals. SchemeSaathi solves this by using a familiar interface (WhatsApp) and natural language processing to simplify the entire process.

## The Problem

- **Awareness Gap**: Citizens are unaware of schemes they're eligible for
- **Complexity**: Government portals are difficult to navigate for users with limited technical literacy
- **Language Barriers**: Most information is in English, excluding non-English speakers
- **Low Literacy**: Text-heavy interfaces exclude users with reading difficulties

## The Solution

SchemeSaathi provides:
- 🗣️ **Conversational Interface**: Natural chat-based interaction, no complex forms
- 🌐 **Multilingual Support**: English, Hindi, and regional languages (Tamil/Marathi)
- 🎤 **Voice-First Design**: Audio input for users with low literacy
- 🤖 **AI-Powered Matching**: RAG-based system finds relevant schemes automatically
- 📋 **Step-by-Step Guidance**: Simplified application instructions
- 🔔 **Smart Alerts**: Notifications about new schemes matching user profiles

## Key Features

### 1. User Profiling via Chat
Conversational intake of user details (age, gender, location, occupation, income, category) without complex forms.

### 2. Multilingual Support
Full support for English, Hindi, and at least one regional language using AI translation layers (Bhashini/Google Translate).

### 3. RAG-Based Scheme Matching
Retrieval-Augmented Generation system matches user profiles against a vector database of government scheme documents with high accuracy.

### 4. Voice-First Interface
Support for audio input (voice notes) using Speech-to-Text (Whisper) for users with low literacy.

### 5. Application Guidance
Step-by-step, simplified guides: "Get these 3 documents ready," "Go to this link," "Visit the Block Office."

### 6. Subscription & Alerts
Users can subscribe to new schemes relevant to their profile (e.g., a farmer gets alerted when a new crop insurance scheme launches).

## Architecture

```
┌─────────────┐
│   WhatsApp  │
│    Users    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│         WhatsApp Gateway (Twilio/Meta API)              │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (FastAPI)                      │
│  ┌─────────────────┐  ┌──────────────────┐              │
│  │  Conversation   │  │   Translation    │              │
│  │    Manager      │  │     Service      │              │
│  └────────┬────────┘  └────────┬─────────┘              │
│           │                     │                       │
│           ▼                     ▼                       │
│  ┌─────────────────────────────────────┐                │
│  │   LLM Orchestration (LangChain)     │                │
│  └────────┬────────────────────────────┘                │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐  ┌──────────────────┐              │
│  │   RAG System    │  │   STT/TTS        │              │
│  └────────┬────────┘  └──────────────────┘              │
└───────────┼─────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│              Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  PostgreSQL  │  │   Vector DB  │  │    Redis     │   │
│  │  (User Data) │  │  (Schemes)   │  │  (Sessions)  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

### Interface
- **WhatsApp**: Twilio API or Meta WhatsApp Cloud API

### Backend
- **Framework**: Python with FastAPI
- **LLM Orchestration**: LangChain
- **AI Model**: Google Gemini 2.5 Pro/Flash or OpenAI GPT-4o-mini

### Data Storage
- **Vector Database**: Pinecone or ChromaDB (for scheme documents)
- **Relational Database**: PostgreSQL (user data, profiles, conversations)
- **Cache**: Redis (sessions, translations)

### AI Services
- **Translation**: AI4Bharat (Bhashini) API or Google Translate API
- **Speech-to-Text**: OpenAI Whisper
- **Text-to-Speech**: Google TTS or similar

### Hosting
- Render, Railway, or AWS Lambda (serverless)

## User Personas

### 👨‍🌾 Ramesh the Farmer
45-year-old farmer from rural Maharashtra with limited literacy. Uses WhatsApp daily, prefers voice messages. Needs agricultural subsidies and crop insurance schemes.

### 👩‍💼 Lakshmi the Entrepreneur
32-year-old woman from semi-urban Tamil Nadu running a small tailoring business. Needs women entrepreneurship schemes and microfinance options.

### 🎓 Arjun the Student
19-year-old college student from Uttar Pradesh. Tech-savvy but unaware of lesser-known scholarships and education schemes.

## Getting Started

### Prerequisites
```bash
- Python 3.9+
- PostgreSQL 13+
- Redis 6+
- Twilio Account or Meta WhatsApp Business Account
- API Keys: Gemini/OpenAI, Bhashini, Whisper
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/schemesaathi.git
cd schemesaathi

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

### Environment Variables

```env
# WhatsApp
WHATSAPP_VERIFY_TOKEN=your_verify_token
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
# OR
META_ACCESS_TOKEN=your_meta_token

# AI Services
GEMINI_API_KEY=your_gemini_key
# OR
OPENAI_API_KEY=your_openai_key

# Translation
BHASHINI_API_KEY=your_bhashini_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/schemesaathi
REDIS_URL=redis://localhost:6379

# Vector Database
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_environment
```

## Project Structure

```
schemesaathi/
├── app/
│   ├── api/              # API endpoints
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   │   ├── conversation_manager.py
│   │   ├── translation_service.py
│   │   ├── rag_system.py
│   │   ├── stt_service.py
│   │   └── whatsapp_gateway.py
│   ├── core/             # Configuration
│   └── main.py           # FastAPI application
├── tests/                # Unit and property-based tests
├── alembic/              # Database migrations
├── .kiro/
│   └── specs/
│       └── scheme-saathi/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── requirements.txt
├── .env.example
└── README.md
```

## Documentation

- **[Requirements Document](.kiro/specs/scheme-saathi/requirements.md)**: Detailed functional and non-functional requirements
- **[Design Document](.kiro/specs/scheme-saathi/design.md)**: System architecture, components, and interfaces
- **[Implementation Tasks](.kiro/specs/scheme-saathi/tasks.md)**: Step-by-step implementation plan

## API Endpoints

### WhatsApp Webhook
```
POST /webhook/whatsapp
```
Receives incoming WhatsApp messages

### Scheme Management
```
POST /api/schemes/upload
POST /api/schemes/batch-upload
```
Upload scheme documents (admin only)

### Health & Monitoring
```
GET /health
GET /metrics
```
System health and performance metrics

## Testing

```bash
# Run all tests
pytest

# Run unit tests only
pytest tests/unit/

# Run property-based tests
pytest tests/property/

# Run with coverage
pytest --cov=app tests/
```

## Deployment

### Docker
```bash
docker-compose up -d
```

### Render/Railway
Follow the deployment guide in the documentation.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [x] Requirements and design documentation
- [ ] Core data models and database setup
- [ ] Translation and STT/TTS services
- [ ] RAG system with vector database
- [ ] Conversation manager with state machine
- [ ] WhatsApp integration
- [ ] Subscription and notification system
- [ ] Security and privacy features
- [ ] Deployment and monitoring

See [tasks.md](.kiro/specs/scheme-saathi/tasks.md) for detailed implementation plan.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- AI4Bharat for Bhashini translation API
- OpenAI for Whisper STT
- Google for Gemini LLM
- Government of India for scheme data

## Contact

Project Link: [https://github.com/yourusername/schemesaathi](https://github.com/yourusername/schemesaathi)

---

**Made with ❤️ for rural India**
