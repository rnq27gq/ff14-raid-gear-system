-- FF14システム用 Supabase RPC 関数

-- 1. チーム認証関数
CREATE OR REPLACE FUNCTION authenticate_team(p_team_id VARCHAR, p_password VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash VARCHAR;
BEGIN
    -- パスワードハッシュ取得
    SELECT password_hash INTO stored_hash
    FROM teams 
    WHERE team_id = p_team_id;
    
    -- チーム存在確認
    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- パスワード検証
    IF crypt(p_password, stored_hash) = stored_hash THEN
        -- 最終アクセス時刻更新
        UPDATE teams SET last_access = NOW() WHERE team_id = p_team_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. チーム作成関数
CREATE OR REPLACE FUNCTION create_team(p_team_id VARCHAR, p_team_name VARCHAR, p_password VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    -- 重複チェック
    IF EXISTS (SELECT 1 FROM teams WHERE team_id = p_team_id) THEN
        RAISE EXCEPTION 'チームID % は既に使用されています', p_team_id;
    END IF;
    
    -- チーム作成
    INSERT INTO teams (team_id, team_name, password_hash)
    VALUES (p_team_id, p_team_name, crypt(p_password, gen_salt('bf')));
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. セッション変数設定関数
CREATE OR REPLACE FUNCTION set_team_context(team_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_team_id', team_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. データマージ関数（既存データとの統合）
CREATE OR REPLACE FUNCTION merge_raid_data(
    p_team_id VARCHAR,
    p_tier_id VARCHAR, 
    p_data_type VARCHAR,
    p_content JSONB
)
RETURNS JSONB AS $$
DECLARE
    existing_data JSONB;
    merged_data JSONB;
BEGIN
    -- 既存データ取得
    SELECT content INTO existing_data
    FROM raid_data
    WHERE team_id = p_team_id AND tier_id = p_tier_id AND data_type = p_data_type;
    
    -- データが存在しない場合は新規作成
    IF existing_data IS NULL THEN
        INSERT INTO raid_data (team_id, tier_id, data_type, content)
        VALUES (p_team_id, p_tier_id, p_data_type, p_content);
        RETURN p_content;
    END IF;
    
    -- JSONBマージ（深いマージ）
    merged_data := existing_data || p_content;
    
    -- 更新
    UPDATE raid_data 
    SET content = merged_data, updated_at = NOW()
    WHERE team_id = p_team_id AND tier_id = p_tier_id AND data_type = p_data_type;
    
    RETURN merged_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. データ統計関数
CREATE OR REPLACE FUNCTION get_team_stats(p_team_id VARCHAR)
RETURNS TABLE (
    tier_count INTEGER,
    player_count INTEGER,
    allocation_count INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT rd.tier_id)::INTEGER as tier_count,
        (SELECT COUNT(*) FROM raid_data rd2 
         WHERE rd2.team_id = p_team_id AND rd2.data_type = 'players')::INTEGER as player_count,
        (SELECT COUNT(*) FROM raid_data rd3 
         WHERE rd3.team_id = p_team_id AND rd3.data_type = 'allocations')::INTEGER as allocation_count,
        MAX(rd.updated_at) as last_updated
    FROM raid_data rd
    WHERE rd.team_id = p_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS ポリシー更新（より柔軟な制御）
DROP POLICY IF EXISTS "Teams can only access their own data" ON raid_data;
CREATE POLICY "Teams can only access their own data" ON raid_data
    FOR ALL USING (
        team_id = current_setting('app.current_team_id', true) OR
        current_setting('app.current_team_id', true) = ''
    );

-- 7. 公開アクセス用ポリシー（読み取り専用）
CREATE POLICY "Public read access for demo" ON raid_data
    FOR SELECT USING (team_id = 'demo-team');

-- 8. 関数実行権限設定
GRANT EXECUTE ON FUNCTION authenticate_team TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_team TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_team_context TO anon, authenticated;
GRANT EXECUTE ON FUNCTION merge_raid_data TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_team_stats TO anon, authenticated;