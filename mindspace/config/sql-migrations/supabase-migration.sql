-- Enable Row Level Security
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MoodEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JournalEntry" ENABLE ROW LEVEL SECURITY;

-- Create UserProfile policies
CREATE POLICY "Users can view their own profiles"
  ON "UserProfile"
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles"
  ON "UserProfile"
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to insert into UserProfile (needed for the trigger)
CREATE POLICY "Service role can insert profiles"
  ON "UserProfile"
  FOR INSERT
  WITH CHECK (true);

-- Create MoodEntry policies
CREATE POLICY "Users can view their own mood entries"
  ON "MoodEntry"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood entries"
  ON "MoodEntry"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries"
  ON "MoodEntry"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries"
  ON "MoodEntry"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create JournalEntry policies
CREATE POLICY "Users can view their own journal entries"
  ON "JournalEntry"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON "JournalEntry"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON "JournalEntry"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON "JournalEntry"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Drop and recreate the trigger function with proper error handling
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."UserProfile" (id, email, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error in create_profile_for_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile_for_user(); 