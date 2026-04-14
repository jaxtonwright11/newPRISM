-- Lock down core table write policies that were opened broadly.
-- These tables should only be writable by trusted server paths
-- using the Supabase service role key.

-- Perspectives
DROP POLICY IF EXISTS "perspectives_insert" ON perspectives;
DROP POLICY IF EXISTS "perspectives_update" ON perspectives;
CREATE POLICY "perspectives_insert" ON perspectives
  FOR INSERT TO service_role
  WITH CHECK (true);
CREATE POLICY "perspectives_update" ON perspectives
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Communities
DROP POLICY IF EXISTS "communities_insert" ON communities;
DROP POLICY IF EXISTS "communities_update" ON communities;
CREATE POLICY "communities_insert" ON communities
  FOR INSERT TO service_role
  WITH CHECK (true);
CREATE POLICY "communities_update" ON communities
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Topics
DROP POLICY IF EXISTS "topics_insert" ON topics;
DROP POLICY IF EXISTS "topics_update" ON topics;
CREATE POLICY "topics_insert" ON topics
  FOR INSERT TO service_role
  WITH CHECK (true);
CREATE POLICY "topics_update" ON topics
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Community alignments
DROP POLICY IF EXISTS "alignments_insert" ON community_alignments;
DROP POLICY IF EXISTS "alignments_update" ON community_alignments;
CREATE POLICY "alignments_insert" ON community_alignments
  FOR INSERT TO service_role
  WITH CHECK (true);
CREATE POLICY "alignments_update" ON community_alignments
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);
