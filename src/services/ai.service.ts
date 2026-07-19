import { env } from "../config/env";
import { RECIPE_GENERATION_PROMPT, CHEF_AI_SYSTEM_PROMPT } from "../utils/prompts";

const AGENTROUTER_API_KEY = env.AGENTROUTER_API_KEY || "sk-I9ujSSesOENwHUb9EL04IXSgYqj312xe5bozs3zNIDoFnoQq";
const AGENTROUTER_BASE_URL = "https://agentrouter.org/v1";

const SPOOF_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${AGENTROUTER_API_KEY}`,
  "Originator": "codex_cli_rs",
  "Version": "0.114.0",
  "anthropic-dangerous-direct-browser-access": "true",
  "x-app": "cli",
  "x-stainless-lang": "js",
  "x-stainless-package-version": "0.55.1",
  "x-stainless-os": "Windows",
  "x-stainless-runtime": "node",
  "x-stainless-arch": "x64"
};

export class AIService {
  /**
   * Generates a recipe based on ingredients, cuisine, and dietType
   */
  public static async generateRecipe(
    ingredients: string[],
    cuisine: string,
    dietType: string,
    length?: string,
    selectedModel?: string,
    isRetry = false
  ): Promise<any> {
    const model = selectedModel || "glm-5.2";
    const prompt = `
      Ingredients available: ${ingredients.join(", ")}
      Preferred Cuisine: ${cuisine}
      Dietary Profile: ${dietType}
      Desired Length/Complexity: ${length || "Medium"}
      
      You must respond with a JSON object following the schema requested.
    `;

    try {
      const response = await fetch(`${AGENTROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: SPOOF_HEADERS,
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: RECIPE_GENERATION_PROMPT },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AgentRouter API Error: ${response.status} - ${text}`);
      }

      const result = (await response.json()) as any;
      const responseText = result.choices?.[0]?.message?.content;
      if (!responseText) {
        throw new Error("Empty response from AI engine");
      }

      // Safe JSON parse (handling markdown blocks if model returns them)
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.substring(7);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();

      const parsedRecipe = JSON.parse(cleanedText);
      return parsedRecipe;
    } catch (error) {
      console.error("AI Recipe Generation error:", error);
      if (!isRetry) {
        console.log("Retrying AI Recipe Generation...");
        return this.generateRecipe(ingredients, cuisine, dietType, length, model, true);
      }
      throw error;
    }
  }

  /**
   * Streams a chat session with Chef AI
   */
  public static async streamChat(
    message: string,
    history: { role: "user" | "assistant" | "system"; content: string }[],
    selectedModel?: string,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const model = selectedModel || "glm-5.2";
    
    // Map history to standard OpenAI format
    const messages = [
      { role: "system", content: CHEF_AI_SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    const response = await fetch(`${AGENTROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: SPOOF_HEADERS,
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AgentRouter Stream Error: ${response.status} - ${errText}`);
    }

    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    if (response.body) {
      // @ts-ignore
      for await (const chunk of response.body) {
        const chunkText = decoder.decode(chunk, { stream: true });
        const lines = chunkText.split("\n");
        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === "data: [DONE]") continue;

          if (cleanLine.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(cleanLine.substring(6));
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                fullText += delta;
                if (onChunk) {
                  onChunk(delta);
                }
              }
            } catch (err) {
              // Ignore partial or parse errors
            }
          }
        }
      }
    }

    return fullText;
  }
}
