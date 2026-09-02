import type { SurveyMatch } from "./types";

/**
 * Survey/block token matching, ported 1:1 from the mentor's demo logic so
 * results stay identical to the digitised books:
 *
 *  - exact:   token equals the query, or the query falls inside a printed
 *             range token like "12 TO 45";
 *  - related: the book lists subdivisions of the queried base number
 *             ("1674/PAIKI", "240/P", "86/2" for query "1674"/"240"/"86"),
 *             or the reverse (query "86/2", book lists base "86").
 *
 * Queries and tokens are compared uppercase with collapsed whitespace.
 */

export function normalizeQuery(s: string): string {
  return s.toUpperCase().replace(/\s+/g, " ").trim();
}

export function tokenMatch(token: string, query: string): SurveyMatch | null {
  if (token === query) return "exact";

  const range = token.match(/^(\d+)\s+TO\s+(\d+)$/);
  if (range && /^\d+$/.test(query)) {
    const n = Number(query);
    if (n >= Number(range[1]) && n <= Number(range[2])) return "exact";
  }

  if (token.startsWith(query + "/") || token.startsWith(query + " ")) return "related";
  if (query.startsWith(token + "/") || query.startsWith(token + " ")) return "related";

  return null;
}

export function findInTokens(tokens: string[], query: string): {
  exact: string[];
  related: string[];
} {
  const exact: string[] = [];
  const related: string[] = [];
  for (const token of tokens) {
    const m = tokenMatch(token, query);
    if (m === "exact") exact.push(token);
    else if (m === "related") related.push(token);
  }
  return { exact, related };
}
