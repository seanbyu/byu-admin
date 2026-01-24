-- Add industry_id to service_categories
ALTER TABLE service_categories 
ADD COLUMN industry_id UUID REFERENCES industries(id) ON DELETE SET NULL;

-- Add display_order to salon_industries
ALTER TABLE salon_industries 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Index for performance
CREATE INDEX idx_service_categories_industry ON service_categories(industry_id);
