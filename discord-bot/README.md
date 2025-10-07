# FF14装備分配システム Discord Bot

このDiscord Botは、FF14の零式レイドで装備を公平に分配するためのWebアプリケーションと連携します。

## 機能

- `/share` コマンドでチーム専用URLを作成
- Supabaseと連携してデータを保存
- GitHub Pagesでホストされているフロントエンドと連携

---

## セルフホストガイド

自分でBotを運営したい場合の手順です。

### 必要なアカウント

1. [Discord Developer Portal](https://discord.com/developers/applications)
2. [Supabase](https://supabase.com/)
3. [Fly.io](https://fly.io/)（無料ホスティング）

---

## ステップ1: Discord Bot作成

### 1.1 Discord Developer Portalにアクセス

https://discord.com/developers/applications

### 1.2 New Applicationをクリック

- Name: `FF14 Gear Allocation Bot`（任意）
- Create

### 1.3 Botタブに移動

- Add Botをクリック
- Yes, do it!

### 1.4 Bot Tokenをコピー

- Reset Tokenをクリック
- Tokenをコピーして安全な場所に保存
- このTokenは後で使用します

### 1.5 Bot設定

以下をONにします:
- ✅ Public Bot（他のユーザーが招待できるようにする場合）
- ❌ Require OAuth2 Code Grant（OFFのまま）

Privileged Gateway Intents:
- ❌ Presence Intent（不要）
- ❌ Server Members Intent（不要）
- ❌ Message Content Intent（不要）

### 1.6 OAuth2タブに移動

- CLIENT IDをコピーして保存

### 1.7 Bot招待URLを生成

OAuth2 > URL Generator:
- SCOPES: `bot`, `applications.commands`
- BOT PERMISSIONS: `Send Messages`, `Use Slash Commands`

生成されたURLをコピー。これがBot招待リンクです。

---

## ステップ2: Supabase設定

### 2.1 Supabaseプロジェクト作成

https://supabase.com/

- New Project
- Project name: `ff14-gear-allocation`
- Database Password: 強力なパスワードを設定
- Region: Northeast Asia (Tokyo)

### 2.2 テーブル作成

SQL Editorで以下を実行:

```sql
-- teamsテーブル
CREATE TABLE teams (
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
CREATE TABLE players (
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
CREATE TABLE allocations (
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

-- インデックス
CREATE INDEX idx_teams_invite_token ON teams(invite_token);
CREATE INDEX idx_players_raid_tier ON players(raid_tier_id);
CREATE INDEX idx_allocations_raid_tier ON allocations(raid_tier_id);
```

### 2.3 API Keysを取得

Settings > API:
- Project URL をコピー
- anon public key をコピー
- service_role key をコピー（ShowをクリックしてからRetrieveにチェックを入れる）

---

## ステップ3: ローカル環境設定

### 3.1 リポジトリをクローン

```bash
git clone https://github.com/rnq27gq/ff14-raid-gear-system.git
cd ff14-raid-gear-system/discord-bot
```

### 3.2 依存関係をインストール

```bash
npm install
```

### 3.3 .envファイルを作成

`.env.example`をコピーして`.env`を作成:

```bash
cp .env.example .env
```

`.env`を編集:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Application Configuration
WEB_APP_URL=https://rnq27gq.github.io/ff14-raid-gear-system
INVITE_TOKEN_EXPIRY_HOURS=24
```

### 3.4 コマンドをデプロイ

```bash
npm run deploy
```

成功すると`Successfully reloaded application commands.`と表示されます。

### 3.5 Botを起動

```bash
npm start
```

---

## ステップ4: Discordでテスト

1. 先ほど生成した招待URLでBotを自分のサーバーに追加
2. Discordサーバーで `/share` コマンドを実行
3. 専用URLが生成されることを確認

---

## ステップ5: Fly.ioにデプロイ（常時起動）

ローカルテストが完了したら、Fly.ioにデプロイして24時間稼働させます。

詳細は [DEPLOYMENT_FLYIO.md](./DEPLOYMENT_FLYIO.md) を参照してください。

---

## 開発

### ローカル開発モード

```bash
npm run dev
```

ファイル変更時に自動的に再起動します。

### テスト

```bash
npm test
```

---

## トラブルシューティング

### Botがオンラインにならない

- `.env`ファイルの`DISCORD_TOKEN`が正しいか確認
- Discord Developer Portalでトークンをリセットして再設定

### `/share`コマンドが表示されない

- `npm run deploy`を実行してコマンドを登録
- グローバルコマンドは反映に最大1時間かかる場合あり

### Supabaseエラー

- `.env`ファイルの`SUPABASE_URL`と各KEYが正しいか確認
- Supabaseのテーブルが作成されているか確認

### コマンドデプロイエラー

- `DISCORD_CLIENT_ID`が正しいか確認
- Botに`applications.commands`スコープが付与されているか確認

---

## ファイル構成

```
discord-bot/
├── src/
│   ├── bot.js              # メインBot起動スクリプト
│   ├── deploy-commands.js  # コマンド登録スクリプト
│   └── commands/
│       └── share.js        # /shareコマンド実装
├── test/                   # テストファイル
├── .env.example            # 環境変数テンプレート
├── .env                    # 環境変数（gitignore済み）
├── package.json
├── fly.toml                # Fly.io設定
├── Dockerfile              # Docker設定
├── README.md               # このファイル
└── DEPLOYMENT_FLYIO.md     # デプロイガイド
```

---

## ライセンス

MIT License

---

## サポート

問題が発生した場合:
- [GitHub Issues](https://github.com/rnq27gq/ff14-raid-gear-system/issues)
