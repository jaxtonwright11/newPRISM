-- ============================================================
-- Fix auth: add handle_new_user trigger, missing RLS policies,
-- and missing tables (community_follows, early_access_emails, reports)
-- ============================================================

-- 1. TRIGGER: auto-create public.users + user_profiles row on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. MISSING TABLES
-- ============================================================

-- Community follows (user follows a community)
CREATE TABLE IF NOT EXISTS community_follows (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, community_id)
);
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;

-- Early access email signups
CREATE TABLE IF NOT EXISTS early_access_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE early_access_emails ENABLE ROW LEVEL SECURITY;

-- Content reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('perspective','post','comment','user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;


-- 3. RLS POLICIES (idempotent: drop then create)
-- ============================================================

-- community_follows
DROP POLICY IF EXISTS "cf_public_read" ON community_follows;
DROP POLICY IF EXISTS "cf_insert_own" ON community_follows;
DROP POLICY IF EXISTS "cf_delete_own" ON community_follows;
CREATE POLICY "cf_public_read" ON community_follows FOR SELECT USING (true);
CREATE POLICY "cf_insert_own" ON community_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cf_delete_own" ON community_follows FOR DELETE USING (auth.uid() = user_id);

-- early_access_emails
DROP POLICY IF EXISTS "ea_public_insert" ON early_access_emails;
DROP POLICY IF EXISTS "ea_public_read" ON early_access_emails;
CREATE POLICY "ea_public_insert" ON early_access_emails FOR INSERT WITH CHECK (true);
CREATE POLICY "ea_public_read" ON early_access_emails FOR SELECT USING (true);

-- reports
DROP POLICY IF EXISTS "reports_insert_own" ON reports;
DROP POLICY IF EXISTS "reports_read_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_read_own" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- USERS table
DROP POLICY IF EXISTS "users_public_read" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_public_read" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- USER_PROFILES table
DROP POLICY IF EXISTS "user_profiles_public_read" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_public_read" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- POSTS table
DROP POLICY IF EXISTS "posts_public_read" ON posts;
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_public_read" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = user_id);

-- REACTIONS table
DROP POLICY IF EXISTS "reactions_public_read" ON reactions;
DROP POLICY IF EXISTS "reactions_insert_own" ON reactions;
DROP POLICY IF EXISTS "reactions_delete_own" ON reactions;
CREATE POLICY "reactions_public_read" ON reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert_own" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- POST_LIKES table
DROP POLICY IF EXISTS "post_likes_public_read" ON post_likes;
DROP POLICY IF EXISTS "post_likes_insert_own" ON post_likes;
DROP POLICY IF EXISTS "post_likes_delete_own" ON post_likes;
CREATE POLICY "post_likes_public_read" ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_own" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- BOOKMARKS table
DROP POLICY IF EXISTS "bookmarks_read_own" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_own" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_own" ON bookmarks;
CREATE POLICY "bookmarks_read_own" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_own" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- CONTRIBUTORS table
DROP POLICY IF EXISTS "contributors_public_read" ON contributors;
DROP POLICY IF EXISTS "contributors_insert_own" ON contributors;
CREATE POLICY "contributors_public_read" ON contributors FOR SELECT USING (true);
CREATE POLICY "contributors_insert_own" ON contributors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- COMMUNITY_CONNECTIONS table
DROP POLICY IF EXISTS "connections_read_own" ON community_connections;
DROP POLICY IF EXISTS "connections_insert_own" ON community_connections;
DROP POLICY IF EXISTS "connections_update_own" ON community_connections;
CREATE POLICY "connections_read_own" ON community_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
CREATE POLICY "connections_insert_own" ON community_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "connections_update_own" ON community_connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- DIRECT_MESSAGES table
DROP POLICY IF EXISTS "messages_read_own" ON direct_messages;
DROP POLICY IF EXISTS "messages_insert_own" ON direct_messages;
CREATE POLICY "messages_read_own" ON direct_messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() IN (
      SELECT requester_id FROM community_connections WHERE id = connection_id
      UNION
      SELECT recipient_id FROM community_connections WHERE id = connection_id
    )
  );
CREATE POLICY "messages_insert_own" ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- NOTIFICATIONS table
DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_service" ON notifications;
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_service" ON notifications FOR INSERT WITH CHECK (true);

-- PERSPECTIVES table (already has public read from initial schema)
DROP POLICY IF EXISTS "perspectives_insert" ON perspectives;
DROP POLICY IF EXISTS "perspectives_update" ON perspectives;
CREATE POLICY "perspectives_insert" ON perspectives FOR INSERT WITH CHECK (true);
CREATE POLICY "perspectives_update" ON perspectives FOR UPDATE USING (true);

-- COMMUNITIES table (already has public read from initial schema)
DROP POLICY IF EXISTS "communities_insert" ON communities;
DROP POLICY IF EXISTS "communities_update" ON communities;
CREATE POLICY "communities_insert" ON communities FOR INSERT WITH CHECK (true);
CREATE POLICY "communities_update" ON communities FOR UPDATE USING (true);

-- TOPICS table (already has public read from initial schema)
DROP POLICY IF EXISTS "topics_insert" ON topics;
DROP POLICY IF EXISTS "topics_update" ON topics;
CREATE POLICY "topics_insert" ON topics FOR INSERT WITH CHECK (true);
CREATE POLICY "topics_update" ON topics FOR UPDATE USING (true);

-- COMMUNITY_ALIGNMENTS (already has public read from initial schema)
DROP POLICY IF EXISTS "alignments_insert" ON community_alignments;
DROP POLICY IF EXISTS "alignments_update" ON community_alignments;
CREATE POLICY "alignments_insert" ON community_alignments FOR INSERT WITH CHECK (true);
CREATE POLICY "alignments_update" ON community_alignments FOR UPDATE USING (true);


-- 4. INDEXES for new tables
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_community_follows_user ON community_follows (user_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_community ON community_follows (community_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_early_access_email ON early_access_emails (email);
