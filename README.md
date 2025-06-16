# FF14 零式装備分配システム

FF14零式レイドでの装備分配を公平かつ効率的に行うためのWebアプリケーションです。

## 🚀 利用開始

### オンライン版
- [メインアプリ](https://rnq27gq.github.io/ff14-raid-gear-system/) にアクセス
- 新規チーム作成または既存チームでログイン
- 8人でのリアルタイム共同利用が可能

### デモアカウント
- **チームID**: `demo-team`
- **パスワード**: `demo123`

## ✨ 主な機能

### 装備分配システム
- **Need/Greed/Pass方式**: FF14標準の分配システム
- **優先順位自動計算**: ポジション・装備方針・過去取得履歴を考慮
- **武器分配対応**: 武器箱・直ドロップ武器の希望順位制
- **リアルタイム同期**: 全メンバーの画面が即座に更新

### メンバー管理
- **8ポジション対応**: MT/ST/H1/H2/D1/D2/D3/D4
- **ジョブ管理**: 各ポジションの適切なジョブ割り当て
- **装備希望登録**: 第1～第4希望まで設定可能

### 統計・履歴機能
- **取得統計**: メンバー別の装備取得状況
- **分配履歴**: 過去の分配記録
- **手動編集**: 統計情報の調整機能

## 🛠️ 技術仕様

- **フロントエンド**: HTML/CSS/JavaScript
- **データベース**: Supabase PostgreSQL
- **認証**: チーム単位認証システム
- **データ同期**: リアルタイム更新

## 📋 システム要件

- **ブラウザ**: Chrome, Firefox, Safari, Edge（最新版）
- **ネットワーク**: インターネット接続必須
- **推奨環境**: デスクトップ・タブレット

## 🔧 セットアップ（管理者向け）

データベースのセットアップが必要な場合は [SETUP_GUIDE.md](SETUP_GUIDE.md) を参照してください。

## 📚 使用方法

### 1. チーム作成・ログイン
1. アプリにアクセス
2. 「新しいチームを作成」または既存チームでログイン
3. チーム情報を8人で共有

### 2. 初期設定
1. **メンバー管理**: 8人のプレイヤー情報を登録
2. **装備方針設定**: 各メンバーの装備取得方針を設定
3. **優先順位調整**: 必要に応じてポジション優先順位を調整

### 3. 装備分配
1. **装備分配システム**にアクセス
2. ドロップしたアイテムを選択
3. システムの優先順位計算結果を確認
4. 分配を実行

### 4. 統計・管理
- **統計情報**: 各メンバーの取得状況を確認
- **分配履歴**: 過去の分配記録を参照
- **手動調整**: 必要に応じて統計を編集

## 🏆 分配ロジック

### 優先順位計算
1. **装備方針**: 零式優先 vs トームストーン優先
2. **ポジション優先順位**: D1→D2→D3→D4→MT→ST→H1→H2（調整可能）
3. **動的優先度**: 過去の取得履歴による調整
4. **希望順位**: 武器の第1～第4希望

### スコア計算
- **零式Need**: 1000 + ポジション優先順位 - 動的優先度
- **トームGreed**: 500 + ポジション優先順位 - 動的優先度
- **武器箱**: 2000 + ポジション優先順位 - 動的優先度
- **直ドロ武器**: 3000 + ポジション優先順位 - 希望順位×100 - 動的優先度

## 🚀 テスト運用開始について

### パスワードリセット機能の有効化
新しいパスワードリセット機能を使用するには、Supabaseデータベースに以下のSQLを実行してください：

```sql
-- 必要な拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- teamsテーブルにカラムを追加
ALTER TABLE teams ADD COLUMN IF NOT EXISTS security_question TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS security_answer_hash VARCHAR(255);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS reset_token VARCHAR(100);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);

-- パスワードリセット用関数を作成（詳細は envdoc/quick_password_reset_setup.sql を参照）
```

### テストデータのクリーンアップ
本格運用前にテストデータをクリーンアップする場合：

```sql
-- 全テストデータを削除
DELETE FROM raid_data;
DELETE FROM teams WHERE team_id != 'demo-team';

-- または完全クリーンアップしてdemo-teamを再作成
DELETE FROM raid_data;
DELETE FROM teams;

-- パスワードリセット対応demo-teamを再作成
INSERT INTO teams (team_id, team_name, password_hash, created_by, security_question, security_answer_hash)
VALUES ('demo-team', 'デモチーム', crypt('demo123', gen_salt('bf')), 'システム管理者', 
        '好きなジョブは何ですか？', crypt('竜騎士', gen_salt('bf')));
```

### 新機能
- **パスワードリセット**: セキュリティ質問による安全なパスワード復旧
- **断章交換システム**: 零式装備の断章交換状態管理
- **自動ステータス更新**: 箱取得時の断章交換者状態自動更新
- **ロール別色分け**: タンク(青)・ヒーラー(緑)・DPS(オレンジ)

## 📞 サポート

システムに関する質問や要望は、開発者にお問い合わせください。

## 📄 ライセンス

このプロジェクトは個人利用・チーム利用を目的としています。

---

**🎮 良きFF14ライフを！**