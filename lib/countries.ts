import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

const aliases: Record<string, string> = {
  america: "US",
  britain: "GB",
  england: "GB",
  holland: "NL",
  iran: "IR",
  laos: "LA",
  russia: "RU",
  "south korea": "KR",
  "north korea": "KP",
  syria: "SY",
  taiwan: "TW",
  tanzania: "TZ",
  "the bahamas": "BS",
  "the gambia": "GM",
  turkey: "TR",
  uk: "GB",
  "u.k.": "GB",
  usa: "US",
  "u.s.a.": "US",
  "united states": "US",
  vietnam: "VN",
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s.]/g, " ").replace(/\s+/g, " ").trim();
}

const names = Object.entries(countries.getNames("en", { select: "official" })).map(([code, name]) => ({
  code,
  name,
  normalized: normalize(name),
}));

export type CountryMatch = { name: string; isoCode: string };

export function findCountry(input: string): CountryMatch | null {
  const query = normalize(input);
  if (!query) return null;

  const alias = Object.entries(aliases)
    .sort(([a], [b]) => b.length - a.length)
    .find(([key]) => new RegExp(`(^|\\s)${key.replaceAll(".", "\\.")}(?=$|\\s)`, "i").test(query));
  if (alias) {
    const name = countries.getName(alias[1], "en", { select: "official" });
    return name ? { name, isoCode: alias[1] } : null;
  }

  const exact = names.find(({ normalized }) => query === normalized);
  if (exact) return { name: exact.name, isoCode: exact.code };

  const embedded = names
    .filter(({ normalized }) => normalized.length >= 4 && new RegExp(`(^|\\s)${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[?.!,\\s])`, "i").test(query))
    .sort((a, b) => b.normalized.length - a.normalized.length)[0];

  return embedded ? { name: embedded.name, isoCode: embedded.code } : null;
}
