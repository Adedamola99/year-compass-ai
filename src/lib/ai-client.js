// lib/ai-client.js
// GitHub Models API Client (Corrected)

import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";

// Available models on GitHub Models:
// - "gpt-4o" (GPT-4 Omni - recommended)
// - "gpt-4o-mini" (faster, cheaper)
// - "gpt-4-turbo"
// - "Phi-3.5-mini-instruct"
// - "Llama-3.2-11B-Vision-Instruct"
const model = "gpt-4o"; // Using GPT-4o (best balance of speed & quality)

if (!token) {
  console.warn("⚠️ GITHUB_TOKEN not found in environment variables");
  console.warn("Get one from: https://github.com/settings/tokens");
}

/**
 * Call GitHub Models API with conversation history
 * @param {Array} messages - Array of {role: 'user'|'assistant'|'system', content: string}
 * @param {string} systemPrompt - System instructions
 * @param {object} options - Additional options (temperature, maxTokens, etc.)
 * @returns {Promise<string>} - AI response text
 */
export async function callAI(messages, systemPrompt = "", options = {}) {
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set. Please add it to .env.local");
  }

  const client = ModelClient(endpoint, new AzureKeyCredential(token));

  // Build messages array with system prompt first
  const allMessages = [];

  if (systemPrompt) {
    allMessages.push({ role: "system", content: systemPrompt });
  }

  // Add conversation messages
  allMessages.push(...messages);

  try {
    const response = await client.path("/chat/completions").post({
      body: {
        messages: allMessages,
        model: model,
        temperature: options.temperature ?? 0.9,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 0.95,
      },
    });

    if (isUnexpected(response)) {
      const errorMsg = response.body?.error?.message || "AI API error";
      console.error("GitHub Models API Error:", response.body);
      throw new Error(errorMsg);
    }

    const aiResponse = response.body.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    return aiResponse;
  } catch (error) {
    console.error("GitHub Models API Error:", error);
    throw error;
  }
}

/**
 * Call AI for intake interview (conversational)
 */
export async function callIntakeInterview(conversationHistory, systemPrompt) {
  return callAI(conversationHistory, systemPrompt, {
    temperature: 0.9, // More creative/conversational
    maxTokens: 2000,
  });
}

/**
 * Call AI for plan generation (structured)
 */
export async function callPlanGeneration(intakeData, systemPrompt) {
  const messages = [
    {
      role: "user",
      content: `Here is the intake data:\n\n${JSON.stringify(
        intakeData,
        null,
        2,
      )}\n\nPlease create a comprehensive year plan.`,
    },
  ];

  return callAI(messages, systemPrompt, {
    temperature: 0.7, // More structured/consistent
    maxTokens: 8000, // Need more tokens for full plan
  });
}

/**
 * Call AI for daily coaching (encouraging, concise)
 */
export async function callDailyCoach(context, userMessage, systemPrompt) {
  const messages = [
    {
      role: "user",
      content: `Context:\n${JSON.stringify(
        context,
        null,
        2,
      )}\n\nUser message: ${userMessage}`,
    },
  ];

  return callAI(messages, systemPrompt, {
    temperature: 0.8,
    maxTokens: 500, // Keep it concise
  });
}

/**
 * Call AI for plan adaptation (analytical)
 */
export async function callAdaptation(
  currentPlan,
  completionHistory,
  reason,
  systemPrompt,
) {
  const messages = [
    {
      role: "user",
      content: `Current plan:\n${JSON.stringify(
        currentPlan,
        null,
        2,
      )}\n\nCompletion history:\n${JSON.stringify(
        completionHistory,
        null,
        2,
      )}\n\nReason for adaptation: ${reason}\n\nPlease suggest adaptations.`,
    },
  ];

  return callAI(messages, systemPrompt, {
    temperature: 0.7,
    maxTokens: 3000,
  });
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function extractJSON(text) {
  try {
    // Try to parse directly first
    return JSON.parse(text);
  } catch (e) {
    // Try to find JSON in markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }

    // Try to find raw JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("No valid JSON found in response");
  }
}

/**
 * Check if API token is valid
 */
export async function validateApiKey(apiToken) {
  try {
    const client = ModelClient(endpoint, new AzureKeyCredential(apiToken));

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [{ role: "user", content: "Test" }],
        model: model,
        max_tokens: 10,
      },
    });

    return !isUnexpected(response);
  } catch {
    return false;
  }
}

// Export default object with all functions
const aiClient = {
  callAI,
  callIntakeInterview,
  callPlanGeneration,
  callDailyCoach,
  callAdaptation,
  extractJSON,
  validateApiKey,
};

export default aiClient;
