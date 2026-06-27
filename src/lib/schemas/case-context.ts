import { z } from "zod";

export const CaseContextSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  originalRequest: z.string(),
  problemSummary: z.string(),
  customerMetadata: z.record(z.string(), z.any()),
  priorSteps: z.array(z.object({
    step: z.string(),
    agentId: z.string().uuid(),
    timestamp: z.string().datetime(),
    notes: z.string().optional(),
  })),
  notes: z.array(z.object({
    id: z.string().uuid(),
    agentId: z.string().uuid(),
    content: z.string(),
    timestamp: z.string().datetime(),
  })),
  resolutionState: z.enum(["pending", "in_progress", "resolved", "escalated"]),
  approvalState: z.enum(["pending", "approved", "rejected", "overridden"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CaseContext = z.infer<typeof CaseContextSchema>;

export const CaseContextInputSchema = CaseContextSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CaseContextInput = z.infer<typeof CaseContextInputSchema>;
