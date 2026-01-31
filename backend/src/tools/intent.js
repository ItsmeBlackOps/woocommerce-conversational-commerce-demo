import { normalizeText } from "../utils/text.js";

export function recommendForIntent(intentText, data) {
  const normalized = normalizeText(intentText);
  let match = null;

  for (const intent of data.intents.intents) {
    const phraseMatch = intent.match_phrases.some((phrase) =>
      normalized.includes(normalizeText(phrase))
    );
    if (phraseMatch) {
      match = intent;
      break;
    }
  }

  if (!match) {
    return null;
  }

  const products = match.recommend.product_ids
    .map((id) => data.products.products.find((product) => product.id === id))
    .filter(Boolean);
  const recipes = match.recommend.recipe_ids
    .map((id) => data.recipes.recipes.find((recipe) => recipe.id === id))
    .filter(Boolean);

  return {
    intent: match,
    products,
    recipes
  };
}
