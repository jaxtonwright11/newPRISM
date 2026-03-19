-- PRISM initial schema (idempotent): 14 tables + RLS + policies
-- Generated from docs/prism-full-spec.md table definitions.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  community_type TEXT NOT NULL
    CHECK (community_type IN ('civic','diaspora','rural','policy','academic','cultural')),
  color_hex TEXT NOT NULL,
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','trending','hot','cooling','archived')),
  perspective_count INT DEFAULT 0,
  community_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  home_community_id UUID REFERENCES communities(id),
  verification_level INT DEFAULT 1 CHECK (verification_level IN (1,2,3)),
  ghost_mode BOOLEAN DEFAULT FALSE,
  default_radius_miles INT DEFAULT 40 CHECK (default_radius_miles IN (10,20,30,40)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  perspectives_read INT DEFAULT 0,
  communities_engaged INT DEFAULT 0,
  connections_made INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id),
  verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending','approved','rejected')),
  named_attribution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  context TEXT,
  category_tag TEXT,
  contributor_id UUID REFERENCES contributors(id),
  verified BOOLEAN DEFAULT FALSE,
  reaction_count INT DEFAULT 0,
  bookmark_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id),
  topic_id UUID REFERENCES topics(id),
  content TEXT NOT NULL,
  image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'permanent'
    CHECK (post_type IN ('permanent','story')),
  radius_miles INT NOT NULL DEFAULT 40
    CHECK (radius_miles IN (10,20,30,40)),
  expires_at TIMESTAMPTZ,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  perspective_id UUID REFERENCES perspectives(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL
    CHECK (reaction_type IN ('i_see_this','i_didnt_know_this','i_agree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, perspective_id)
);

CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  perspective_id UUID REFERENCES perspectives(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (topic_id IS NOT NULL AND perspective_id IS NULL AND post_id IS NULL) OR
    (topic_id IS NULL AND perspective_id IS NOT NULL AND post_id IS NULL) OR
    (topic_id IS NULL AND perspective_id IS NULL AND post_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS community_alignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  alignment_statement TEXT NOT NULL,
  community_ids UUID[],
  agreement_pct INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id),
  perspective_id UUID REFERENCES perspectives(id),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined')),
  intro_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (requester_id != recipient_id)
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES community_connections(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on every table
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE perspectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- At least one policy per table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'communities' AND policyname = 'communities_public_read'
  ) THEN
    CREATE POLICY communities_public_read ON communities FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'topics' AND policyname = 'topics_public_read'
  ) THEN
    CREATE POLICY topics_public_read ON topics FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'perspectives' AND policyname = 'perspectives_public_read'
  ) THEN
    CREATE POLICY perspectives_public_read ON perspectives FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'posts' AND policyname = 'posts_public_read_excluding_ghost_and_expired'
  ) THEN
    CREATE POLICY posts_public_read_excluding_ghost_and_expired
      ON posts FOR SELECT
      USING (
        (
          post_type <> 'story'
          OR expires_at IS NULL
          OR expires_at > NOW()
        )
        AND EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = posts.user_id
          AND u.ghost_mode = FALSE
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_own_row'
  ) THEN
    CREATE POLICY users_select_own_row ON users FOR SELECT USING (id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'user_profiles_select_own_row'
  ) THEN
    CREATE POLICY user_profiles_select_own_row
      ON user_profiles FOR SELECT USING (id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contributors' AND policyname = 'contributors_public_read'
  ) THEN
    CREATE POLICY contributors_public_read ON contributors FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reactions' AND policyname = 'reactions_select_own'
  ) THEN
    CREATE POLICY reactions_select_own ON reactions FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'post_likes_select_own'
  ) THEN
    CREATE POLICY post_likes_select_own ON post_likes FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bookmarks' AND policyname = 'bookmarks_select_own'
  ) THEN
    CREATE POLICY bookmarks_select_own ON bookmarks FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_alignments' AND policyname = 'community_alignments_public_read'
  ) THEN
    CREATE POLICY community_alignments_public_read
      ON community_alignments FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_connections' AND policyname = 'community_connections_participants_select'
  ) THEN
    CREATE POLICY community_connections_participants_select
      ON community_connections FOR SELECT
      USING (requester_id = auth.uid() OR recipient_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'direct_messages' AND policyname = 'direct_messages_connection_participants_select'
  ) THEN
    CREATE POLICY direct_messages_connection_participants_select
      ON direct_messages FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM community_connections cc
          WHERE cc.id = direct_messages.connection_id
            AND (cc.requester_id = auth.uid() OR cc.recipient_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_select_own'
  ) THEN
    CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;
