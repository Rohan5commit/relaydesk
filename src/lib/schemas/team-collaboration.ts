import { z } from "zod";

export const TeamCollaborationRecordSchema = z.object({
  id: z.string().uuid(),
  projectName: z.string(),
  description: z.string(),
  teamMembers: z.array(z.object({
    name: z.string(),
    role: z.string(),
    agentId: z.string().uuid().optional(),
  })),
  tasks: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    assignee: z.string(),
    status: z.enum(["pending", "in_progress", "completed"]),
    notes: z.string().optional(),
  })),
  contextPreserved: z.array(z.string()),
  screenshots: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TeamCollaborationRecord = z.infer<typeof TeamCollaborationRecordSchema>;

export const TeamCollaborationRecordInputSchema = TeamCollaborationRecordSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TeamCollaborationRecordInput = z.infer<typeof TeamCollaborationRecordInputSchema>;
