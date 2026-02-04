"use client";

import Link from "next/link";
import {
  Sparkles,
  Calendar,
  TrendingUp,
  MessageCircle,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">
              Year Compass AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Life Planning
          </div>

          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Your Yearly Goals
            <br />
            Into Daily Actions That Stick
          </h1>

          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            An AI life coach that respects your real life. No more overwhelming
            plans.
            <br />
            Just consistent progress toward what actually matters.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start Planning Your Year
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Free to start • No credit card required
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Smart Yearly Planning"
            description="AI understands your goals and constraints, creating a realistic roadmap"
          />
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="Daily Task Breakdown"
            description="Big goals become simple 15-minute daily tasks that actually fit your life"
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Adapts When Life Happens"
            description="AI adjusts your plan when you miss tasks or priorities change"
          />
          <FeatureCard
            icon={<MessageCircle className="w-6 h-6" />}
            title="AI Coach That Gets You"
            description="Encouraging, realistic guidance. Not a drill sergeant, a wise friend"
          />
        </div>

        {/* How It Works */}
        <div className="mt-32 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>

          <div className="space-y-12">
            <Step
              number="1"
              title="Tell Us About Your Year"
              description="15-minute conversation where the AI learns your goals, constraints, and real-life limits"
            />
            <Step
              number="2"
              title="Get Your Custom Plan"
              description="AI creates a quarterly roadmap with daily tasks that respect your energy and schedule"
            />
            <Step
              number="3"
              title="Show Up Daily"
              description="See 3 simple tasks each morning. Complete them. Build momentum. Watch your year transform."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Make This Your Year?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join people who are building better lives, one day at a time
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            <Sparkles className="w-5 h-5" />
            Start Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-600 text-sm">
          <p>© 2025 Year Compass AI. Built with care.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="flex items-start gap-6">
      <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
