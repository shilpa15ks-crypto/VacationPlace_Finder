import { NextResponse } from "next/server";
import { z } from "zod";
import { researchCountry } from "@/lib/agents";
import { findCountry } from "@/lib/countries";

export const maxDuration = 60;

const RequestSchema = z.object({ message: z.string().trim().min(1).max(500) });

export async function POST(request: Request) {
  try {
    const { message } = RequestSchema.parse(await request.json());
    const country = findCountry(message);

    if (!country) {
      return NextResponse.json(
        { error: "I couldn't identify a country. Try a country name such as Japan, Brazil, or South Africa." },
        { status: 422 },
      );
    }

    return NextResponse.json(await researchCountry(country));
  } catch (error) {
    console.error("Travel research failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Please enter a short message containing a country name." }, { status: 400 });
    }
    const message = error instanceof Error && error.message.includes("OPENAI_API_KEY")
      ? "The travel research service has not been configured yet. Add OPENAI_API_KEY to .env.local."
      : "Research is temporarily unavailable. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
