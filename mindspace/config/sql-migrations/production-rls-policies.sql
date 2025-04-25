-- Production-ready Row Level Security Policies for MindSpace
-- This replaces the development-only policies in fix-database.sql

-- Step 1: Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profiles" ON public."UserProfile";
DROP POLICY IF EXISTS "Users can update their own profiles" ON public."UserProfile";
DROP POLICY IF EXISTS "Service role can insert profiles" ON public."UserProfile";
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public."UserProfile";

-- Step 2: Create production-ready policies for UserProfile
CREATE POLICY "Users can view their own profiles"
  ON public."UserProfile"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles"
  ON public."UserProfile"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON public."UserProfile"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Step 3: Add similar policies for MoodEntry if not already present
DROP POLICY IF EXISTS "Users can access their own mood entries" ON public."MoodEntry";

CREATE POLICY "Users can access their own mood entries"
  ON public."MoodEntry"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 4: Add similar policies for JournalEntry if not already present
DROP POLICY IF EXISTS "Users can access their own journal entries" ON public."JournalEntry";

CREATE POLICY "Users can access their own journal entries"
  ON public."JournalEntry"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Verify all tables from add-new-moods.sql have appropriate policies
-- The add-new-moods.sql file already has proper RLS policies for:
-- SleepEntry, FoodEntry, WaterEntry, GratitudeEntry

-- Step 5: Add policy to allow service_role to read all data for admin purposes
CREATE POLICY "Service role can read all profiles"
  ON public."UserProfile"
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can read all mood entries"
  ON public."MoodEntry"
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can read all journal entries"
  ON public."JournalEntry"
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can read all sleep entries"
  ON public."SleepEntry"
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can read all food entries"
  ON public."FoodEntry"
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can read all water entries"
  ON public."WaterEntry"
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can read all gratitude entries"
  ON public."GratitudeEntry"
  FOR SELECT
  TO service_role
  USING (true); 