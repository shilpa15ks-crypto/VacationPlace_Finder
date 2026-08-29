# Roamwise

Roamwise is a source-backed travel chat that returns exactly three recommended destinations for a country, together with reasons, activities, confidence, and links.

## Architecture

1. The API validates the country deterministically against ISO 3166 data.
2. The Destination Agent researches and selects three places.
3. The Things-to-Do Agent and Verification Agent run concurrently for those places.
4. The server merges their structured output and returns it to the chat UI.

The agents use the OpenAI Responses API, Structured Outputs, and hosted web search. The API key is used only on the server.

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `OPENAI_API_KEY` in `.env.local`. `OPENAI_MODEL` is optional and defaults to `gpt-5.4-mini`.

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm test
npm run build
```
