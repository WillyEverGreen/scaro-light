-- Edgecase PostgreSQL Initialization Script
-- This script runs when the PostgreSQL container starts for the first time

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create indexes for full-text search (optional enhancement)
-- These will be created by SQLAlchemy models, but we can add extra here

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE edgecase TO edgecase;

-- Log successful initialization
DO $$ 
BEGIN
    RAISE NOTICE 'Edgecase database initialized successfully';
END $$;
