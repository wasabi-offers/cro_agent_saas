-- Add goal_step_id to funnels table
-- When set, "Converted" = visitors who reached this step (instead of last step)
-- When null, fallback to last step (current behavior)
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS goal_step_id TEXT REFERENCES funnel_steps(id) ON DELETE SET NULL;
COMMENT ON COLUMN funnels.goal_step_id IS 'Step that counts as conversion. Null = use last step.';
