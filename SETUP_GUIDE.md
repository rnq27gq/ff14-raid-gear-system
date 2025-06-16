# FF14零式装備分配システム - セットアップガイド

## Supabaseデータベースセットアップ

新規登録機能を使用するために、以下のSQLを**Supabaseダッシュボード**で実行してください。

### 1. 必要なSQL文をSQL Editorで実行

```sql
-- 必要な拡張機能有効化
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- テーブル作成
CREATE TABLE IF NOT EXISTS raid_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL,
    tier_id VARCHAR(50) NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('players', 'allocations', 'settings', 'equipmentData')),
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id VARCHAR(50) UNIQUE NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_access TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_raid_data_team_tier ON raid_data(team_id, tier_id);
CREATE INDEX IF NOT EXISTS idx_raid_data_type ON raid_data(data_type);
CREATE INDEX IF NOT EXISTS idx_teams_team_id ON teams(team_id);

-- Row Level Security設定
ALTER TABLE raid_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- 更新時刻自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー作成
DROP TRIGGER IF EXISTS update_raid_data_updated_at ON raid_data;
CREATE TRIGGER update_raid_data_updated_at BEFORE UPDATE ON raid_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- チーム認証関数
CREATE OR REPLACE FUNCTION authenticate_team(p_team_id VARCHAR, p_password VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash VARCHAR;
BEGIN
    SELECT password_hash INTO stored_hash
    FROM teams 
    WHERE team_id = p_team_id;
    
    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF crypt(p_password, stored_hash) = stored_hash THEN
        UPDATE teams SET last_access = NOW() WHERE team_id = p_team_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- チーム作成関数
CREATE OR REPLACE FUNCTION create_team(p_team_id VARCHAR, p_team_name VARCHAR, p_password VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM teams WHERE team_id = p_team_id) THEN
        RAISE EXCEPTION 'チームID % は既に使用されています', p_team_id;
    END IF;
    
    INSERT INTO teams (team_id, team_name, password_hash)
    VALUES (p_team_id, p_team_name, crypt(p_password, gen_salt('bf')));
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- セッション変数設定関数
CREATE OR REPLACE FUNCTION set_team_context(team_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_team_id', team_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLSポリシー
DROP POLICY IF EXISTS "Teams can only access their own data" ON raid_data;
CREATE POLICY "Teams can only access their own data" ON raid_data
    FOR ALL USING (
        team_id = current_setting('app.current_team_id', true) OR
        current_setting('app.current_team_id', true) = ''
    );

DROP POLICY IF EXISTS "Teams can only access their own team info" ON teams;
CREATE POLICY "Teams can only access their own team info" ON teams
    FOR ALL USING (team_id = current_setting('app.current_team_id', true));

-- 公開アクセス用ポリシー（デモ用）
DROP POLICY IF EXISTS "Public read access for demo" ON raid_data;
CREATE POLICY "Public read access for demo" ON raid_data
    FOR SELECT USING (team_id = 'demo-team');

-- 関数実行権限設定
GRANT EXECUTE ON FUNCTION authenticate_team TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_team TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_team_context TO anon, authenticated;

-- デモチーム作成
INSERT INTO teams (team_id, team_name, password_hash) VALUES 
('demo-team', 'デモチーム', crypt('demo123', gen_salt('bf')))
ON CONFLICT (team_id) DO NOTHING;
```

### 2. セットアップ確認

上記のSQLを実行後、以下で確認できます：

```sql
-- テーブル確認
SELECT * FROM teams;

-- 関数確認
SELECT authenticate_team('demo-team', 'demo123'); -- trueが返る
SELECT create_team('test-team', 'テストチーム', 'test123'); -- trueが返る
```

### 3. 使用開始

- Webアプリにアクセス
- 「新しいチームを作成」から新規登録
- または既存のチームIDでログイン

## トラブルシューティング

### 「Could not find the function」エラー
- 上記のSQLが正しく実行されているか確認
- Supabaseの「SQL Editor」で関数の存在を確認

### 権限エラー
- `GRANT EXECUTE` 文が正しく実行されているか確認
- RLSポリシーが適切に設定されているか確認

### 作成済みのデータベースを確認
```sql
-- 既存のテーブル確認
\dt

-- 既存の関数確認
\df
```