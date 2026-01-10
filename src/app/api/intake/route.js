// app/api/intake/route.js
// API endpoint for intake interview

import { callIntakeInterview, extractJSON } from "@/lib/gemini";
import { mockIntakeInterview } from "@/lib/mockAI"; // MOCK MODE
import { getSystemPrompt } from "@/lib/prompts";
import {
  saveIntakeResponse,
  saveConversation,
  updateConversation,
  getActiveConversation,
} from "@/lib/supabase";
import { NextResponse } from "next/server";

// Toggle this to switch between mock and real AI
const USE_MOCK = true; // Set to false when you have a working API

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, userMessage, conversationId } = body;

    if (!userId || !userMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // USE MOCK MODE (no API key needed!)
    if (USE_MOCK) {
      const result = await mockIntakeInterview(
        userId,
        userMessage,
        conversationId
      );

      // Save intake data when complete
      if (result.intakeComplete && result.intakeData) {
        // Transform mock data to match database schema
        const dbIntakeData = {
          aspirations: result.intakeData.aspirations,
          constraints: result.intakeData.constraints,
          derailment_factors: result.intakeData.derailment_factors,
          top_3_priorities: result.intakeData.top_3_priorities,
          coaching_style: result.intakeData.coaching_style,
        };
        await saveIntakeResponse(userId, dbIntakeData);
      }

      return NextResponse.json({
        success: true,
        conversationId: result.conversationId,
        aiResponse: result.aiResponse,
        intakeComplete: result.intakeComplete,
        intakeData: result.intakeData,
        questionCount: result.questionCount,
      });
    }

    // REAL AI MODE (requires API key)

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await getActiveConversation(userId, "intake");
      if (!conversation || conversation.id !== conversationId) {
        return NextResponse.json(
          { error: "Invalid conversation" },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation
      conversation = await saveConversation(userId, "intake", []);
    }

    // Build conversation history
    const messages = [
      ...conversation.messages,
      { role: "user", content: userMessage },
    ];

    // Call Gemini
    const systemPrompt = getSystemPrompt("intake");
    const aiResponse = await callIntakeInterview(messages, systemPrompt);

    // Add AI response to messages
    messages.push({ role: "assistant", content: aiResponse });

    // Update conversation
    await updateConversation(conversation.id, messages);

    // Check if intake is complete (AI returned JSON)
    let intakeComplete = false;
    let intakeData = null;

    if (aiResponse.includes('"intake_complete": true')) {
      try {
        intakeData = extractJSON(aiResponse);
        intakeComplete = true;

        // Save intake response to database
        await saveIntakeResponse(userId, intakeData);
      } catch (error) {
        console.error("Failed to parse intake data:", error);
      }
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      aiResponse,
      intakeComplete,
      intakeData,
      questionCount: Math.floor(
        messages.filter((m) => m.role === "user").length
      ),
    });
  } catch (error) {
    console.error("Intake API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Get conversation history
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const conversation = await getActiveConversation(userId, "intake");

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get intake error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
