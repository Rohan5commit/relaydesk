import { z } from "zod";

export const AgentIdentitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(["customer_facing", "specialist", "escalation_manager", "human"]),
  role: z.string(),
  team: z.string(),
  capabilities: z.array(z.string()),
  avatarUrl: z.string().optional(),
  isOnline: z.boolean().default(true),
  currentCases: z.number().default(0),
  maxCases: z.number().default(10),
  createdAt: z.string().datetime(),
});

export type AgentIdentity = z.infer<typeof AgentIdentitySchema>;

export const AgentIdentityInputSchema = AgentIdentitySchema.omit({
  id: true,
  createdAt: true,
});

export type AgentIdentityInput = z.infer<typeof AgentIdentityInputSchema>;
