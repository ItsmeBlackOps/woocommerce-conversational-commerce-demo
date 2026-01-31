export async function postChat(payload) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Chat request failed");
  }

  return data;
}

export async function fetchProducts() {
  const response = await fetch("/api/data/products");
  if (!response.ok) {
    throw new Error("Failed to load products");
  }
  return response.json();
}

export async function fetchBusiness() {
  const response = await fetch("/api/data/business");
  if (!response.ok) {
    throw new Error("Failed to load business");
  }
  return response.json();
}

export async function fetchMockPath() {
  const response = await fetch("/api/data/mock-path");
  if (!response.ok) {
    throw new Error("Failed to load mock path");
  }
  return response.json();
}

export async function fetchConfig() {
  const response = await fetch("/api/config");
  if (!response.ok) {
    throw new Error("Failed to load config");
  }
  return response.json();
}
