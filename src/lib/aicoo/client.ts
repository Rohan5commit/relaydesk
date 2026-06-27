const AICOO_BASE_URL = "https://www.aicoo.io/api/v1";

interface AicooConfig {
  apiKey: string;
}

interface AicooMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AicooChatRequest {
  message: string;
  conversationId?: string;
  userTimezone?: string;
  stream?: boolean;
  model?: string;
  temperature?: number;
}

interface AicooChatResponse {
  type: string;
  textDelta?: string;
  completion?: {
    metadata: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

interface AicooAccumulateRequest {
  files?: Array<{ path: string; content: string; message?: string }>;
  texts?: Array<{ title: string; content: string; folder?: string }>;
  delete?: Array<{ path: string }>;
  folders?: {
    create?: string[];
    delete?: string[];
  };
}

interface AicooAccumulateResponse {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: string[];
  versions: Array<{
    file: string;
    from: string;
    to: string;
    message: string;
  }>;
  foldersCreated: string[];
  workspace: {
    totalFiles: number;
    totalSizeBytes: number;
  };
}

interface AicooShareLinkRequest {
  scope: "all" | "folders";
  access: "read" | "read_calendar" | "read_calendar_write";
  label?: string;
  expiresIn?: "1h" | "24h" | "7d" | "30d";
  folderIds?: number[];
  notesAccess?: "read" | "write" | "edit";
  identity?: {
    loadCoo?: boolean;
    loadUser?: boolean;
    loadPolicy?: boolean;
  };
}

interface AicooShareLinkResponse {
  success: boolean;
  shareLink: {
    id: string;
    token: string;
    url: string;
    agentUrl: string;
    scope: string;
    access: string;
    notesAccess: string;
    identity: {
      loadCoo: boolean;
      loadUser: boolean;
      loadPolicy: boolean;
    };
    label: string;
    anonymous: boolean;
    expiresAt: string;
    createdAt: string;
  };
}

export class AicooClient {
  private apiKey: string;

  constructor(config: AicooConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${AICOO_BASE_URL}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Aicoo API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async chat(request: AicooChatRequest): Promise<string> {
    const response = await this.request<AicooChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({
        ...request,
        stream: false,
      }),
    });

    return response.textDelta || "";
  }

  async initializeWorkspace(): Promise<{
    initialized: boolean;
    workspace: {
      folders: Array<{
        id: number;
        name: string;
        parentId: number | null;
        icon: string | null;
        fileCount: number;
      }>;
      totalFiles: number;
      totalSizeBytes: number;
    };
  }> {
    return this.request("/init", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async accumulateContext(
    request: AicooAccumulateRequest
  ): Promise<AicooAccumulateResponse> {
    return this.request("/accumulate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async createShareLink(
    request: AicooShareLinkRequest
  ): Promise<AicooShareLinkResponse> {
    return this.request("/share/create", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getTools(): Promise<{
    success: boolean;
    tools: Array<{
      name: string;
      description: string;
      namespace: string;
      source: string;
      readWrite: string;
      parameters: Record<string, any>;
    }>;
    totalTools: number;
  }> {
    return this.request("/tools");
  }

  async executeTool(
    tool: string,
    params: Record<string, any>
  ): Promise<{
    success: boolean;
    tool: string;
    result: any;
    metadata: {
      executionTimeMs: number;
    };
  }> {
    return this.request("/tools", {
      method: "POST",
      body: JSON.stringify({ tool, params }),
    });
  }

  async getContextStatus(): Promise<{
    success: boolean;
    contextCount: number;
    totalSizeBytes: number;
    folders: Array<{
      id: number;
      name: string;
      parentId: number | null;
      icon: string | null;
      fileCount: number;
    }>;
    lastSyncedAt: string;
  }> {
    return this.request("/context/status");
  }

  async sendAgentMessage(
    agentId: string,
    message: string,
    context?: Record<string, any>
  ): Promise<string> {
    const prompt = `You are agent ${agentId}. ${message}${
      context ? `\n\nContext: ${JSON.stringify(context)}` : ""
    }`;
    return this.chat({ message: prompt });
  }
}

export const aicooClient = new AicooClient({
  apiKey: process.env.AICOO_API_KEY || "",
});
