import { v4 as uuidv4 } from "uuid";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
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

interface StoreData {
  supportRequests: Record<string, SupportRequest>;
  agentIdentities: Record<string, AgentIdentity>;
  routeDecisions: Record<string, RouteDecision>;
  caseContexts: Record<string, CaseContext>;
  caseNotes: Record<string, CaseNote>;
  resolutionDrafts: Record<string, ResolutionDraft>;
  approvalActions: Record<string, ApprovalAction>;
  auditEvents: Record<string, AuditEvent>;
}

function getStorePath(): string {
  // On Vercel, /tmp is writable. Locally, use project root.
  if (process.env.VERCEL) {
    return "/tmp/relaydesk-store.json";
  }
  return join(process.cwd(), "relaydesk-store.json");
}

function loadStore(): StoreData {
  const filePath = getStorePath();
  try {
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      if (data && typeof data.supportRequests === "object") {
        return data;
      }
    }
  } catch {
    // If file is corrupt or missing, start fresh
  }
  return {
    supportRequests: {},
    agentIdentities: {},
    routeDecisions: {},
    caseContexts: {},
    caseNotes: {},
    resolutionDrafts: {},
    approvalActions: {},
    auditEvents: {},
  };
}

function saveStore(data: StoreData): void {
  const filePath = getStorePath();
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist store:", err);
  }
}

class FileBackedStore {
  private data: StoreData;
  private seeded = false;

  constructor() {
    this.data = loadStore();
    // Seed on cold start if empty
    if (
      Object.keys(this.data.agentIdentities).length === 0 &&
      Object.keys(this.data.supportRequests).length === 0
    ) {
      this.seedDemoData();
      this.seeded = true;
    }
  }

  private persist(): void {
    saveStore(this.data);
  }

  // Support Requests
  createSupportRequest(
    request: Omit<SupportRequest, "id" | "createdAt" | "updatedAt">
  ): SupportRequest {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newRequest: SupportRequest = {
      ...request,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.data.supportRequests[id] = newRequest;
    this.persist();
    return newRequest;
  }

  getSupportRequest(id: string): SupportRequest | undefined {
    return this.data.supportRequests[id];
  }

  getAllSupportRequests(): SupportRequest[] {
    return Object.values(this.data.supportRequests);
  }

  updateSupportRequest(
    id: string,
    updates: Partial<Omit<SupportRequest, "id" | "createdAt">>
  ): SupportRequest | undefined {
    const request = this.data.supportRequests[id];
    if (!request) return undefined;
    const updatedRequest = {
      ...request,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.supportRequests[id] = updatedRequest;
    this.persist();
    return updatedRequest;
  }

  // Agent Identities
  createAgentIdentity(
    identity: Omit<AgentIdentity, "id" | "createdAt">
  ): AgentIdentity {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newIdentity: AgentIdentity = {
      ...identity,
      id,
      createdAt: now,
    };
    this.data.agentIdentities[id] = newIdentity;
    this.persist();
    return newIdentity;
  }

  getAgentIdentity(id: string): AgentIdentity | undefined {
    return this.data.agentIdentities[id];
  }

  getAllAgentIdentities(): AgentIdentity[] {
    return Object.values(this.data.agentIdentities);
  }

  // Route Decisions
  createRouteDecision(
    decision: Omit<RouteDecision, "id" | "timestamp">
  ): RouteDecision {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newDecision: RouteDecision = {
      ...decision,
      id,
      timestamp: now,
    };
    this.data.routeDecisions[id] = newDecision;
    this.persist();
    return newDecision;
  }

  getRouteDecision(id: string): RouteDecision | undefined {
    return this.data.routeDecisions[id];
  }

  getRouteDecisionsByRequest(requestId: string): RouteDecision[] {
    return Object.values(this.data.routeDecisions).filter(
      (d) => d.requestId === requestId
    );
  }

  // Case Contexts
  createCaseContext(
    context: Omit<CaseContext, "id" | "createdAt" | "updatedAt">
  ): CaseContext {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newContext: CaseContext = {
      ...context,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.data.caseContexts[id] = newContext;
    this.persist();
    return newContext;
  }

  getCaseContext(id: string): CaseContext | undefined {
    return this.data.caseContexts[id];
  }

  getCaseContextByRequest(requestId: string): CaseContext | undefined {
    return Object.values(this.data.caseContexts).find(
      (c) => c.requestId === requestId
    );
  }

  updateCaseContext(
    id: string,
    updates: Partial<Omit<CaseContext, "id" | "createdAt">>
  ): CaseContext | undefined {
    const context = this.data.caseContexts[id];
    if (!context) return undefined;
    const updatedContext = {
      ...context,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.caseContexts[id] = updatedContext;
    this.persist();
    return updatedContext;
  }

  // Case Notes
  createCaseNote(
    note: Omit<CaseNote, "id" | "timestamp">
  ): CaseNote {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newNote: CaseNote = {
      ...note,
      id,
      timestamp: now,
    };
    this.data.caseNotes[id] = newNote;
    this.persist();
    return newNote;
  }

  getCaseNote(id: string): CaseNote | undefined {
    return this.data.caseNotes[id];
  }

  getCaseNotesByRequest(requestId: string): CaseNote[] {
    return Object.values(this.data.caseNotes).filter(
      (n) => n.requestId === requestId
    );
  }

  // Resolution Drafts
  createResolutionDraft(
    draft: Omit<ResolutionDraft, "id" | "timestamp">
  ): ResolutionDraft {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newDraft: ResolutionDraft = {
      ...draft,
      id,
      timestamp: now,
    };
    this.data.resolutionDrafts[id] = newDraft;
    this.persist();
    return newDraft;
  }

  getResolutionDraft(id: string): ResolutionDraft | undefined {
    return this.data.resolutionDrafts[id];
  }

  getResolutionDraftsByRequest(requestId: string): ResolutionDraft[] {
    return Object.values(this.data.resolutionDrafts).filter(
      (d) => d.requestId === requestId
    );
  }

  updateResolutionDraft(
    id: string,
    updates: Partial<Omit<ResolutionDraft, "id" | "timestamp">>
  ): ResolutionDraft | undefined {
    const draft = this.data.resolutionDrafts[id];
    if (!draft) return undefined;
    const updatedDraft = {
      ...draft,
      ...updates,
    };
    this.data.resolutionDrafts[id] = updatedDraft;
    this.persist();
    return updatedDraft;
  }

  // Approval Actions
  createApprovalAction(
    action: Omit<ApprovalAction, "id" | "timestamp">
  ): ApprovalAction {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newAction: ApprovalAction = {
      ...action,
      id,
      timestamp: now,
    };
    this.data.approvalActions[id] = newAction;
    this.persist();
    return newAction;
  }

  getApprovalAction(id: string): ApprovalAction | undefined {
    return this.data.approvalActions[id];
  }

  getApprovalActionsByRequest(requestId: string): ApprovalAction[] {
    return Object.values(this.data.approvalActions).filter(
      (a) => a.requestId === requestId
    );
  }

  // Audit Events
  createAuditEvent(
    event: Omit<AuditEvent, "id" | "timestamp">
  ): AuditEvent {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newEvent: AuditEvent = {
      ...event,
      id,
      timestamp: now,
    };
    this.data.auditEvents[id] = newEvent;
    this.persist();
    return newEvent;
  }

  getAuditEvent(id: string): AuditEvent | undefined {
    return this.data.auditEvents[id];
  }

  getAuditEventsByRequest(requestId: string): AuditEvent[] {
    return Object.values(this.data.auditEvents)
      .filter((e) => e.requestId === requestId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  }

  // Demo data seeding (idempotent)
  seedDemoData(): void {
    // Don't seed if agents already exist
    if (Object.keys(this.data.agentIdentities).length > 0) return;

    const now = new Date().toISOString();

    // Use deterministic IDs so every serverless instance generates the same data
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

    // Create agents with deterministic IDs
    this.data.agentIdentities[agentIds.support] = {
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
    };
    this.data.agentIdentities[agentIds.billing] = {
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
    };
    this.data.agentIdentities[agentIds.technical] = {
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
    };
    this.data.agentIdentities[agentIds.onboarding] = {
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
    };
    this.data.agentIdentities[agentIds.escalation] = {
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
    };

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
      this.data.supportRequests[id] = {
        ...request,
        id,
        createdAt: now,
        updatedAt: now,
      };
    });

    this.persist();
  }

  // Get case state for a request
  getCaseState(requestId: string): Record<string, any> {
    const request = this.getSupportRequest(requestId);
    const context = this.getCaseContextByRequest(requestId);
    const notes = this.getCaseNotesByRequest(requestId);
    const routes = this.getRouteDecisionsByRequest(requestId);
    const resolutions = this.getResolutionDraftsByRequest(requestId);
    const approvals = this.getApprovalActionsByRequest(requestId);
    const auditEvents = this.getAuditEventsByRequest(requestId);

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
}

export const store = new FileBackedStore();
