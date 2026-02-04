// lib/mockAI.js
// Mock AI responses for development (NO API KEY NEEDED)

const INTAKE_RESPONSES = {
  0: "Hey there! I'm so glad you're here. Before we build your year plan, I need to really understand you—your dreams, your reality, your constraints. This'll take about 15-20 minutes. Ready to dive in?",

  1: "Let's start with the big picture. Imagine it's December 2026, and you're genuinely proud of your year. What happened? Tell me about your wins in career, health, money, relationships, learning, spirituality—whatever matters to you. Don't filter, just dream out loud.",

  2: "Beautiful. Now let's ground this in reality. Walk me through a typical week. What's your work schedule? What are your non-negotiable commitments?",

  3: "When do you have the most energy? Are you a morning person or night owl? When do you typically crash during the day?",

  4: "Got it. Let's talk career. What does progress look like for you? Promotion? New job? Building specific skills? Be as specific as you can.",

  5: "And health - what's your relationship with exercise and wellness right now? Are we building from zero or getting back on track?",

  6: "Perfect. What about learning? Is there a skill, language, or subject you want to tackle this year? And realistically, how much time can you give it weekly?",

  7: "Money goals - what are we aiming for? Savings target? Debt payoff? What's your current monthly surplus or deficit?",

  8: "This is important: what usually derails your plans? Be brutally honest—is it energy, discipline, unexpected chaos, lack of clarity?",

  9: "If you could only achieve 3 things this year and had to drop everything else, which 3 would you choose? This helps me understand your true priorities.",

  10: "Last question: Do you want me to push you hard, or do you need me to help you be gentle with yourself? What kind of coaching style actually works for you?",
};

// Track conversation state
const conversationState = new Map();

export async function mockIntakeInterview(userId, userMessage, conversationId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Get or create conversation state
  let state = conversationState.get(conversationId || userId) || {
    questionIndex: 0,
    messages: [],
    userData: {},
  };

  // Add user message
  state.messages.push({ role: "user", content: userMessage });

  // Increment question index
  state.questionIndex++;

  let aiResponse;
  let intakeComplete = false;
  let intakeData = null;

  // Return appropriate response
  if (state.questionIndex <= 10) {
    aiResponse = INTAKE_RESPONSES[state.questionIndex];
  } else if (state.questionIndex === 11) {
    // After question 10, summarize
    aiResponse = `Perfect! Here's what I captured:\n\nYou want to achieve meaningful growth across career, health, and personal development. You're working full-time with limited energy, and you need a plan that respects your real constraints.\n\nYour top priorities are clear, and I understand your coaching style preference.\n\nDid I capture this right? Anything to add or correct?`;
  } else {
    // User confirmed, complete intake
    intakeComplete = true;
    intakeData = generateMockIntakeData(state.messages);
    aiResponse = `Perfect. I have everything I need to build your year plan. Let me process this...`;
  }

  // Add AI response
  state.messages.push({ role: "assistant", content: aiResponse });

  // Store updated state
  conversationState.set(conversationId || userId, state);

  return {
    aiResponse,
    intakeComplete,
    intakeData,
    questionCount: state.questionIndex,
    conversationId: conversationId || userId,
  };
}

export async function mockPlanGeneration(intakeData) {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    year: 2025,
    vision: "The year I became someone who shows up for myself daily",
    quarters: [
      {
        quarter: 1,
        theme: "Foundation & Rhythm",
        focus_areas: ["Morning routine", "Health basics", "Career clarity"],
        months: [
          {
            month: 1,
            name: "January",
            primary_focus: "Morning Routine",
            supporting_focus: ["Sleep", "Prayer"],
            milestones: ["30-day wake streak", "Establish pre-work ritual"],
            weeks: [
              {
                week: 1,
                theme: "Just show up",
                focus_rotation: {
                  monday: ["health", "spirituality"],
                  tuesday: ["career", "learning"],
                  wednesday: ["health", "finance"],
                  thursday: ["career", "spirituality"],
                  friday: ["learning", "health"],
                  saturday: ["finance", "lifestyle"],
                  sunday: ["rest", "reflection"],
                },
                sample_tasks: {
                  monday: [
                    {
                      title: "Wake at 6am",
                      area: "health",
                      duration: 0,
                      time: "6:00 AM",
                      why: "Anchor for your morning routine",
                      priority: 1,
                    },
                    {
                      title: "Morning prayer/meditation (10 min)",
                      area: "spirituality",
                      duration: 10,
                      time: "6:05 AM",
                      why: "Spiritual foundation for the day",
                    },
                    {
                      title: "15-min walk outside (no phone)",
                      area: "health",
                      duration: 15,
                      time: "6:20 AM",
                      why: "Movement + sunlight = energy",
                    },
                  ],
                  tuesday: [
                    {
                      title: "Review 1 job posting",
                      area: "career",
                      duration: 20,
                      time: "Evening",
                      why: "Build career momentum",
                    },
                    {
                      title: "15-min language practice",
                      area: "learning",
                      duration: 15,
                      time: "Evening",
                      why: "Consistency compounds",
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

function generateMockIntakeData(messages) {
  // Extract info from user messages (simplified)
  return {
    intake_complete: true,
    aspirations: {
      career: "Career growth and skill development",
      health: "Build consistent exercise habits",
      finance: "Save money and invest",
      learning: "Learn new skills",
      spirituality: "Daily spiritual practice",
      lifestyle: "Better work-life balance",
    },
    constraints: {
      work_schedule: "9-5 weekdays with commute",
      energy_patterns: "Morning person, crashes afternoon",
      commitments: "Family time on weekends",
      available_daily_time: "2-3 hours on weekdays, 6-8 hours weekends",
    },
    derailment_factors: ["work stress", "lack of energy", "unexpected events"],
    top_3_priorities: ["Career growth", "Health habits", "Financial stability"],
    coaching_style: "Firm but compassionate - push me but recognize limits",
  };
}

const mockAIModule = {
  mockIntakeInterview,
  mockPlanGeneration,
};

export default mockAIModule;
