-- ================================================================
-- Atlas Phase 1 Schema
-- Run this entire file in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ================================================================

-- ----------------------------------------------------------------
-- profiles
-- One row per authenticated user, 1:1 with auth.users.
-- Focused on user identity and onboarding data only.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name           TEXT        NOT NULL DEFAULT '',
  display_name         TEXT        NOT NULL DEFAULT '',
  account_role         TEXT        NOT NULL DEFAULT 'standard'
                         CHECK (account_role IN ('standard', 'teen', 'parent')),
  experience_level     TEXT
                         CHECK (experience_level IN ('new', 'some', 'experienced')),
  goal                 TEXT
                         CHECK (goal IN ('learn', 'practice', 'understand', 'habits')),
  interests            TEXT[]      NOT NULL DEFAULT '{}',
  initial_watchlist    TEXT[]      NOT NULL DEFAULT '{}',
  onboarding_completed BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- user_preferences
-- Separate from profiles so user identity and settings can evolve
-- independently. One row per user.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  theme                TEXT        NOT NULL DEFAULT 'dark',
  default_chart_range  TEXT        NOT NULL DEFAULT '1M',
  notification_email   BOOLEAN     NOT NULL DEFAULT TRUE,
  notification_in_app  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

-- ----------------------------------------------------------------
-- Row Level Security
-- Every user can only see and modify their own rows.
-- auth.uid() is the only trusted identity source.
-- ----------------------------------------------------------------
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles: select own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: insert own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- user_preferences policies
CREATE POLICY "user_preferences: select own"
  ON user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_preferences: insert own"
  ON user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences: update own"
  ON user_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- updated_at trigger function (shared)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------
-- Auto-create profile + preferences on signup
-- Uses SECURITY DEFINER so it can insert into profiles even though
-- the new user's session is not yet active.
-- Does NOT store any auth tokens or sensitive data.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'first_name',
      split_part(NEW.email, '@', 1),
      ''
    )
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail the signup due to a profile-creation error.
  -- The app handles missing profiles gracefully via loadProfile().
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
