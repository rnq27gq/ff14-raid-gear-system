 # FF14零式装備分配管理システム (GitHub連携版)

  8人固定パーティでのFF14零式レイド装備分配を効率的に管理し、チーム全員でリアルタイム共有できるWe
  bアプリケーション。

  ## 🎯 プロジェクト概要

  - **目的**: 8人全員が同じデータを更新・参照できる装備分配システム
  - **技術**: GitHub API + GitHub Pages による無料ホスティング
  - **データ管理**: JSONファイル + Git履歴による変更追跡

  ## 📋 開発進捗

  ### ✅ 完了済み作業

  #### **Phase 1: GitHubリポジトリセットアップ**
  - [x] GitHubリポジトリ作成: `ff14-raid-gear-system`
  - [x] Personal Access Token作成・保存済み
  - [x] ローカルリポジトリクローン完了
  - [x] 基本ディレクトリ構造作成済み

  #### **Phase 2: データファイル初期化**
  - [x] `data/` ディレクトリ作成
  - [x] 初期JSONファイル作成完了:
    - `data/raid-tiers.json` - レイドティア管理
    - `data/players.json` - プレイヤー情報
    - `data/allocations.json` - 分配履歴
    - `data/settings.json` - システム設定
  - [x] VSCodeで文字コード確認済み（UTF-8, LF, BOMなし）
  - [x] GitHubにpush済み

  ### 🔄 現在の状況

  **リポジトリ状態:**
  ff14-raid-gear-system/
  ├── data/
  │   ├── raid-tiers.json    ✅ 作成済み
  │   ├── players.json       ✅ 作成済み
  │   ├── allocations.json   ✅ 作成済み
  │   └── settings.json      ✅ 作成済み
  ├── js/                    📁 空（次の作業対象）
  ├── css/                   📁 空
  ├── index.html             📄 空
  └── README.md              📄 このファイル

  ### 🎯 次回作業開始時の手順

  #### **作業再開コマンド**
  ```bash
  # 1. 作業ディレクトリに移動
  cd ~/ff14-raid-gear-system

  # 2. 最新状態を確認
  git status
  git pull origin main

  # 3. VSCodeでプロジェクトを開く
  code .

  # 4. 作業続行 (次の実装タスクを参照)

  次の実装タスク: Step 3 - GitHub API連携

  優先度順に実装:

  1. js/github-api.js - GitHubAPI連携クラス
  class GitHubAPI {
      constructor() {
          this.owner = 'hirqt';  // GitHubユーザー名
          this.repo = 'ff14-raid-gear-system';
          // データ取得・保存メソッド
      }
  }
  2. js/auth.js - 認証管理クラス
  class AuthManager {
      // Personal Access Token管理
      // ログイン・ログアウト機能
  }
  3. js/data-sync.js - データ同期クラス
  class DataSyncManager {
      // ローカル⇔GitHub双方向同期
      // 競合解決機能
  }
  4. index.html - 既存システムの統合
    - GitHub認証UI追加
    - 同期ステータス表示
    - 既存機能の移植

  ⚙️ 技術設定

  GitHub設定:
  - リポジトリ: hirqt/ff14-raid-gear-system
  - ブランチ: main
  - Personal Access Token: ローカル管理

  コード設定値:
  // GitHub API設定
  this.owner = 'hirqt';
  this.repo = 'ff14-raid-gear-system';
  this.baseURL = 'https://api.github.com/repos/hirqt/ff14-raid-gear-system/contents';

  📚 データ構造設計

  JSONファイル構成

  raid-tiers.json

  {
    "raidTiers": [],           // レイドティア一覧
    "activeRaidTierId": null,  // アクティブなティアID
    "lastUpdated": "ISO8601",  // 最終更新日時
    "updatedBy": "username"    // 更新者
  }

  players.json

  {
    "players": {},             // プレイヤー情報（ティアIDごと）
    "lastUpdated": "ISO8601",
    "updatedBy": "username"
  }

  allocations.json

  {
    "allocations": {},         // 分配履歴（ティアIDごと）
    "lastUpdated": "ISO8601",
    "updatedBy": "username"
  }

  settings.json

  {
    "teamMembers": [],         // チームメンバー一覧
    "permissions": {},         // 権限設定
    "lastUpdated": "ISO8601",
    "updatedBy": "username"
  }

  🔧 開発環境

  - OS: Linux (WSL2)
  - エディタ: VSCode
  - 文字コード: UTF-8, LF, BOMなし
  - Git: 設定済み
  - GitHub: Personal Access Token取得済み

  ⚠️ 重要事項

  1. Personal Access Token: 安全な場所に保管
  2. GitHub API制限: 認証済みで5000リクエスト/時間
  3. チームメンバー招待: システム実装完了後に実施

  📞 次回開始時の確認項目

  # 作業環境確認
  pwd                    # ~/ff14-raid-gear-system
  ls -la data/          # 4つのJSONファイル確認
  git log --oneline     # コミット履歴確認

  ---
  📅 次回作業開始時: Step 3-1 GitHub APIクラス実装から再開

  🚀 将来の機能

  - リアルタイム同期
  - Discord連携通知
  - 分配履歴の可視化
  - 装備優先度の自動調整
  - モバイル対応UI