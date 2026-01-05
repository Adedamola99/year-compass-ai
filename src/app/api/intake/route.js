// app/api/intake/route.js
// API endpoint for intake interview

import { callIntakeInterview, extractJSON } from "@/lib/gemini";
import { getSystemPrompt } from "@/lib/prompts";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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

    // Create Supabase client with user session
    const cookieStore = cookies();
    const supabaseClient = supabase;

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data, error } = await supabaseClient
        .from("ai_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Invalid conversation" },
          { status: 404 }
        );
      }
      conversation = data;
    } else {
      // Create new conversation
      const { data, error } = await supabaseClient
        .from("ai_conversations")
        .insert({
          user_id: userId,
          conversation_type: "intake",
          messages: [],
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }
      conversation = data;
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
    const { error: updateError } = await supabaseClient
      .from("ai_conversations")
      .update({
        messages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    if (updateError) {
      console.error("Error updating conversation:", updateError);
    }

    // Check if intake is complete (AI returned JSON)
    let intakeComplete = false;
    let intakeData = null;

    if (aiResponse.includes('"intake_complete": true')) {
      try {
        intakeData = extractJSON(aiResponse);
        intakeComplete = true;

        // Save intake response to database
        const { error: intakeError } = await supabaseClient
          .from("intake_responses")
          .insert({
            user_id: userId,
            completed_at: new Date().toISOString(),
            career_goals: intakeData.aspirations.career,
            health_goals: intakeData.aspirations.health,
            finance_goals: intakeData.aspirations.finance,
            learning_goals: intakeData.aspirations.learning,
            spirituality_goals: intakeData.aspirations.spirituality,
            lifestyle_goals: intakeData.aspirations.lifestyle,
            work_schedule: intakeData.constraints.work_schedule,
            energy_patterns: intakeData.constraints.energy_patterns,
            existing_commitments: intakeData.constraints.commitments,
            available_daily_time: intakeData.constraints.available_daily_time,
            derailment_factors: intakeData.derailment_factors,
            top_priorities: intakeData.top_3_priorities,
            coaching_style: intakeData.coaching_style,
          });

        if (intakeError) {
          console.error("Error saving intake:", intakeError);
        }
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

    const { data: conversation, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", userId)
      .eq("conversation_type", "intake")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get intake error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
