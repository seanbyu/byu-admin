-- ============================================
-- Rename designer_id to artist_id in bookings table
-- ============================================

-- Rename the column
ALTER TABLE bookings RENAME COLUMN designer_id TO artist_id;

-- Update the index name
DROP INDEX IF EXISTS idx_bookings_designer;
CREATE INDEX idx_bookings_artist ON bookings(artist_id);

DROP INDEX IF EXISTS idx_bookings_designer_date;
CREATE INDEX idx_bookings_artist_date ON bookings(artist_id, booking_date, start_time);

-- Update foreign key constraint name (optional, for clarity)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_designer_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_artist_id_fkey
  FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update column comment
COMMENT ON COLUMN bookings.artist_id IS 'References users(id) - the artist/staff performing the service';
