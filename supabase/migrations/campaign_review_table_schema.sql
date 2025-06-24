-- Create campaign_review table for storing comprehensive campaign summaries
-- This table preserves the essence of completed campaigns for posterity and reflection

CREATE TABLE campaign_review (
    id SERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL, -- The comprehensive AI-generated campaign summary
    adventure_title VARCHAR(255), -- The adventure/module name
    final_level INTEGER DEFAULT 1, -- The final level reached by the party
    duration_days INTEGER, -- Campaign duration in days
    character_count INTEGER DEFAULT 0, -- Number of characters in the campaign
    milestone_count INTEGER DEFAULT 0, -- Number of milestones completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_campaign_review_campaign_id ON campaign_review(campaign_id);
CREATE INDEX idx_campaign_review_created_at ON campaign_review(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_campaign_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaign_review_updated_at
    BEFORE UPDATE ON campaign_review
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_review_updated_at();

-- Add comments for documentation
COMMENT ON TABLE campaign_review IS 'Stores comprehensive AI-generated summaries of completed campaigns for player reflection and historical record';
COMMENT ON COLUMN campaign_review.summary IS 'AI-generated narrative summary of the entire campaign journey';
COMMENT ON COLUMN campaign_review.duration_days IS 'Campaign duration calculated from creation to completion';
COMMENT ON COLUMN campaign_review.character_count IS 'Total number of player characters who participated';
COMMENT ON COLUMN campaign_review.milestone_count IS 'Total number of major milestones completed'; 