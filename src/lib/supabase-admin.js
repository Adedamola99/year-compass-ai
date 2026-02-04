// lib/supabase-admin.js
// Server-side Supabase client with admin privileges (bypasses RLS)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase service role key not configured - using anon key");
}

// Create admin client that bypasses RLS
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Admin versions of database operations (bypass RLS)
export async function saveIntakeResponseAdmin(userId, intakeData) {
  // Check if intake already exists for this user
  const { data: existingIntake } = await supabaseAdmin
    .from("intake_responses")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingIntake) {
    // Update existing intake
    const { data, error } = await supabaseAdmin
      .from("intake_responses")
      .update({
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
      })
      .eq("id", existingIntake.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create new intake
  const { data, error } = await supabaseAdmin
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
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveYearPlanAdmin(
  userId,
  intakeId,
  year,
  planData,
  vision
) {
  // First, check if a plan already exists for this user/year
  const { data: existingPlan } = await supabaseAdmin
    .from("year_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("is_active", true)
    .single();

  if (existingPlan) {
    // Update existing plan instead of creating new one
    const { data, error } = await supabaseAdmin
      .from("year_plans")
      .update({
        plan_data: planData,
        vision: vision,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingPlan.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create new plan if none exists
  const { data, error } = await supabaseAdmin
    .from("year_plans")
    .insert({
      user_id: userId,
      intake_id: intakeId,
      year,
      vision,
      plan_data: planData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createDailyTasksAdmin(userId, planId, date, tasks) {
  // First, delete any existing tasks for this date (in case of regeneration)
  await supabaseAdmin
    .from("daily_tasks")
    .delete()
    .eq("user_id", userId)
    .eq("date", date);

  const tasksWithMeta = tasks.map((task, index) => ({
    user_id: userId,
    plan_id: planId,
    date,
    title: task.title,
    description: task.description || null,
    area: task.area,
    duration_minutes: task.duration,
    time_suggestion: task.time,
    why: task.why,
    priority: task.priority || 0,
    order_index: index,
  }));

  const { data, error } = await supabaseAdmin
    .from("daily_tasks")
    .insert(tasksWithMeta)
    .select();

  if (error) throw error;
  return data;
}

export default supabaseAdmin;
