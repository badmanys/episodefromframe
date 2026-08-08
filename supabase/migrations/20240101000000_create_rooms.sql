-- Smaže starou tabulku, pokud existuje, abychom začali s čistým štítem
DROP TABLE IF EXISTS rooms;

-- Vytvoří tabulku rooms
CREATE TABLE rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  anime_id text,
  frames jsonb NOT NULL,
  player1_score integer DEFAULT 0,
  player2_score integer DEFAULT 0,
  player1_guess jsonb,
  player2_guess jsonb,
  current_round integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Zapne Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Povolí všem uživatelům (včetně anonymních) vkládat řádky (INSERT)
CREATE POLICY "Enable insert for all users" ON rooms
  FOR INSERT WITH CHECK (true);

-- Povolí všem uživatelům (včetně anonymních) číst všechny řádky (SELECT)
CREATE POLICY "Enable select for all users" ON rooms
  FOR SELECT USING (true);

-- Povolí všem uživatelům (včetně anonymních) upravovat všechny řádky (UPDATE)
CREATE POLICY "Enable update for all users" ON rooms
  FOR UPDATE USING (true);

-- DŮLEŽITÉ: Zapne Realtime pro tuto tabulku, aby se změny (připojení hráče, tipy) okamžitě posílaly
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;
