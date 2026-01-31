import { test, expect } from "@playwright/test";

const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

test.describe("WooCommerce chatbot demo", () => {
  test("renders expandable chat UI", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Open chat" }).click();
    await expect(page.getByRole("heading", { name: "Chat with AI ✨" })).toBeVisible();

    await page.fill("textarea[name=\"message\"]", "Do you ship fast to California?");
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.getByText("Do you ship fast to California?")).toBeVisible();

    if (!hasOpenAIKey) {
      await expect(page.getByText("OPENAI_API_KEY")).toBeVisible();
      return;
    }
    await expect(page.locator("text=/OpenAI-powered responses/i")).toBeVisible();
  });
});
