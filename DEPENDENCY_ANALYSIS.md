# 依存関係分析 (index.html)

## 1. 関数間呼び出し関係

### A. 初期化チェーン
```
initializeApp()
├─ tryAutoLogin()
│  ├─ showAuthenticatedState()
│  └─ initializeMainFeatures()
│     └─ loadAllData()
└─ handleDiscordCallback()
   └─ joinTeamWithDiscordAuth()
```

### B. 認証フロー
```
Discord認証系:
startDiscordAuth() → handleDiscordCallback() → joinTeamWithDiscordAuth()

チーム認証系:
authenticateTeam() → showAuthenticatedState() → initializeMainFeatures()

チーム作成系:
createNewTeam() → showLoginForm() → authenticateTeam()

パスワードリセット系:
getSecurityQuestion() → verifySecurityAnswer() → executePasswordReset()
```

### C. UI切り替えチェーン
```
showLoginForm() ←→ showSignupForm() ←→ showPasswordResetForm()
                    ↓
            showAuthenticatedState()
                    ↓
            showMainDashboard()
         ├─ showTierDashboard()
         ├─ showPlayerManagement()
         ├─ showEquipmentAllocation()
         ├─ showPriorityManagement()
         ├─ showStatistics()
         └─ showAllocationHistory()
```

### D. データフロー関係
```
loadAllData()
├─ showMainDashboard() → displayRaidTiers()
├─ showPlayerManagement() → showTabbedSetup()
├─ showEquipmentAllocation() → showLayerAllocation()
└─ showStatistics() → generatePlayerStatistics()
```

## 2. DOM要素依存関係

### A. 主要画面要素
```html
<!-- 認証関連 -->
#authScreen (認証画面コンテナ)
#signupScreen (登録画面)
#passwordResetScreen (パスワードリセット画面)
#mainContent (メインコンテンツ)

<!-- 認証フォーム -->
#mainTeamIdInput (チームID入力)
#mainPasswordInput (パスワード入力)
#signupTeamIdInput (登録チームID)
#signupPasswordInput (登録パスワード)

<!-- メインUI -->
#loggedInControls (ログイン済み制御)
#loggedInTeam (チーム情報表示)
#teamInfo (チーム詳細)
#currentTeamName (現在のチーム名)
```

### B. 機能別DOM要素
```html
<!-- ダッシュボード -->
#dashboard (ダッシュボードコンテナ)
#tierList (層一覧)
#tierDashboard (層ダッシュボード)

<!-- プレイヤー管理 -->
#playerManagement (プレイヤー管理画面)
#tabbedSetup (タブ設定)
#playersTab, #equipmentTab, #weaponTab (各タブ)

<!-- 装備分配 -->
#equipmentAllocation (装備分配画面)
#layerAllocation (層別分配)
#allocationResults (分配結果)

<!-- 統計・履歴 -->
#statistics (統計画面)
#allocationHistory (分配履歴)
```

## 3. イベントハンドラー関係

### A. onclick イベント (HTML内直接記述)
```javascript
// 認証系
onclick="logout()"
onclick="startDiscordAuth()"
onclick="authenticateTeam()"
onclick="createNewTeam()"

// UI切り替え
onclick="showSignupForm()"
onclick="showLoginForm()"
onclick="showPasswordResetForm()"

// パスワードリセット
onclick="getSecurityQuestion()"
onclick="verifySecurityAnswer()"
onclick="executePasswordReset()"

// 機能アクセス
onclick="showPlayerManagement()"
onclick="showEquipmentAllocation()"
onclick="showStatistics()"
onclick="showAllocationHistory()"
```

### B. addEventListener イベント (JavaScript内)
```javascript
// 初期化イベント
window.addEventListener('load', initializeApp)
document.addEventListener('DOMContentLoaded', initializeApp)

// ドラッグ&ドロップ（優先順位設定）
addEventListener('dragstart', ...)
addEventListener('dragover', ...)
addEventListener('drop', ...)

// フォーム送信
addEventListener('submit', ...)
addEventListener('change', ...)
```

## 4. CSS-HTML 関係

### A. クラスベース結合
```css
/* 認証UI */
.auth-card, .auth-btn, .discord-auth-btn
.login-form, .signup-form, .password-reset-form

/* ダッシュボード */
.dashboard-container, .tier-card, .tier-button
.main-dashboard, .tier-dashboard

/* 機能UI */
.player-management, .equipment-allocation
.statistics-container, .history-container

/* ロール別色分け */
.tank, .healer, .dps, .melee, .ranged, .caster
```

### B. ID ベース結合
```css
/* 画面コンテナ */
#authScreen, #mainContent, #dashboard
#playerManagement, #equipmentAllocation

/* フォーム要素 */
#mainTeamIdInput, #mainPasswordInput
#signupTeamIdInput, #signupPasswordInput
```

## 5. グローバル変数依存

### A. 認証状態管理
```javascript
isAuthenticated        // 認証状態
currentTeamId         // 現在のチームID
currentTierId         // 現在の層ID
discordUser           // Discord ユーザー情報
```

### B. データ管理
```javascript
supabaseClient        // Supabase クライアント
allData              // 全データキャッシュ
currentData          // 現在の層データ
```

### C. UI状態管理
```javascript
isInitializing       // 初期化中フラグ
isInitialized        // 初期化完了フラグ
currentView          // 現在の表示画面
```

## 6. 分離リスク評価

### 高リスク (密結合)
- **認証システム**: グローバル状態と深く結合
- **ダッシュボード**: 全機能のエントリーポイント
- **データ管理**: 全機能でグローバル変数を共有

### 中リスク (部分結合)
- **プレイヤー管理**: タブシステムとDOM操作
- **装備分配**: 複雑な計算ロジックと表示
- **統計機能**: データ変換と表示ロジック

### 低リスク (疎結合)
- **CSS定義**: スタイル定義のみ
- **定数設定**: 設定値のみ
- **ユーティリティ関数**: 純粋関数
- **メッセージ表示**: 独立した表示機能

## 安全分離戦略

### Phase 1: CSS分離 (リスク: 極低)
- CSS定義を外部ファイル化
- HTML構造は変更なし

### Phase 2: 設定分離 (リスク: 低)
- DISCORD_CONFIG, SUPABASE_CONFIG
- グローバル定数のみ

### Phase 3: ユーティリティ分離 (リスク: 中)
- getPositionRoleClass, getDisplayTeamName
- 純粋関数の抽出

### Phase 4: UI管理分離 (リスク: 中)
- showError, showSuccess, showMessage
- DOM操作の分離

### Phase 5: 機能単位分離 (リスク: 高)
- 認証 → プレイヤー管理 → 装備分配 → 統計
- 慎重な依存関係の管理が必要