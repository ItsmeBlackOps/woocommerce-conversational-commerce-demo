import { normalizeText } from "../utils/text.js";

export function faqAnswer(query, data) {
  const normalized = normalizeText(query);
  let best = null;
  let bestScore = 0;

  for (const item of data.faq.items) {
    const haystack = normalizeText([item.question, ...(item.topics || [])].join(" "));
    let score = 0;
    for (const token of normalized.split(" ").filter(Boolean)) {
      if (haystack.includes(token)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return bestScore > 0 ? best : null;
}
