-- RLSポリシー修正: 認証済みユーザーに対してより柔軟なアクセスを許可

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Teams can only access their own data" ON raid_data;
DROP POLICY IF EXISTS "Public read access for demo" ON raid_data;

-- 新しいポリシー: 認証済みユーザーは全てのチームデータにアクセス可能
CREATE POLICY "Authenticated users can access all data" ON raid_data
    FOR ALL USING (true);

-- teams テーブルのポリシーも修正
DROP POLICY IF EXISTS "Teams can only access their own team info" ON teams;
CREATE POLICY "Authenticated users can access team info" ON teams
    FOR ALL USING (true);

-- 匿名ユーザーにも基本的なアクセス権限を付与
GRANT ALL ON raid_data TO anon, authenticated;
GRANT ALL ON teams TO anon, authenticated;

-- シーケンスへのアクセス権限も付与
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;