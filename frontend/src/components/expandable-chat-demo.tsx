"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Send, Bot, Paperclip, Mic, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter
} from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { postChat } from "@/api.js";
import type { Product } from "@/types";

type ChatRole = "ai" | "user";
type ChatKind = "text" | "suggestions";

interface ChatMessage {
  id: number;
  content: string;
  sender: ChatRole;
  links?: Array<{ title: string; url: string }>;
  kind?: ChatKind;
  suggestedProducts?: Product[];
}

interface ExpandableChatDemoProps {
  products: Product[];
  suggestedProducts: Product[];
  onAddToCart: (productId: string, amount?: number) => void;
  onSetQuantity: (productId: string, amount: number) => void;
}

const money = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount);

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function ExpandableChatDemo({
  products,
  suggestedProducts,
  onAddToCart,
  onSetQuantity
}: ExpandableChatDemoProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const sessionIdRef = useRef(crypto.randomUUID());
  const didSendProactive = useRef(false);
  const nextMessageId = useRef(1);
  const lastSuggestionKey = useRef("");

  const productIndex = useMemo(() => {
    return products.map((product) => ({
      product,
      normalized: normalize(product.name)
    }));
  }, [products]);

  const appendMessage = (message: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextMessageId.current++,
        ...message
      }
    ]);
  };

  const handleLocalIntent = (messageText: string) => {
    const normalizedInput = normalize(messageText);
    const hasSuggest = /(suggest|recommend|recommendation)/.test(
      normalizedInput
    );
    const hasAdd = /\b(add|include|put)\b/.test(normalizedInput);
    const hasRemove = /\b(remove|delete|take off|drop)\b/.test(normalizedInput);
    const matched = productIndex.find(({ normalized }) =>
      normalizedInput.includes(normalized)
    );

    if (hasSuggest) {
      const picks =
        suggestedProducts.length > 0
          ? suggestedProducts.slice(0, 3)
          : products.slice(0, 3);
      if (picks.length) {
        appendMessage({
          content: "Here are a few items you might like:",
          sender: "ai",
          kind: "suggestions",
          suggestedProducts: picks
        });
        return true;
      }
    }

    if (hasAdd) {
      if (matched?.product) {
        onAddToCart(matched.product.id);
        appendMessage({
          content: `Added ${matched.product.name} to your cart.`,
          sender: "ai"
        });
        return true;
      }
      appendMessage({
        content: "Which item should I add? You can mention a product name.",
        sender: "ai"
      });
      return true;
    }

    if (hasRemove) {
      if (matched?.product) {
        onSetQuantity(matched.product.id, 0);
        appendMessage({
          content: `Removed ${matched.product.name} from your cart.`,
          sender: "ai"
        });
        return true;
      }
      appendMessage({
        content: "Which item should I remove from the cart?",
        sender: "ai"
      });
      return true;
    }

    return false;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    appendMessage({
      content: messageText,
      sender: "user"
    });
    setInput("");
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (handleLocalIntent(messageText)) {
        setIsLoading(false);
        return;
      }
      const response = await postChat({
        message: messageText,
        sessionId: sessionIdRef.current
      });
      if (response.reply) {
        appendMessage({
          content: response.reply,
          sender: "ai",
          links: response.suggestedLinks || []
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to reach OpenAI.";
      setErrorMessage(message);
      appendMessage({
        content: "Sorry, I could not reach OpenAI just now.",
        sender: "ai"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (didSendProactive.current) return;
    didSendProactive.current = true;

    const sendProactive = async () => {
      try {
        const response = await postChat({
          message: "",
          proactiveTrigger: "entry",
          sessionId: sessionIdRef.current
        });
        if (response.proactiveMessage) {
          appendMessage({
            content: response.proactiveMessage,
            sender: "ai"
          });
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unable to reach OpenAI.";
        setErrorMessage(message);
      }
    };

    sendProactive();
  }, []);

  useEffect(() => {
    if (!suggestedProducts.length) return;
    const suggestionKey = suggestedProducts.map((item) => item.id).join("|");
    if (suggestionKey && suggestionKey !== lastSuggestionKey.current) {
      lastSuggestionKey.current = suggestionKey;
      appendMessage({
        content: "Based on your cart, I also recommend:",
        sender: "ai",
        kind: "suggestions",
        suggestedProducts: suggestedProducts.slice(0, 3)
      });
    }
  }, [suggestedProducts]);

  const handleAttachFile = () => {
    //
  };

  const handleMicrophoneClick = () => {
    //
  };

  return (
    <div className="h-[700px] relative">
      <ExpandableChat
        size="lg"
        position="bottom-right"
        icon={<Bot className="h-6 w-6" />}
      >
        <ExpandableChatHeader className="flex-col text-center justify-center">
          <h1 className="text-xl font-semibold">Chat with AI ✨</h1>
          <p className="text-sm text-muted-foreground">
            Ask about products, shipping, or store policies.
          </p>
          {errorMessage ? (
            <p className="text-xs text-destructive mt-2">{errorMessage}</p>
          ) : null}
        </ExpandableChatHeader>

        <ExpandableChatBody>
          <ChatMessageList>
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                variant={message.sender === "user" ? "sent" : "received"}
              >
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src={
                    message.sender === "user"
                      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
                      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                  }
                  fallback={message.sender === "user" ? "US" : "AI"}
                />
                <ChatBubbleMessage
                  variant={message.sender === "user" ? "sent" : "received"}
                >
                  <div className="space-y-2">
                    <p>{message.content}</p>
                    {message.kind === "suggestions" &&
                    message.suggestedProducts?.length ? (
                      <div className="grid gap-2">
                        {message.suggestedProducts.map((product) => (
                          <div
                            key={`suggestion-${product.id}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {product.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {money(product.price.amount, product.price.currency)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="h-8 rounded-full px-3 text-xs"
                              onClick={() => onAddToCart(product.id)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {message.links?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {message.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline underline-offset-4"
                          >
                            {link.title}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </ChatBubbleMessage>
              </ChatBubble>
            ))}

            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                  fallback="AI"
                />
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            )}
          </ChatMessageList>
        </ExpandableChatBody>

        <ExpandableChatFooter>
          <form
            onSubmit={handleSubmit}
            className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
          >
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center p-3 pt-0 justify-between">
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleAttachFile}
                >
                  <Paperclip className="size-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleMicrophoneClick}
                >
                  <Mic className="size-4" />
                </Button>
              </div>
              <Button type="submit" size="sm" className="ml-auto gap-1.5">
                Send Message
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </form>
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-2">
            <Send className="size-3.5" />
            OpenAI-powered responses
          </div>
        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  );
}
