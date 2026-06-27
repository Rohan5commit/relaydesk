import { z } from "zod";

export const ApprovalActionSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  resolutionId: z.string().uuid(),
  approverId: z.string().uuid(),
  approverName: z.string(),
  action: z.enum(["approve", "reject", "override", "request_more_context"]),
  reason: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type ApprovalAction = z.infer<typeof ApprovalActionSchema>;

export const ApprovalActionInputSchema = ApprovalActionSchema.omit({
  id: true,
  timestamp: true,
});

export type ApprovalActionInput = z.infer<typeof ApprovalActionInputSchema>;
