-- Check if tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'UserProfile'
);

-- Check policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'UserProfile';

-- Test if trigger works correctly
CREATE OR REPLACE FUNCTION test_trigger() 
RETURNS text AS $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- This simulates what happens when a user is created
  -- It doesn't actually create a user in auth.users
  INSERT INTO public."UserProfile" (id, email, name)
  VALUES (test_user_id, 'test@example.com', 'Test User')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN 'Trigger test completed. Check if a row was created.';
END;
$$ LANGUAGE plpgsql; 