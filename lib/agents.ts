import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAI, model } from "./openai";
import {
  ActivitiesResearchSchema,
  DestinationResearchSchema,
  TripResultSchema,
  VerificationResearchSchema,
  type TripResult,
} from "./types";
import type { CountryMatch } from "./countries";

const researchRules = `Use current web research. Prefer official tourism boards, UNESCO, national parks, museums, and official attraction sites. Never invent a URL. Keep descriptions useful and concise.`;

async function findDestinations(country: CountryMatch) {
  const response = await getOpenAI().responses.parse({
    model,
    tools: [{ type: "web_search_preview" }],
    input: `You are the Find Destinations Agent. ${researchRules}\nSelect exactly three distinct tourist destinations in ${country.name}. Balance cultural or natural significance, visitor appeal, experience variety, and accessibility. Explain why each belongs in the top three.`,
    text: { format: zodTextFormat(DestinationResearchSchema, "destination_research") },
  });
  if (!response.output_parsed) throw new Error("Destination research returned no structured result.");
  return response.output_parsed;
}

async function findActivities(country: CountryMatch, destinationNames: string[]) {
  const response = await getOpenAI().responses.parse({
    model,
    tools: [{ type: "web_search_preview" }],
    input: `You are the Things to Do Agent. ${researchRules}\nFor each of these destinations in ${country.name}, provide 3-5 varied, specific activities: ${destinationNames.join(", ")}. Include a realistic duration and a short booking tip. Do not change the destination list.`,
    text: { format: zodTextFormat(ActivitiesResearchSchema, "activity_research") },
  });
  if (!response.output_parsed) throw new Error("Activity research returned no structured result.");
  return response.output_parsed;
}

async function verifyDestinations(country: CountryMatch, destinationNames: string[]) {
  const response = await getOpenAI().responses.parse({
    model,
    tools: [{ type: "web_search_preview" }],
    input: `You are the Verification and Sources Agent. ${researchRules}\nVerify these recommended destinations in ${country.name}: ${destinationNames.join(", ")}. Confirm that each is a strong, currently visitable recommendation, give a confidence from 0 to 1, and return fresh authoritative sources. Note closures, access issues, or unsupported claims in warnings.`,
    text: { format: zodTextFormat(VerificationResearchSchema, "verification_research") },
  });
  if (!response.output_parsed) throw new Error("Verification returned no structured result.");
  return response.output_parsed;
}

export async function researchCountry(country: CountryMatch): Promise<TripResult> {
  const destinationResearch = await findDestinations(country);
  const destinationNames = destinationResearch.destinations.map((destination) => destination.name);
  const [activityResearch, verificationResearch] = await Promise.all([
    findActivities(country, destinationNames),
    verifyDestinations(country, destinationNames),
  ]);

  const result = {
    country,
    destinations: destinationResearch.destinations.map((destination) => {
      const activities = activityResearch.destinations.find(
        (item) => item.destinationName.toLowerCase() === destination.name.toLowerCase(),
      );
      const verification = verificationResearch.checks.find(
        (item) => item.destinationName.toLowerCase() === destination.name.toLowerCase(),
      );
      return {
        ...destination,
        activities: activities?.activities ?? [],
        confidence: verification?.confidence ?? 0.7,
        verificationNote: verification?.note ?? "Recommendation reviewed from available research.",
        sources: [...destination.sources, ...(verification?.sources ?? [])]
          .filter((source, index, all) => all.findIndex((item) => item.url === source.url) === index)
          .slice(0, 4),
      };
    }),
    researchedAt: new Date().toISOString(),
    warnings: verificationResearch.warnings,
  };

  return TripResultSchema.parse(result);
}
