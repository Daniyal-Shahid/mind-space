# Supabase Setup Guide for MindSpace

This guide will help you correctly set up your Supabase project to work with the MindSpace application.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note down your Supabase URL and API keys from the project dashboard

## Step 1: Set Up Database Tables

Run the following SQL in your Supabase SQL Editor (Dashboard > SQL Editor):

```sql
-- Create UserProfile table 
CREATE TABLE public."UserProfile" (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT UNIQUE,
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create MoodEntry table
CREATE TABLE public."MoodEntry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mood TEXT,
  note TEXT,
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES public."UserProfile"(id)
);

-- Create JournalEntry table
CREATE TABLE public."JournalEntry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  tags TEXT,
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES public."UserProfile"(id)
);
```

## Step 2: Set Up Row Level Security (RLS)

Run the following SQL to enable security policies:

```sql
-- Enable Row Level Security
ALTER TABLE public."UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MoodEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."JournalEntry" ENABLE ROW LEVEL SECURITY;

-- For Development: Create permissive policies
-- Note: For production, you should make these more restrictive
CREATE POLICY "Allow full access to authenticated users"
  ON public."UserProfile"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users"
  ON public."MoodEntry"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow full access to authenticated users"
  ON public."JournalEntry"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Step 3: Create Trigger for User Registration

Run this SQL to set up a trigger that creates a user profile when a new user registers:

```sql
-- Create function to handle new user registration
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

-- Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile_for_user();
```

## Step 4: Configure Auth Settings

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Under "Email Auth", consider these settings:
   - For development: Disable "Confirm email" to avoid needing email verification
   - For production: Enable "Confirm email" for proper security

## Step 5: Set Up Environment Variables

1. In your MindSpace project, create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Find these values in your Supabase dashboard:
   - Project URL: Settings > API > URL
   - Anon Key: Settings > API > anon/public
   - Service Role Key: Settings > API > service_role (keep this secure!)

## Troubleshooting

### "Database error saving new user"

If you encounter this error:

1. Check the SQL console for errors:
   - Go to SQL Editor and run: `SELECT * FROM public."UserProfile";` to see if the table exists
   
2. Verify RLS policies:
   - Go to Database > Tables > "UserProfile" > Policies to ensure policies are set up correctly
   
3. Use Server-Side API Endpoint:
   - The application includes a fallback API endpoint at `/api/auth/signup` that uses the service role key
   - Make sure your `.env.local` file includes the `SUPABASE_SERVICE_ROLE_KEY`

4. Development Quick Fix:
   - As a last resort, you can temporarily disable Row Level Security for testing:
     ```sql
     ALTER TABLE public."UserProfile" DISABLE ROW LEVEL SECURITY;
     ```
   - Remember to re-enable it for production!

### Authentication Issues

1. If users aren't being automatically logged in after signup:
   - Go to Authentication > Settings and check if "Confirm email" is enabled
   - For development, disabling email confirmation makes testing easier

2. If the user profile isn't being created:
   - Check the logs in your Supabase dashboard under Database > Logs
   - Verify that the trigger function is working correctly

## Security Considerations for Production

When deploying to production:

1. Use more restrictive RLS policies 
2. Enable email confirmation
3. Keep your service role key secure - never expose it to the client
4. Consider adding rate limiting to your API endpoints
5. Set up proper CORS configuration in your Supabase dashboard 