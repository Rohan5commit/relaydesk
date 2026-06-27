# Aicoo Usage

## How RelayDesk Uses Aicoo

RelayDesk uses Aicoo as the coordination layer for multi-agent support workflows. Aicoo is not a decorative feature—it is the infrastructure that makes agent coordination possible.

## Aicoo Capabilities Used

### 1. Agent Identities
Every actor in the system has a clear Aicoo identity:
- Customer Support Bot
- Billing Specialist
- Technical Support Agent
- Onboarding Specialist
- Escalation Manager

Each identity includes:
- Role and team
- Capabilities
- Current workload
- Online status

### 2. Cross-Agent Routing
Aicoo routes requests to the correct specialist based on:
- Request category
- Urgency level
- Agent capabilities
- Team availability

Routing decisions are recorded with:
- Confidence score
- Reason for routing
- Context shared

### 3. Context Persistence
Case context is stored in Aicoo and shared through Mountable Context Cells:
- Original request
- AI analysis
- Agent notes
- Resolution drafts

Context moves with the case across handoffs.

### 4. Human Handoff
When AI cannot resolve, Aicoo facilitates handoff to human agents:
- Full context preserved
- Audit trail maintained
- Override authority respected

## Where Aicoo Appears in the Product

### 1. Request Intake
When a customer submits a request, Aicoo receives it and creates the initial context.

### 2. Triage
Aicoo coordinates the AI analysis and stores the results.

### 3. Routing
Aicoo selects the appropriate specialist agent and shares context.

### 4. Specialist Workspace
Specialists access case context through Aicoo.

### 5. Resolution
Aicoo stores resolution drafts and manages the approval workflow.

### 6. Audit
Aicoo records all actions and decisions in the audit trail.

## Why Aicoo is Central

### Without Aicoo
- Agents are isolated
- Context is lost at every handoff
- Routing is manual
- Escalations lack context
- No audit trail

### With Aicoo
- Agents have identities
- Context moves with the case
- Routing is intelligent
- Escalations preserve context
- Complete audit trail

### Result
- Faster resolution
- Happier customers
- Accountable workflows
- Scalable coordination

## Aicoo API Usage

### Initialize Workspace
```typescript
await aicooClient.initializeWorkspace();
```

### Accumulate Context
```typescript
await aicooClient.accumulateContext({
  texts: [{
    title: "Request: Subject",
    content: "Customer request details...",
    folder: "Support Requests"
  }],
  folders: {
    create: ["Support Requests"]
  }
});
```

### Create Share Link
```typescript
await aicooClient.createShareLink({
  scope: "all",
  access: "read",
  label: "Case Context"
});
```

## Aicoo Identity Model

Each agent has:
- **ID**: Unique identifier
- **Name**: Human-readable name
- **Type**: customer_facing, specialist, escalation_manager, human
- **Role**: Specific function
- **Team**: Organizational unit
- **Capabilities**: What the agent can do
- **Status**: Online/offline
- **Workload**: Current/max cases

This model enables:
- Access-aware routing
- Context sharing with appropriate scope
- Clear accountability
- Workload balancing

## Aicoo Routing Layer

The routing layer uses:
1. **Deterministic rules**: Category and urgency mapping
2. **AI suggestions**: Confidence scores and reasons
3. **Agent availability**: Online status and workload
4. **Team matching**: Capabilities and team alignment

Routing decisions are:
- Recorded in audit trail
- Visible in case timeline
- Explainable through Ask RelayDesk
