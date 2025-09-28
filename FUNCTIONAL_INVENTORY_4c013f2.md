# FF14装備分配システム機能一覧 (4c013f2時点)

## ベースファイル情報
- **ファイル**: index.html (5352行、235KB)
- **関数数**: 109個
- **コミット**: 4c013f2 - UIリファクタリング: 認証画面の表示問題修正、チーム名表示の改善、不要なテスト機能削除

## 主要機能群

### 🔐 認証システム (Authentication System)
#### Discord認証
- `startDiscordAuth()` - Discord OAuth開始
- `handleDiscordCallback()` - Discord認証コールバック処理
- `joinTeamWithDiscordAuth()` - Discord認証でのチーム参加

#### チーム認証
- `authenticateTeam()` - チーム認証処理
- `createNewTeam()` - 新規チーム作成
- `showSignupForm()` / `showLoginForm()` - 認証フォーム表示

#### 招待システム
- `handleInviteTokenAccess()` - 招待トークンアクセス処理
- `showInviteWelcomeScreen()` - 招待画面表示

#### セキュリティ
- `getSecurityQuestion()` - セキュリティ質問取得
- `verifySecurityAnswer()` - セキュリティ回答検証
- `executePasswordReset()` - パスワードリセット実行

### 👥 プレイヤー管理 (Player Management)
#### プレイヤーデータ
- `showPlayerManagement()` - プレイヤー管理画面
- `showTabbedSetup()` - タブ式設定画面
- `savePlayersData()` - プレイヤーデータ保存

#### データインポート
- `importFromJSON()` - JSONからのインポート
- `importFromCSV()` - CSVからのインポート
- `convertImportData()` - インポートデータ変換

#### データ管理
- `resetAllPlayersData()` - 全プレイヤーデータリセット
- `resetCurrentTierData()` - 現在の層データリセット

### ⚔️ 装備分配システム (Equipment Allocation)
#### メイン分配
- `showEquipmentAllocation()` - 装備分配画面
- `showLayerAllocation()` - 層別分配表示
- `processLayerAllocation()` - 層分配処理
- `calculateAllocation()` - 分配計算

#### 優先順位システム
- `calculatePlayerPriority()` - プレイヤー優先順位計算
- `getPositionPriority()` - ポジション優先順位
- `getMaterialPriority()` - 素材優先順位
- `showPriorityManagement()` - 優先順位管理画面

#### 装備判定
- `getPlayerEquipmentStatus()` - プレイヤー装備状況取得
- `hasUnacquiredRaidPlayers()` - 未取得レイド装備プレイヤー確認
- `isAllEligiblePlayersObtained()` - 対象プレイヤー取得完了判定

#### 分配結果
- `displayAllocationResults()` - 分配結果表示
- `confirmAllocation()` - 分配確定
- `updateAllocationChoice()` - 分配選択更新

### 🏆 武器・素材管理 (Weapon & Material Management)
#### 武器分配
- `updateDirectWeapon()` - 直接武器更新
- `hasUnacquiredWeaponBoxPlayers()` - 未取得武器ボックスプレイヤー確認

#### トークン管理
- `updateTomeExchangeStatus()` - トークン交換状況更新
- `getCurrentWeek()` - 現在週取得
- `getItemPriority()` - アイテム優先順位取得

### 📊 統計・分析 (Statistics & Analytics)
#### 統計表示
- `showStatistics()` - 統計画面表示
- `generatePlayerStatistics()` - プレイヤー統計生成
- `calculateStatistics()` - 統計計算

#### 編集機能
- `showStatisticsEditMode()` - 統計編集モード
- `generateEditablePlayerStatistics()` - 編集可能統計生成
- `updateEquipmentStatus()` - 装備状況更新
- `saveStatisticsChanges()` - 統計変更保存

### 📝 履歴管理 (History Management)
#### 分配履歴
- `showAllocationHistory()` - 分配履歴表示
- `generateHistoryTable()` - 履歴テーブル生成
- `filterAllocationHistory()` - 履歴フィルタリング
- `clearAllFilters()` - 全フィルタクリア

### 🏠 ダッシュボード (Dashboard)
#### メインダッシュボード
- `showMainDashboard()` - メインダッシュボード表示
- `displayRaidTiers()` - レイド層表示
- `selectRaidTier()` - レイド層選択
- `showTierDashboard()` - 層ダッシュボード表示

#### 層管理
- `createNewTier()` - 新規層作成
- `showCreateTierForm()` - 層作成フォーム表示
- `submitCreateTier()` - 層作成送信

### ⚙️ システム機能 (System Functions)
#### データ管理
- `initializeApp()` - アプリケーション初期化
- `initializeMainFeatures()` - メイン機能初期化
- `loadAllData()` - 全データ読み込み
- `saveDataToSupabase()` - Supabaseへのデータ保存

#### UI管理
- `showAuthenticatedState()` - 認証済み状態表示
- `showError()` / `showSuccess()` / `showMessage()` - メッセージ表示
- `updateConnectionStatus()` - 接続状況更新
- `logout()` - ログアウト

#### ユーティリティ
- `getPositionRoleClass()` - ポジションロールクラス取得
- `getDisplayTeamName()` - チーム名表示取得
- `getItemTypeLabel()` - アイテムタイプラベル取得

#### システム設定
- `showSystemSettings()` - システム設定表示
- `exportAllData()` - 全データエクスポート

### 🔧 ドラッグ&ドロップ機能
- `initializeDragAndDrop()` - ドラッグ&ドロップ初期化
- `updatePriorityNumbers()` - 優先順位番号更新
- `savePrioritySettings()` - 優先順位設定保存

## 相互依存関係の特徴

1. **グローバル変数共有**: 全関数がグローバルスコープの変数を共有
2. **状態管理**: プレイヤーデータ、装備状況、認証状態が複数関数間で参照
3. **DOM操作**: HTML要素の直接操作が各関数に分散
4. **Supabase連携**: データベース操作が各機能に密結合

## 安全リファクタリングのリスク評価

### 低リスク (分離可能)
- CSS スタイル定義
- 定数・設定値 (DISCORD_CONFIG等)
- 純粋関数 (getPositionRoleClass等)

### 中リスク (慎重に分離)
- ユーティリティ関数群
- メッセージ表示機能
- データ変換処理

### 高リスク (最後に分離)
- 認証システム (状態管理と密結合)
- メイン機能 (複雑な相互依存)
- ダッシュボード (全機能のエントリーポイント)

## 次段階の準備完了

フェーズ1完了: 現状の完全な把握と安全な分離計画の基盤確立