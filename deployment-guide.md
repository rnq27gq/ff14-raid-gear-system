# FF14装備分配システム Discord連携機能 運用開始ガイド

## 📋 概要

このドキュメントは、FF14装備分配システムのDiscord連携機能を本格運用開始するまでの詳細手順を記載しています。

## 🚀 運用開始までの手順

### 1. Discord Developer Portal設定

#### 1.1 Discord Application作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリック
3. アプリケーション名を入力: `FF14装備分配システム`
4. 「Create」をクリック

#### 1.2 OAuth2設定

1. 左メニューから「OAuth2」→「General」を選択
2. 「Redirects」に以下のURLを追加:
   ```
   https://your-domain.github.io/FF14_Gear_Allocation_System/
   ```
   > ⚠️ `your-domain` を実際のGitHub PagesのURLに変更してください

3. 「CLIENT ID」と「CLIENT SECRET」をメモしておく（後でGitHub Secretsに設定）


#### 1.3 Bot設定

1. 左メニューから「Bot」を選択
2. 「Add Bot」をクリック
3. 「TOKEN」を取得してメモしておく（後でGitHub Secretsに設定）
4. Privileged Gateway Intents設定:
   - MESSAGE CONTENT INTENT: ❌ 無効
   - SERVER MEMBERS INTENT: ❌ 無効  
   - PRESENCE INTENT: ❌ 無効

#### 1.4 Slash Commands設定

1. 左メニューから「OAuth2」→「URL Generator」を選択
2. Scopes選択:
   - `bot`
   - `applications.commands`
3. Bot Permissions選択:
   - `Send Messages`
   - `Use Slash Commands`
4. 生成されたURLでDiscordサーバーにボットを招待

---

### 2. Supabaseデータベース設定

#### 2.1 テーブル拡張

Supabase SQL Editorまたはpsqlで以下のSQLを実行:

```sql
-- teams テーブルに列を追加
ALTER TABLE teams 
ADD COLUMN discord_guild_id TEXT,
ADD COLUMN discord_channel_id TEXT,
ADD COLUMN creator_discord_id TEXT,
ADD COLUMN invite_token TEXT UNIQUE,
ADD COLUMN token_expires_at TIMESTAMP,
ADD COLUMN auth_method TEXT DEFAULT 'password';

-- Discord users テーブル作成
CREATE TABLE discord_users (
    id SERIAL PRIMARY KEY,
    discord_id TEXT UNIQUE NOT NULL,
    discord_username TEXT NOT NULL,
    discord_discriminator TEXT,
    discord_avatar TEXT,
    team_id INTEGER REFERENCES teams(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discord sessions テーブル作成
CREATE TABLE discord_sessions (
    id SERIAL PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    discord_user_id INTEGER REFERENCES discord_users(id),
    team_id INTEGER REFERENCES teams(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス追加（パフォーマンス向上）
CREATE INDEX idx_discord_users_discord_id ON discord_users(discord_id);
CREATE INDEX idx_discord_sessions_token ON discord_sessions(session_token);
CREATE INDEX idx_teams_invite_token ON teams(invite_token);
```

#### 2.2 Supabase関数作成

```sql
-- チーム参加用関数
CREATE OR REPLACE FUNCTION join_team_with_discord(
    p_invite_token TEXT,
    p_discord_id TEXT,
    p_discord_username TEXT,
    p_discord_avatar TEXT,
    p_access_token TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_team_record RECORD;
    v_user_id INTEGER;
    v_session_token TEXT;
    v_result JSON;
BEGIN
    -- 招待トークン検証
    SELECT * INTO v_team_record
    FROM teams
    WHERE invite_token = p_invite_token
    AND token_expires_at > NOW()
    AND auth_method = 'discord';

    IF NOT FOUND THEN
        RETURN JSON_BUILD_OBJECT(
            'success', false,
            'error', 'Invalid or expired invite token'
        );
    END IF;

    -- Discord ユーザー作成または更新
    INSERT INTO discord_users (
        discord_id,
        discord_username,
        discord_avatar,
        team_id
    )
    VALUES (
        p_discord_id,
        p_discord_username,
        p_discord_avatar,
        v_team_record.id
    )
    ON CONFLICT (discord_id) 
    DO UPDATE SET
        discord_username = EXCLUDED.discord_username,
        discord_avatar = EXCLUDED.discord_avatar,
        team_id = EXCLUDED.team_id,
        updated_at = NOW()
    RETURNING id INTO v_user_id;

    -- セッション作成
    v_session_token := gen_random_uuid()::TEXT;
    
    INSERT INTO discord_sessions (
        session_token,
        discord_user_id,
        team_id,
        expires_at
    )
    VALUES (
        v_session_token,
        v_user_id,
        v_team_record.id,
        NOW() + INTERVAL '7 days'
    );

    -- 結果返却
    SELECT JSON_BUILD_OBJECT(
        'success', true,
        'team_id', v_team_record.team_id,
        'team_name', v_team_record.team_name,
        'session_token', v_session_token,
        'user_id', v_user_id
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2.3 Row Level Security (RLS) 設定

```sql
-- discord_users テーブル
ALTER TABLE discord_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON discord_users
    FOR SELECT USING (auth.uid()::text = discord_id);

-- discord_sessions テーブル  
ALTER TABLE discord_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON discord_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM discord_users 
            WHERE id = discord_user_id 
            AND discord_id = auth.uid()::text
        )
    );
```

#### 2.4 Supabase Edge Function作成

1. Supabase CLI をインストール:
   ```bash
   npm install supabase --save-dev
   npx supabase login
   ```

2. プロジェクト初期化:
   ```bash
   npx supabase init
   ```

3. Discord認証用Edge Function作成:
   ```bash
   npx supabase functions new discord-auth
   ```

4. `supabase/functions/discord-auth/index.ts` を作成:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { code, state } = await req.json()
    
    // Discord OAuth2 トークン交換
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('DISCORD_CLIENT_ID')!,
        client_secret: Deno.env.get('DISCORD_CLIENT_SECRET')!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: Deno.env.get('DISCORD_REDIRECT_URI')!,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange Discord code for token')
    }

    const tokenData = await tokenResponse.json()
    
    // ユーザー情報取得
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Discord user data')
    }

    const userData = await userResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true,
        tokenData, 
        userData 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 400
      },
    )
  }
})
```

5. Edge Function デプロイ:
   ```bash
   npx supabase functions deploy discord-auth
   ```

---

### 3. GitHub Actions / Secrets設定

#### 3.1 GitHub Secrets追加

1. GitHubリポジトリの Settings > Secrets and variables > Actions に移動
2. 以下のSecretを追加:

```bash
# Discord関連
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_discord_bot_token

# Supabase関連 (既存のものを確認・更新)
SUPABASE_URL=your_supabase_url  
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Discord redirect URI
DISCORD_REDIRECT_URI=https://your-domain.github.io/FF14_Gear_Allocation_System/
```

#### 3.2 GitHub Actions ワークフロー更新

`.github/workflows/deploy.yml` に以下を追加:

```yaml
- name: Replace Discord Configuration
  run: |
    sed -i "s/client_id: '1330616705325465652'/client_id: '${{ secrets.DISCORD_CLIENT_ID }}'/g" index.html
    # 必要に応じて他の設定も置換
```

---

### 4. Discordボット デプロイ

#### 4.1 Railway.app デプロイ

1. [Railway.app](https://railway.app/) アカウント作成
2. GitHub連携設定
3. `discord-bot` ディレクトリをデプロイ用に選択
4. 以下の環境変数を設定:

```bash
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
WEB_APP_URL=https://your-domain.github.io/FF14_Gear_Allocation_System
INVITE_TOKEN_EXPIRY_HOURS=24
```

#### 4.2 コマンド登録

デプロイ後、以下のコマンドを実行:

```bash
# Railway.app のコンソールで実行
cd discord-bot
npm install

# グローバルコマンド登録 (本番用)
node src/deploy-commands.js global

# または特定サーバーでテスト
node src/deploy-commands.js YOUR_GUILD_ID
```

---

### 5. フロントエンド修正

#### 5.1 Discord認証フローの修正

`index.html` の Discord認証処理を修正して、Edge Function経由でトークン交換するように変更:

```javascript
// 既存のコードを以下に置き換え
async function handleDiscordCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (!code || !state) return false;
    
    try {
        showMessage('Discord認証処理中...', 'info');
        
        // Supabase Edge Function経由でトークン交換
        const { data, error } = await window.supabaseClient
            .functions.invoke('discord-auth', {
                body: { code, state }
            });
        
        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        
        // stateデコード
        const stateData = JSON.parse(atob(state));
        const { inviteToken } = stateData;
        
        // チーム参加処理
        await joinTeamWithDiscordAuth(inviteToken, data.userData, data.tokenData.access_token);
        
        return true;
        
    } catch (error) {
        console.error('Discord認証エラー:', error);
        showError('Discord認証に失敗しました: ' + error.message);
        
        // URLからパラメータをクリア
        window.history.replaceState({}, document.title, window.location.pathname);
        return false;
    }
}
```

---

### 6. テスト手順

#### 6.1 開発環境テスト

```bash
# 1. Discordボット起動確認
# Railway.appのログを確認してエラーがないことを確認

# 2. コマンド動作確認
# Discordサーバーで /team-create テストチーム を実行

# 3. 生成されたURLにアクセスして動作確認
```

#### 6.2 統合テストシナリオ

##### テストシナリオ1: 正常フロー
1. ✅ Discordで `/team-create テストチーム` 実行
2. ✅ 生成された招待URLにアクセス
3. ✅ Discord認証ボタンをクリック
4. ✅ Discord認証完了後、チーム画面に遷移確認
5. ✅ メンバー管理でDiscordユーザーが表示確認
6. ✅ 既存の装備分配機能が正常動作確認

##### テストシナリオ2: エラーハンドリング
1. ✅ 期限切れトークンでアクセス → 適切なエラーメッセージ表示
2. ✅ 無効なトークンでアクセス → 適切なエラーメッセージ表示
3. ✅ Discord認証キャンセル → 元の画面に戻る
4. ✅ ネットワークエラー時の挙動確認

##### テストシナリオ3: 既存機能との互換性
1. ✅ 従来のチームID・パスワード認証が動作
2. ✅ 既存チームデータが正常に保持
3. ✅ 装備分配システムの全機能が正常動作

---

### 7. 運用監視設定

#### 7.1 ログ監視設定

**Discordボット側:**
```javascript
// src/commands/team-create.js に追加
console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'team_created',
    team_id: teamData.team_id,
    discord_guild_id: interaction.guild?.id,
    discord_user_id: interaction.user.id
}));
```

**フロントエンド側:**
```javascript
// index.html に追加
window.addEventListener('error', (event) => {
    console.error('Frontend error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        timestamp: new Date().toISOString()
    });
});
```

#### 7.2 Supabase監視クエリ

```sql
-- 使用状況監視
SELECT 
    DATE(created_at) as date,
    auth_method,
    COUNT(*) as team_count
FROM teams 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), auth_method
ORDER BY date DESC;

-- Discord認証ユーザー数
SELECT COUNT(*) as discord_users_count 
FROM discord_users 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- アクティブセッション数
SELECT COUNT(*) as active_sessions 
FROM discord_sessions 
WHERE expires_at > NOW();
```

---

### 8. ドキュメント更新

#### 8.1 README.md更新項目

以下の内容をREADME.mdに追加:

```markdown
## Discord連携機能

### チーム作成 (新機能)

#### Discord経由での作成
1. DiscordサーバーでFF14装備分配ボットを招待
2. `/team-create チーム名` コマンドを実行
3. 生成された招待URLをチームメンバーに共有
4. メンバーは招待URLからDiscord認証でチームに参加

#### 従来方式 (継続サポート)
- チームID・パスワード方式も引き続き利用可能
- 既存チームは従来通り使用できます

### トラブルシューティング

#### Discord認証でエラーが発生する場合
1. ブラウザのキャッシュをクリア
2. プライベートブラウジングモードで再試行
3. Discord側でアプリ連携を一度解除してから再認証

#### 招待URLが期限切れの場合
- 招待URLの有効期限は24時間です
- チームリーダーに新しい招待URL生成を依頼してください
```

#### 8.2 運用手順書作成

`operation-guide.md` を作成:

```markdown
# 運用手順書

## 日次運用
- [ ] Discordボットの稼働状況確認
- [ ] エラーログの確認
- [ ] 新規チーム作成数の確認

## 週次運用  
- [ ] データベース使用量の確認
- [ ] 非アクティブセッションの清掃
- [ ] パフォーマンス指標の確認

## 月次運用
- [ ] 利用統計レポートの作成
- [ ] バックアップ状況の確認
- [ ] セキュリティ更新の確認

## 障害対応
### Discordボット停止時
1. Railway.appのログを確認
2. 環境変数の設定確認
3. Discord API状況確認
4. 必要に応じてサービス再起動

### Webアプリケーション障害時
1. GitHub Pages の状況確認
2. Supabaseの稼働状況確認
3. ブラウザコンソールでエラー確認
4. 必要に応じてロールバック実行
```

---

## 🎯 運用開始チェックリスト

### Phase 1: 基盤設定
- [ ] Discord Developer Portal設定完了
- [ ] Discord Application OAuth2設定完了
- [ ] Discord Bot作成・トークン取得完了
- [ ] Discordサーバーにボット招待完了

### Phase 2: データベース設定
- [ ] Supabaseテーブル拡張完了
- [ ] Supabase関数作成完了
- [ ] RLSポリシー設定完了
- [ ] Edge Function作成・デプロイ完了

### Phase 3: デプロイメント設定
- [ ] GitHub Secrets設定完了
- [ ] GitHub Actions ワークフロー更新完了
- [ ] Railway.app デプロイ完了
- [ ] Discordコマンド登録完了

### Phase 4: コード修正
- [ ] フロントエンドのDiscord認証フロー修正完了
- [ ] セキュリティ問題(Client Secret露出)修正完了

### Phase 5: テスト実施
- [ ] 正常フローテスト完了
- [ ] エラーハンドリングテスト完了
- [ ] 既存機能互換性テスト完了
- [ ] パフォーマンステスト完了

### Phase 6: 運用準備
- [ ] 監視設定完了
- [ ] ログ設定完了
- [ ] ドキュメント更新完了
- [ ] 運用手順書作成完了

### Phase 7: 運用開始
- [ ] 本番環境デプロイ完了
- [ ] 利用者向けアナウンス実施
- [ ] 初期運用監視開始

---

## 📞 サポート情報

### 開発者向け
- **GitHub Repository**: [リポジトリURL]
- **Discord Developer Portal**: https://discord.com/developers/applications
- **Supabase Dashboard**: [プロジェクトURL]
- **Railway.app Dashboard**: [デプロイ先URL]

### ユーザー向け
- **利用ガイド**: README.md参照
- **トラブルシューティング**: よくある質問を参照
- **お問い合わせ**: [連絡先情報]

---

**最終更新日**: 2025年9月26日  
**バージョン**: 1.0.0