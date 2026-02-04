// app/api/intake/skip/route.js
// Skip intake with fake data (for testing)

import { saveIntakeResponseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Create fake intake data
    const fakeIntake = {
      aspirations: {
        career: "Get promoted and build new skills",
        health: "Exercise 3x per week and eat better",
        finance: "Save $10,000 this year",
        learning: "Learn Spanish to B1 level",
        spirituality: "Daily meditation practice",
        lifestyle: "Better work-life balance",
      },
      constraints: {
        work_schedule: "9-6 Monday to Friday with 30-min commute",
        energy_patterns: "Morning person, crash around 3pm, second wind at 7pm",
        commitments: "Family dinner on Sundays",
        available_daily_time: "2-3 hours on weekdays, 6-8 hours on weekends",
      },
      derailment_factors: [
        "work stress",
        "lack of motivation",
        "unexpected events",
      ],
      top_3_priorities: [
        "Career growth",
        "Health improvement",
        "Financial security",
      ],
      coaching_style:
        "Firm but compassionate - push me but recognize when I'm struggling",
    };

    // Save using admin client (bypasses RLS)
    await saveIntakeResponseAdmin(userId, fakeIntake);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Skip intake error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
