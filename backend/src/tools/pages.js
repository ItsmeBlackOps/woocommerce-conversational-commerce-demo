import { normalizeText } from "../utils/text.js";

export function routeToPage(query, data) {
  const normalized = normalizeText(query);
  let best = null;
  let bestScore = 0;

  for (const route of data.pages.routing_keywords || []) {
    const keyword = normalizeText(route.keyword);
    if (!keyword) {
      continue;
    }
    if (normalized.includes(keyword)) {
      const score = keyword.length;
      if (score > bestScore) {
        bestScore = score;
        best = route.page_id;
      }
    }
  }

  if (!best) {
    return null;
  }

  return data.pages.pages.find((page) => page.id === best) || null;
}
