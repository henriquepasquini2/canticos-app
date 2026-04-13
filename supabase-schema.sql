-- =============================================================
-- Canticos App - Supabase Schema
-- Execute this SQL in the Supabase SQL Editor (Dashboard > SQL)
-- =============================================================

-- 1. Songs catalog
CREATE TABLE IF NOT EXISTS songs (
  id SERIAL PRIMARY KEY,
  number INT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_playable BOOLEAN DEFAULT true,
  is_ready BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sundays
CREATE TABLE IF NOT EXISTS sundays (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Songs played/planned per Sunday (with ordering)
CREATE TABLE IF NOT EXISTS sunday_songs (
  id SERIAL PRIMARY KEY,
  sunday_id INT REFERENCES sundays(id) ON DELETE CASCADE,
  song_id INT REFERENCES songs(id) ON DELETE CASCADE,
  position INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sunday_id, song_id)
);

-- 4. New song suggestions
CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  song_name TEXT NOT NULL,
  artist TEXT,
  suggested_by TEXT NOT NULL,
  reason TEXT,
  link TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','rejeitada')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Comments on Sundays
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  sunday_id INT REFERENCES sundays(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_sunday_songs_sunday ON sunday_songs(sunday_id);
CREATE INDEX IF NOT EXISTS idx_sunday_songs_song ON sunday_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_sundays_date ON sundays(date);
CREATE INDEX IF NOT EXISTS idx_comments_sunday ON comments(sunday_id);

-- =============================================================
-- RLS Policies (open access for anon)
-- =============================================================
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sundays ENABLE ROW LEVEL SECURITY;
ALTER TABLE sunday_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on songs" ON songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sundays" ON sundays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sunday_songs" ON sunday_songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on suggestions" ON suggestions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on comments" ON comments FOR ALL USING (true) WITH CHECK (true);

-- =============================================================
-- Enable Realtime
-- In Supabase Dashboard: Database > Replication > enable tables
-- Or use this SQL:
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sundays;
ALTER PUBLICATION supabase_realtime ADD TABLE sunday_songs;
ALTER PUBLICATION supabase_realtime ADD TABLE suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
