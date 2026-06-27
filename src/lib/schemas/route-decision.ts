import { z } from "zod";

export const RouteDecisionSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  fromAgentId: z.string().uuid(),
  toAgentId: z.string().uuid(),
  reason: z.string(),
  contextShared: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  status: z.enum(["pending", "accepted", "rejected", "completed"]),
});

export type RouteDecision = z.infer<typeof RouteDecisionSchema>;

export const RouteDecisionInputSchema = RouteDecisionSchema.omit({
  id: true,
  timestamp: true,
});

export type RouteDecisionInput = z.infer<typeof RouteDecisionInputSchema>;
