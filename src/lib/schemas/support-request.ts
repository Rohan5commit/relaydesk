import { z } from "zod";

export const SupportRequestSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum([
    "billing",
    "refund",
    "account_access",
    "product_bug",
    "onboarding",
    "general",
  ]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  sentiment: z.enum(["positive", "neutral", "negative", "frustrated"]),
  missingInformation: z.array(z.string()),
  likelyResolverTeam: z.string(),
  riskScore: z.number().min(0).max(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.enum([
    "received",
    "triaged",
    "routed",
    "enriched",
    "escalated",
    "resolved",
  ]),
});

export type SupportRequest = z.infer<typeof SupportRequestSchema>;

export const CreateSupportRequestSchema = SupportRequestSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export type CreateSupportRequest = z.infer<typeof CreateSupportRequestSchema>;

/** Schema for POST /api/requests request body */
export const CreateRequestBodySchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be 200 characters or fewer"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or fewer"),
  customerInfo: z
    .object({
      id: z.string().min(1, "Customer ID is required"),
      name: z.string().min(1, "Customer name is required"),
      email: z.string().email("Valid email is required"),
    })
    .strict(),
});

export type CreateRequestBody = z.infer<typeof CreateRequestBodySchema>;
