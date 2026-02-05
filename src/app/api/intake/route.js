// app/api/intake/route.js
// AI-powered intake interview - No mock code

import { callIntakeInterview, extractJSON } from "@/lib/ai-client";
import { getSystemPrompt } from "@/lib/prompts";
import { saveIntakeResponseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// In-memory conversation storage (resets on server restart)
const conversations = new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, userMessage, conversationId } = body;

    if (!userId || !userMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log("💬 User message:", userMessage);

    // Get or create conversation ID
    const convId = conversationId || `intake_${userId}_${Date.now()}`;

    // Get existing messages or create new
    const existingMessages = conversations.get(convId) || [];

    // Build conversation history
    const messages = [
      ...existingMessages,
      { role: "user", content: userMessage },
    ];

    console.log(
      "🤖 Calling AI... (conversation has",
      messages.length,
      "messages)",
    );

    // Call AI
    const systemPrompt = getSystemPrompt("intake");
    const aiResponse = await callIntakeInterview(messages, systemPrompt);

    console.log("✅ AI responded");

    // Add AI response
    messages.push({ role: "assistant", content: aiResponse });

    // Store in memory
    conversations.set(convId, messages);

    // Check if intake is complete
    let intakeComplete = false;
    let intakeData = null;

    if (aiResponse.includes('"intake_complete": true')) {
      try {
        console.log("🎯 Intake completion detected! Extracting JSON...");

        intakeData = extractJSON(aiResponse);

        // Validate required fields
        if (!intakeData.aspirations || !intakeData.constraints) {
          throw new Error("Missing required fields in intake data");
        }

        intakeComplete = true;

        console.log("✅ Intake data extracted:", {
          career: intakeData.aspirations.career ? "✓" : "✗",
          health: intakeData.aspirations.health ? "✓" : "✗",
          finance: intakeData.aspirations.finance ? "✓" : "✗",
          constraints: intakeData.constraints.work_schedule ? "✓" : "✗",
          priorities: intakeData.top_3_priorities?.length || 0,
        });

        // Save to database
        console.log("💾 Saving intake to database...");
        await saveIntakeResponseAdmin(userId, intakeData);

        console.log("✅ Intake saved successfully!");

        // Clear conversation from memory
        conversations.delete(convId);
      } catch (error) {
        console.error("❌ Failed to parse or save intake data:", error);
        console.error(
          "AI Response (first 500 chars):",
          aiResponse.substring(0, 500),
        );

        // Return error to frontend
        return NextResponse.json(
          {
            error:
              "The AI didn't format the response correctly. Let me try asking again.",
            details: error.message,
            suggestion:
              "Please say 'yes' or 'ready' to confirm your information.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      conversationId: convId,
      aiResponse,
      intakeComplete,
      intakeData,
      questionCount: Math.floor(
        messages.filter((m) => m.role === "user").length,
      ),
    });
  } catch (error) {
    console.error("❌ Intake API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      conversation: null,
    });
  } catch (error) {
    console.error("Get intake error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
