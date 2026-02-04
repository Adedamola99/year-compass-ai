// app/api/tasks/route.js
// CRUD operations for daily tasks

import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// GET today's tasks
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get tasks for the date
    const { data: tasks, error } = await supabaseAdmin
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("order_index", { ascending: true });

    if (error) throw error;

    // Get streaks
    const { data: streaks, error: streaksError } = await supabaseAdmin
      .from("streaks")
      .select("*")
      .eq("user_id", userId);

    if (streaksError) throw streaksError;

    // Calculate completion stats
    const completedCount = tasks?.filter((t) => t.completed).length || 0;
    const totalCount = tasks?.length || 0;

    // Get AI encouragement message based on progress
    const message = generateEncouragementMessage(
      completedCount,
      totalCount,
      streaks
    );

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
      stats: {
        completed: completedCount,
        total: totalCount,
        completionRate:
          totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      },
      streaks: streaks || [],
      message,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Complete a task
export async function POST(request) {
  try {
    const body = await request.json();
    const { taskId, userId, completed } = body;

    if (!taskId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update task
    const { data: task, error } = await supabaseAdmin
      .from("daily_tasks")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", taskId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    // Update streaks if completing a task
    if (completed) {
      await updateStreaks(userId, task.date);
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Complete task error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper: Update streaks
async function updateStreaks(userId, date) {
  try {
    // Get all tasks for today
    const { data: tasks } = await supabaseAdmin
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date);

    const allCompleted = tasks?.every((t) => t.completed) || false;

    if (allCompleted && tasks && tasks.length > 0) {
      // Get current streak
      const { data: existingStreak } = await supabaseAdmin
        .from("streaks")
        .select("*")
        .eq("user_id", userId)
        .eq("streak_type", "daily_completion")
        .single();

      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newCount = 1;
      if (existingStreak && existingStreak.last_updated === yesterdayStr) {
        newCount = existingStreak.current_count + 1;
      }

      // Update or insert streak
      await supabaseAdmin.from("streaks").upsert(
        {
          user_id: userId,
          streak_type: "daily_completion",
          current_count: newCount,
          longest_count: Math.max(existingStreak?.longest_count || 0, newCount),
          last_updated: date,
        },
        {
          onConflict: "user_id,streak_type",
        }
      );
    }
  } catch (error) {
    console.error("Error updating streaks:", error);
  }
}

// Helper: Generate encouragement message
function generateEncouragementMessage(completed, total, streaks) {
  const dailyStreak = streaks?.find(
    (s) => s.streak_type === "daily_completion"
  );
  const streakCount = dailyStreak?.current_count || 0;

  if (completed === 0 && total > 0) {
    const messages = [
      "Hey there! Ready to make today count?",
      "Let's start with just one task. You've got this.",
      "Every journey starts with a single step. Pick one.",
      "Today's a fresh start. Which task feels easiest?",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  if (completed === total && total > 0) {
    if (streakCount > 7) {
      return `🔥 ${streakCount} days strong! You're building something real here.`;
    } else if (streakCount > 0) {
      return `✅ All done! That's ${streakCount} ${
        streakCount === 1 ? "day" : "days"
      } in a row. Keep it going!`;
    } else {
      return "✅ All tasks done! That's how you build momentum.";
    }
  }

  if (completed > 0 && completed < total) {
    return `Nice! ${completed}/${total} done. Finish strong?`;
  }

  return "Ready when you are. One task at a time.";
}

// PATCH - Reschedule task
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { taskId, userId, newDate } = body;

    if (!taskId || !userId || !newDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabaseAdmin
      .from("daily_tasks")
      .update({ date: newDate })
      .eq("id", taskId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Reschedule task error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove task
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const userId = searchParams.get("userId");

    if (!taskId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("daily_tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
