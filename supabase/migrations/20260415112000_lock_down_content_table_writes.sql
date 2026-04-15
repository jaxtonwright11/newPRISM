-- Lock down writes for canonical content tables.
-- The previous migration introduced permissive INSERT/UPDATE policies (`true`)
-- that allowed any authenticated client token to modify core content.

-- perspectives
DROP POLICY IF EXISTS "perspectives_insert" ON perspectives;
DROP POLICY IF EXISTS "perspectives_update" ON perspectives;
CREATE POLICY "perspectives_insert" ON perspectives
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "perspectives_update" ON perspectives
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- communities
DROP POLICY IF EXISTS "communities_insert" ON communities;
DROP POLICY IF EXISTS "communities_update" ON communities;
CREATE POLICY "communities_insert" ON communities
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "communities_update" ON communities
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- topics
DROP POLICY IF EXISTS "topics_insert" ON topics;
DROP POLICY IF EXISTS "topics_update" ON topics;
CREATE POLICY "topics_insert" ON topics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "topics_update" ON topics
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- community_alignments
DROP POLICY IF EXISTS "alignments_insert" ON community_alignments;
DROP POLICY IF EXISTS "alignments_update" ON community_alignments;
CREATE POLICY "alignments_insert" ON community_alignments
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "alignments_update" ON community_alignments
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
