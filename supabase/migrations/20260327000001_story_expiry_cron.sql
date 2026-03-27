-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM posts
  WHERE post_type = 'story'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$;

-- Schedule the cleanup to run every hour
SELECT cron.schedule(
  'cleanup-expired-stories',
  '0 * * * *',  -- every hour at minute 0
  'SELECT cleanup_expired_stories()'
);
