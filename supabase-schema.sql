-- FF14装備分配システム Supabaseスキーマ
-- このSQLをSupabase SQL Editorで実行してください

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

-- インデックス
CREATE INDEX IF NOT EXISTS idx_team_data_team_id ON team_data(team_id);
CREATE INDEX IF NOT EXISTS idx_team_data_type ON team_data(team_id, data_type);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_team_data_updated_at
  BEFORE UPDATE ON team_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) を有効化（オプション）
ALTER TABLE team_data ENABLE ROW LEVEL SECURITY;

-- 全てのユーザーがデータを読み書きできるポリシー（開発用）
CREATE POLICY "Enable all access for authenticated users" ON team_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- コメント
COMMENT ON TABLE team_data IS 'FF14装備分配システムのチームデータ保存テーブル';
COMMENT ON COLUMN team_data.team_id IS 'チームID（例: testserver-mgge0aik）';
COMMENT ON COLUMN team_data.data_type IS 'データタイプ（allocations, players, settings, prioritySettings）';
COMMENT ON COLUMN team_data.data IS 'JSONデータ';
