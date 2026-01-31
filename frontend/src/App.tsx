import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Flame,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2
} from "lucide-react";
import { ExpandableChatDemo } from "./components/expandable-chat-demo";
import { fetchProducts } from "./api.js";
import { Button } from "./components/ui/button";
import type { CrossSellRule, Product, ProductsPayload } from "./types";

const money = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount);

const coverGradients = [
  "from-[#ff9f6a] via-[#ffd6a5] to-[#fff4e0]",
  "from-[#4cc9f0] via-[#7cd3ff] to-[#e5f4ff]",
  "from-[#b392f0] via-[#8b5cf6] to-[#f3e8ff]",
  "from-[#34d399] via-[#6ee7b7] to-[#e6fffb]",
  "from-[#f472b6] via-[#fb7185] to-[#ffe4e6]",
  "from-[#facc15] via-[#fde047] to-[#fef9c3]"
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getGradient = (index: number) =>
  coverGradients[index % coverGradients.length];

const buildCartSummary = (items: Array<{ total: number }>) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const shipping = subtotal > 0 ? 5 : 0;
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  return {
    subtotal,
    shipping,
    tax,
    total: subtotal + shipping + tax
  };
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [crossSellRules, setCrossSellRules] = useState<CrossSellRule[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const data = (await fetchProducts()) as ProductsPayload;
        if (!isMounted) return;
        setProducts(data.products || []);
        setCrossSellRules(data.cross_sell_rules || []);
        setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        setLoadError(
          error instanceof Error ? error.message : "Unable to load products."
        );
        setIsLoading(false);
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = products.find((item) => item.id === productId);
        if (!product) return null;
        return {
          product,
          quantity,
          total: product.price.amount * quantity
        };
      })
      .filter(Boolean) as Array<{
      product: Product;
      quantity: number;
      total: number;
    }>;
  }, [cart, products]);

  const cartSummary = useMemo(() => buildCartSummary(cartItems), [cartItems]);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const suggestedProducts = useMemo(() => {
    if (!crossSellRules.length || !cartItems.length) return [];
    const cartTags = new Set(
      cartItems.flatMap((item) => item.product.tags || [])
    );
    const suggestedIds = new Set<string>();
    crossSellRules.forEach((rule) => {
      const matches = rule.if_cart_has_tags.some((tag) => cartTags.has(tag));
      if (matches) {
        rule.suggest_product_ids.forEach((id) => suggestedIds.add(id));
      }
    });
    return products.filter(
      (product) =>
        suggestedIds.has(product.id) && !(product.id in cart)
    );
  }, [cartItems, cart, crossSellRules, products]);

  const addToCart = (productId: string, amount = 1) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + amount
    }));
  };

  const removeFromCart = (productId: string, amount = 1) => {
    setCart((prev) => {
      const next = { ...prev };
      const nextAmount = (next[productId] || 0) - amount;
      if (nextAmount <= 0) {
        delete next[productId];
      } else {
        next[productId] = nextAmount;
      }
      return next;
    });
  };

  const setQuantity = (productId: string, amount: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (amount <= 0) {
        delete next[productId];
      } else {
        next[productId] = amount;
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen text-foreground">
      <main className="relative">
        <section className="mx-auto max-w-6xl px-6 pt-10">
          <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-8 shadow-[0_30px_60px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_55%),radial-gradient(circle_at_70%_20%,_rgba(99,102,241,0.2),_transparent_55%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  conversational commerce
                </div>
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                  A WooCommerce chatbot that sells, suggests, and builds carts.
                </h1>
                <p className="max-w-xl text-base text-slate-600">
                  See the storefront cards below, then ask the assistant to
                  recommend items or add them to the cart. The AI can also remove
                  items in real time.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    Cart actions
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow">
                    <Flame className="h-4 w-4 text-rose-500" />
                    Instant upsells
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow">
                    <ShoppingBag className="h-4 w-4 text-indigo-500" />
                    Marketplace cards
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow">
                <h2 className="text-lg font-semibold">Assistant highlights</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Powered by your WooCommerce catalog with clear suggestions and
                  structured cart actions.
                </p>
                <div className="mt-4 grid gap-3 text-sm text-slate-700">
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3">
                    Suggests items based on cart tags.
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3">
                    Adds and removes products on command.
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3">
                    Presents menu items as shoppable cards.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Menu marketplace</h2>
                  <p className="text-sm text-slate-600">
                    Showcase products in a quick-buy grid just like a retail
                    marketplace.
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow">
                  {products.length} live items
                </div>
              </div>

              {loadError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {loadError}
                </div>
              ) : null}

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="h-72 animate-pulse rounded-3xl border border-slate-200/60 bg-white/70"
                      />
                    ))
                  : products.map((product, index) => (
                      <div
                        key={product.id}
                        className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div
                          className={`relative flex h-36 items-end justify-between rounded-2xl bg-gradient-to-br ${getGradient(
                            index
                          )} p-4 text-white`}
                        >
                          <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                            {product.tags?.[0] || "Blend"}
                          </div>
                          <div className="text-2xl font-semibold">
                            {getInitials(product.name)}
                          </div>
                        </div>
                        <div className="mt-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold">
                              {product.name}
                            </h3>
                            <span className="text-base font-semibold text-slate-900">
                              {money(product.price.amount, product.price.currency)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {product.summary}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(product.tags || []).slice(0, 3).map((tag) => (
                              <span
                                key={`${product.id}-${tag}`}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <Button
                              size="sm"
                              className="rounded-full px-4"
                              onClick={() => addToCart(product.id)}
                            >
                              Add to cart
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full border border-slate-200"
                              asChild
                            >
                              <a
                                href={product.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.1)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your cart</h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {cartCount} items
                  </span>
                </div>
                <div className="mt-5 space-y-4">
                  {cartItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      The cart is empty. Ask the bot to add a product.
                    </div>
                  ) : (
                    cartItems.map(({ product, quantity }) => (
                      <div
                        key={`cart-${product.id}`}
                        className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {money(product.price.amount, product.price.currency)} per item
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-500 transition hover:scale-105"
                            onClick={() => setQuantity(product.id, 0)}
                            aria-label={`Remove ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:scale-105"
                            onClick={() => removeFromCart(product.id)}
                            aria-label={`Decrease ${product.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="min-w-[56px] rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-center text-sm font-semibold text-slate-700">
                            {quantity}
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:scale-105"
                            onClick={() => addToCart(product.id)}
                            aria-label={`Increase ${product.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 space-y-3 border-t border-dashed border-slate-200 pt-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      {money(cartSummary.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-slate-900">
                      {money(cartSummary.shipping)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax (8%)</span>
                    <span className="font-semibold text-slate-900">
                      {money(cartSummary.tax)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                    <span>Total</span>
                    <span>{money(cartSummary.total)}</span>
                  </div>
                </div>
                <Button className="mt-5 w-full rounded-full py-6 text-base">
                  Proceed to checkout
                </Button>
              </div>

              <div className="rounded-3xl border border-indigo-200/60 bg-indigo-50/70 p-6 shadow-[0_16px_30px_rgba(30,64,175,0.12)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  AI suggestions
                </div>
                <p className="mt-2 text-sm text-indigo-700/80">
                  Based on your cart tags, the assistant recommends:
                </p>
                <div className="mt-4 space-y-3">
                  {(suggestedProducts.length
                    ? suggestedProducts
                    : products.slice(0, 2)
                  ).map((product) => (
                    <div
                      key={`suggested-${product.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {money(product.price.amount, product.price.currency)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => addToCart(product.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <ExpandableChatDemo
        products={products}
        suggestedProducts={suggestedProducts}
        onAddToCart={addToCart}
        onSetQuantity={setQuantity}
      />
    </div>
  );
}
