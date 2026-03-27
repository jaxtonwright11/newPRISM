-- Update reaction types to match PRISM-specific language
-- Old: i_see_this, i_didnt_know_this, i_agree
-- New: this_resonates, seeing_differently, want_to_understand

-- Update existing reactions to new types
UPDATE reactions SET reaction_type = 'this_resonates' WHERE reaction_type = 'i_see_this';
UPDATE reactions SET reaction_type = 'seeing_differently' WHERE reaction_type = 'i_didnt_know_this';
UPDATE reactions SET reaction_type = 'want_to_understand' WHERE reaction_type = 'i_agree';

-- Drop old constraint and add new one
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_reaction_type_check;
ALTER TABLE reactions ADD CONSTRAINT reactions_reaction_type_check
  CHECK (reaction_type IN ('this_resonates', 'seeing_differently', 'want_to_understand'));
