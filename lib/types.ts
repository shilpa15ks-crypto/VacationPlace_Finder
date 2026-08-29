import { z } from "zod";

export const SourceSchema = z.object({
  title: z.string(),
  // OpenAI Structured Outputs supports string patterns, but not format: "uri".
  url: z.string().regex(/^https?:\/\/[^\s]+$/),
});

export const DestinationSeedSchema = z.object({
  name: z.string(),
  region: z.string(),
  summary: z.string(),
  whyRecommended: z.string(),
  bestFor: z.array(z.string()).min(1).max(4),
  sources: z.array(SourceSchema).min(1).max(4),
});

export const DestinationResearchSchema = z.object({
  destinations: z.array(DestinationSeedSchema).length(3),
});

export const ActivitySchema = z.object({
  name: z.string(),
  description: z.string(),
  duration: z.string(),
  bookingTip: z.string(),
});

export const ActivityGroupSchema = z.object({
  destinationName: z.string(),
  activities: z.array(ActivitySchema).min(3).max(5),
});

export const ActivitiesResearchSchema = z.object({
  destinations: z.array(ActivityGroupSchema).length(3),
});

export const VerificationSchema = z.object({
  destinationName: z.string(),
  confidence: z.number().min(0).max(1),
  note: z.string(),
  sources: z.array(SourceSchema).min(1).max(4),
});

export const VerificationResearchSchema = z.object({
  checks: z.array(VerificationSchema).length(3),
  warnings: z.array(z.string()),
});

export const TripResultSchema = z.object({
  country: z.object({ name: z.string(), isoCode: z.string().length(2) }),
  destinations: z.array(
    DestinationSeedSchema.extend({
      activities: z.array(ActivitySchema),
      confidence: z.number().min(0).max(1),
      verificationNote: z.string(),
    }),
  ).length(3),
  researchedAt: z.string(),
  warnings: z.array(z.string()),
});

export type TripResult = z.infer<typeof TripResultSchema>;
