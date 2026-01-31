import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..", "..");
const mockDir = path.join(projectRoot, "mock");

const files = {
  business: "business.json",
  pages: "pages.json",
  products: "products.json",
  shipping: "shipping.json",
  faq: "faq.json",
  recipes: "recipes.json",
  intents: "intents.json"
};

let cache = null;
let lastMtime = 0;

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function getLatestMtime() {
  let newest = 0;
  for (const fileName of Object.values(files)) {
    const fullPath = path.join(mockDir, fileName);
    const stat = fs.statSync(fullPath);
    if (stat.mtimeMs > newest) {
      newest = stat.mtimeMs;
    }
  }
  return newest;
}

export function loadData() {
  const latest = getLatestMtime();
  if (cache && latest <= lastMtime) {
    return cache;
  }

  const data = {
    business: readJson(path.join(mockDir, files.business)),
    pages: readJson(path.join(mockDir, files.pages)),
    products: readJson(path.join(mockDir, files.products)),
    shipping: readJson(path.join(mockDir, files.shipping)),
    faq: readJson(path.join(mockDir, files.faq)),
    recipes: readJson(path.join(mockDir, files.recipes)),
    intents: readJson(path.join(mockDir, files.intents))
  };

  cache = data;
  lastMtime = latest;
  return data;
}

export function validateData(data) {
  const errors = [];

  if (!data.business || !data.business.storeName) {
    errors.push("business.storeName is required");
  }
  if (!data.pages || !Array.isArray(data.pages.pages)) {
    errors.push("pages.pages must be an array");
  }
  if (!data.products || !Array.isArray(data.products.products)) {
    errors.push("products.products must be an array");
  }
  if (!data.shipping || !Array.isArray(data.shipping.methods)) {
    errors.push("shipping.methods must be an array");
  }
  if (!data.faq || !Array.isArray(data.faq.items)) {
    errors.push("faq.items must be an array");
  }
  if (!data.recipes || !Array.isArray(data.recipes.recipes)) {
    errors.push("recipes.recipes must be an array");
  }
  if (!data.intents || !Array.isArray(data.intents.intents)) {
    errors.push("intents.intents must be an array");
  }

  const productIds = new Set(data.products.products.map((product) => product.id));
  const pageIds = new Set(data.pages.pages.map((page) => page.id));
  const recipeIds = new Set(data.recipes.recipes.map((recipe) => recipe.id));

  for (const rule of data.products.cross_sell_rules || []) {
    for (const id of rule.suggest_product_ids || []) {
      if (!productIds.has(id)) {
        errors.push(`cross_sell_rules references missing product id: ${id}`);
      }
    }
  }

  for (const page of data.pages.pages) {
    if (page.top_products) {
      for (const id of page.top_products) {
        if (!productIds.has(id)) {
          errors.push(`pages top_products references missing product id: ${id}`);
        }
      }
    }
  }

  for (const route of data.pages.routing_keywords || []) {
    if (!pageIds.has(route.page_id)) {
      errors.push(`routing_keywords references missing page id: ${route.page_id}`);
    }
  }

  for (const intent of data.intents.intents) {
    for (const id of intent.recommend?.product_ids || []) {
      if (!productIds.has(id)) {
        errors.push(`intents recommend references missing product id: ${id}`);
      }
    }
    for (const id of intent.recommend?.recipe_ids || []) {
      if (!recipeIds.has(id)) {
        errors.push(`intents recommend references missing recipe id: ${id}`);
      }
    }
  }

  for (const recipe of data.recipes.recipes) {
    for (const id of recipe.recommended_product_ids || []) {
      if (!productIds.has(id)) {
        errors.push(`recipes references missing product id: ${id}`);
      }
    }
  }

  return errors;
}

export function applyStoreOverride(data, storeOverride) {
  if (!storeOverride || storeOverride.mode !== "custom") {
    return data;
  }

  const next = JSON.parse(JSON.stringify(data));
  const business = next.business;
  business.storeName = storeOverride.storeName || business.storeName;
  business.storeDomain = storeOverride.storeDomain || business.storeDomain;
  if (storeOverride.support) {
    business.support = {
      ...business.support,
      ...storeOverride.support
    };
  }

  next.pages.store.name = business.storeName;
  next.pages.store.domain = business.storeDomain;
  for (const page of next.pages.pages) {
    if (page.type === "support" && storeOverride.support) {
      page.support_channels = {
        ...page.support_channels,
        ...storeOverride.support
      };
    }
  }

  return next;
}

export { mockDir };
