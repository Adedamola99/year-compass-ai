-- Year Compass AI - Complete Database Schema
-- Save as: supabase/migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER PROFILES
-- ============================================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INTAKE RESPONSES
-- ============================================================================
CREATE TABLE intake_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Aspirations (all text fields for flexibility)
  career_goals TEXT,
  health_goals TEXT,
  finance_goals TEXT,
  learning_goals TEXT,
  spirituality_goals TEXT,
  lifestyle_goals TEXT,
  
  -- Constraints
  work_schedule TEXT,
  energy_patterns TEXT,
  existing_commitments TEXT,
  available_daily_time TEXT,
  
  -- Meta
  derailment_factors TEXT[],
  top_priorities TEXT[],
  coaching_style TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- YEAR PLANS
-- ============================================================================
CREATE TABLE year_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  intake_id UUID REFERENCES intake_responses(id),
  year INTEGER NOT NULL,
  vision TEXT, -- One-sentence year vision
  plan_data JSONB NOT NULL, -- Full quarterly/monthly/weekly structure
  version INTEGER DEFAULT 1, -- For plan regeneration
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, year, version)
);

-- Index for fast lookups
CREATE INDEX idx_year_plans_user_year ON year_plans(user_id, year) WHERE is_active = TRUE;

-- ============================================================================
-- DAILY TASKS
-- ============================================================================
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES year_plans(id),
  date DATE NOT NULL,
  
  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  area TEXT, -- 'health', 'career', 'finance', etc.
  duration_minutes INTEGER,
  time_suggestion TEXT, -- '6:00 AM', 'Evening', etc.
  why TEXT, -- Why this task matters
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high
  
  -- Completion tracking
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT FALSE,
  skipped_reason TEXT,
  
  -- Ordering
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_daily_tasks_user_date ON daily_tasks(user_id, date);
CREATE INDEX idx_daily_tasks_completion ON daily_tasks(user_id, completed, date);

-- ============================================================================
-- HABITS
-- ============================================================================
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  area TEXT, -- 'health', 'spirituality', etc.
  frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'custom'
  target_count INTEGER DEFAULT 1, -- For habits like "5 prayers"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  count INTEGER DEFAULT 0, -- Actual count (e.g., 3 out of 5 prayers)
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(habit_id, date)
);

CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date);

-- ============================================================================
-- STREAKS (Computed daily)
-- ============================================================================
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  streak_type TEXT NOT NULL, -- 'daily_completion', 'habit_morning_routine', etc.
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  last_updated DATE,
  
  UNIQUE(user_id, streak_type)
);

-- ============================================================================
-- PROGRESS SNAPSHOTS (Daily rollup for analytics)
-- ============================================================================
CREATE TABLE progress_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  -- Daily metrics
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Rolling averages
  completion_rate_7d DECIMAL(5,2) DEFAULT 0,
  completion_rate_30d DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

CREATE INDEX idx_progress_user_date ON progress_snapshots(user_id, date DESC);

-- ============================================================================
-- SAVINGS TRACKER
-- ============================================================================
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  goal_name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  target_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE savings_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES savings_goals(id),
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_savings_entries_user_date ON savings_entries(user_id, date DESC);

-- ============================================================================
-- AI CONVERSATIONS
-- ============================================================================
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_type TEXT NOT NULL, -- 'intake', 'daily_coach', 'adaptation', 'general'
  messages JSONB NOT NULL DEFAULT '[]', -- [{role: 'user', content: '...'}, ...]
  context JSONB, -- Extra context (current tasks, completion rate, etc.)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_type ON ai_conversations(user_id, conversation_type, is_active);

-- ============================================================================
-- PLAN ADAPTATIONS (Learning & improvement)
-- ============================================================================
CREATE TABLE plan_adaptations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES year_plans(id),
  
  -- What triggered this?
  trigger_type TEXT NOT NULL, -- 'user_request', 'missed_tasks', 'pattern_detected', 'burnout'
  trigger_data JSONB, -- Details about what was detected
  
  -- What did AI suggest?
  ai_suggestion TEXT NOT NULL,
  suggested_changes JSONB, -- Structured changes proposed
  
  -- What did user choose?
  user_decision TEXT, -- 'accepted', 'modified', 'rejected'
  final_changes JSONB, -- What actually got applied
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_adaptations_user ON plan_adaptations(user_id, created_at DESC);

-- ============================================================================
-- MILESTONES
-- ============================================================================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES year_plans(id),
  
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  quarter INTEGER, -- 1, 2, 3, 4
  month INTEGER, -- 1-12
  
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_user_quarter ON milestones(user_id, quarter, completed);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own intake" ON intake_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own intake" ON intake_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own plans" ON year_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON year_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON year_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks" ON daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON daily_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON daily_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habit logs" ON habit_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own streaks" ON streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own progress" ON progress_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own savings" ON savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own savings entries" ON savings_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own adaptations" ON plan_adaptations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own milestones" ON milestones FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_year_plans_updated_at BEFORE UPDATE ON year_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at BEFORE UPDATE ON daily_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- None needed - users create their own data through intake