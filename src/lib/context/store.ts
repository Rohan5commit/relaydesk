import { v4 as uuidv4 } from "uuid";
import {
  SupportRequest,
  AgentIdentity,
  RouteDecision,
  CaseContext,
  CaseNote,
  ResolutionDraft,
  ApprovalAction,
  AuditEvent,
} from "../schemas";
import { getRedis, isRedisAvailable } from "../redis";

const KEYS = {
  supportRequests: "rd:supportRequests",
  agentIdentities: "rd:agents",
  routeDecisions: "rd:routes",
  caseContexts: "rd:contexts",
  caseNotes: "rd:notes",
  resolutionDrafts: "rd:resolutions",
  approvalActions: "rd:approvals",
  auditEvents: "rd:audit",
  seeded: "rd:seeded",
} as const;

// In-memory fallback for local dev or when Redis is unavailable
const mem: Record<string, Record<string, any>> = {};

async function loadCollection<T>(key: string): Promise<Record<string, T>> {
  if (isRedisAvailable()) {
    try {
      const redis = getRedis();
      const raw = await redis.get<string>(key);
      if (raw && typeof raw === "object") return raw as Record<string, T>;
      if (typeof raw === "string") return JSON.parse(raw);
    } catch (err) {
      console.error(`Redis read failed for ${key}, falling back to memory:`, err);
    }
  }
  return (mem[key] || {}) as Record<string, T>;
}

async function saveCollection<T>(
  key: string,
  data: Record<string, T>
): Promise<void> {
  mem[key] = data;
  if (isRedisAvailable()) {
    try {
      const redis = getRedis();
      await redis.set(key, JSON.stringify(data));
    } catch (err) {
      console.error(`Redis write failed for ${key}:`, err);
    }
  }
}

class RedisStore {
  private inited = false;
  private initPromise: Promise<void> | null = null;

  private async ensureSeeded(): Promise<void> {
    if (this.inited) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // Check if data already exists in memory (from prior call in this instance)
      const existingAgents = await loadCollection<AgentIdentity>(KEYS.agentIdentities);
      if (Object.keys(existingAgents).length > 0) {
        this.inited = true;
        return;
      }

      if (isRedisAvailable()) {
        try {
          const redis = getRedis();
          const seeded = await redis.get(KEYS.seeded);
          if (seeded) {
            this.inited = true;
            return;
          }
        } catch (err) {
          console.error("Redis seed check failed:", err);
        }
      }

      await this.seedDemoData();

      if (isRedisAvailable()) {
        try {
          const redis = getRedis();
          await redis.set(KEYS.seeded, "1");
        } catch (err) {
          console.error("Redis seed flag write failed:", err);
        }
      }

      this.inited = true;
    })();

    return this.initPromise;
  }

  // Support Requests
  async createSupportRequest(
    request: Omit<SupportRequest, "id" | "createdAt" | "updatedAt">
  ): Promise<SupportRequest> {
    await this.ensureSeeded();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newRequest: SupportRequest = {
      ...request,
      id,
      createdAt: now,
      updatedAt: now,
    };
    const data = await loadCollection<SupportRequest>(KEYS.supportRequests);
    data[id] = newRequest;
    await saveCollection(KEYS.supportRequests, data);
    return newRequest;
  }

  async getSupportRequest(id: string): Promise<SupportRequest | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<SupportRequest>(KEYS.supportRequests);
    return data[id];
  }

  async getAllSupportRequests(): Promise<SupportRequest[]> {
    await this.ensureSeeded();
    const data = await loadCollection<SupportRequest>(KEYS.supportRequests);
    return Object.values(data);
  }

  async updateSupportRequest(
    id: string,
    updates: Partial<Omit<SupportRequest, "id" | "createdAt">>
  ): Promise<SupportRequest | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<SupportRequest>(KEYS.supportRequests);
    const request = data[id];
    if (!request) return undefined;
    const updatedRequest = {
      ...request,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    data[id] = updatedRequest;
    await saveCollection(KEYS.supportRequests, data);
    return updatedRequest;
  }

  // Agent Identities
  async createAgentIdentity(
    identity: Omit<AgentIdentity, "id" | "createdAt">
  ): Promise<AgentIdentity> {
    await this.ensureSeeded();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newIdentity: AgentIdentity = {
      ...identity,
      id,
      createdAt: now,
    };
    const data = await loadCollection<AgentIdentity>(KEYS.agentIdentities);
    data[id] = newIdentity;
    await saveCollection(KEYS.agentIdentities, data);
    return newIdentity;
  }

  async getAgentIdentity(id: string): Promise<AgentIdentity | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<AgentIdentity>(KEYS.agentIdentities);
    return data[id];
  }

  async getAllAgentIdentities(): Promise<AgentIdentity[]> {
    await this.ensureSeeded();
    const data = await loadCollection<AgentIdentity>(KEYS.agentIdentities);
    return Object.values(data);
  }

  // Route Decisions
  async createRouteDecision(
    decision: Omit<RouteDecision, "id" | "timestamp">
  ): Promise<RouteDecision> {
    await this.ensureSeeded();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newDecision: RouteDecision = {
      ...decision,
      id,
      timestamp: now,
    };
    const data = await loadCollection<RouteDecision>(KEYS.routeDecisions);
    data[id] = newDecision;
    await saveCollection(KEYS.routeDecisions, data);
    return newDecision;
  }

  async getRouteDecision(id: string): Promise<RouteDecision | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<RouteDecision>(KEYS.routeDecisions);
    return data[id];
  }

  async getRouteDecisionsByRequest(requestId: string): Promise<RouteDecision[]> {
    await this.ensureSeeded();
    const data = await loadCollection<RouteDecision>(KEYS.routeDecisions);
    return Object.values(data).filter((d) => d.requestId === requestId);
  }

  // Case Contexts
  async createCaseContext(
    context: Omit<CaseContext, "id" | "createdAt" | "updatedAt">
  ): Promise<CaseContext> {
    await this.ensureSeeded();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newContext: CaseContext = {
      ...context,
      id,
      createdAt: now,
      updatedAt: now,
    };
    const data = await loadCollection<CaseContext>(KEYS.caseContexts);
    data[id] = newContext;
    await saveCollection(KEYS.caseContexts, data);
    return newContext;
  }

  async getCaseContext(id: string): Promise<CaseContext | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<CaseContext>(KEYS.caseContexts);
    return data[id];
  }

  async getCaseContextByRequest(
    requestId: string
  ): Promise<CaseContext | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<CaseContext>(KEYS.caseContexts);
    return Object.values(data).find((c) => c.requestId === requestId);
  }

  async updateCaseContext(
    id: string,
    updates: Partial<Omit<CaseContext, "id" | "createdAt">>
  ): Promise<CaseContext | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<CaseContext>(KEYS.caseContexts);
    const context = data[id];
    if (!context) return undefined;
    const updatedContext = {
      ...context,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    data[id] = updatedContext;
    await saveCollection(KEYS.caseContexts, data);
    return updatedContext;
  }

  // Case Notes
  async createCaseNote(
    note: Omit<CaseNote, "id" | "timestamp">
  ): Promise<CaseNote> {
    await this.ensureSeeded();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newNote: CaseNote = {
      ...note,
      id,
      timestamp: now,
    };
    const data = await loadCollection<CaseNote>(KEYS.caseNotes);
    data[id] = newNote;
    await saveCollection(KEYS.caseNotes, data);
    return newNote;
  }

  async getCaseNote(id: string): Promise<CaseNote | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<CaseNote>(KEYS.caseNotes);
    return data[id];
  }

  async getCaseNotesByRequest(requestId: string): Promise<CaseNote[]> {
    await this.ensureSeeded();
    const data = await loadCollection<CaseNote>(KEYS.caseNotes);
    return Object.values(data).filter((n) => n.requestId === requestId);
  }

  // Resolution Drafts
  async createResolutionDraft(
    draft: Omit<ResolutionDraft, "id" | "timestamp">
  ): Promise<ResolutionDraft> {
    await this.ensureSeeded();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newDraft: ResolutionDraft = {
      ...draft,
      id,
      timestamp: now,
    };
    const data = await loadCollection<ResolutionDraft>(KEYS.resolutionDrafts);
    data[id] = newDraft;
    await saveCollection(KEYS.resolutionDrafts, data);
    return newDraft;
  }

  async getResolutionDraft(id: string): Promise<ResolutionDraft | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<ResolutionDraft>(KEYS.resolutionDrafts);
    return data[id];
  }

  async getResolutionDraftsByRequest(
    requestId: string
  ): Promise<ResolutionDraft[]> {
    await this.ensureSeeded();
    const data = await loadCollection<ResolutionDraft>(KEYS.resolutionDrafts);
    return Object.values(data).filter((d) => d.requestId === requestId);
  }

  async updateResolutionDraft(
    id: string,
    updates: Partial<Omit<ResolutionDraft, "id" | "timestamp">>
  ): Promise<ResolutionDraft | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<ResolutionDraft>(KEYS.resolutionDrafts);
    const draft = data[id];
    if (!draft) return undefined;
    const updatedDraft = { ...draft, ...updates };
    data[id] = updatedDraft;
    await saveCollection(KEYS.resolutionDrafts, data);
    return updatedDraft;
  }

  // Approval Actions
  async createApprovalAction(
    action: Omit<ApprovalAction, "id" | "timestamp">
  ): Promise<ApprovalAction> {
    await this.ensureSeeded();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newAction: ApprovalAction = {
      ...action,
      id,
      timestamp: now,
    };
    const data = await loadCollection<ApprovalAction>(KEYS.approvalActions);
    data[id] = newAction;
    await saveCollection(KEYS.approvalActions, data);
    return newAction;
  }

  async getApprovalAction(id: string): Promise<ApprovalAction | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<ApprovalAction>(KEYS.approvalActions);
    return data[id];
  }

  async getApprovalActionsByRequest(
    requestId: string
  ): Promise<ApprovalAction[]> {
    await this.ensureSeeded();
    const data = await loadCollection<ApprovalAction>(KEYS.approvalActions);
    return Object.values(data).filter((a) => a.requestId === requestId);
  }

  // Audit Events
  async createAuditEvent(
    event: Omit<AuditEvent, "id" | "timestamp">
  ): Promise<AuditEvent> {
    await this.ensureSeeded();
    const id = uuidv4();
    const now = new Date().toISOString();
    const newEvent: AuditEvent = {
      ...event,
      id,
      timestamp: now,
    };
    const data = await loadCollection<AuditEvent>(KEYS.auditEvents);
    data[id] = newEvent;
    await saveCollection(KEYS.auditEvents, data);
    return newEvent;
  }

  async getAuditEvent(id: string): Promise<AuditEvent | undefined> {
    await this.ensureSeeded();
    const data = await loadCollection<AuditEvent>(KEYS.auditEvents);
    return data[id];
  }

  async getAuditEventsByRequest(requestId: string): Promise<AuditEvent[]> {
    await this.ensureSeeded();
    const data = await loadCollection<AuditEvent>(KEYS.auditEvents);
    return Object.values(data)
      .filter((e) => e.requestId === requestId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  }

  // Get case state for a request
  async getCaseState(requestId: string): Promise<Record<string, any>> {
    const request = await this.getSupportRequest(requestId);
    const context = await this.getCaseContextByRequest(requestId);
    const notes = await this.getCaseNotesByRequest(requestId);
    const routes = await this.getRouteDecisionsByRequest(requestId);
    const resolutions = await this.getResolutionDraftsByRequest(requestId);
    const approvals = await this.getApprovalActionsByRequest(requestId);
    const auditEvents = await this.getAuditEventsByRequest(requestId);

    return {
      request,
      context,
      notes,
      routes,
      resolutions,
      approvals,
      auditEvents,
    };
  }

  // Demo data seeding (idempotent)
  async seedDemoData(): Promise<void> {
    const now = new Date().toISOString();

    const agentIds = {
      support: "agent-00000000-0000-0000-0000-000000000001",
      billing: "agent-00000000-0000-0000-0000-000000000002",
      technical: "agent-00000000-0000-0000-0000-000000000003",
      onboarding: "agent-00000000-0000-0000-0000-000000000004",
      escalation: "agent-00000000-0000-0000-0000-000000000005",
    };

    const requestIds = [
      "demo-00000000-0000-0000-0000-000000000001",
      "demo-00000000-0000-0000-0000-000000000002",
      "demo-00000000-0000-0000-0000-000000000003",
      "demo-00000000-0000-0000-0000-000000000004",
      "demo-00000000-0000-0000-0000-000000000005",
    ];

    const agents: Record<string, AgentIdentity> = {
      [agentIds.support]: {
        id: agentIds.support,
        name: "Customer Support Bot",
        type: "customer_facing",
        role: "First-line support",
        team: "Support",
        capabilities: ["intake", "triage", "basic_resolution"],
        isOnline: true,
        currentCases: 0,
        maxCases: 20,
        createdAt: now,
      },
      [agentIds.billing]: {
        id: agentIds.billing,
        name: "Billing Specialist",
        type: "specialist",
        role: "Billing expert",
        team: "Finance",
        capabilities: ["billing_analysis", "refund_processing", "payment_issues"],
        isOnline: true,
        currentCases: 0,
        maxCases: 10,
        createdAt: now,
      },
      [agentIds.technical]: {
        id: agentIds.technical,
        name: "Technical Support Agent",
        type: "specialist",
        role: "Technical expert",
        team: "Engineering",
        capabilities: ["bug_analysis", "technical_debugging", "system_issues"],
        isOnline: true,
        currentCases: 0,
        maxCases: 15,
        createdAt: now,
      },
      [agentIds.onboarding]: {
        id: agentIds.onboarding,
        name: "Onboarding Specialist",
        type: "specialist",
        role: "Onboarding expert",
        team: "Customer Success",
        capabilities: ["setup_assistance", "training", "adoption"],
        isOnline: true,
        currentCases: 0,
        maxCases: 12,
        createdAt: now,
      },
      [agentIds.escalation]: {
        id: agentIds.escalation,
        name: "Escalation Manager",
        type: "escalation_manager",
        role: "Human escalation point",
        team: "Management",
        capabilities: ["escalation_handling", "override_authority", "final_approval"],
        isOnline: true,
        currentCases: 0,
        maxCases: 5,
        createdAt: now,
      },
    };

    const requests: Record<string, SupportRequest> = {};
    const demoRequests = [
      {
        customerId: "cust-001",
        customerName: "John Smith",
        customerEmail: "john.smith@example.com",
        subject: "Duplicate billing charge on my account",
        description:
          "I was charged twice for my monthly subscription. I see two charges of $29.99 on my credit card statement from yesterday. Please refund the duplicate charge.",
        category: "billing" as const,
        urgency: "high" as const,
        sentiment: "negative" as const,
        missingInformation: ["transaction_ids", "payment_method"],
        likelyResolverTeam: "Finance",
        riskScore: 0.7,
        status: "received" as const,
      },
      {
        customerId: "cust-002",
        customerName: "Sarah Johnson",
        customerEmail: "sarah.j@example.com",
        subject: "Refund request for unused service",
        description:
          "I upgraded to the premium plan last month but haven't used any of the premium features. I'd like to request a refund for the upgrade fee of $49.99.",
        category: "refund" as const,
        urgency: "medium" as const,
        sentiment: "neutral" as const,
        missingInformation: ["usage_history", "upgrade_date"],
        likelyResolverTeam: "Finance",
        riskScore: 0.4,
        status: "received" as const,
      },
      {
        customerId: "cust-003",
        customerName: "Mike Chen",
        customerEmail: "mike.chen@example.com",
        subject: "Cannot access my account",
        description:
          "I'm locked out of my account. I've tried resetting my password but I'm not receiving the reset email. I need to access my account urgently for a client meeting.",
        category: "account_access" as const,
        urgency: "critical" as const,
        sentiment: "frustrated" as const,
        missingInformation: ["account_email", "last_login_date"],
        likelyResolverTeam: "Technical Support",
        riskScore: 0.9,
        status: "received" as const,
      },
      {
        customerId: "cust-004",
        customerName: "Emily Davis",
        customerEmail: "emily.d@example.com",
        subject: "Bug in dashboard reporting feature",
        description:
          "The dashboard reporting feature is showing incorrect data. The numbers don't match what I see in the raw data exports. This is affecting our monthly reports.",
        category: "product_bug" as const,
        urgency: "high" as const,
        sentiment: "negative" as const,
        missingInformation: ["screenshots", "browser_version", "data_examples"],
        likelyResolverTeam: "Engineering",
        riskScore: 0.6,
        status: "received" as const,
      },
      {
        customerId: "cust-005",
        customerName: "Alex Wilson",
        customerEmail: "alex.w@example.com",
        subject: "Need help with initial setup",
        description:
          "I just signed up and I'm trying to set up my workspace. I'm confused about the integration options and how to connect my existing tools.",
        category: "onboarding" as const,
        urgency: "low" as const,
        sentiment: "neutral" as const,
        missingInformation: ["tools_to_integrate", "team_size"],
        likelyResolverTeam: "Customer Success",
        riskScore: 0.2,
        status: "received" as const,
      },
    ];

    demoRequests.forEach((request, i) => {
      const id = requestIds[i];
      requests[id] = { ...request, id, createdAt: now, updatedAt: now };
    });

    // Write all collections in parallel
    await Promise.all([
      saveCollection(KEYS.agentIdentities, agents),
      saveCollection(KEYS.supportRequests, requests),
      saveCollection(KEYS.routeDecisions, {}),
      saveCollection(KEYS.caseContexts, {}),
      saveCollection(KEYS.caseNotes, {}),
      saveCollection(KEYS.resolutionDrafts, {}),
      saveCollection(KEYS.approvalActions, {}),
      saveCollection(KEYS.auditEvents, {}),
    ]);
  }
}

export const store = new RedisStore();
