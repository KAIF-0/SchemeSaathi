# SchemeSaathi

SchemeSaathi is a multilingual WhatsApp assistant designed to help people discover and understand relevant government welfare schemes through natural conversation.

## Overview

SchemeSaathi focuses on accessibility and simplicity:
- Users chat on WhatsApp in their preferred language
- The assistant understands user context and profile intent
- It retrieves relevant scheme information and returns practical guidance

## Current Platform Notes

- Agent orchestration is active and running.
- Agent tracing is enabled with **LangSmith**.
- API trace controls and rate limiting are planned with **ArcJet** (to be implemented).
- Audio transcription is planned as a future feature.

## Project Flow

```text
┌────────────────────┐
│  User on WhatsApp  │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│  Incoming Message  │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│ SchemeSaathi Agent │◄──────────────┐
└──────────┬─────────┘               │
           │                         │
           ▼                         │
┌────────────────────┐               │
│ Context + Intent   │               │
│ Understanding      │               │
└──────────┬─────────┘               │
           │                         │
           ▼                         │
┌────────────────────┐               │
│ Relevant Scheme    │               │
│ Retrieval          │               │
└──────────┬─────────┘               │
           │                         │
           ▼                         │
┌────────────────────┐               │
│ Response Generation│               │
└──────────┬─────────┘               │
           │                         │
           ▼                         │
┌────────────────────┐               │
│ Reply on WhatsApp  │               │
└────────────────────┘               │

Tracing: LangSmith ──────────────────┘
Future API tracing + rate limiting: ArcJet
```

## Product Direction

- Strengthen multilingual experience across all interactions
- Add ArcJet-based API protections and rate limiting
- Add audio transcription in a future release
