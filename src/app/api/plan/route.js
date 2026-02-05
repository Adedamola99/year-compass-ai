// app/api/plan/route.js
// Generate yearly plan from intake data

import { callPlanGeneration, extractJSON } from "@/lib/ai-client";
import { getSystemPrompt } from "@/lib/prompts";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { saveYearPlanAdmin, createDailyTasksAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    console.log("🔍 Looking for intake for user:", userId);

    // Get intake response using ADMIN client
    const { data: intake, error: intakeError } = await supabaseAdmin
      .from("intake_responses")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (intakeError || !intake) {
      console.error("❌ No intake found:", intakeError);
      return NextResponse.json(
        {
          error: "No intake response found. Please complete onboarding first.",
        },
        { status: 404 },
      );
    }

    console.log("✅ Intake found:", intake.id);

    // Build intake data object for AI
    const intakeData = {
      aspirations: {
        career: intake.career_goals || null,
        health: intake.health_goals || null,
        finance: intake.finance_goals || null,
        learning: intake.learning_goals || null,
        spirituality: intake.spirituality_goals || null,
        lifestyle: intake.lifestyle_goals || null,
      },
      constraints: {
        work_schedule: intake.work_schedule || null,
        energy_patterns: intake.energy_patterns || null,
        commitments: intake.existing_commitments || null,
        available_daily_time: intake.available_daily_time || null,
      },
      derailment_factors: intake.derailment_factors || [],
      top_3_priorities: intake.top_priorities || [],
      coaching_style: intake.coaching_style || null,
    };

    console.log("🤖 Calling AI to generate plan...");

    // Call AI to generate plan
    const systemPrompt = getSystemPrompt("planGeneration");
    const aiResponse = await callPlanGeneration(intakeData, systemPrompt);

    console.log(
      "✅ AI response received (length:",
      aiResponse.length,
      "chars)",
    );

    // Extract JSON plan
    let planData;
    try {
      planData = extractJSON(aiResponse);

      // Validate plan structure
      if (
        !planData.quarters ||
        !Array.isArray(planData.quarters) ||
        planData.quarters.length === 0
      ) {
        throw new Error("Invalid plan structure: missing or empty quarters");
      }

      console.log("✅ Plan validated:", {
        quarters: planData.quarters.length,
        vision: planData.vision ? "✓" : "✗",
        firstMonth: planData.quarters[0]?.months?.[0]?.name || "missing",
      });
    } catch (error) {
      console.error("❌ Failed to parse plan JSON:", error);
      console.error(
        "AI Response (first 1000 chars):",
        aiResponse.substring(0, 1000),
      );

      return NextResponse.json(
        {
          error:
            "Failed to generate valid plan. The AI response wasn't formatted correctly.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    console.log("📋 Plan data extracted, saving to database...");

    // Save plan to database using admin client
    const year = planData.year || new Date().getFullYear();
    const savedPlan = await saveYearPlanAdmin(
      userId,
      intake.id,
      year,
      planData,
      planData.vision,
    );

    console.log("✅ Plan saved:", savedPlan.id);

    // Generate first week's tasks
    const firstWeek = planData.quarters?.[0]?.months?.[0]?.weeks?.[0];
    if (firstWeek && firstWeek.sample_tasks) {
      const today = new Date().toISOString().split("T")[0];

      // Get day of week
      const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayOfWeek = daysOfWeek[new Date().getDay()];

      const todaysTasks = firstWeek.sample_tasks[dayOfWeek] || [];

      if (todaysTasks.length > 0) {
        console.log(`📝 Creating ${todaysTasks.length} tasks for today...`);
        await createDailyTasksAdmin(userId, savedPlan.id, today, todaysTasks);
        console.log("✅ Tasks created");
      }
    }

    return NextResponse.json({
      success: true,
      plan: savedPlan,
      vision: planData.vision,
    });
  } catch (error) {
    console.error("❌ Plan generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate plan" },
      { status: 500 },
    );
  }
}

// Get active plan
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const year = searchParams.get("year") || new Date().getFullYear();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: plan, error } = await supabaseAdmin
      .from("year_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("year", parseInt(year))
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (error || !plan) {
      return NextResponse.json({ error: "No plan found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Get plan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
