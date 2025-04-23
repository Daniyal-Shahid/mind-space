# MindSpace - Next.js & Supabase Application

This is a mindfulness and journaling application built with Next.js and Supabase.

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI](https://heroui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) - Backend and Authentication
- [TypeScript](https://www.typescriptlang.org)
- [Framer Motion](https://www.framer.com/motion)
- [next-themes](https://github.com/pacocoursey/next-themes)

## Getting Started

### Setting up Supabase

1. Create a [Supabase](https://supabase.com) account and start a new project
2. Set up authentication (Email/Password is enabled by default)
3. Set up the database schema using one of these two methods:

#### Option 1: Run the SQL directly

In your Supabase dashboard, go to the SQL Editor and run the following SQL:

```sql
-- Create UserProfile table 
CREATE TABLE "UserProfile" (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT UNIQUE,
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create MoodEntry table
CREATE TABLE "MoodEntry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mood TEXT,
  note TEXT,
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES "UserProfile"(id)
);

-- Create JournalEntry table
CREATE TABLE "JournalEntry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  tags TEXT,
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES "UserProfile"(id)
);
```

#### Option 2: Run the migration file

For a complete setup with proper permissions and triggers, find the `supabase-migration.sql` file in the `config` folder and run it in your Supabase SQL Editor. This will:

- Create all necessary tables
- Set up Row Level Security policies
- Create the trigger to auto-create user profiles

### Setting up Environment Variables

1. Get your Supabase URL and Anon Key from your project settings:
   - Go to Project Settings > API in your Supabase dashboard
   - Copy the URL and anon/public key

2. Create a `.env.local` file from the example:

```bash
cp .env.local.example .env.local
```

3. Fill in your Supabase URL and Anon Key in the `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication Flow

The application implements a complete authentication flow:

- Sign Up with email/password
- Login with email/password
- Password reset process
- Protected routes for authenticated users

## Troubleshooting

### "Database error saving new user"

If you encounter this error during signup:

1. Make sure Row Level Security is properly configured. Run the `supabase-migration.sql` file in the SQL Editor.
2. Check that your permissions allow for inserting new records into the UserProfile table.
3. Ensure that the trigger function `create_profile_for_user()` is correctly set up.
4. Verify that you're using the correct Supabase URL and Anon Key in your `.env.local` file.

### Authentication Issues

1. Enable email confirmations in Authentication > Settings if you want users to confirm their email
2. For development, you can turn off email confirmations to simplify testing

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-pages-template/blob/main/LICENSE).
