-- Lock down privileged content writes introduced by permissive RLS policies.
-- Core curation tables should only be writable by server-side service-role code.

-- perspectives
DROP POLICY IF EXISTS "perspectives_insert" ON perspectives;
DROP POLICY IF EXISTS "perspectives_update" ON perspectives;
DROP POLICY IF EXISTS "perspectives_insert_service" ON perspectives;
DROP POLICY IF EXISTS "perspectives_update_service" ON perspectives;

CREATE POLICY "perspectives_insert_service" ON perspectives
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "perspectives_update_service" ON perspectives
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- communities
DROP POLICY IF EXISTS "communities_insert" ON communities;
DROP POLICY IF EXISTS "communities_update" ON communities;
DROP POLICY IF EXISTS "communities_insert_service" ON communities;
DROP POLICY IF EXISTS "communities_update_service" ON communities;

CREATE POLICY "communities_insert_service" ON communities
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "communities_update_service" ON communities
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- topics
DROP POLICY IF EXISTS "topics_insert" ON topics;
DROP POLICY IF EXISTS "topics_update" ON topics;
DROP POLICY IF EXISTS "topics_insert_service" ON topics;
DROP POLICY IF EXISTS "topics_update_service" ON topics;

CREATE POLICY "topics_insert_service" ON topics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "topics_update_service" ON topics
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- community_alignments
DROP POLICY IF EXISTS "alignments_insert" ON community_alignments;
DROP POLICY IF EXISTS "alignments_update" ON community_alignments;
DROP POLICY IF EXISTS "alignments_insert_service" ON community_alignments;
DROP POLICY IF EXISTS "alignments_update_service" ON community_alignments;

CREATE POLICY "alignments_insert_service" ON community_alignments
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "alignments_update_service" ON community_alignments
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
