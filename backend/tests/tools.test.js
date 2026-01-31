import test from "node:test";
import assert from "node:assert/strict";
import { loadData } from "../src/data/loaders.js";
import { searchProducts } from "../src/tools/products.js";
import { routeToPage } from "../src/tools/pages.js";
import { recommendFromCart } from "../src/tools/cart.js";
import { recommendForIntent } from "../src/tools/intent.js";
import { shippingEstimate } from "../src/tools/shipping.js";
import { faqAnswer } from "../src/tools/faq.js";

const data = loadData();

test("searchProducts matches by tag", () => {
  const results = searchProducts("gift", {}, data);
  assert.ok(results.length > 0);
});

test("routeToPage finds subscriptions", () => {
  const page = routeToPage("Where are subscriptions", data);
  assert.equal(page?.id, "subscriptions");
});

test("recommendFromCart uses cross sell rules", () => {
  const suggestions = recommendFromCart([{ productId: "p_explorer_box" }], data);
  assert.ok(suggestions.length > 0);
});

test("recommendForIntent matches boss dinner", () => {
  const result = recommendForIntent("gift for my boss dinner", data);
  assert.ok(result);
  assert.ok(result.products.length > 0);
});

test("shippingEstimate returns range", () => {
  const estimate = shippingEstimate("NY", data);
  assert.equal(estimate.minDays, 2);
  assert.equal(estimate.maxDays, 5);
});

test("faqAnswer finds tracking", () => {
  const result = faqAnswer("How do I track", data);
  assert.ok(result);
  assert.equal(result.id, "faq_tracking");
});
