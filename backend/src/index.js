import "dotenv/config";
import fs from "fs";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { loadData, validateData, mockDir } from "./data/loaders.js";
import { runAgent } from "./agent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 5174;

const initialData = loadData();
const validationErrors = validateData(initialData);
if (validationErrors.length) {
  console.error("Data validation failed:\n" + validationErrors.join("\n"));
  process.exit(1);
}

const sessions = new Map();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/data/business", (_req, res) => {
  const data = loadData();
  res.json(data.business);
});

app.get("/api/data/pages", (_req, res) => {
  const data = loadData();
  res.json(data.pages);
});

app.get("/api/data/products", (_req, res) => {
  const data = loadData();
  res.json(data.products);
});

app.get("/api/data/mock-path", (_req, res) => {
  res.json({ mockPath: mockDir });
});

app.get("/api/config", (_req, res) => {
  res.json({
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  });
});

app.post("/api/chat", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "OPENAI_API_KEY is not set on the server." });
    return;
  }

  const { message, cartItems, storeOverride, proactiveTrigger, sessionId } = req.body || {};
  const sessionKey = sessionId || "demo";
  const sessionState = sessions.get(sessionKey) || {
    proactiveSent: false,
    userReplied: false,
    history: []
  };

  if (message && message.trim()) {
    sessionState.userReplied = true;
    sessionState.proactiveSent = true;
  }

  let response;
  try {
    response = await runAgent({
      message,
      cartItems,
      storeOverride,
      proactiveTrigger: sessionState.userReplied ? null : proactiveTrigger,
      sessionState
    });
  } catch (error) {
    console.error("OpenAI request failed", error);
    res.status(500).json({ error: "OpenAI request failed. Check server logs." });
    return;
  }

  if (response.proactiveMessage) {
    sessionState.proactiveSent = true;
  }

  if (message && message.trim()) {
    sessionState.history.push({ role: "user", content: message });
  }
  if (response.reply) {
    sessionState.history.push({ role: "assistant", content: response.reply });
  }
  sessionState.history = sessionState.history.slice(-8);

  sessions.set(sessionKey, sessionState);

  res.json({
    reply: response.reply,
    suggestedLinks: response.suggestedLinks,
    proactiveMessage: response.proactiveMessage
  });
});

const frontendDist = path.resolve(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
