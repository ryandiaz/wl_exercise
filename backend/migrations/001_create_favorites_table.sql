-- Migration: 001_create_favorites_table.sql
-- Description: Create favorites table for storing user's favorite images
-- Created: $(date)

-- Create the favorites table
CREATE TABLE IF NOT EXISTS favorites (
    -- Primary key for the favorites table
    id SERIAL PRIMARY KEY,
    
    -- User identification
    user_id VARCHAR(255) NOT NULL,
    
    -- Image data fields from ImageData interface
    image_id VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_generating BOOLEAN DEFAULT false,
    variations JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_user_image UNIQUE (user_id, image_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_image_id ON favorites(image_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_favorites_updated_at 
    BEFORE UPDATE ON favorites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE favorites IS 'Stores user favorite images with associated metadata';
COMMENT ON COLUMN favorites.user_id IS 'Identifier for the user who favorited the image';
COMMENT ON COLUMN favorites.image_id IS 'Unique identifier for the image from ImageData';
COMMENT ON COLUMN favorites.prompt IS 'The prompt used to generate the image';
COMMENT ON COLUMN favorites.image_url IS 'URL where the image is stored';
COMMENT ON COLUMN favorites.is_generating IS 'Flag indicating if the image is still being generated';
COMMENT ON COLUMN favorites.variations IS 'JSON array of image variation URLs'; 