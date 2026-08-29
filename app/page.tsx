"use client";

import { FormEvent, useState } from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  ExternalLink,
  Globe2,
  MapPin,
  Route,
  Sparkles,
} from "lucide-react";
import type { TripResult } from "@/lib/types";

const suggestions = ["Japan", "Portugal", "New Zealand"];

function formatSourceLabel(url: string, title: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return title.trim() && title.length <= 42 ? title.trim() : hostname;
  } catch {
    return title.trim() || "View source";
  }
}

export default function Home() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(message: string) {
    if (!message.trim() || loading) return;
    setQuery(message.trim());
    setInput("");
    setResult(null);
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const message = new FormData(form).get("country");
    if (typeof message === "string") void submit(message);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Roamwise home">
          <span className="brand-mark"><Compass size={21} strokeWidth={2.4} /></span>
          <span>roamwise</span>
        </a>
        <div className="top-label"><span className="online-dot" /> AI travel scout</div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><Sparkles size={15} /> YOUR CURATED TRAVEL SHORTLIST</div>
        <h1>One country.<br /><em>Three unforgettable places.</em></h1>
        <p className="intro">Tell me where you&apos;re curious about. My travel scouts research, cross-check, and curate the three places most worth your time.</p>

        <form className="search" onSubmit={handleSubmit}>
          <Globe2 className="search-icon" size={23} />
          <input
            name="country"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Where do you want to explore?"
            aria-label="Enter a country"
            disabled={loading}
          />
          <button type="submit" disabled={loading} aria-label="Find destinations"><ArrowUp size={21} /></button>
        </form>

        {!query && (
          <div className="suggestions">
            <span>Try</span>
            {suggestions.map((country) => <button key={country} onClick={() => void submit(country)}>{country}</button>)}
          </div>
        )}
      </section>

      {(query || result || error) && (
        <section className="conversation" aria-live="polite">
          <div className="user-row"><div className="user-message">{query}</div><div className="avatar">You</div></div>

          {loading && <ResearchProgress country={query} />}

          {error && (
            <div className="agent-row">
              <div className="agent-avatar"><Compass size={18} /></div>
              <div className="error-card"><strong>I hit a snag</strong><p>{error}</p><button onClick={() => { setQuery(""); setError(""); }}>Try another country</button></div>
            </div>
          )}

          {result && <Results result={result} />}
        </section>
      )}

      <footer>
        <span><Compass size={15} /> Roamwise</span>
        <p>Recommendations are researched with AI. Check official sources before you travel.</p>
      </footer>
    </main>
  );
}

function ResearchProgress({ country }: { country: string }) {
  return (
    <div className="agent-row">
      <div className="agent-avatar pulse"><Compass size={18} /></div>
      <div className="research-card">
        <div className="research-heading"><span className="loader" /> Scouting {country}...</div>
        <div className="research-steps">
          <span><Check size={14} /> Country recognized</span>
          <span className="active"><Route size={14} /> Ranking destinations</span>
          <span><Sparkles size={14} /> Finding things to do</span>
        </div>
      </div>
    </div>
  );
}

function Results({ result }: { result: TripResult }) {
  const researched = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(result.researchedAt));
  return (
    <div className="agent-row results-row">
      <div className="agent-avatar"><Compass size={18} /></div>
      <div className="results">
        <div className="results-intro">
          <span className="result-kicker"><Check size={14} /> Research complete</span>
          <h2>The best of {result.country.name},<br /><em>narrowed down for you.</em></h2>
          <p>Three distinct places, chosen for their cultural significance, variety of experiences, and enduring traveler appeal.</p>
        </div>

        <div className="destination-list">
          {result.destinations.map((destination, index) => (
            <article className="destination" key={destination.name}>
              <div className="rank">0{index + 1}</div>
              <div className="destination-body">
                <div className="destination-top">
                  <div>
                    <div className="location"><MapPin size={14} /> {destination.region}</div>
                    <h3>{destination.name}</h3>
                  </div>
                  <div className="confidence">{Math.round(destination.confidence * 100)}% match</div>
                </div>
                <p className="summary">{destination.summary}</p>
                <blockquote>{destination.whyRecommended}</blockquote>
                <div className="tags">{destination.bestFor.map((tag) => <span key={tag}>{tag}</span>)}</div>

                <details>
                  <summary><span>Things worth doing</span><ChevronDown size={17} /></summary>
                  <div className="activities">
                    {destination.activities.map((activity) => (
                      <div className="activity" key={activity.name}>
                        <div className="activity-dot" />
                        <div><h4>{activity.name}</h4><p>{activity.description}</p><small><Clock3 size={12} /> {activity.duration} · {activity.bookingTip}</small></div>
                      </div>
                    ))}
                  </div>
                </details>

                <div className="sources">
                  <span>Verified sources</span>
                  {destination.sources.slice(0, 3).map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${source.title} — ${source.url}`}
                    >
                      {formatSourceLabel(source.url, source.title)}
                      <ExternalLink size={11} />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {result.warnings.length > 0 && <div className="warning"><strong>Good to know:</strong> {result.warnings.join(" ")}</div>}
        <div className="research-date">Researched and cross-checked on {researched}</div>
      </div>
    </div>
  );
}
