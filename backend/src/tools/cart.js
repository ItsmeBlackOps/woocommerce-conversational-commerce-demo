export function recommendFromCart(cartItems, data) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return [];
  }

  const cartTags = new Set();
  for (const item of cartItems) {
    const product = data.products.products.find((entry) => entry.id === item.productId);
    if (!product) {
      continue;
    }
    for (const tag of product.tags || []) {
      cartTags.add(tag.toLowerCase());
    }
  }

  const suggestions = [];
  for (const rule of data.products.cross_sell_rules || []) {
    const ruleMatch = rule.if_cart_has_tags.every((tag) => cartTags.has(tag.toLowerCase()));
    if (!ruleMatch) {
      continue;
    }
    for (const productId of rule.suggest_product_ids || []) {
      const product = data.products.products.find((entry) => entry.id === productId);
      if (product) {
        suggestions.push({ product, reason: rule.reason });
      }
    }
  }

  return suggestions;
}
