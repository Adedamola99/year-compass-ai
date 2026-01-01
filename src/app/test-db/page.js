"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function TestDB() {
  const [status, setStatus] = useState("Testing...");

  useEffect(() => {
    async function test() {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("count");

        if (error) throw error;
        setStatus("✅ Database connected!");
      } catch (err) {
        setStatus(`❌ Error: ${err.message}`);
      }
    }
    test();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-2xl">{status}</div>
    </div>
  );
}
