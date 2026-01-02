// lib/supabase.js
// Supabase client configuration

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// AUTH HELPERS
// ============================================================================

// export async function signUp(email, password, name) {
//   const { data, error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       data: { name }, // Store name in user metadata
//     },
//   });

//   if (error) throw error;

//   // Create user profile
//   if (data.user) {
//     const { error: profileError } = await supabase
//       .from("user_profiles")
//       .insert({
//         id: data.user.id,
//         name,
//         email,
//         timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//       });

//     if (profileError) throw profileError;
//   }

//   return data;
// }

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }, // Store name in metadata for the trigger
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// ============================================================================
// USER PROFILE
// ============================================================================

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// INTAKE
// ============================================================================

export async function saveIntakeResponse(userId, intakeData) {
  const { data, error } = await supabase
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

export async function getIntakeResponse(userId) {
  const { data, error } = await supabase
    .from("intake_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data;
}

// ============================================================================
// YEAR PLANS
// ============================================================================

export async function saveYearPlan(userId, intakeId, year, planData, vision) {
  const { data, error } = await supabase
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

export async function getActiveYearPlan(
  userId,
  year = new Date().getFullYear()
) {
  const { data, error } = await supabase
    .from("year_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// ============================================================================
// DAILY TASKS
// ============================================================================

export async function getTodaysTasks(userId, date = null) {
  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("date", targetDate)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createDailyTasks(userId, planId, date, tasks) {
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

  const { data, error } = await supabase
    .from("daily_tasks")
    .insert(tasksWithMeta)
    .select();

  if (error) throw error;
  return data;
}

export async function completeTask(taskId, completed = true) {
  const updates = {
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("daily_tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function skipTask(taskId, reason) {
  const { data, error } = await supabase
    .from("daily_tasks")
    .update({
      skipped: true,
      skipped_reason: reason,
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// STREAKS
// ============================================================================

export async function getStreaks(userId) {
  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data || [];
}

export async function updateStreak(
  userId,
  streakType,
  currentCount,
  longestCount
) {
  const { data, error } = await supabase
    .from("streaks")
    .upsert(
      {
        user_id: userId,
        streak_type: streakType,
        current_count: currentCount,
        longest_count: Math.max(longestCount, currentCount),
        last_updated: new Date().toISOString().split("T")[0],
      },
      {
        onConflict: "user_id,streak_type",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// PROGRESS
// ============================================================================

export async function getProgressSnapshot(userId, date = null) {
  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("progress_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("date", targetDate)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createProgressSnapshot(userId, date, metrics) {
  const { data, error } = await supabase
    .from("progress_snapshots")
    .upsert(
      {
        user_id: userId,
        date,
        ...metrics,
      },
      {
        onConflict: "user_id,date",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// AI CONVERSATIONS
// ============================================================================

export async function saveConversation(
  userId,
  conversationType,
  messages,
  context = null
) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      conversation_type: conversationType,
      messages,
      context,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConversation(conversationId, messages) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .update({
      messages,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveConversation(userId, conversationType) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("conversation_type", conversationType)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export default supabase;
