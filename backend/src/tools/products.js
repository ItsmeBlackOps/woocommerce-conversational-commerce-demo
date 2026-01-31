import { normalizeText } from "../utils/text.js";

export function searchProducts(query, filters, data) {
  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const results = [];

  for (const product of data.products.products) {
    let score = 0;
    const haystack = normalizeText(
      [
        product.name,
        product.summary,
        ...(product.tags || []),
        ...(product.use_cases || [])
      ].join(" ")
    );

    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 1;
      }
    }

    if (filters?.tags?.length) {
      const tags = (product.tags || []).map((tag) => normalizeText(tag));
      const filterMatches = filters.tags.every((tag) => tags.includes(normalizeText(tag)));
      if (!filterMatches) {
        continue;
      }
      score += 1;
    }

    if (filters?.use_cases?.length) {
      const useCases = (product.use_cases || []).map((tag) => normalizeText(tag));
      const useCaseMatches = filters.use_cases.some((tag) => useCases.includes(normalizeText(tag)));
      if (!useCaseMatches) {
        continue;
      }
      score += 1;
    }

    if (score > 0) {
      results.push({ product, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product);
}

export function getProduct(productId, data) {
  return data.products.products.find((product) => product.id === productId) || null;
}
