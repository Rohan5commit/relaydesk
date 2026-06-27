import { z } from "zod";

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  eventType: z.enum([
    "request_received",
    "triage_completed",
    "routed",
    "context_shared",
    "agent_joined",
    "agent_left",
    "note_added",
    "resolution_drafted",
    "resolution_approved",
    "resolution_rejected",
    "escalated",
    "resolved",
  ]),
  agentId: z.string().uuid(),
  agentName: z.string(),
  agentType: z.enum(["customer_facing", "specialist", "escalation_manager", "human"]),
  details: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().datetime(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const AuditEventInputSchema = AuditEventSchema.omit({
  id: true,
  timestamp: true,
});

export type AuditEventInput = z.infer<typeof AuditEventInputSchema>;
