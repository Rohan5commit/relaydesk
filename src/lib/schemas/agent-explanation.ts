import { z } from "zod";

export const AgentExplanationSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  question: z.string(),
  answer: z.string(),
  sources: z.array(z.object({
    type: z.enum(["audit_event", "case_note", "route_decision", "resolution"]),
    referenceId: z.string(),
    description: z.string(),
  })),
  timestamp: z.string().datetime(),
});

export type AgentExplanation = z.infer<typeof AgentExplanationSchema>;

export const AgentExplanationInputSchema = AgentExplanationSchema.omit({
  id: true,
  timestamp: true,
});

export type AgentExplanationInput = z.infer<typeof AgentExplanationInputSchema>;
