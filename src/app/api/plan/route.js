// app/api/plan/route.js
// Generate yearly plan from intake data

import { callPlanGeneration, extractJSON } from '@/lib/gemini';
import { mockPlanGeneration } from '@/lib/mockAI'; // MOCK MODE
import { getSystemPrompt } from '@/lib/prompts';
import { getIntakeResponse, saveYearPlan, createDailyTasks } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Toggle this to switch between mock and real AI
const USE_MOCK = true; // Set to false when you have a working API

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get intake response
    const intake = await getIntakeResponse(userId);
    if (!intake) {
      // If no intake in DB but using mock mode, create a mock intake
      if (USE_MOCK) {
        const mockIntake = {
          id: 'mock-intake-id',
          user_id: userId,
          career_goals: "Career growth and skill development",
          health_goals: "Build consistent exercise habits",
          finance_goals: "Save money and invest",
          learning_goals: "Learn new skills",
          spirituality_goals: "Daily spiritual practice",
          lifestyle_goals: "Better work-life balance",
          work_schedule: "9-5 weekdays with commute",
          energy_patterns: "Morning person, crashes afternoon",
          existing_commitments: "Family time on weekends",
          available_daily_time: "2-3 hours on weekdays, 6-8 hours weekends",
          derailment_factors: ["work stress", "lack of energy"],
          top_priorities: ["Career growth", "Health habits", "Financial stability"],
          coaching_style: "Firm but compassionate"
        };
        
        planData = await mockPlanGeneration(mockIntake);
      } else {
        return NextResponse.json(
          { error: 'No intake response found. Please complete onboarding first.' },
          { status: 404 }
        );
      }
    } else {

    } else {
      let planData;

      // USE MOCK MODE (instant, no API)
      if (USE_MOCK) {
        planData = await mockPlanGeneration(intake);
      } else {
      // REAL AI MODE
    const intakeData = {
      aspirations: {
        career: intake.career_goals,
        health: intake.health_goals,
        finance: intake.finance_goals,
        learning: intake.learning_goals,
        spirituality: intake.spirituality_goals,
        lifestyle: intake.lifestyle_goals
      },
      constraints: {
        work_schedule: intake.work_schedule,
        energy_patterns: intake.energy_patterns,
        commitments: intake.existing_commitments,
        available_daily_time: intake.available_daily_time
      },
      derailment_factors: intake.derailment_factors,
      top_3_priorities: intake.top_priorities,
      coaching_style: intake.coaching_style
      };

      // Call AI to generate plan
      const systemPrompt = getSystemPrompt('planGeneration');
      const aiResponse = await callPlanGeneration(intakeData, systemPrompt);

      // Extract JSON plan
      planData = extractJSON(aiResponse);
    }
    }

    // Save plan to database
    const year = planData.year || new Date().getFullYear();
    const savedPlan = await saveYearPlan(
      userId,
      intake.id,
      year,
      planData,
      planData.vision
    );

    // Generate first week's tasks
    const firstWeek = planData.quarters[0]?.months[0]?.weeks[0];
    if (firstWeek && firstWeek.sample_tasks) {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      
      const todaysTasks = firstWeek.sample_tasks[dayOfWeek] || [];
      
      if (todaysTasks.length > 0) {
        await createDailyTasks(userId, savedPlan.id, today, todaysTasks);
      }
    }

    return NextResponse.json({
      success: true,
      plan: savedPlan,
      vision: planData.vision
    });

  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate plan' },
      { status: 500 }
    );
  }
}

// Get active plan
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const year = searchParams.get('year') || new Date().getFullYear();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const { getActiveYearPlan } = await import('@/lib/supabase');
    const plan = await getActiveYearPlan(userId, parseInt(year));

    if (!plan) {
      return NextResponse.json(
        { error: 'No plan found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('Get plan error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}