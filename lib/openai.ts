import OpenAI from "openai";

let client: OpenAI | undefined;

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
