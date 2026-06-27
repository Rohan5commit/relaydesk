# Architecture

## System Overview

RelayDesk is a multi-agent support coordination system built on Aicoo. It demonstrates how AI agents, human operators, and coordination infrastructure work together to resolve support requests efficiently.

## Request Lifecycle

### 1. Receive
Customer submits a support request through the demo interface. The request includes subject, description, and customer information.

### 2. Triage
NVIDIA NIM analyzes the request to determine:
- **Category**: billing, refund, account_access, product_bug, onboarding, general
- **Urgency**: low, medium, high, critical
- **Sentiment**: positive, neutral, negative, frustrated
- **Missing Information**: What details are needed
- **Risk Score**: Likelihood of churn or escalation

### 3. Route
Aicoo routing layer selects the appropriate specialist agent based on:
- Request category and urgency
- Agent team and capabilities
- Current workload and availability
- AI confidence score

### 4. Enrich
Context is shared with the specialist agent through Aicoo:
- Original request and customer metadata
- AI analysis and problem summary
- Prior steps and routing decisions
- Notes from previous agents

### 5. Resolve
Specialist agent works on resolution:
- Reviews full context
- Adds notes and observations
- Drafts resolution with AI assistance
- Submits for human review

### 6. Audit
Complete trail of all actions is recorded:
- Request received and triaged
- Routing decisions and reasons
- Context shared between agents
- Notes added by each agent
- Resolution drafted and approved

## Aicoo Routing Flow

```
Request arrives
    ↓
Customer Support Bot receives
    ↓
AI analyzes request
    ↓
Aicoo selects specialist agent
    ↓
Context shared via Aicoo
    ↓
Specialist receives request with context
    ↓
Specialist works on resolution
    ↓
If needed, escalates through Aicoo
    ↓
Human reviews and approves
    ↓
Case resolved with audit trail
```

## Context Persistence Flow

### Initial Context
- Customer request (subject, description, metadata)
- AI analysis (category, urgency, sentiment)

### During Processing
- Agent notes and observations
- Routing decisions and reasons
- Context shared between agents

### Resolution
- AI-drafted resolution
- Human approval/rejection
- Final case summary

### Storage
- In-memory store for demo
- Aicoo workspace for context sharing
- Audit trail for all actions

## Human Review Flow

1. **Draft**: AI generates resolution draft
2. **Submit**: Specialist submits for review
3. **Review**: Human operator reviews draft
4. **Decision**: Approve, reject, override, or request more context
5. **Execute**: Approved resolution is applied
6. **Audit**: Decision is recorded in audit trail

## Audit Flow

Every action in the system generates an audit event:
- `request_received`: Customer submits request
- `triage_completed`: AI analysis complete
- `routed`: Request routed to specialist
- `context_shared`: Context shared with agent
- `agent_joined`: Agent takes ownership
- `note_added`: Agent adds note
- `resolution_drafted`: Resolution drafted
- `resolution_approved`: Human approves
- `resolution_rejected`: Human rejects
- `escalated`: Request escalated
- `resolved`: Case resolved

Audit events are immutable and provide complete traceability.
