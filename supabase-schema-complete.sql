-- FF14装備分配システム 完全スキーマ
-- Discord Bot + Webアプリ統合版
-- このSQLをSupabase SQL Editorで実行してください

-- ===========================================
-- Discord Bot用テーブル
-- ===========================================

-- teamsテーブル
CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  creator_name TEXT,
  creator_discord_id TEXT,
  discord_guild_id TEXT,
  discord_channel_id TEXT,
  invite_token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  auth_method TEXT DEFAULT 'discord',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- playersテーブル
CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  raid_tier_id TEXT NOT NULL,
  position TEXT NOT NULL,
  name TEXT NOT NULL,
  job TEXT,
  equipment_policy JSONB,
  weapon_wishes TEXT[],
  dynamic_priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(raid_tier_id, position)
);

-- allocationsテーブル
CREATE TABLE IF NOT EXISTS allocations (
  id BIGSERIAL PRIMARY KEY,
  raid_tier_id TEXT NOT NULL,
  position TEXT NOT NULL,
  slot TEXT NOT NULL,
  status TEXT,
  layer INTEGER,
  week INTEGER,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discord Bot用インデックス
CREATE INDEX IF NOT EXISTS idx_teams_invite_token ON teams(invite_token);
CREATE INDEX IF NOT EXISTS idx_players_raid_tier ON players(raid_tier_id);
CREATE INDEX IF NOT EXISTS idx_allocations_raid_tier ON allocations(raid_tier_id);

-- ===========================================
-- Webアプリ用テーブル
-- ===========================================

-- team_dataテーブル（アプリケーションデータの保存）
CREATE TABLE IF NOT EXISTS team_data (
  id BIGSERIAL PRIMARY KEY,
  team_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, data_type)
);

-- Webアプリ用インデックス
CREATE INDEX IF NOT EXISTS idx_team_data_team_id ON team_data(team_id);
CREATE INDEX IF NOT EXISTS idx_team_data_type ON team_data(team_id, data_type);

-- ===========================================
-- トリガーと関数
-- ===========================================

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- team_dataテーブル用トリガー
DROP TRIGGER IF EXISTS update_team_data_updated_at ON team_data;
CREATE TRIGGER update_team_data_updated_at
  BEFORE UPDATE ON team_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Row Level Security (RLS)
-- ===========================================

-- team_dataテーブルのRLS
ALTER TABLE team_data ENABLE ROW LEVEL SECURITY;

-- 全てのユーザーがデータを読み書きできるポリシー（開発用）
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON team_data;
CREATE POLICY "Enable all access for authenticated users" ON team_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- teamsテーブルのRLS（オプション）
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON teams;
CREATE POLICY "Enable read access for all users" ON teams
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON teams;
CREATE POLICY "Enable insert for all users" ON teams
  FOR INSERT
  WITH CHECK (true);

-- playersテーブルのRLS（オプション）
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for players" ON players;
CREATE POLICY "Enable all access for players" ON players
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- allocationsテーブルのRLS（オプション）
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for allocations" ON allocations;
CREATE POLICY "Enable all access for allocations" ON allocations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- コメント
-- ===========================================

COMMENT ON TABLE teams IS 'Discord Botで作成されたチーム情報';
COMMENT ON TABLE players IS 'レイドメンバーのプレイヤー情報';
COMMENT ON TABLE allocations IS '装備分配履歴';
COMMENT ON TABLE team_data IS 'Webアプリのチームデータ保存テーブル（JSONB形式）';

COMMENT ON COLUMN team_data.team_id IS 'チームID（例: testserver-mgge0aik）';
COMMENT ON COLUMN team_data.data_type IS 'データタイプ（allocations, players, settings, prioritySettings）';
COMMENT ON COLUMN team_data.data IS 'JSONデータ';
