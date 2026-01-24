-- ============================================
-- Seed Industries
-- ============================================

INSERT INTO industries (name) VALUES
  ('HAIR'),
  ('NAIL'),
  ('ESTHETIC'),
  ('MASSAGE'),
  ('BARBERSHOP')
ON CONFLICT (name) DO NOTHING;
