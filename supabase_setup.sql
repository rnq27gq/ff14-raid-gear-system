-- FF14零式装備分配システム用 Supabase テーブル定義

-- 1. メインデータテーブル
CREATE TABLE raid_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL,
    tier_id VARCHAR(50) NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('players', 'allocations', 'settings', 'equipmentData')),
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. チーム管理テーブル
CREATE TABLE teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id VARCHAR(50) UNIQUE NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_access TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. インデックス作成（検索性能向上）
CREATE INDEX idx_raid_data_team_tier ON raid_data(team_id, tier_id);
CREATE INDEX idx_raid_data_type ON raid_data(data_type);
CREATE INDEX idx_teams_team_id ON teams(team_id);

-- 4. Row Level Security (RLS) 設定
ALTER TABLE raid_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- 5. RLS ポリシー（チーム別データアクセス制限）
CREATE POLICY "Teams can only access their own data" ON raid_data
    FOR ALL USING (team_id = current_setting('app.current_team_id', true));

CREATE POLICY "Teams can only access their own team info" ON teams
    FOR ALL USING (team_id = current_setting('app.current_team_id', true));

-- 6. 更新時刻自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_raid_data_updated_at BEFORE UPDATE ON raid_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. サンプルチーム作成（テスト用）
INSERT INTO teams (team_id, team_name, password_hash) VALUES 
('demo-team', 'デモチーム', crypt('demo123', gen_salt('bf')));

-- 8. 必要な拡張機能有効化
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

COMMENT ON TABLE raid_data IS 'FF14レイド装備分配システムのメインデータ';
COMMENT ON TABLE teams IS 'チーム管理とアクセス制御';