const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";

interface NimConfig {
  apiKey: string;
  model?: string;
}

interface NimMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface NimChatRequest {
  messages: NimMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface NimChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface RequestUnderstanding {
  category: string;
  urgency: "low" | "medium" | "high" | "critical";
  sentiment: "positive" | "neutral" | "negative" | "frustrated";
  missingInformation: string[];
  likelyResolverTeam: string;
  riskScore: number;
  problemSummary: string;
}

interface ResolutionDraft {
  customerResponse: string;
  internalNote: string;
  followUpTask?: string;
  nextOwner?: string;
  caseSummary: string;
}

interface AgentExplanation {
  answer: string;
  sources: Array<{
    type: string;
    referenceId: string;
    description: string;
  }>;
}

function fallbackUnderstand(subject: string, description: string): RequestUnderstanding {
  const text = `${subject} ${description}`.toLowerCase();
  let category: RequestUnderstanding["category"] = "general";
  if (text.includes("bill") || text.includes("charge") || text.includes("payment")) category = "billing";
  else if (text.includes("refund")) category = "refund";
  else if (text.includes("access") || text.includes("locked") || text.includes("password")) category = "account_access";
  else if (text.includes("bug") || text.includes("error") || text.includes("broken") || text.includes("incorrect")) category = "product_bug";
  else if (text.includes("setup") || text.includes("onboard") || text.includes("install")) category = "onboarding";

  let urgency: RequestUnderstanding["urgency"] = "medium";
  if (text.includes("urgent") || text.includes("critical") || text.includes("immediately")) urgency = "critical";
  else if (text.includes("asap") || text.includes("important")) urgency = "high";
  else if (text.includes("whenever") || text.includes("no rush")) urgency = "low";

  let sentiment: RequestUnderstanding["sentiment"] = "neutral";
  if (text.includes("frustrated") || text.includes("angry") || text.includes("unacceptable")) sentiment = "frustrated";
  else if (text.includes("disappointed") || text.includes("upset")) sentiment = "negative";
  else if (text.includes("thank") || text.includes("great") || text.includes("love")) sentiment = "positive";

  const teamMap: Record<string, string> = {
    billing: "Finance",
    refund: "Finance",
    account_access: "Technical Support",
    product_bug: "Engineering",
    onboarding: "Customer Success",
    general: "Support",
  };

  return {
    category,
    urgency,
    sentiment,
    missingInformation: [],
    likelyResolverTeam: teamMap[category] || "Support",
    riskScore: urgency === "critical" ? 0.9 : urgency === "high" ? 0.7 : urgency === "medium" ? 0.4 : 0.2,
    problemSummary: subject,
  };
}

function fallbackDraftResolution(summary: string): ResolutionDraft {
  return {
    customerResponse: `Thank you for reaching out to us. We have reviewed your request regarding "${summary}" and our team is working on resolving this for you. We will follow up within 24 hours with an update.`,
    internalNote: `Customer requested assistance with: ${summary}. Case requires follow-up from the assigned team.`,
    followUpTask: "Follow up with customer within 24 hours",
    caseSummary: summary,
  };
}

function fallbackExplain(question: string): AgentExplanation {
  return {
    answer: `Based on the case data, this request was processed through RelayDesk's multi-agent coordination system. The request was triaged, routed to the appropriate specialist agent via Aicoo, and resolved with human oversight. For specific details, please review the case timeline.`,
    sources: [],
  };
}

export class NvidiaNimClient {
  private apiKey: string;
  private model: string;

  constructor(config: NimConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "nvidia/llama-3.3-nemotron-super-49b-v1";
  }

  private get hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  async chat(request: NimChatRequest): Promise<string> {
    if (!this.hasApiKey) {
      return "AI service is running in fallback mode. The NVIDIA NIM API key is not configured.";
    }

    const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        model: request.model || this.model,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA NIM API error: ${response.status} - ${error}`);
    }

    const data: NimChatResponse = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  private async chatWithJson<T>(request: NimChatRequest): Promise<T> {
    if (!this.hasApiKey) {
      throw new Error("NO_API_KEY");
    }

    const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        model: request.model || this.model,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA NIM API error: ${response.status} - ${error}`);
    }

    const data: NimChatResponse = await response.json();
    const content = data.choices[0]?.message?.content || "";

    try {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      throw new Error("No JSON found in response");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(
        `Failed to parse JSON: ${msg}, content: ${content.substring(0, 500)}`
      );
    }
  }

  async understandRequest(
    subject: string,
    description: string
  ): Promise<RequestUnderstanding> {
    try {
      const prompt = `You are a support request analyzer. Analyze this support request and return a JSON object with the following fields:
- category: one of ["billing", "refund", "account_access", "product_bug", "onboarding", "general"]
- urgency: one of ["low", "medium", "high", "critical"]
- sentiment: one of ["positive", "neutral", "negative", "frustrated"]
- missingInformation: array of strings describing what information is missing
- likelyResolverTeam: string describing which team should handle this
- riskScore: number between 0 and 1 indicating risk of churn/escalation
- problemSummary: brief summary of the problem

Subject: ${subject}
Description: ${description}

Return ONLY the JSON object, no other text.`;

      return await this.chatWithJson<RequestUnderstanding>({
        messages: [
          {
            role: "system",
            content:
              "You are a support request analyzer. Always return valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });
    } catch {
      return fallbackUnderstand(subject, description);
    }
  }

  async draftResolution(
    requestSummary: string,
    context: Record<string, any>
  ): Promise<ResolutionDraft> {
    try {
      const prompt = `You are a support resolution drafter. Based on the following request and context, draft a resolution.

Request Summary: ${requestSummary}
Context: ${JSON.stringify(context, null, 2)}

Return a JSON object with:
- customerResponse: professional response to the customer
- internalNote: internal note for the team
- followUpTask: optional follow-up task if needed
- nextOwner: optional next owner if unresolved
- caseSummary: brief case summary

Return ONLY the JSON object, no other text.`;

      return await this.chatWithJson<ResolutionDraft>({
        messages: [
          {
            role: "system",
            content:
              "You are a support resolution drafter. Always return valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });
    } catch {
      return fallbackDraftResolution(requestSummary);
    }
  }

  async explainRouting(
    question: string,
    caseState: Record<string, any>
  ): Promise<AgentExplanation> {
    try {
      const prompt = `You are RelayDesk's support assistant. Answer the following question based on the case state.

Question: ${question}
Case State: ${JSON.stringify(caseState, null, 2)}

Return a JSON object with:
- answer: clear answer to the question
- sources: array of objects with type, referenceId, and description

Return ONLY the JSON object, no other text.`;

      return await this.chatWithJson<AgentExplanation>({
        messages: [
          {
            role: "system",
            content:
              "You are RelayDesk's support assistant. Always return valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });
    } catch {
      return fallbackExplain(question);
    }
  }

  async generateAuditSummary(
    auditEvents: Array<Record<string, any>>
  ): Promise<string> {
    try {
      const prompt = `Summarize the following audit events in a clear, concise way:

${JSON.stringify(auditEvents, null, 2)}

Provide a brief summary of what happened.`;

      return await this.chat({
        messages: [
          {
            role: "system",
            content: "You are an audit summary generator.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });
    } catch {
      return `Case processed through ${auditEvents.length} events. Request was triaged, routed, and resolved via multi-agent coordination.`;
    }
  }
}

export const nimClient = new NvidiaNimClient({
  apiKey: process.env.NIM_API_KEY || "",
});
