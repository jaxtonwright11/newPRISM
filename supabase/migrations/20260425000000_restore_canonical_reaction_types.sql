-- Restore canonical PRISM reaction types.
-- The product contract only allows: i_see_this, i_didnt_know_this, i_agree.

UPDATE reactions SET reaction_type = 'i_see_this' WHERE reaction_type = 'this_resonates';
UPDATE reactions SET reaction_type = 'i_didnt_know_this' WHERE reaction_type = 'seeing_differently';
UPDATE reactions SET reaction_type = 'i_agree' WHERE reaction_type = 'want_to_understand';

ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_reaction_type_check;
ALTER TABLE reactions ADD CONSTRAINT reactions_reaction_type_check
  CHECK (reaction_type IN ('i_see_this', 'i_didnt_know_this', 'i_agree'));
