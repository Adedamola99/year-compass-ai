// lib/gemini.js
// Clean wrapper for Google Gemini API calls

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-2.0-flash-exp"; // Free tier, fast & good

/**
 * Call Gemini API with conversation history
 * @param {Array} messages - Array of {role: 'user'|'model', content: string}
 * @param {string} systemPrompt - System instructions
 * @param {object} options - Additional options (temperature, maxTokens, etc.)
 * @returns {Promise<string>} - AI response text
 */
export async function callGemini(messages, systemPrompt = "", options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  // Convert messages to Gemini format
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : msg.role,
    parts: [{ text: msg.content }],
  }));

  const requestBody = {
    contents,
    generationConfig: {
      temperature: options.temperature || 0.9,
      maxOutputTokens: options.maxTokens || 2048,
      topP: options.topP || 0.95,
    },
  };

  // Add system instruction if provided
  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      throw new Error(data.error.message || "Gemini API error");
    }

    // Extract text from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No text in Gemini response");
    }

    return text;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw error;
  }
}

/**
 * Call Gemini for intake interview (conversational)
 */
export async function callIntakeInterview(conversationHistory, systemPrompt) {
  return callGemini(conversationHistory, systemPrompt, {
    temperature: 0.9, // More creative/conversational
    maxTokens: 2000,
  });
}

/**
 * Call Gemini for plan generation (structured)
 */
export async function callPlanGeneration(intakeData, systemPrompt) {
  const messages = [
    {
      role: "user",
      content: `Here is the intake data:\n\n${JSON.stringify(
        intakeData,
        null,
        2
      )}\n\nPlease create a comprehensive year plan.`,
    },
  ];

  return callGemini(messages, systemPrompt, {
    temperature: 0.7, // More structured/consistent
    maxTokens: 8000, // Need more tokens for full plan
  });
}

/**
 * Call Gemini for daily coaching (encouraging, concise)
 */
export async function callDailyCoach(context, userMessage, systemPrompt) {
  const messages = [
    {
      role: "user",
      content: `Context:\n${JSON.stringify(
        context,
        null,
        2
      )}\n\nUser message: ${userMessage}`,
    },
  ];

  return callGemini(messages, systemPrompt, {
    temperature: 0.8,
    maxTokens: 500, // Keep it concise
  });
}

/**
 * Call Gemini for plan adaptation (analytical)
 */
export async function callAdaptation(
  currentPlan,
  completionHistory,
  reason,
  systemPrompt
) {
  const messages = [
    {
      role: "user",
      content: `Current plan:\n${JSON.stringify(
        currentPlan,
        null,
        2
      )}\n\nCompletion history:\n${JSON.stringify(
        completionHistory,
        null,
        2
      )}\n\nReason for adaptation: ${reason}\n\nPlease suggest adaptations.`,
    },
  ];

  return callGemini(messages, systemPrompt, {
    temperature: 0.7,
    maxTokens: 3000,
  });
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function extractJSON(text) {
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

/**
 * Check if API key is valid
 */
export async function validateApiKey(apiKey) {
  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Test" }] }],
        }),
      }
    );

    const data = await response.json();
    return !data.error;
  } catch {
    return false;
  }
}

export default {
  callGemini,
  callIntakeInterview,
  callPlanGeneration,
  callDailyCoach,
  callAdaptation,
  extractJSON,
  validateApiKey,
};
