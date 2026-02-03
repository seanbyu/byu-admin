-- ============================================
-- User Favorite Salons Table (즐겨찾기)
-- ============================================

CREATE TABLE user_favorite_salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Prevent duplicate favorites
  UNIQUE(user_id, salon_id)
);

-- Indexes
CREATE INDEX idx_user_favorites_user ON user_favorite_salons(user_id);
CREATE INDEX idx_user_favorites_salon ON user_favorite_salons(salon_id);
CREATE INDEX idx_user_favorites_created ON user_favorite_salons(created_at DESC);

-- Comments
COMMENT ON TABLE user_favorite_salons IS 'User favorite/bookmarked salons for quick access';
COMMENT ON COLUMN user_favorite_salons.user_id IS 'User who bookmarked the salon';
COMMENT ON COLUMN user_favorite_salons.salon_id IS 'Salon that was bookmarked';

-- ============================================
-- User Favorite Artists Table (아티스트 즐겨찾기)
-- ============================================

CREATE TABLE user_favorite_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Prevent duplicate favorites
  UNIQUE(user_id, artist_id)
);

-- Indexes
CREATE INDEX idx_user_favorite_artists_user ON user_favorite_artists(user_id);
CREATE INDEX idx_user_favorite_artists_artist ON user_favorite_artists(artist_id);
CREATE INDEX idx_user_favorite_artists_created ON user_favorite_artists(created_at DESC);

-- Comments
COMMENT ON TABLE user_favorite_artists IS 'User favorite/bookmarked artists (nail, massage, skincare, hair, etc.) for quick access';
COMMENT ON COLUMN user_favorite_artists.user_id IS 'User who bookmarked the artist';
COMMENT ON COLUMN user_favorite_artists.artist_id IS 'Artist (staff user) that was bookmarked';
