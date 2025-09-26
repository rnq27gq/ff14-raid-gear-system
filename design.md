# FF14装備分配システム Discord連携機能 基本設計書

## 1. システム全体アーキテクチャ

### 1.1 システム構成図
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Discord App   │    │  Discord Bot    │    │  Web Frontend   │
│  (User Client)  │◄──►│   (Node.js)     │◄──►│ (GitHub Pages)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Discord API    │    │   Supabase      │
                       │                 │    │  (Database+     │
                       │                 │    │   OAuth2)       │
                       └─────────────────┘    └─────────────────┘
```

### 1.2 コンポーネント概要
- **Discord Bot**: チーム作成コマンドと固有URL生成
- **Web Frontend**: 既存システム + Discord認証機能
- **Supabase**: データベース + Discord OAuth2認証
- **Discord API**: ユーザー情報取得とボット機能

## 2. データベース設計

### 2.1 既存テーブルの拡張

#### 2.1.1 teams テーブル拡張
```sql
ALTER TABLE teams ADD COLUMN discord_guild_id TEXT;
ALTER TABLE teams ADD COLUMN discord_channel_id TEXT;
ALTER TABLE teams ADD COLUMN creator_discord_id TEXT;
ALTER TABLE teams ADD COLUMN invite_token TEXT;
ALTER TABLE teams ADD COLUMN token_expires_at TIMESTAMP;
ALTER TABLE teams ADD COLUMN auth_method TEXT DEFAULT 'password'; -- 'password' or 'discord'
```

#### 2.1.2 新規テーブル: discord_users
```sql
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
```

#### 2.1.3 新規テーブル: discord_sessions
```sql
CREATE TABLE discord_sessions (
    id SERIAL PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    discord_user_id INTEGER REFERENCES discord_users(id),
    team_id INTEGER REFERENCES teams(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Discordボット設計

### 3.1 ボット基本構成
- **フレームワーク**: Discord.js v14
- **言語**: Node.js
- **ホスティング**: Railway.app または Heroku
- **環境変数**: Discord Token, Supabase接続情報

### 3.2 コマンド設計

#### 3.2.1 /team-create コマンド
```javascript
{
    name: 'team-create',
    description: 'FF14装備分配チームを作成します',
    options: [
        {
            name: 'team-name',
            description: 'チーム名（3-20文字）',
            type: ApplicationCommandOptionType.String,
            required: true,
            min_length: 3,
            max_length: 20
        },
        {
            name: 'leader-name',
            description: 'リーダー名（省略時はDiscordユーザー名）',
            type: ApplicationCommandOptionType.String,
            required: false,
            max_length: 20
        }
    ]
}
```

#### 3.2.2 コマンド処理フロー
```
1. コマンド受信
2. 入力検証（文字数、重複チェック）
3. Supabaseにチーム情報登録
4. 招待トークン生成（UUID v4）
5. 固有URL作成
6. チャンネルに結果投稿
7. DM で詳細情報送信
```

### 3.3 URL生成仕様
```javascript
const inviteToken = crypto.randomUUID();
const inviteURL = `https://your-domain.github.io/FF14_Gear_Allocation_System/?token=${inviteToken}`;
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後
```

### 3.4 エラーハンドリング
- Discord API レート制限対応
- Supabase接続エラー対応
- 重複チーム名エラー処理
- 権限不足エラー処理

## 4. Web認証システム設計

### 4.1 認証フロー設計

#### 4.1.1 Discord OAuth2フロー
```
1. 固有URL アクセス
2. Discord認証ボタン表示
3. Discord OAuth2 認証画面へリダイレクト
4. 認証成功後、コールバック処理
5. ユーザー情報取得・保存
6. セッション作成
7. メインアプリケーションへ遷移
```

#### 4.1.2 OAuth2設定
```javascript
const DISCORD_OAUTH_CONFIG = {
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    redirect_uri: 'https://your-domain.github.io/auth/callback',
    scope: 'identify guilds',
    response_type: 'code'
};
```

### 4.2 フロントエンド設計

#### 4.2.1 認証画面コンポーネント
```javascript
// Discord認証ボタン
function showDiscordAuthScreen(inviteToken) {
    return `
        <div class="discord-auth-screen">
            <div class="auth-card">
                <h2>🎮 Discordでログイン</h2>
                <p>チームへの参加にはDiscord認証が必要です</p>
                <button onclick="startDiscordAuth('${inviteToken}')" 
                        class="discord-auth-btn">
                    <i class="discord-icon"></i>
                    Discordでログイン
                </button>
            </div>
        </div>
    `;
}
```

#### 4.2.2 URL パラメータ処理
```javascript
function handleInviteToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token');
    
    if (inviteToken) {
        validateTokenAndShowAuth(inviteToken);
    } else {
        showDefaultLoginScreen();
    }
}
```

### 4.3 既存認証との統合

#### 4.3.1 認証方式選択画面
```javascript
function showAuthModeSelection() {
    return `
        <div class="auth-mode-selection">
            <h2>ログイン方法を選択</h2>
            <button onclick="showDiscordAuth()" class="auth-mode-btn discord">
                <i class="discord-icon"></i>
                Discordでログイン
            </button>
            <button onclick="showPasswordAuth()" class="auth-mode-btn password">
                <i class="password-icon"></i>
                チームID・パスワード
            </button>
        </div>
    `;
}
```

## 5. API設計

### 5.1 Supabase Edge Functions

#### 5.1.1 Discord認証処理
```javascript
// /functions/discord-auth/index.ts
export default async function handler(req: Request) {
    const { code, state } = await req.json();
    
    // Discord OAuth2 トークン交換
    const tokenResponse = await exchangeCodeForToken(code);
    
    // ユーザー情報取得
    const userInfo = await fetchDiscordUser(tokenResponse.access_token);
    
    // データベース処理
    const user = await upsertDiscordUser(userInfo);
    const session = await createSession(user.id);
    
    return new Response(JSON.stringify({ session_token: session.token }));
}
```

#### 5.1.2 トークン検証処理
```javascript
// /functions/validate-invite/index.ts
export default async function handler(req: Request) {
    const { token } = await req.json();
    
    const team = await supabase
        .from('teams')
        .select('*')
        .eq('invite_token', token)
        .gt('token_expires_at', new Date().toISOString())
        .single();
    
    if (!team.data) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
            status: 400
        });
    }
    
    return new Response(JSON.stringify({ team: team.data }));
}
```

### 5.2 REST API エンドポイント

#### 5.2.1 認証関連
- `POST /auth/discord` - Discord OAuth2認証
- `POST /auth/validate-token` - 招待トークン検証
- `POST /auth/refresh` - セッション更新
- `POST /auth/logout` - ログアウト

#### 5.2.2 チーム関連
- `POST /teams/create-from-discord` - Discordからのチーム作成
- `GET /teams/:id/members` - チームメンバー情報
- `PUT /teams/:id/discord-settings` - Discord設定更新

## 6. セキュリティ設計

### 6.1 認証セキュリティ
- OAuth2 PKCE フロー実装
- CSRF トークン使用
- セッション固定攻撃対策
- XSS 防止ヘッダー設定

### 6.2 トークン管理
- 招待トークンの時間制限（24時間）
- セッショントークンの適切な期限設定
- リフレッシュトークンのローテーション

### 6.3 データ保護
- Discord個人情報の最小限保存
- 暗号化通信の強制
- ログ情報の適切な管理

## 7. エラーハンドリング設計

### 7.1 フロントエンドエラー処理
```javascript
const ERROR_MESSAGES = {
    INVALID_TOKEN: 'リンクが無効または期限切れです',
    AUTH_FAILED: 'Discord認証に失敗しました',
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
    SERVER_ERROR: 'サーバーエラーが発生しました'
};

function handleAuthError(error) {
    const message = ERROR_MESSAGES[error.code] || '予期しないエラーが発生しました';
    showErrorNotification(message);
    logError(error);
}
```

### 7.2 バックエンドエラー処理
- Discord API レート制限処理
- データベース接続エラー処理
- OAuth2認証エラー処理
- 適切なHTTPステータスコード返却

## 8. パフォーマンス最適化

### 8.1 フロントエンド最適化
- 認証画面の遅延読み込み
- Discord OAuth2フローの最適化
- キャッシュ戦略の実装

### 8.2 バックエンド最適化
- データベースクエリの最適化
- Discord API呼び出しの効率化
- セッションストレージの最適化

## 9. 監視・運用設計

### 9.1 監視項目
- Discord認証成功率
- API レスポンス時間
- エラー発生率
- ユーザー満足度

### 9.2 ログ設計
```javascript
const logAuthEvent = (eventType, userId, metadata) => {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: eventType,
        user_id: userId,
        metadata,
        source: 'discord-auth'
    }));
};
```

## 10. デプロイメント設計

### 10.1 Discordボット デプロイ
- Railway.app または Heroku
- 環境変数設定
- 自動デプロイ設定

### 10.2 フロントエンド デプロイ
- GitHub Actions による自動デプロイ
- 環境変数の安全な管理
- 段階的リリース

## 11. テスト設計

### 11.1 ユニットテスト
- Discord OAuth2フロー
- トークン検証ロジック
- セッション管理

### 11.2 統合テスト
- 認証フロー全体
- Discord API連携
- データベース操作

### 11.3 E2Eテスト
- チーム作成から認証まで
- 既存機能との互換性
- エラーケース処理