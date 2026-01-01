"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { updateUserProfile } from "@/lib/supabase";

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [intakeData, setIntakeData] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, authLoading, router]);

  // Initialize conversation
  useEffect(() => {
    if (user && messages.length === 0) {
      const initMessage = {
        role: "assistant",
        content:
          "Hey there! I'm so glad you're here. Before we build your year plan, I need to really understand you—your dreams, your reality, your constraints. This'll take about 15-20 minutes. Ready to dive in?",
      };
      setMessages([initMessage]);
    }
  }, [user, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!userInput.trim() || isLoading || !user) return;

    const userMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userMessage: userInput,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get response");
      }

      // Set conversation ID on first response
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.aiResponse,
        },
      ]);

      setQuestionCount(data.questionCount || 0);

      // Check if intake is complete
      if (data.intakeComplete && data.intakeData) {
        setIntakeData(data.intakeData);
        setIsComplete(true);

        // Mark onboarding as complete
        await updateUserProfile(user.id, { onboarding_completed: true });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again.",
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContinue = () => {
    router.push("/plan-generation");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Completion Screen
  if (isComplete && intakeData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <h1 className="text-3xl font-bold text-gray-800">
                Intake Complete!
              </h1>
            </div>

            <p className="text-gray-600 mb-6">
              Amazing work. I now have everything I need to build your
              personalized year plan. Here&apos;s what I captured:
            </p>

            <div className="space-y-6">
              <Section title="🎯 Your Aspirations">
                {Object.entries(intakeData.aspirations).map(
                  ([key, value]) =>
                    value && <Item key={key} label={key} value={value} />
                )}
              </Section>

              <Section title="⏰ Your Constraints">
                <Item
                  label="Work Schedule"
                  value={intakeData.constraints.work_schedule}
                />
                <Item
                  label="Energy Patterns"
                  value={intakeData.constraints.energy_patterns}
                />
                <Item
                  label="Available Time"
                  value={intakeData.constraints.available_daily_time}
                />
              </Section>

              <Section title="⚡ Top 3 Priorities">
                <ol className="list-decimal list-inside space-y-2">
                  {intakeData.top_3_priorities.map((priority, idx) => (
                    <li key={idx} className="text-gray-700">
                      {priority}
                    </li>
                  ))}
                </ol>
              </Section>

              <Section title="🎓 Coaching Style">
                <p className="text-gray-700">{intakeData.coaching_style}</p>
              </Section>
            </div>

            <button
              onClick={handleContinue}
              className="mt-8 w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate My Year Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interview Screen
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">
                Year Compass AI
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Question {questionCount}/10
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white shadow-lg p-6 h-125 overflow-y-auto">
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-6 py-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          <div className="flex gap-3">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              disabled={isLoading}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
              rows={3}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !userInput.trim()}
              className="bg-indigo-600 text-white px-6 rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const Item = ({ label, value }) => (
  <div className="pl-4 border-l-2 border-indigo-200">
    <span className="text-sm font-medium text-gray-600 capitalize">
      {label}:
    </span>
    <p className="text-gray-700 mt-1">{value}</p>
  </div>
);
