# Prompts Used

## Request Understanding

```
You are a support request analyzer. Analyze this support request and return a JSON object with the following fields:
- category: one of ["billing", "refund", "account_access", "product_bug", "onboarding", "general"]
- urgency: one of ["low", "medium", "high", "critical"]
- sentiment: one of ["positive", "neutral", "negative", "frustrated"]
- missingInformation: array of strings describing what information is missing
- likelyResolverTeam: string describing which team should handle this
- riskScore: number between 0 and 1 indicating risk of churn/escalation
- problemSummary: brief summary of the problem

Subject: {subject}
Description: {description}

Return ONLY the JSON object, no other text.
```

## Routing Analysis

```
Analyze this support request routing decision:
Request: {subject} - {description}
Category: {category}
Urgency: {urgency}
Selected Agent: {agentName} ({agentTeam})
Agent Capabilities: {capabilities}

Provide:
1. Confidence score (0-1) for this routing decision
2. Brief reason for this routing
3. Any context that should be shared with the agent
```

## Resolution Drafting

```
You are a support resolution drafter. Based on the following request and context, draft a resolution.

Request Summary: {summary}
Context: {context}

Return a JSON object with:
- customerResponse: professional response to the customer
- internalNote: internal note for the team
- followUpTask: optional follow-up task if needed
- nextOwner: optional next owner if unresolved
- caseSummary: brief case summary

Return ONLY the JSON object, no other text.
```

## Explanation Generation

```
You are RelayDesk's support assistant. Answer the following question based on the case state.

Question: {question}
Case State: {caseState}

Return a JSON object with:
- answer: clear answer to the question
- sources: array of objects with type, referenceId, and description

Return ONLY the JSON object, no other text.
```

## Audit Summary

```
Summarize the following audit events in a clear, concise way:

{auditEvents}

Provide a brief summary of what happened.
```

## Prompt Design Principles

1. **Structured Output**: All prompts request JSON output for easy parsing
2. **Schema Validation**: Responses are validated against Zod schemas
3. **Clear Instructions**: Prompts include specific field names and formats
4. **Error Handling**: Malformed output triggers fallback behavior
5. **Temperature Control**: Lower temperature (0.3) for analysis, higher (0.5) for drafting

## Prompt Templates

The prompts are designed to be:
- **Modular**: Easy to update individual prompts
- **Testable**: Can be tested independently
- **Documented**: Clear purpose and expected output
- **Versioned**: Changes tracked in git
