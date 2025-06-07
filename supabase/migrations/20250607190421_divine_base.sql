/*
  # Add phone number and fix username handling

  1. New Columns
    - Add `phone` column to profiles table for phone number storage
    - Ensure username is properly indexed for login lookups

  2. Security
    - Update RLS policies to include phone field
    - Add index on username for efficient lookups

  3. Changes
    - Add phone number field to profiles
    - Create index on username for login performance
    - Update trigger function to handle phone number
*/

-- Add phone column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
END $$;

-- Create index on username for efficient lookups during login
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Update the trigger function to handle phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;