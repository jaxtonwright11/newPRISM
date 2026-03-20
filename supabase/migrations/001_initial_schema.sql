-- PRISM Database Schema v1
-- All 14 tables with RLS policies
-- Run this migration in your Supabase SQL editor or via CLI

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- full-text search on topics

-- ============================================================
-- ENUMS (for type safety at DB level)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE community_type AS ENUM ('civic','diaspora','rural','policy','academic','cultural');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE topic_status AS ENUM ('active','trending','hot','cooling','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reaction_type AS ENUM ('i_see_this','i_didnt_know_this','i_agree');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE connection_status AS ENUM ('pending','accepted','declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE post_type AS ENUM ('permanent','story');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLE: communities
-- ============================================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  community_type community_type NOT NULL,
  color_hex TEXT NOT NULL CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communities_type ON communities(community_type);
CREATE INDEX IF NOT EXISTS idx_communities_active ON communities(active) WHERE active = TRUE;

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Communities are public read
CREATE POLICY "communities_public_read" ON communities
  FOR SELECT USING (active = TRUE);

-- Only service role can insert/update/delete communities
CREATE POLICY "communities_service_write" ON communities
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- TABLE: topics
-- ============================================================

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  status topic_status DEFAULT 'active',
  perspective_count INT DEFAULT 0,
  community_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_title_trgm ON topics USING GIN (title gin_trgm_ops);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topics_public_read" ON topics
  FOR SELECT USING (status != 'archived');

CREATE POLICY "topics_service_write" ON topics
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-z0-9_]{3,30}$'),
  display_name TEXT CHECK (char_length(display_name) <= 100),
  avatar_url TEXT,
  home_community_id UUID REFERENCES communities(id),
  verification_level INT DEFAULT 1 CHECK (verification_level IN (1,2,3)),
  ghost_mode BOOLEAN DEFAULT FALSE,
  default_radius_miles INT DEFAULT 40 CHECK (default_radius_miles IN (10,20,30,40)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_community ON users(home_community_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Public can read non-ghost users' basic info (for community browsing)
CREATE POLICY "users_public_limited_read" ON users
  FOR SELECT USING (ghost_mode = FALSE AND verification_level >= 2);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Service role for inserts (user creation hook)
CREATE POLICY "users_service_insert" ON users
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = id);

-- ============================================================
-- TABLE: user_profiles (aggregated stats)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  perspectives_read INT DEFAULT 0,
  communities_engaged INT DEFAULT 0,
  connections_made INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_read_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles_service_write" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- TABLE: contributors (verified Level 3 community voices)
-- ============================================================

CREATE TABLE IF NOT EXISTS contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id),
  verified BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'pending',
  named_attribution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

CREATE INDEX IF NOT EXISTS idx_contributors_community ON contributors(community_id);
CREATE INDEX IF NOT EXISTS idx_contributors_verified ON contributors(verified) WHERE verified = TRUE;

ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contributors_public_read" ON contributors
  FOR SELECT USING (verified = TRUE);

CREATE POLICY "contributors_service_write" ON contributors
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- TABLE: perspectives (official community perspective cards)
-- ============================================================

CREATE TABLE IF NOT EXISTS perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  contributor_id UUID REFERENCES contributors(id),
  quote TEXT NOT NULL CHECK (char_length(quote) BETWEEN 20 AND 500),
  context TEXT CHECK (char_length(context) <= 300),
  category_tag TEXT CHECK (char_length(category_tag) <= 50),
  verified BOOLEAN DEFAULT FALSE,
  reaction_count INT DEFAULT 0,
  bookmark_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perspectives_community ON perspectives(community_id);
CREATE INDEX IF NOT EXISTS idx_perspectives_topic ON perspectives(topic_id);
CREATE INDEX IF NOT EXISTS idx_perspectives_created ON perspectives(created_at DESC);

ALTER TABLE perspectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perspectives_public_read" ON perspectives
  FOR SELECT USING (verified = TRUE);

CREATE POLICY "perspectives_contributor_write" ON perspectives
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR (
      EXISTS (
        SELECT 1 FROM contributors c
        WHERE c.user_id = auth.uid()
          AND c.community_id = perspectives.community_id
          AND c.verified = TRUE
      )
    )
  );

CREATE POLICY "perspectives_service_update" ON perspectives
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================
-- TABLE: posts (individual user posts — appear as pins on map)
-- ============================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id),
  topic_id UUID REFERENCES topics(id),
  content TEXT NOT NULL CHECK (
    (post_type = 'story' AND char_length(content) <= 280) OR
    (post_type = 'permanent' AND char_length(content) BETWEEN 1 AND 1000)
  ),
  image_url TEXT,
  post_type post_type NOT NULL DEFAULT 'permanent',
  radius_miles INT NOT NULL DEFAULT 40 CHECK (radius_miles IN (10,20,30,40)),
  expires_at TIMESTAMPTZ, -- NULL for permanent, NOW()+24h for stories
  latitude DECIMAL(9,6),  -- approximate (radius center, not exact location)
  longitude DECIMAL(9,6),
  like_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_expires ON posts(expires_at) WHERE expires_at IS NOT NULL;
-- Partial index for active (non-expired) stories
CREATE INDEX IF NOT EXISTS idx_posts_active_stories ON posts(created_at DESC)
  WHERE post_type = 'story' AND (expires_at IS NULL OR expires_at > NOW());

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public read for non-expired posts
CREATE POLICY "posts_public_read" ON posts
  FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

-- Verified users (level 2+) can create posts
CREATE POLICY "posts_level2_insert" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.verification_level >= 2
    )
  );

-- Users can delete their own posts
CREATE POLICY "posts_owner_delete" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Users can update their own posts (content only, not counts)
CREATE POLICY "posts_owner_update" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: reactions (perspective reactions — 3 types)
-- ============================================================

CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perspective_id UUID NOT NULL REFERENCES perspectives(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, perspective_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_perspective ON reactions(perspective_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Auth users can read/write their own reactions
CREATE POLICY "reactions_user_own" ON reactions
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can read reaction counts per perspective (aggregated via view)
CREATE POLICY "reactions_public_aggregate_read" ON reactions
  FOR SELECT USING (TRUE);

-- ============================================================
-- TABLE: post_likes (simple heart on personal posts)
-- ============================================================

CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_likes_user_own" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "post_likes_public_read" ON post_likes
  FOR SELECT USING (TRUE);

-- ============================================================
-- TABLE: bookmarks
-- ============================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  perspective_id UUID REFERENCES perspectives(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT bookmarks_one_target CHECK (
    (CASE WHEN topic_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN perspective_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_perspective ON bookmarks(perspective_id) WHERE perspective_id IS NOT NULL;

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_user_own" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: community_alignments
-- ============================================================

CREATE TABLE IF NOT EXISTS community_alignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  alignment_statement TEXT NOT NULL CHECK (char_length(alignment_statement) BETWEEN 10 AND 300),
  community_ids UUID[],
  agreement_pct INT CHECK (agreement_pct BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alignments_topic ON community_alignments(topic_id);

ALTER TABLE community_alignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alignments_public_read" ON community_alignments
  FOR SELECT USING (TRUE);

CREATE POLICY "alignments_service_write" ON community_alignments
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- TABLE: community_connections (cross-community individual connections)
-- ============================================================

CREATE TABLE IF NOT EXISTS community_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id),
  perspective_id UUID REFERENCES perspectives(id),
  status connection_status DEFAULT 'pending',
  intro_message TEXT NOT NULL CHECK (char_length(intro_message) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT no_self_connection CHECK (requester_id != recipient_id),
  CONSTRAINT unique_pending_pair UNIQUE (requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_requester ON community_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON community_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON community_connections(status);

ALTER TABLE community_connections ENABLE ROW LEVEL SECURITY;

-- Users can see connections they are part of
CREATE POLICY "connections_participant_read" ON community_connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Level 2+ users can create connection requests
CREATE POLICY "connections_level2_insert" ON community_connections
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id AND
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.verification_level >= 2
    )
  );

-- Recipients can accept/decline
CREATE POLICY "connections_recipient_update" ON community_connections
  FOR UPDATE USING (auth.uid() = recipient_id);

-- ============================================================
-- TABLE: direct_messages
-- ============================================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES community_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_connection ON direct_messages(connection_id, created_at DESC);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Only connection participants can read/write messages
CREATE POLICY "messages_participants_only" ON direct_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_connections cc
      WHERE cc.id = direct_messages.connection_id
        AND cc.status = 'accepted'
        AND (cc.requester_id = auth.uid() OR cc.recipient_id = auth.uid())
    )
  );

-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'connection_request',
    'connection_accepted',
    'new_message',
    'community_pulse',
    'perspective_reaction'
  )),
  payload JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_user_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS: auto-update counters
-- ============================================================

-- Update perspective reaction_count on reaction insert/delete
CREATE OR REPLACE FUNCTION update_perspective_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE perspectives SET reaction_count = reaction_count + 1 WHERE id = NEW.perspective_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE perspectives SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.perspective_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_perspective_reaction_count ON reactions;
CREATE TRIGGER trg_perspective_reaction_count
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION update_perspective_reaction_count();

-- Update post like_count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_post_like_count ON post_likes;
CREATE TRIGGER trg_post_like_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Update topic perspective_count when perspective added/removed
CREATE OR REPLACE FUNCTION update_topic_perspective_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE topics SET
      perspective_count = perspective_count + 1,
      updated_at = NOW()
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE topics SET
      perspective_count = GREATEST(perspective_count - 1, 0),
      updated_at = NOW()
    WHERE id = OLD.topic_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_topic_perspective_count ON perspectives;
CREATE TRIGGER trg_topic_perspective_count
  AFTER INSERT OR DELETE ON perspectives
  FOR EACH ROW EXECUTE FUNCTION update_topic_perspective_count();

-- Update user_profiles.connections_made on connection accepted
CREATE OR REPLACE FUNCTION update_connection_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO user_profiles (id, connections_made)
      VALUES (NEW.requester_id, 1), (NEW.recipient_id, 1)
      ON CONFLICT (id) DO UPDATE SET
        connections_made = user_profiles.connections_made + 1,
        updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_connection_counts ON community_connections;
CREATE TRIGGER trg_connection_counts
  AFTER INSERT OR UPDATE ON community_connections
  FOR EACH ROW EXECUTE FUNCTION update_connection_counts();

-- ============================================================
-- FUNCTION: create user profile on auth signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
