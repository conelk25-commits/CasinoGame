-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Players table
CREATE TABLE IF NOT EXISTS public.players (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  coins INTEGER DEFAULT 100 NOT NULL,
  total_played INTEGER DEFAULT 0 NOT NULL,
  total_won INTEGER DEFAULT 0 NOT NULL,
  last_refresh TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW()),
  CONSTRAINT coins_non_negative CHECK (coins >= 0)
);

-- Player sessions (for tracking online players)
CREATE TABLE IF NOT EXISTS public.player_sessions (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- Game history
CREATE TABLE IF NOT EXISTS public.game_history (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL, -- 'slots', 'roulette', 'blackjack', 'dice', 'poker'
  bet_amount INTEGER NOT NULL,
  win_amount INTEGER DEFAULT 0,
  game_data JSONB, -- Store game-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- Leaderboard view
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  rank INTEGER,
  total_wins INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_user_id ON public.players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_username ON public.players(username);
CREATE INDEX IF NOT EXISTS idx_player_sessions_player_id ON public.player_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_player_sessions_is_online ON public.player_sessions(is_online);
CREATE INDEX IF NOT EXISTS idx_game_history_player_id ON public.game_history(player_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON public.game_history(created_at);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard(rank);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies for players
CREATE POLICY "Players can view their own profile" 
  ON public.players 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Players can update their own profile" 
  ON public.players 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view all player usernames" 
  ON public.players 
  FOR SELECT 
  USING (true);

-- Row Level Security Policies for player_sessions
CREATE POLICY "Players can manage their own sessions" 
  ON public.player_sessions 
  FOR ALL 
  USING (auth.uid() = (SELECT user_id FROM public.players WHERE id = player_id));

-- Row Level Security Policies for game_history
CREATE POLICY "Players can view their own game history" 
  ON public.game_history 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM public.players WHERE id = player_id));

CREATE POLICY "Players can insert their own game history" 
  ON public.game_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.players WHERE id = player_id));

-- Row Level Security Policies for leaderboard
CREATE POLICY "Everyone can view leaderboard" 
  ON public.leaderboard 
  FOR SELECT 
  USING (true);

-- Function to update player's last_activity and coins
CREATE OR REPLACE FUNCTION update_player_refresh()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('UTC', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for players table
CREATE TRIGGER players_update_timestamp
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION update_player_refresh();

-- Function to auto-refresh coins if player hasn't played in 24 hours
CREATE OR REPLACE FUNCTION auto_refresh_coins()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coins <= 0 OR (NEW.last_refresh IS NULL OR NOW() - NEW.last_refresh > INTERVAL '24 hours') THEN
    IF NEW.coins <= 0 THEN
      NEW.coins = 100;
      NEW.last_refresh = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-refresh
CREATE TRIGGER players_auto_refresh
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION auto_refresh_coins();

-- Create a realtime channel for live updates
-- This is typically managed through Supabase UI, but we can add a function for it
CREATE OR REPLACE FUNCTION notify_player_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'player_update',
    json_build_object(
      'id', NEW.id,
      'coins', NEW.coins,
      'total_played', NEW.total_played,
      'total_won', NEW.total_won
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for realtime notifications
CREATE TRIGGER players_notify_update
  AFTER UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION notify_player_update();

-- Demo account creation function (optional)
CREATE OR REPLACE FUNCTION create_demo_account()
RETURNS TABLE (user_id UUID, email VARCHAR) AS $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Insert demo user if not exists
  INSERT INTO auth.users (
    email, 
    email_confirmed_at, 
    encrypted_password,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    'demo@casino.test',
    NOW(),
    crypt('password123', gen_salt('bf')),
    '{}',
    '{}',
    false,
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING auth.users.id INTO demo_user_id;

  -- Create player profile
  INSERT INTO public.players (user_id, username, email, coins, total_played, total_won)
  VALUES (demo_user_id, 'DemoPlayer', 'demo@casino.test', 100, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY SELECT demo_user_id, 'demo@casino.test'::VARCHAR;
END;
$$ LANGUAGE plpgsql;
