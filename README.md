# WooCommerce Conversational Commerce Demo

A polished WooCommerce chatbot experience that can suggest products, add/remove items from the cart, and display a marketplace-style menu of products. Built on local JSON data with an optional OpenAI-backed support agent.

## What you get

- Marketplace-style product cards with quick add-to-cart
- Live cart panel with quantity controls and totals
- Chat assistant that can suggest, add, and remove items
- Proactive store guidance + suggested links

## Quick start

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Set `OPENAI_API_KEY` to enable OpenAI-powered answers. You can optionally set `OPENAI_MODEL`
(defaults to `gpt-4.1`).

```powershell
$env:OPENAI_API_KEY="your_key_here"
```

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5174

## Data

All mock data lives in `/mock`. You can replace the JSON with your own store data and restart the backend.

## API

- `POST /api/chat`
  - body: `{ message, cartItems, storeOverride, proactiveTrigger, sessionId }`
  - returns: `{ reply, suggestedLinks, proactiveMessage }`

## Tests

```bash
npm test
```

## Playwright (E2E)

```bash
npm run test:e2e
```

If running for the first time, install Playwright browsers:

```bash
npx playwright install
```
