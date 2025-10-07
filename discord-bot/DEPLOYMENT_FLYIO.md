# Fly.io デプロイガイド

このガイドでは、Discord BotをFly.ioに無料でデプロイする手順を説明します。

## 前提条件

- GitHubアカウント
- Discord Bot Token（Discord Developer Portalで取得）
- Supabaseプロジェクト（URL、ANON KEY、SERVICE KEY）

---

## ステップ1: Fly.ioアカウント作成

1. [Fly.io](https://fly.io/app/sign-up)にアクセス
2. GitHubアカウントでサインアップ
3. クレジットカード登録（無料枠内であれば請求なし）

---

## ステップ2: flyctlのインストール

### Linux/macOS
```bash
curl -L https://fly.io/install.sh | sh
```

### Windows (PowerShell)
```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

インストール後、パスを通してください。

---

## ステップ3: Fly.ioにログイン

```bash
flyctl auth login
```

ブラウザが開き、認証を求められます。

---

## ステップ4: アプリケーション作成

discord-botディレクトリに移動:
```bash
cd discord-bot
```

アプリケーションを作成（デプロイはまだしない）:
```bash
flyctl launch --no-deploy
```

質問には以下のように答えてください:
- **App Name**: `ff14-gear-allocation-bot`（または任意の名前）
- **Region**: `nrt` (Tokyo)
- **PostgreSQL**: `No`
- **Redis**: `No`

`fly.toml`ファイルが既に存在する場合は、そのまま使用されます。

---

## ステップ5: 環境変数（Secret）の設定

以下のコマンドで環境変数を設定します:

```bash
flyctl secrets set DISCORD_TOKEN=your_discord_bot_token_here
flyctl secrets set DISCORD_CLIENT_ID=your_discord_client_id_here
flyctl secrets set SUPABASE_URL=your_supabase_project_url
flyctl secrets set SUPABASE_ANON_KEY=your_supabase_anon_key
flyctl secrets set SUPABASE_SERVICE_KEY=your_supabase_service_role_key
flyctl secrets set WEB_APP_URL=https://rnq27gq.github.io/ff14-raid-gear-system
```

各値は`.env`ファイルから取得してください。

---

## ステップ6: 初回デプロイ

```bash
flyctl deploy
```

デプロイには数分かかります。

---

## ステップ7: 動作確認

### ログを確認
```bash
flyctl logs
```

### ステータス確認
```bash
flyctl status
```

### VMの状態確認
```bash
flyctl vm status
```

---

## ステップ8: Discordでテスト

1. DiscordサーバーでBotがオンラインになっているか確認
2. `/share`コマンドを実行
3. 専用URLが生成されることを確認

---

## 更新時のデプロイ

コードを変更した後:

```bash
git add .
git commit -m "更新内容"
git push origin main
cd discord-bot
flyctl deploy
```

---

## トラブルシューティング

### Botがオンラインにならない

```bash
flyctl logs
```

エラーログを確認してください。

### 環境変数の確認

```bash
flyctl secrets list
```

設定済みのSecretが表示されます（値は表示されません）。

### 環境変数の再設定

```bash
flyctl secrets set DISCORD_TOKEN=new_token_here
```

### VMの再起動

```bash
flyctl vm restart
```

### アプリケーションの削除

```bash
flyctl apps destroy ff14-gear-allocation-bot
```

---

## 無料枠の確認

### 使用量の確認

Fly.ioダッシュボード: https://fly.io/dashboard

- メモリ使用量
- CPU使用量
- データ転送量

Discord Bot程度であれば、無料枠（256MB RAM, 共有CPU）で十分です。

---

## コスト管理

無料枠を超えないための設定:

1. `fly.toml`で`memory_mb = 256`に設定済み
2. `min_machines_running = 1`で1台のみ稼働
3. 不要なログは削除（ログは3日間保存）

---

## 便利なコマンド

```bash
# SSHでコンテナに接続
flyctl ssh console

# 環境変数をローカルで確認（デバッグ用）
flyctl ssh console -C "printenv"

# アプリケーション情報
flyctl info

# リージョン変更
flyctl regions set nrt
```

---

## サポート

問題が発生した場合:
- [Fly.io公式ドキュメント](https://fly.io/docs/)
- [Fly.io Community](https://community.fly.io/)
- GitHub Issuesでバグ報告

---

## 次のステップ

- [Discord Bot招待リンクの作成](README.md#discord-developer-portal設定)
- [メインREADMEを更新して招待リンクを公開](../README.md)
