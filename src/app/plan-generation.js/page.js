"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const LOADING_MESSAGES = [
  "Analyzing your goals and constraints...",
  "Creating quarterly themes...",
  "Breaking down into daily tasks...",
  "Optimizing for your energy patterns...",
  "Building your personalized roadmap...",
  "Almost there...",
];

export default function PlanGenerationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState("");

  // Cycle through loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = prev + 1;
        if (next < LOADING_MESSAGES.length) {
          setLoadingMessage(LOADING_MESSAGES[next]);
          return next;
        }
        return prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Generate plan
  useEffect(() => {
    if (!user) return;

    const generatePlan = async () => {
      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to generate plan");
        }

        // Success! Redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (err) {
        console.error("Plan generation error:", err);
        setError(err.message);
      }
    };

    generatePlan();
  }, [user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something Went Wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/onboarding")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="text-center">
            {/* Animated Icon */}
            <div className="mb-8">
              <Sparkles className="w-16 h-16 text-indigo-600 mx-auto animate-pulse" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Building Your Plan
            </h1>

            <p className="text-gray-600 mb-8">
              This takes about 30 seconds. I&aspos;m making sure this plan
              actually fits your life, not some fantasy version of it.
            </p>

            {/* Loading Animation */}
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
            </div>

            {/* Current Step */}
            <p className="text-indigo-600 font-medium animate-fade-in">
              {loadingMessage}
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          🎯 Your personalized yearly strategy is being created
        </p>
      </div>
    </div>
  );
}
