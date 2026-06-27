import { z } from "zod";

export const ResolutionDraftSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  agentId: z.string().uuid(),
  agentName: z.string(),
  customerResponse: z.string(),
  internalNote: z.string(),
  followUpTask: z.string().optional(),
  nextOwner: z.string().optional(),
  caseSummary: z.string(),
  timestamp: z.string().datetime(),
  status: z.enum(["draft", "pending_review", "approved", "rejected"]),
});

export type ResolutionDraft = z.infer<typeof ResolutionDraftSchema>;

export const ResolutionDraftInputSchema = ResolutionDraftSchema.omit({
  id: true,
  timestamp: true,
});

export type ResolutionDraftInput = z.infer<typeof ResolutionDraftInputSchema>;
