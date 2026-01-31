export interface ProductPrice {
  amount: number;
  currency: string;
}

export interface Product {
  id: string;
  name: string;
  url: string;
  price: ProductPrice;
  summary: string;
  features?: string[];
  tags?: string[];
  use_cases?: string[];
  attributes?: Record<string, unknown>;
  availability?: { in_stock: boolean };
  shipping_notes?: string;
}

export interface CrossSellRule {
  if_cart_has_tags: string[];
  suggest_product_ids: string[];
  reason: string;
}

export interface ProductsPayload {
  products: Product[];
  cross_sell_rules: CrossSellRule[];
}
