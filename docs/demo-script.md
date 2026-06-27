# Demo Script

## 2-5 Minute Demo Narration

### Opening (30 seconds)

"RelayDesk is an Aicoo-native multi-agent support network. It solves the problem of context loss in support handoffs. When customers repeat themselves, agents start from zero, and escalations lack context, support breaks.

RelayDesk uses Aicoo as the coordination layer so people, agents, and workflows work together. Every actor has an identity. Every handoff preserves context. Every action is auditable."

### Demo Walkthrough (2-3 minutes)

**Step 1: Submit Request (30 seconds)**

"Let's see it in action. A customer submits a support request about a duplicate billing charge. Watch what happens."

[Click "Try Demo" → Select "Duplicate Billing Charge" scenario → Submit]

"The customer enters their issue. NVIDIA NIM analyzes the request and determines it's a billing issue with high urgency."

**Step 2: AI Triage (30 seconds)**

"AI has already triaged this. It identified:
- Category: Billing
- Urgency: High
- Sentiment: Negative
- Missing information: Transaction IDs
- Risk score: 70%"

[Show the case detail page with AI analysis]

**Step 3: Aicoo Routing (30 seconds)**

"Now Aicoo routes this to the right specialist. It selected the Billing Specialist from the Finance team based on category and urgency."

[Show routing history]

"The routing decision includes confidence score and the context that was shared."

**Step 4: Specialist Workspace (30 seconds)**

"The Billing Specialist receives the case with full context. They don't need to ask the customer to repeat themselves."

[Show case context panel]

"Notice the problem summary, customer metadata, and the AI analysis are all visible."

**Step 5: Resolution Draft (30 seconds)**

"The specialist drafts a resolution with AI assistance."

[Click "Draft Resolution with AI"]

"AI generates a customer response and internal note. The specialist can review and edit."

**Step 6: Human Review (30 seconds)**

"A human operator reviews the draft."

[Show resolution in pending review state]

"They can approve, reject, override, or request more context. This ensures quality and accountability."

**Step 7: Audit Trail (30 seconds)**

"Every action is recorded in the audit trail."

[Show timeline tab]

"You can see:
- When the request was received
- How it was triaged
- Where it was routed
- What context was shared
- Who approved the final action"

### Closing (30 seconds)

"RelayDesk proves that Aicoo is the coordination layer that makes multi-agent support work. It's not just a chatbot—it's a complete workflow with identities, routing, context preservation, and human oversight.

The result: faster resolution, happier customers, and accountable workflows."

## Key Points to Highlight

1. **Aicoo is central**: Not a decorative feature, but the coordination infrastructure
2. **Multi-agent coordination**: Customer-facing, specialist, and human agents work together
3. **Context preservation**: No more repeating yourself across handoffs
4. **Human oversight**: AI drafts, humans approve
5. **Audit trail**: Complete traceability of all actions

## Demo Scenarios

### Scenario 1: Duplicate Billing
- Category: Billing
- Urgency: High
- Route to: Billing Specialist
- Resolution: Refund duplicate charge

### Scenario 2: Account Access
- Category: Account Access
- Urgency: Critical
- Route to: Technical Support
- Resolution: Password reset assistance

### Scenario 3: Product Bug
- Category: Product Bug
- Urgency: High
- Route to: Engineering
- Resolution: Bug fix and workaround

## Technical Highlights

1. **NVIDIA NIM**: AI inference for request understanding and resolution drafting
2. **Aicoo**: Coordination layer for routing, context, and audit
3. **Next.js 15**: Modern React framework with App Router
4. **shadcn/ui**: Beautiful, accessible components
5. **TypeScript**: Type-safe code throughout
