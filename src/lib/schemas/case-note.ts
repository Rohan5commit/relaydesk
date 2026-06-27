import { z } from "zod";

export const CaseNoteSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  agentId: z.string().uuid(),
  agentName: z.string(),
  content: z.string(),
  timestamp: z.string().datetime(),
  type: z.enum(["internal", "customer_facing", "escalation"]),
});

export type CaseNote = z.infer<typeof CaseNoteSchema>;

export const CaseNoteInputSchema = CaseNoteSchema.omit({
  id: true,
  timestamp: true,
});

export type CaseNoteInput = z.infer<typeof CaseNoteInputSchema>;
