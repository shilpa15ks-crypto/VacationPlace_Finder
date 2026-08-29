import { describe, expect, it } from "vitest";
import { findCountry } from "./countries";

describe("findCountry", () => {
  it("matches an exact official country name", () => {
    expect(findCountry("Japan")).toMatchObject({ isoCode: "JP" });
  });

  it("extracts a country from a conversational request", () => {
    expect(findCountry("Show me the best places in South Africa, please")).toMatchObject({ isoCode: "ZA" });
  });

  it("recognizes common aliases", () => {
    expect(findCountry("I want to visit the UK")).toMatchObject({ isoCode: "GB" });
    expect(findCountry("USA")).toMatchObject({ isoCode: "US" });
  });

  it("rejects cities and unrelated text", () => {
    expect(findCountry("Paris")).toBeNull();
    expect(findCountry("somewhere sunny")).toBeNull();
  });
});
