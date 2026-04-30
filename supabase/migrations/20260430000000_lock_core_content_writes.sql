-- Lock core platform content writes to trusted server-side clients only.
-- Public reads remain unchanged; untrusted anon/authenticated clients must use
-- validated API routes instead of writing directly through the Supabase anon key.

DROP POLICY IF EXISTS "perspectives_insert" ON perspectives;
DROP POLICY IF EXISTS "perspectives_update" ON perspectives;
DROP POLICY IF EXISTS "perspectives_service_insert" ON perspectives;
DROP POLICY IF EXISTS "perspectives_service_update" ON perspectives;
DROP POLICY IF EXISTS "perspectives_service_delete" ON perspectives;
CREATE POLICY "perspectives_service_insert" ON perspectives
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "perspectives_service_update" ON perspectives
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "perspectives_service_delete" ON perspectives
  FOR DELETE TO service_role USING (true);

DROP POLICY IF EXISTS "communities_insert" ON communities;
DROP POLICY IF EXISTS "communities_update" ON communities;
DROP POLICY IF EXISTS "communities_service_insert" ON communities;
DROP POLICY IF EXISTS "communities_service_update" ON communities;
DROP POLICY IF EXISTS "communities_service_delete" ON communities;
CREATE POLICY "communities_service_insert" ON communities
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "communities_service_update" ON communities
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "communities_service_delete" ON communities
  FOR DELETE TO service_role USING (true);

DROP POLICY IF EXISTS "topics_insert" ON topics;
DROP POLICY IF EXISTS "topics_update" ON topics;
DROP POLICY IF EXISTS "topics_service_insert" ON topics;
DROP POLICY IF EXISTS "topics_service_update" ON topics;
DROP POLICY IF EXISTS "topics_service_delete" ON topics;
CREATE POLICY "topics_service_insert" ON topics
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "topics_service_update" ON topics
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "topics_service_delete" ON topics
  FOR DELETE TO service_role USING (true);

DROP POLICY IF EXISTS "alignments_insert" ON community_alignments;
DROP POLICY IF EXISTS "alignments_update" ON community_alignments;
DROP POLICY IF EXISTS "alignments_service_insert" ON community_alignments;
DROP POLICY IF EXISTS "alignments_service_update" ON community_alignments;
DROP POLICY IF EXISTS "alignments_service_delete" ON community_alignments;
CREATE POLICY "alignments_service_insert" ON community_alignments
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "alignments_service_update" ON community_alignments
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "alignments_service_delete" ON community_alignments
  FOR DELETE TO service_role USING (true);
