"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  MoreVertical,
  Calendar,
  Trash2,
} from "lucide-react";

export default function TaskItem({ task, onComplete, onReschedule, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleComplete = () => {
    onComplete(task.id, !task.completed);
  };

  const handleReschedule = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    onReschedule(task.id, tomorrowStr);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to remove this task?")) {
      onDelete(task.id);
    }
    setShowMenu(false);
  };

  const areaColors = {
    health: "bg-green-100 text-green-700 border-green-200",
    career: "bg-blue-100 text-blue-700 border-blue-200",
    finance: "bg-yellow-100 text-yellow-700 border-yellow-200",
    learning: "bg-purple-100 text-purple-700 border-purple-200",
    spirituality: "bg-indigo-100 text-indigo-700 border-indigo-200",
    lifestyle: "bg-pink-100 text-pink-700 border-pink-200",
  };

  const areaColor =
    areaColors[task.area] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div
      className={`bg-white rounded-xl border-2 p-5 transition-all hover:shadow-md relative ${
        task.completed ? "opacity-60 border-gray-200" : "border-gray-200"
      } ${task.priority === 1 ? "ring-2 ring-indigo-500 ring-opacity-50" : ""}`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          className={`flex-shrink-0 mt-1 transition-all ${
            task.completed
              ? "text-green-500"
              : "text-gray-400 hover:text-indigo-600"
          }`}
        >
          {task.completed ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Priority Badge */}
          {task.priority === 1 && !task.completed && (
            <div className="flex items-center gap-1 text-xs font-medium text-indigo-600 mb-2">
              <Sparkles className="w-3 h-3" />
              PRIORITY
            </div>
          )}

          {/* Title */}
          <h3
            className={`text-lg font-semibold mb-1 ${
              task.completed ? "line-through text-gray-500" : "text-gray-900"
            }`}
          >
            {task.title}
          </h3>

          {/* Description/Why */}
          {task.why && !task.completed && (
            <p className="text-sm text-gray-600 mb-3">{task.why}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* Area Tag */}
            <span
              className={`px-3 py-1 rounded-full border font-medium ${areaColor}`}
            >
              {task.area}
            </span>

            {/* Time Suggestion */}
            {task.time_suggestion && (
              <span className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                {task.time_suggestion}
              </span>
            )}

            {/* Duration */}
            {task.duration_minutes > 0 && (
              <span className="text-gray-600">{task.duration_minutes} min</span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                <button
                  onClick={handleReschedule}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Calendar className="w-4 h-4" />
                  Move to tomorrow
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Completion Timestamp */}
      {task.completed && task.completed_at && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          Completed{" "}
          {new Date(task.completed_at).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}
