"use client";

import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { getIntakeResponse, getActiveYearPlan } from "@/lib/supabase";

export default function DebugPage() {
  const { user, loading } = useAuth();
  const [intake, setIntake] = useState(null);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const intakeData = await getIntakeResponse(user.id);
        setIntake(intakeData);

        const planData = await getActiveYearPlan(user.id);
        setPlan(planData);
      } catch (err) {
        setError(err.message);
      }
    }

    loadData();
  }, [user]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">Not logged in</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Info</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">User Info</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* Intake Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Intake Response</h2>
          {intake ? (
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
              {JSON.stringify(intake, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No intake data found</p>
          )}
        </div>

        {/* Plan Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Year Plan</h2>
          {plan ? (
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
              {JSON.stringify(plan, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No plan data found</p>
          )}
        </div>
      </div>
    </div>
  );
}
