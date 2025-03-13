/*
  # Create initial user and profile

  1. Create User
    - Create initial admin user if not exists
    - Set up profile with admin privileges
  
  2. Security
    - Enable RLS on profiles table
    - Add policies for user access

  Note: This migration safely handles cases where the user already exists
*/

-- Create initial admin user if not exists
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'marius@7salessteps.com';

  IF existing_user_id IS NULL THEN
    -- Create new user in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'marius@7salessteps.com',
      crypt('password123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex')
    )
    RETURNING id INTO new_user_id;
  ELSE
    new_user_id := existing_user_id;
  END IF;

  -- Create profile if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = new_user_id
  ) THEN
    INSERT INTO public.profiles (
      id,
      first_name,
      last_name,
      is_admin,
      updated_at
    )
    VALUES (
      new_user_id,
      'Marius',
      'Admin',
      true,
      NOW()
    );
  END IF;
END $$;

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;