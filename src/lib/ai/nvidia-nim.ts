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

export class NvidiaNimClient {
  private apiKey: string;
  private model: string;

  constructor(config: NimConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "nvidia/llama-3.3-nemotron-super-49b-v1";
  }

  async chat(request: NimChatRequest): Promise<string> {
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

  private async chatWithJson<T>(
    request: NimChatRequest
  ): Promise<T> {
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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      throw new Error("No JSON found in response");
    } catch (e) {
      throw new Error(`Failed to parse JSON response: ${content}`);
    }
  }

  async understandRequest(
    subject: string,
    description: string
  ): Promise<RequestUnderstanding> {
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

    return this.chatWithJson<RequestUnderstanding>({
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
  }

  async draftResolution(
    requestSummary: string,
    context: Record<string, any>
  ): Promise<ResolutionDraft> {
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

    return this.chatWithJson<ResolutionDraft>({
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
  }

  async explainRouting(
    question: string,
    caseState: Record<string, any>
  ): Promise<AgentExplanation> {
    const prompt = `You are RelayDesk's support assistant. Answer the following question based on the case state.

Question: ${question}
Case State: ${JSON.stringify(caseState, null, 2)}

Return a JSON object with:
- answer: clear answer to the question
- sources: array of objects with type, referenceId, and description

Return ONLY the JSON object, no other text.`;

    return this.chatWithJson<AgentExplanation>({
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
  }

  async generateAuditSummary(
    auditEvents: Array<Record<string, any>>
  ): Promise<string> {
    const prompt = `Summarize the following audit events in a clear, concise way:

${JSON.stringify(auditEvents, null, 2)}

Provide a brief summary of what happened.`;

    return this.chat({
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
  }
}

export const nimClient = new NvidiaNimClient({
  apiKey: process.env.NIM_API_KEY || "",
});
