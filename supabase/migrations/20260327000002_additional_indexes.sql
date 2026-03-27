-- Additional performance indexes based on API route audit
-- Feed queries join perspectives with verified=true filter
CREATE INDEX IF NOT EXISTS idx_perspectives_verified ON perspectives (verified) WHERE verified = true;

-- Community follows: used by feed/for-you and feed/communities routes
CREATE INDEX IF NOT EXISTS idx_community_follows_user_id ON community_follows (user_id);

-- Topics: slug lookups used across multiple feed routes
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics (slug);

-- Composite index for perspectives filtered by community + time (for-you feed)
CREATE INDEX IF NOT EXISTS idx_perspectives_community_created ON perspectives (community_id, created_at DESC) WHERE verified = true;
