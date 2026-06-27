# RelayDesk

Aicoo-native multi-agent support and escalation network.

## Problem

Support work breaks when every handoff loses context. Multi-team coordination is slow. AI agents need identities and routing, not just model calls. Customers repeat themselves. Agents start from zero. Escalations lack context.

## Solution

RelayDesk uses Aicoo as the coordination layer that makes people, agents, and workflows work together. Every actor has an identity. Every handoff preserves context. Every action is auditable.

## How Aicoo is Used

### Agent Identities
Every agent has a clear Aicoo identity with role, team, and capabilities:
- Customer Support Bot (Support team)
- Billing Specialist (Finance team)
- Technical Support Agent (Engineering team)
- Onboarding Specialist (Customer Success team)
- Escalation Manager (Management)

### Cross-Agent Routing
Requests are routed through Aicoo to the correct specialist based on:
- Request category (billing, refund, account access, product bug, onboarding)
- Urgency level (low, medium, high, critical)
- Team availability and capabilities

### Context Persistence
Case context is stored in Aicoo and shared with agents through Mountable Context Cells:
- Original request and customer metadata
- AI analysis (category, urgency, sentiment)
- Prior steps and agent notes
- Resolution drafts and approvals

### Human Handoff
When AI cannot resolve, Aicoo facilitates handoff to human agents:
- Full context preserved
- Audit trail maintained
- Override authority respected

## How AI is Used Safely

### NVIDIA NIM Integration
- **Request Understanding**: AI analyzes incoming requests for category, urgency, and sentiment
- **Routing Decisions**: AI suggests routing with confidence scores
- **Resolution Drafting**: AI drafts customer responses and internal notes
- **Grounded Q&A**: AI answers questions about case state from audit records

### Safety Measures
- Schema validation with Zod for all AI outputs
- Deterministic routing rules combined with AI suggestions
- Human approval required for all resolutions
- Malformed AI output never corrupts case state

## Setup

### Environment Variables

```bash
# NVIDIA NIM API Key
NIM_API_KEY=nvapi-...

# Aicoo API Key
AICOO_API_KEY=aicoo_sk_...
```

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NIM_API_KEY
vercel env add AICOO_API_KEY
```

## Demo Flow

1. **Landing Page**: Understand the product and click "Try Demo"
2. **Demo Mode**: Select a scenario or create a custom request
3. **Request Processing**: AI analyzes the request and routes it
4. **Specialist Workspace**: See context, add notes, draft resolution
5. **Human Review**: Approve, reject, or override the resolution
6. **Audit Trail**: View complete timeline of all actions

## Architecture

```
Customer Request
    ↓
Customer Support Bot (AI Intake)
    ↓
Aicoo Routing Layer
    ↓
Specialist Agent (with Context)
    ↓
Resolution Draft (AI)
    ↓
Human Review & Approval
    ↓
Resolved Case (with Audit Trail)
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **AI Inference**: NVIDIA NIM (Llama 3.3 Nemotron Super 49B)
- **Coordination**: Aicoo API
- **Validation**: Zod
- **Storage**: In-memory store (demo)

## Limitations

- In-memory storage (not persistent across restarts)
- Single-user demo (no authentication)
- Simplified routing logic
- No real-time updates

## Future Work

- Persistent database storage
- Multi-user authentication
- Real-time updates with WebSockets
- More sophisticated routing algorithms
- Integration with real support tools
- Mobile app

## License

MIT
