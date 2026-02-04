"use client";

import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { updateUserProfile } from "@/lib/supabase";

export default function SkipOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSkip = async () => {
    if (!user) return;

    try {
      // Call API to create fake intake (bypasses RLS)
      const response = await fetch("/api/intake/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Mark onboarding complete
      await updateUserProfile(user.id, { onboarding_completed: true });

      // Redirect to plan generation
      router.push("/plan-generation");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to skip onboarding: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please sign in first
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Skip Onboarding (Testing)</h1>
        <p className="text-gray-600 mb-6">
          This will create fake intake data and jump straight to plan
          generation. Only use this for testing!
        </p>
        <button
          onClick={handleSkip}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Skip to Plan Generation
        </button>
        <button
          onClick={() => router.push("/onboarding")}
          className="w-full mt-3 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Do Proper Onboarding
        </button>
      </div>
    </div>
  );
}
