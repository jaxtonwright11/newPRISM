-- Lock down privileged write access on core content tables.
-- The previous migration allowed any authenticated user to write
-- communities/topics/perspectives/alignment rows via permissive RLS.

-- PERSPECTIVES
DROP POLICY IF EXISTS "perspectives_insert" ON perspectives;
DROP POLICY IF EXISTS "perspectives_update" ON perspectives;
CREATE POLICY "perspectives_insert_service_only"
  ON perspectives
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "perspectives_update_service_only"
  ON perspectives
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- COMMUNITIES
DROP POLICY IF EXISTS "communities_insert" ON communities;
DROP POLICY IF EXISTS "communities_update" ON communities;
CREATE POLICY "communities_insert_service_only"
  ON communities
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "communities_update_service_only"
  ON communities
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- TOPICS
DROP POLICY IF EXISTS "topics_insert" ON topics;
DROP POLICY IF EXISTS "topics_update" ON topics;
CREATE POLICY "topics_insert_service_only"
  ON topics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "topics_update_service_only"
  ON topics
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- COMMUNITY_ALIGNMENTS
DROP POLICY IF EXISTS "alignments_insert" ON community_alignments;
DROP POLICY IF EXISTS "alignments_update" ON community_alignments;
CREATE POLICY "alignments_insert_service_only"
  ON community_alignments
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "alignments_update_service_only"
  ON community_alignments
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
