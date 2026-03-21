-- Performance indexes for frequently-queried columns
-- Identified via database query audit

-- Perspectives: topic and community lookups
CREATE INDEX IF NOT EXISTS idx_perspectives_topic_id ON perspectives (topic_id);
CREATE INDEX IF NOT EXISTS idx_perspectives_community_id ON perspectives (community_id);
CREATE INDEX IF NOT EXISTS idx_perspectives_created_at ON perspectives (created_at DESC);

-- Posts: topic, user, location, and expiry lookups
CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts (topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_expires_at ON posts (expires_at) WHERE expires_at IS NOT NULL;

-- Communities: type and active status filtering
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities (community_type);
CREATE INDEX IF NOT EXISTS idx_communities_active ON communities (active) WHERE active = true;

-- Reactions and bookmarks: user lookups
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_perspective_id ON reactions (perspective_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks (user_id);

-- Notifications: user lookups ordered by time
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, read) WHERE read = false;

-- Messages: conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_sender ON direct_messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON direct_messages (recipient_id, created_at DESC);

-- Community alignments: topic lookups
CREATE INDEX IF NOT EXISTS idx_alignments_topic_id ON community_alignments (topic_id);

-- User profiles: ghost mode filtering
CREATE INDEX IF NOT EXISTS idx_users_ghost_mode ON user_profiles (ghost_mode) WHERE ghost_mode = false;
