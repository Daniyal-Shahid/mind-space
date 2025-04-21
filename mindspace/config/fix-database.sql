-- Step 1: Make sure tables exist with correct structure
CREATE TABLE IF NOT EXISTS public."UserProfile" (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT UNIQUE,
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."MoodEntry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mood TEXT,
  note TEXT,
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES public."UserProfile"(id)
);

CREATE TABLE IF NOT EXISTS public."JournalEntry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  tags TEXT,
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES public."UserProfile"(id)
);

-- Step 2: Make sure RLS is enabled
ALTER TABLE public."UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MoodEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."JournalEntry" ENABLE ROW LEVEL SECURITY;

-- Step 3: Remove any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profiles" ON public."UserProfile";
DROP POLICY IF EXISTS "Users can update their own profiles" ON public."UserProfile";
DROP POLICY IF EXISTS "Service role can insert profiles" ON public."UserProfile";
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public."UserProfile";

-- Step 4: Create open policies for development (more permissive)
-- This policy allows all operations for authenticated users - DEVELOPMENT ONLY!
CREATE POLICY "Allow full access to authenticated users"
  ON public."UserProfile"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 5: Add necessary Bucket permissions if you're using Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Drop and recreate the trigger function with better error handling
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the attempt to create a user profile
  RAISE LOG 'Attempting to create profile for user: %', NEW.id;
  
  -- Use a more robust insert with better error handling
  BEGIN
    INSERT INTO public."UserProfile" (id, email, name)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'name', 'New User')
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE LOG 'Successfully created profile for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail
      RAISE LOG 'Error creating profile for user % - Error: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile_for_user();

-- Step 8: Fix case sensitivity in table names if that's an issue
-- Rename any incorrectly cased tables (if needed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'userprofile' AND table_schema = 'public') THEN
    ALTER TABLE public.userprofile RENAME TO "UserProfile";
  END IF;
END $$; 