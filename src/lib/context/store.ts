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

class InMemoryStore {
  private supportRequests: Map<string, SupportRequest> = new Map();
  private agentIdentities: Map<string, AgentIdentity> = new Map();
  private routeDecisions: Map<string, RouteDecision> = new Map();
  private caseContexts: Map<string, CaseContext> = new Map();
  private caseNotes: Map<string, CaseNote> = new Map();
  private resolutionDrafts: Map<string, ResolutionDraft> = new Map();
  private approvalActions: Map<string, ApprovalAction> = new Map();
  private auditEvents: Map<string, AuditEvent> = new Map();

  // Support Requests
  createSupportRequest(request: Omit<SupportRequest, "id" | "createdAt" | "updatedAt">): SupportRequest {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newRequest: SupportRequest = {
      ...request,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.supportRequests.set(id, newRequest);
    return newRequest;
  }

  getSupportRequest(id: string): SupportRequest | undefined {
    return this.supportRequests.get(id);
  }

  getAllSupportRequests(): SupportRequest[] {
    return Array.from(this.supportRequests.values());
  }

  updateSupportRequest(id: string, updates: Partial<SupportRequest>): SupportRequest | undefined {
    const request = this.supportRequests.get(id);
    if (!request) return undefined;
    const updatedRequest = {
      ...request,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.supportRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Agent Identities
  createAgentIdentity(identity: Omit<AgentIdentity, "id" | "createdAt">): AgentIdentity {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newIdentity: AgentIdentity = {
      ...identity,
      id,
      createdAt: now,
    };
    this.agentIdentities.set(id, newIdentity);
    return newIdentity;
  }

  getAgentIdentity(id: string): AgentIdentity | undefined {
    return this.agentIdentities.get(id);
  }

  getAllAgentIdentities(): AgentIdentity[] {
    return Array.from(this.agentIdentities.values());
  }

  // Route Decisions
  createRouteDecision(decision: Omit<RouteDecision, "id" | "timestamp">): RouteDecision {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newDecision: RouteDecision = {
      ...decision,
      id,
      timestamp: now,
    };
    this.routeDecisions.set(id, newDecision);
    return newDecision;
  }

  getRouteDecision(id: string): RouteDecision | undefined {
    return this.routeDecisions.get(id);
  }

  getRouteDecisionsByRequest(requestId: string): RouteDecision[] {
    return Array.from(this.routeDecisions.values()).filter(
      (d) => d.requestId === requestId
    );
  }

  // Case Contexts
  createCaseContext(context: Omit<CaseContext, "id" | "createdAt" | "updatedAt">): CaseContext {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newContext: CaseContext = {
      ...context,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.caseContexts.set(id, newContext);
    return newContext;
  }

  getCaseContext(id: string): CaseContext | undefined {
    return this.caseContexts.get(id);
  }

  getCaseContextByRequest(requestId: string): CaseContext | undefined {
    return Array.from(this.caseContexts.values()).find(
      (c) => c.requestId === requestId
    );
  }

  updateCaseContext(id: string, updates: Partial<CaseContext>): CaseContext | undefined {
    const context = this.caseContexts.get(id);
    if (!context) return undefined;
    const updatedContext = {
      ...context,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.caseContexts.set(id, updatedContext);
    return updatedContext;
  }

  // Case Notes
  createCaseNote(note: Omit<CaseNote, "id" | "timestamp">): CaseNote {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newNote: CaseNote = {
      ...note,
      id,
      timestamp: now,
    };
    this.caseNotes.set(id, newNote);
    return newNote;
  }

  getCaseNote(id: string): CaseNote | undefined {
    return this.caseNotes.get(id);
  }

  getCaseNotesByRequest(requestId: string): CaseNote[] {
    return Array.from(this.caseNotes.values()).filter(
      (n) => n.requestId === requestId
    );
  }

  // Resolution Drafts
  createResolutionDraft(draft: Omit<ResolutionDraft, "id" | "timestamp">): ResolutionDraft {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newDraft: ResolutionDraft = {
      ...draft,
      id,
      timestamp: now,
    };
    this.resolutionDrafts.set(id, newDraft);
    return newDraft;
  }

  getResolutionDraft(id: string): ResolutionDraft | undefined {
    return this.resolutionDrafts.get(id);
  }

  getResolutionDraftsByRequest(requestId: string): ResolutionDraft[] {
    return Array.from(this.resolutionDrafts.values()).filter(
      (d) => d.requestId === requestId
    );
  }

  updateResolutionDraft(id: string, updates: Partial<ResolutionDraft>): ResolutionDraft | undefined {
    const draft = this.resolutionDrafts.get(id);
    if (!draft) return undefined;
    const updatedDraft = {
      ...draft,
      ...updates,
    };
    this.resolutionDrafts.set(id, updatedDraft);
    return updatedDraft;
  }

  // Approval Actions
  createApprovalAction(action: Omit<ApprovalAction, "id" | "timestamp">): ApprovalAction {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newAction: ApprovalAction = {
      ...action,
      id,
      timestamp: now,
    };
    this.approvalActions.set(id, newAction);
    return newAction;
  }

  getApprovalAction(id: string): ApprovalAction | undefined {
    return this.approvalActions.get(id);
  }

  getApprovalActionsByRequest(requestId: string): ApprovalAction[] {
    return Array.from(this.approvalActions.values()).filter(
      (a) => a.requestId === requestId
    );
  }

  // Audit Events
  createAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newEvent: AuditEvent = {
      ...event,
      id,
      timestamp: now,
    };
    this.auditEvents.set(id, newEvent);
    return newEvent;
  }

  getAuditEvent(id: string): AuditEvent | undefined {
    return this.auditEvents.get(id);
  }

  getAuditEventsByRequest(requestId: string): AuditEvent[] {
    return Array.from(this.auditEvents.values())
      .filter((e) => e.requestId === requestId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Demo data seeding
  seedDemoData(): void {
    // Create agent identities
    const customerFacingAgent = this.createAgentIdentity({
      name: "Customer Support Bot",
      type: "customer_facing",
      role: "First-line support",
      team: "Support",
      capabilities: ["intake", "triage", "basic_resolution"],
      isOnline: true,
      currentCases: 0,
      maxCases: 20,
    });

    const billingAgent = this.createAgentIdentity({
      name: "Billing Specialist",
      type: "specialist",
      role: "Billing expert",
      team: "Finance",
      capabilities: ["billing_analysis", "refund_processing", "payment_issues"],
      isOnline: true,
      currentCases: 0,
      maxCases: 10,
    });

    const technicalAgent = this.createAgentIdentity({
      name: "Technical Support Agent",
      type: "specialist",
      role: "Technical expert",
      team: "Engineering",
      capabilities: ["bug_analysis", "technical_debugging", "system_issues"],
      isOnline: true,
      currentCases: 0,
      maxCases: 15,
    });

    const onboardingAgent = this.createAgentIdentity({
      name: "Onboarding Specialist",
      type: "specialist",
      role: "Onboarding expert",
      team: "Customer Success",
      capabilities: ["setup_assistance", "training", "adoption"],
      isOnline: true,
      currentCases: 0,
      maxCases: 12,
    });

    const escalationManager = this.createAgentIdentity({
      name: "Escalation Manager",
      type: "escalation_manager",
      role: "Human escalation point",
      team: "Management",
      capabilities: ["escalation_handling", "override_authority", "final_approval"],
      isOnline: true,
      currentCases: 0,
      maxCases: 5,
    });

    // Create demo support requests
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

    demoRequests.forEach((request) => {
      this.createSupportRequest(request);
    });
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

export const store = new InMemoryStore();
