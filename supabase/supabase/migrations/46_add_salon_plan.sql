-- Add plan_type to salons table with default 'FREE'
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'FREE';

COMMENT ON COLUMN salons.plan_type IS 'Subscription plan type: FREE or PREMIUM';
