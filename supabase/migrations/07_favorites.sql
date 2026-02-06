-- ============================================
-- User Favorites (Salons & Artists)
-- ============================================

-- ============================================
-- User Favorite Salons
-- ============================================
CREATE TABLE user_favorite_salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, salon_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorite_salons(user_id);
CREATE INDEX idx_user_favorites_salon ON user_favorite_salons(salon_id);
CREATE INDEX idx_user_favorites_created ON user_favorite_salons(created_at DESC);

COMMENT ON TABLE user_favorite_salons IS 'User favorite/bookmarked salons';

-- ============================================
-- User Favorite Artists
-- ============================================
CREATE TABLE user_favorite_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, artist_id)
);

CREATE INDEX idx_user_favorite_artists_user ON user_favorite_artists(user_id);
CREATE INDEX idx_user_favorite_artists_artist ON user_favorite_artists(artist_id);
CREATE INDEX idx_user_favorite_artists_created ON user_favorite_artists(created_at DESC);

COMMENT ON TABLE user_favorite_artists IS 'User favorite/bookmarked artists';
