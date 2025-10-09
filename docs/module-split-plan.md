# モジュール分割詳細設計

## 分割方針

### 原則
1. **単一責任の原則**: 各モジュールは1つの明確な責務を持つ
2. **依存関係の最小化**: モジュール間の依存を最小限にする
3. **グローバル状態の集約**: window経由の公開を1箇所で管理
4. **段階的移行**: 各ステップで動作確認可能

### 既存モジュールとの関係
- `config.js` (73行) - 設定値定義、そのまま維持
- `state.js` (78行) - グローバル状態管理、そのまま維持
- `ui.js` (76行) - UI共通関数、そのまま維持
- `utils.js` (34行) - ユーティリティ関数、そのまま維持
- `statistics.js` (25KB) - 統計機能、そのまま維持

## 分割後の構成

### 新規モジュール10個

---

## 1. modules/auth-manager.js (約650行)

### 責務
- Discord OAuth認証
- チームID/パスワード認証
- パスワードリセット
- セッション管理

### 移動する関数 (19個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| tryAutoLogin | 159-193 | localStorageチェック |
| handleInviteTokenAccess | 196-254 | 招待トークン検証 |
| showInviteWelcomeScreen | 257-299 | 招待画面表示 |
| startDiscordAuth | 302-314 | Discord認証開始 |
| startDiscordAuthWithToken | 317-357 | トークン付きDiscord認証 |
| handleDiscordCallback | 360-421 | OAuthコールバック処理 |
| joinTeamWithDiscordAuth | 424-459 | Discord認証後のチーム参加 |
| authenticateTeam | 462-520 | チーム認証 |
| createNewTeam | 523-628 | 新規チーム作成 |
| showSignupForm | 631-650 | 新規登録画面表示 |
| showLoginForm | 653-665 | ログイン画面表示 |
| showPasswordResetForm | 668-683 | パスワードリセット画面 |
| showAuthenticatedState | 686-698 | 認証後UI切り替え |
| logout | 701-725 | ログアウト |
| toggleSettingsMenu | 728-733 | 設定メニュー |
| resetPasswordResetForm | 750-765 | リセットフォーム初期化 |
| getSecurityQuestion | 768-825 | セキュリティ質問取得 |
| verifySecurityAnswer | 828-878 | セキュリティ質問確認 |
| executePasswordReset | 881-935 | パスワードリセット実行 |

### エクスポート
```javascript
export {
    tryAutoLogin,
    handleInviteTokenAccess,
    showInviteWelcomeScreen,
    startDiscordAuth,
    authenticateTeam,
    createNewTeam,
    showSignupForm,
    showLoginForm,
    showPasswordResetForm,
    logout,
    toggleSettingsMenu,
    getSecurityQuestion,
    verifySecurityAnswer,
    executePasswordReset
};
```

### 依存関係
- **読み取り**: `window.supabaseClient`, `window.currentTeamId`, `window.DISCORD_CONFIG`
- **書き込み**: `window.isAuthenticated`, `window.currentTeamId`, `window.resetToken`, `window.resetTeamId`
- **呼び出す他モジュール**: `initializeMainFeatures()` (initialization.js)

---

## 2. modules/data-loader.js (約400行)

### 責務
- Supabaseデータ読み込み
- データ保存
- レイドティア初期化

### 移動する関数 (4個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| initializeMainFeatures | 958-985 | メイン機能初期化 |
| initializeDefaultRaidTier | 988-1035 | レイドティア生成 |
| loadAllData | 1038-1088 | 全データ読み込み |
| saveDataToSupabase | 2195-2208 | 汎用保存ヘルパー |

### エクスポート
```javascript
export {
    initializeMainFeatures,
    initializeDefaultRaidTier,
    loadAllData,
    saveDataToSupabase
};
```

### 依存関係
- **読み取り**: `window.supabaseClient`, `window.currentTeamId`, `window.currentRaidTier`
- **書き込み**: `window.appData`, `window.currentRaidTier`
- **呼び出す他モジュール**: `showTierDashboard()` (dashboard.js)

---

## 3. modules/dashboard.js (約300行)

### 責務
- ダッシュボード表示
- 統合メンバーテーブル
- メンバーデータ保存

### 移動する関数 (4個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| showTierDashboard | 1092-1119 | ダッシュボード表示 |
| renderIntegratedMemberTable | 1129-1231 | テーブルHTML生成 |
| togglePolicyCell | 1234-1247 | 装備方針セル切り替え |
| saveIntegratedMemberData | 1250-1311 | 統合データ保存 |

### エクスポート
```javascript
export {
    showTierDashboard,
    togglePolicyCell,
    saveIntegratedMemberData
};
```

### 依存関係
- **読み取り**: `window.currentRaidTier`, `window.appData.players`
- **書き込み**: `window.appData.players`
- **呼び出す他モジュール**: `getPositionRoleClass()` (utils.js), `saveDataToSupabase()` (data-loader.js)

---

## 4. modules/priority-manager.js (約220行)

### 責務
- 優先順位設定UI
- ドラッグ&ドロップ機能
- 優先順位保存

### 移動する関数 (5個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| showPriorityManagement | 1314-1384 | 優先順位画面表示 |
| initializeDragAndDrop | 1387-1460 | D&D機能初期化 |
| updatePriorityNumbers | 1463-1471 | 番号更新 |
| savePrioritySettings | 1474-1503 | 優先順位保存 |
| resetPrioritySettings | 1506-1528 | デフォルトに戻す |

### エクスポート
```javascript
export {
    showPriorityManagement,
    savePrioritySettings,
    resetPrioritySettings
};
```

### 依存関係
- **読み取り**: `window.appData.settings`, `window.appData.players`, `window.currentRaidTier`
- **書き込み**: `window.appData.settings`
- **呼び出す他モジュール**: `getPositionRoleClass()` (utils.js), `saveDataToSupabase()` (data-loader.js)

---

## 5. modules/player-management.js (約520行)

### 責務
- タブ式プレイヤー設定UI
- プレイヤーデータ保存
- 装備方針・武器希望管理

### 移動する関数 (10個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| showPlayerManagement | 1531-1533 | プレイヤー管理開始 |
| showPlayerSetup | 1536-1538 | プレイヤー設定画面 |
| showTabbedSetup | 1541-1581 | タブUI表示 |
| getTabContent | 1584-1752 | タブコンテンツ生成 |
| saveCurrentTab | 1755-1771 | 現在のタブ保存 |
| saveCurrentTabAndContinue | 1774-1796 | 保存して続行 |
| savePlayersData | 1799-1836 | プレイヤー情報保存 |
| saveEquipmentPolicyData | 1839-1855 | 装備方針保存 |
| saveWeaponWishesData | 1889-1909 | 武器希望保存 |
| getPositionRoleClass | 1122-1126 | ロールクラス取得 (utilsに移動?) |

### エクスポート
```javascript
export {
    showPlayerManagement,
    showTabbedSetup,
    saveCurrentTab,
    saveCurrentTabAndContinue
};
```

### 依存関係
- **読み取り**: `window.appData.players`, `window.currentRaidTier`
- **書き込み**: `window.appData.players`
- **呼び出す他モジュール**: `saveDataToSupabase()` (data-loader.js), `showTierDashboard()` (dashboard.js)

---

## 6. modules/data-import.js (約380行)

### 責務
- JSONインポート
- CSVインポート
- データリセット

### 移動する関数 (7個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| importFromJSON | 1914-1978 | JSONファイルインポート |
| importFromCSV | 2002-2054 | CSVインポート |
| clearCSVData | 2057-2063 | CSVクリア |
| resetAllPlayersData | 2066-2096 | プレイヤーリセット |
| resetCurrentTierData | 2099-2131 | ティアリセット |
| convertImportData | 2134-2171 | データ変換 |
| importConvertedData | 2174-2192 | 変換済みデータ保存 |

### エクスポート
```javascript
// 内部関数 (window公開不要)
export {
    // importFromJSON, importFromCSV は HTML <input> からの呼び出しのみ
};
```

### 依存関係
- **読み取り**: `window.appData`, `window.currentRaidTier`, `window.currentTeamId`
- **書き込み**: `window.appData.players`, `window.appData.allocations`
- **呼び出す他モジュール**: `saveDataToSupabase()` (data-loader.js), `showTabbedSetup()` (player-management.js)

---

## 7. modules/allocation-engine.js (約650行) - 最重要ロジック

### 責務
- 装備分配アルゴリズム
- 優先度計算
- 装備状態管理

### 移動する関数 (10個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| processLayerAllocation | 2265-2282 | 分配処理実行 |
| getLayerDrops | 2285-2314 | ドロップアイテム定義 |
| calculateAllocation | 2317-2396 | 分配計算メイン |
| calculatePlayerPriority | 2399-2526 | プレイヤー優先度計算 |
| getPlayerEquipmentStatus | 2529-2545 | 装備状態取得 |
| hasUnacquiredRaidPlayers | 2548-2564 | 未取得者チェック |
| hasUnacquiredWeaponBoxPlayers | 2567-2583 | 武器箱未取得者チェック |
| isAllEligiblePlayersObtained | 2586-2644 | フリロ判定 |
| getPositionPriority | 2647-2652 | ポジション優先度 |
| getMaterialPriority | 2655-2657 | 素材優先度 |

### エクスポート
```javascript
export {
    processLayerAllocation,
    getLayerDrops,
    calculateAllocation,
    getPlayerEquipmentStatus,
    getPositionPriority
};
```

### 依存関係
- **読み取り**: `window.appData.players`, `window.appData.allocations`, `window.appData.settings`, `window.currentRaidTier`, `window.selectedDirectWeapon`
- **書き込み**: なし (純粋な計算関数)
- **呼び出す他モジュール**: なし (完全に独立)

---

## 8. modules/allocation-ui.js (約550行)

### 責務
- 分配結果表示
- 分配確定処理
- 直ドロップ武器選択

### 移動する関数 (8個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| showEquipmentAllocation | 2211-2236 | 分配画面表示 |
| showLayerAllocation | 2239-2262 | 層別分配開始 |
| displayAllocationResults | 2660-2823 | 結果表示 |
| updateDirectWeapon | 2826-2855 | 直ドロ武器更新 |
| toggleJudgment | 2858-2869 | 判定詳細表示切替 |
| getItemTypeLabel | 2872-2880 | アイテムタイプ名 |
| updateAllocationChoice | 2883-2885 | 選択更新 |
| confirmAllocation | 2888-2982 | 分配確定 |

### 移動する関数（断章交換関連）
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| getCurrentWeek | 2985-3000 | 週番号計算 |
| getItemPriority | 3003-3021 | アイテム優先度 |
| updateTomeExchangeStatus | 3024-3072 | 断章交換ステータス更新 |

### エクスポート
```javascript
export {
    showLayerAllocation,
    confirmAllocation,
    toggleJudgment
};
```

### 依存関係
- **読み取り**: `window.appData.players`, `window.currentRaidTier`, `window.selectedDirectWeapon`
- **書き込み**: `window.appData.allocations`, `window.appData.players`, `window.selectedDirectWeapon`
- **呼び出す他モジュール**:
  - `processLayerAllocation()`, `getLayerDrops()`, `calculateAllocation()` (allocation-engine.js)
  - `saveDataToSupabase()` (data-loader.js)
  - `showTierDashboard()` (dashboard.js)

---

## 9. modules/system-settings.js (約70行)

### 責務
- システム設定画面
- データエクスポート

### 移動する関数 (2個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| showSystemSettings | 3079-3109 | 設定画面表示 |
| exportAllData | 3111-3141 | JSONエクスポート |

### エクスポート
```javascript
export {
    showSystemSettings,
    exportAllData
};
```

### 依存関係
- **読み取り**: `window.appData`, `window.currentRaidTier`
- **書き込み**: なし

---

## 10. modules/initialization.js (約150行)

### 責務
- アプリケーション初期化
- Supabase接続
- 多重初期化防止

### 移動する関数 (5個)
| 関数名 | 行番号 | 備考 |
|--------|--------|------|
| executeInitialization | 27-39 | 初期化実行 |
| initializeApp | 69-153 | Supabase初期化 |
| updateConnectionStatus | 938-940 | 接続状態更新 |
| updateLoadingMessage | 3283-3288 | ローディングメッセージ |
| hideLoadingScreen | 3291-3297 | ローディング非表示 |

### エクスポート
```javascript
export {
    executeInitialization,
    initializeApp
};
```

### 依存関係
- **読み取り**: `window.supabase`, `window.SUPABASE_CONFIG`
- **書き込み**: `window.supabaseClient`, `window.isInitialized`, `window.isInitializing`
- **呼び出す他モジュール**:
  - `tryAutoLogin()` (auth-manager.js)
  - `handleDiscordCallback()` (auth-manager.js)

---

## app.js (最終形態: 約250行)

### 役割
- エントリーポイント
- グローバル関数登録
- 自動Discord認証 (IIFE)

### 残る内容
```javascript
// ===== モジュールインポート =====
import { executeInitialization, initializeApp } from './modules/initialization.js';
import {
    tryAutoLogin,
    authenticateTeam,
    createNewTeam,
    showLoginForm,
    showSignupForm,
    showPasswordResetForm,
    logout,
    toggleSettingsMenu,
    getSecurityQuestion,
    verifySecurityAnswer,
    executePasswordReset,
    startDiscordAuth
} from './modules/auth-manager.js';
import { initializeMainFeatures, saveDataToSupabase } from './modules/data-loader.js';
import { showTierDashboard, togglePolicyCell, saveIntegratedMemberData } from './modules/dashboard.js';
import { showPriorityManagement, savePrioritySettings, resetPrioritySettings } from './modules/priority-manager.js';
import { showPlayerManagement, showTabbedSetup, saveCurrentTab, saveCurrentTabAndContinue } from './modules/player-management.js';
import { showLayerAllocation, confirmAllocation, toggleJudgment } from './modules/allocation-ui.js';
import { showSystemSettings, exportAllData } from './modules/system-settings.js';

// ===== グローバル関数登録 (onclick用) =====
if (typeof window !== 'undefined') {
    // 初期化
    window.executeInitialization = executeInitialization;
    window.initializeApp = initializeApp;

    // 認証
    window.authenticateTeam = authenticateTeam;
    window.createNewTeam = createNewTeam;
    window.showLoginForm = showLoginForm;
    window.showSignupForm = showSignupForm;
    window.showPasswordResetForm = showPasswordResetForm;
    window.logout = logout;
    window.toggleSettingsMenu = toggleSettingsMenu;
    window.getSecurityQuestion = getSecurityQuestion;
    window.verifySecurityAnswer = verifySecurityAnswer;
    window.executePasswordReset = executePasswordReset;
    window.startDiscordAuth = startDiscordAuth;

    // データ
    window.saveDataToSupabase = saveDataToSupabase;

    // ダッシュボード
    window.showTierDashboard = showTierDashboard;
    window.togglePolicyCell = togglePolicyCell;
    window.saveIntegratedMemberData = saveIntegratedMemberData;

    // 優先順位
    window.showPriorityManagement = showPriorityManagement;
    window.savePrioritySettings = savePrioritySettings;
    window.resetPrioritySettings = resetPrioritySettings;

    // プレイヤー管理
    window.showPlayerManagement = showPlayerManagement;
    window.showTabbedSetup = showTabbedSetup;
    window.saveCurrentTab = saveCurrentTab;
    window.saveCurrentTabAndContinue = saveCurrentTabAndContinue;

    // 分配
    window.showLayerAllocation = showLayerAllocation;
    window.confirmAllocation = confirmAllocation;
    window.toggleJudgment = toggleJudgment;

    // システム
    window.showSystemSettings = showSystemSettings;
    window.exportAllData = exportAllData;
}

// ===== 自動Discord認証 (IIFE) =====
(async function autoDiscordAuth() {
    // ... 3192-3280行の内容をそのまま
})();

// ===== イベントリスナー =====
// 設定メニュー外クリック (736-745行)
// JSONファイル選択 (1981-1999行)
```

---

## 分割作業の順序

### フェーズ1: 最も独立したモジュール
1. **system-settings.js** - 依存なし、リスク最小
2. **priority-manager.js** - 軽量、独立性高い

### フェーズ2: データ層
3. **data-loader.js** - 他モジュールが依存
4. **data-import.js** - data-loaderに依存

### フェーズ3: UI層
5. **dashboard.js** - data-loaderに依存
6. **player-management.js** - data-loader, dashboardに依存

### フェーズ4: 認証層
7. **auth-manager.js** - initializationに依存される

### フェーズ5: 最重要ロジック
8. **allocation-engine.js** - 複雑だが独立
9. **allocation-ui.js** - allocation-engineに依存

### フェーズ6: 初期化
10. **initialization.js** - auth-managerに依存

### フェーズ7: 最終整理
11. **app.js** - 全モジュールのインポート&グローバル登録

---

## 各フェーズの作業手順テンプレート

### 例: priority-manager.js 分離

#### 1. ファイル作成
```bash
touch js/modules/priority-manager.js
```

#### 2. 関数をコピー&エクスポート
```javascript
// js/modules/priority-manager.js

// showPriorityManagement (1314-1384行)
export function showPriorityManagement() {
    // ... 元のコードをコピー
}

// initializeDragAndDrop (1387-1460行)
function initializeDragAndDrop() {
    // ... 内部関数なのでエクスポートしない
}

// ... 残りの関数
```

#### 3. app.jsでインポート
```javascript
// js/app.js の先頭に追加
import {
    showPriorityManagement,
    savePrioritySettings,
    resetPrioritySettings
} from './modules/priority-manager.js';
```

#### 4. グローバル登録
```javascript
// js/app.js のグローバル登録セクション
window.showPriorityManagement = showPriorityManagement;
window.savePrioritySettings = savePrioritySettings;
window.resetPrioritySettings = resetPrioritySettings;
```

#### 5. index.htmlにモジュール追加
```html
<!-- index.html -->
<script type="module" src="js/modules/priority-manager.js"></script>
<script type="module" src="js/app.js"></script>
```

#### 6. app.jsから元の関数を削除
- 1314-1528行を削除

#### 7. 動作確認
- ダッシュボード表示
- 「優先順位設定」クリック
- ドラッグ&ドロップ
- 保存機能
- リセット機能
- ブラウザコンソールでエラーチェック

#### 8. コミット
```bash
git add .
git commit -m "モジュール分割: priority-manager.js 分離完了"
```

---

## 期待される最終状態

### ファイル構成
```
js/
├── app.js (250行) - エントリーポイント
├── config.js (73行) - 既存
├── state.js (78行) - 既存
├── ui.js (76行) - 既存
├── utils.js (34行) - 既存
├── statistics.js (25KB) - 既存
└── modules/
    ├── initialization.js (150行)
    ├── auth-manager.js (650行)
    ├── data-loader.js (400行)
    ├── dashboard.js (300行)
    ├── priority-manager.js (220行)
    ├── player-management.js (520行)
    ├── data-import.js (380行)
    ├── allocation-engine.js (650行)
    ├── allocation-ui.js (550行)
    └── system-settings.js (70行)
```

### メリット
1. **可読性**: 各ファイル150-650行で管理しやすい
2. **保守性**: 機能ごとに分離、影響範囲が明確
3. **テスト容易性**: モジュール単位でテスト可能
4. **再利用性**: 独立したモジュールは他プロジェクトでも利用可能
5. **Context容量**: AIが全体を一度に扱える

### 注意事項
1. **ES6モジュール**: type="module" 必須
2. **グローバル公開**: HTML onclick用に window 経由公開必須
3. **import順序**: 依存関係に応じた順序が必要
4. **統計機能**: statistics.js は既に独立しているのでそのまま
