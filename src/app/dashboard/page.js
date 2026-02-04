"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import TaskItem from "@/components/ui/dashboard/TaskItem";
import {
  Sparkles,
  Loader2,
  TrendingUp,
  Flame,
  Calendar,
  MessageCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading, profile } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    completed: 0,
    total: 0,
    completionRate: 0,
  });
  const [streaks, setStreaks] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated or onboarding not complete
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/signin");
      } else if (!profile?.onboarding_completed) {
        router.push("/onboarding");
      }
    }
  }, [user, authLoading, profile, router]);

  // Load today's tasks
  useEffect(() => {
    if (user && profile?.onboarding_completed) {
      loadTasks();
    }
  }, [user, profile]);

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks);
        setStats(data.stats);
        setStreaks(data.streaks);
        setMessage(data.message);
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId, completed) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, userId: user.id, completed }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state optimistically
        setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)));

        // Reload to get updated stats and streaks
        loadTasks();
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleReschedule = async (taskId, newDate) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, userId: user.id, newDate }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from current view
        setTasks(tasks.filter((t) => t.id !== taskId));
      }
    } catch (error) {
      console.error("Failed to reschedule task:", error);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      const response = await fetch(
        `/api/tasks?taskId=${taskId}&userId=${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        setTasks(tasks.filter((t) => t.id !== taskId));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const dailyStreak = streaks.find((s) => s.streak_type === "daily_completion");
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Year Compass</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Calendar className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MessageCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Date & Greeting */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Calendar className="w-4 h-4" />
            {today}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Today's Focus
          </h2>
          <p className="text-gray-600 text-lg">{message}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Completion Rate */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Today</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.completed}/{stats.total}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {Math.round(stats.completionRate)}% complete
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Streak</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {dailyStreak?.current_count || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">days in a row</div>
          </div>

          {/* Record */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Record</span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {dailyStreak?.longest_count || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">best streak</div>
          </div>
        </div>

        {/* Tasks */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tasks for today
            </h3>
            <p className="text-gray-600 mb-6">
              Your daily tasks will appear here. Check back tomorrow!
            </p>
            <button
              onClick={() => router.push("/roadmap")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View Your Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onReschedule={handleReschedule}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {tasks.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
              Too much today?
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
              Chat with coach
            </button>
            <button
              onClick={() => router.push("/roadmap")}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              View roadmap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
