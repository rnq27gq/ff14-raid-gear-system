# app.js 完全解析ドキュメント

## 基本情報
- **ファイルパス**: `js/app.js`
- **総行数**: 3,337行
- **ファイルサイズ**: 162KB
- **関数総数**: 68個
- **グローバル公開関数**: 30個

## 関数一覧

| 関数名 | 行番号 | 種別 | 依存関数 | グローバル変数 | window公開 |
|--------|--------|------|----------|----------------|-----------|
| executeInitialization | 27-39 | async | initializeApp | isInitialized, isInitializing | ❌ |
| initializeApp | 69-153 | async | tryAutoLogin, handleDiscordCallback, updateConnectionStatus | supabaseClient, isAuthenticated, currentTeamId | ✅ |
| tryAutoLogin | 159-193 | async | handleInviteTokenAccess, showAuthenticatedState, initializeMainFeatures | currentTeamId, supabaseClient | ❌ |
| handleInviteTokenAccess | 196-254 | async | showAuthenticatedState, initializeMainFeatures | currentTeamId, supabaseClient | ❌ |
| showInviteWelcomeScreen | 257-299 | sync | startDiscordAuth | - | ❌ |
| startDiscordAuth | 302-314 | sync | startDiscordAuthWithToken | - | ✅ |
| startDiscordAuthWithToken | 317-357 | async | - | supabaseClient, DISCORD_CONFIG | ❌ |
| handleDiscordCallback | 360-421 | async | joinTeamWithDiscordAuth | DISCORD_CONFIG | ❌ |
| joinTeamWithDiscordAuth | 424-459 | async | showAuthenticatedState | currentTeamId, supabaseClient | ❌ |
| authenticateTeam | 462-520 | async | showAuthenticatedState, initializeMainFeatures | currentTeamId, supabaseClient | ✅ |
| createNewTeam | 523-628 | async | authenticateTeam, showLoginForm | supabaseClient | ✅ |
| showSignupForm | 631-650 | sync | - | - | ✅ |
| showLoginForm | 653-665 | sync | - | - | ✅ |
| showPasswordResetForm | 668-683 | sync | resetPasswordResetForm | - | ✅ |
| showAuthenticatedState | 686-698 | async | - | isAuthenticated | ❌ |
| logout | 701-725 | sync | - | isAuthenticated, currentTeamId | ✅ |
| toggleSettingsMenu | 728-733 | sync | - | - | ✅ |
| resetPasswordResetForm | 750-765 | sync | - | resetToken, resetTeamId | ❌ |
| getSecurityQuestion | 768-825 | async | - | supabaseClient, resetTeamId | ✅ |
| verifySecurityAnswer | 828-878 | async | - | supabaseClient, resetTeamId, resetToken | ✅ |
| executePasswordReset | 881-935 | async | showLoginForm | supabaseClient, resetTeamId, resetToken | ✅ |
| updateConnectionStatus | 938-940 | sync | - | - | ❌ |
| initializeMainFeatures | 958-985 | async | initializeDefaultRaidTier, loadAllData, showTierDashboard | - | ❌ |
| initializeDefaultRaidTier | 988-1035 | async | - | currentTeamId, currentRaidTier, supabaseClient | ❌ |
| loadAllData | 1038-1088 | async | - | currentTeamId, appData, supabaseClient | ❌ |
| showTierDashboard | 1092-1119 | sync | renderIntegratedMemberTable, showLayerAllocation, showPriorityManagement, showStatistics, showAllocationHistory | currentRaidTier, appData | ✅ |
| getPositionRoleClass | 1122-1126 | sync | - | - | ❌ |
| renderIntegratedMemberTable | 1129-1231 | sync | getPositionRoleClass, togglePolicyCell, saveIntegratedMemberData | appData | ❌ |
| togglePolicyCell | 1234-1247 | sync | - | - | ✅ |
| saveIntegratedMemberData | 1250-1311 | async | saveDataToSupabase | appData, currentRaidTier | ✅ |
| showPriorityManagement | 1314-1384 | sync | getPositionRoleClass, savePrioritySettings, resetPrioritySettings, initializeDragAndDrop | appData, currentRaidTier | ✅ |
| initializeDragAndDrop | 1387-1460 | sync | updatePriorityNumbers | - | ❌ |
| updatePriorityNumbers | 1463-1471 | sync | - | - | ❌ |
| savePrioritySettings | 1474-1503 | async | - | appData, currentTeamId, currentRaidTier, supabaseClient | ✅ |
| resetPrioritySettings | 1506-1528 | async | saveDataToSupabase, showPriorityManagement | appData | ✅ |
| showPlayerManagement | 1531-1533 | sync | showPlayerSetup | - | ✅ |
| showPlayerSetup | 1536-1538 | sync | showTabbedSetup | - | ❌ |
| showTabbedSetup | 1541-1581 | sync | getTabContent, saveCurrentTab, saveCurrentTabAndContinue | currentRaidTier | ✅ |
| getTabContent | 1584-1752 | sync | getPositionRoleClass | appData, currentRaidTier | ❌ |
| saveCurrentTab | 1755-1771 | async | savePlayersData, saveEquipmentPolicyData, saveWeaponWishesData | - | ✅ |
| saveCurrentTabAndContinue | 1774-1796 | async | savePlayersData, saveEquipmentPolicyData, saveWeaponWishesData, showTierDashboard | appData, currentRaidTier | ✅ |
| savePlayersData | 1799-1836 | async | saveDataToSupabase | appData, currentRaidTier | ❌ |
| saveEquipmentPolicyData | 1839-1855 | async | saveDataToSupabase | appData, currentRaidTier | ❌ |
| savePlayersDataTab | 1858-1866 | async | savePlayersData | - | ❌ |
| saveEquipmentPolicyDataTab | 1868-1876 | async | saveEquipmentPolicyData | - | ❌ |
| saveWeaponWishesDataTab | 1878-1886 | async | saveWeaponWishesData | - | ❌ |
| saveWeaponWishesData | 1889-1909 | async | saveDataToSupabase | appData, currentRaidTier | ❌ |
| importFromJSON | 1914-1978 | async | convertImportData, importConvertedData, showTabbedSetup | - | ❌ |
| importFromCSV | 2002-2054 | async | saveDataToSupabase, showTabbedSetup | appData, currentRaidTier | ❌ |
| clearCSVData | 2057-2063 | sync | - | - | ❌ |
| resetAllPlayersData | 2066-2096 | async | showTabbedSetup | appData, currentTeamId, currentRaidTier, supabaseClient | ❌ |
| resetCurrentTierData | 2099-2131 | async | showTabbedSetup | appData, currentTeamId, currentRaidTier, supabaseClient | ❌ |
| convertImportData | 2134-2171 | async | - | - | ❌ |
| importConvertedData | 2174-2192 | async | saveDataToSupabase | appData, currentRaidTier | ❌ |
| saveDataToSupabase | 2195-2208 | async | - | currentTeamId, currentRaidTier, supabaseClient | ✅ |
| showEquipmentAllocation | 2211-2236 | sync | - | appData, currentRaidTier | ❌ |
| showLayerAllocation | 2239-2262 | async | showEquipmentAllocation, processLayerAllocation | appData, currentRaidTier | ✅ |
| processLayerAllocation | 2265-2282 | async | getLayerDrops, calculateAllocation, displayAllocationResults | - | ❌ |
| getLayerDrops | 2285-2314 | sync | - | selectedDirectWeapon | ❌ |
| calculateAllocation | 2317-2396 | sync | calculatePlayerPriority | appData, currentRaidTier | ❌ |
| calculatePlayerPriority | 2399-2526 | sync | getPlayerEquipmentStatus, hasUnacquiredRaidPlayers, hasUnacquiredWeaponBoxPlayers, getPositionPriority | - | ❌ |
| getPlayerEquipmentStatus | 2529-2545 | sync | - | appData, currentRaidTier | ❌ |
| hasUnacquiredRaidPlayers | 2548-2564 | sync | getPlayerEquipmentStatus | appData, currentRaidTier | ❌ |
| hasUnacquiredWeaponBoxPlayers | 2567-2583 | sync | getPlayerEquipmentStatus | appData, currentRaidTier | ❌ |
| isAllEligiblePlayersObtained | 2586-2644 | sync | getPlayerEquipmentStatus, hasUnacquiredRaidPlayers | appData, currentRaidTier | ❌ |
| getPositionPriority | 2647-2652 | sync | - | appData | ❌ |
| getMaterialPriority | 2655-2657 | sync | getPositionPriority | - | ❌ |
| displayAllocationResults | 2660-2823 | sync | getItemTypeLabel, isAllEligiblePlayersObtained, toggleJudgment, updateAllocationChoice, confirmAllocation, showTierDashboard, updateDirectWeapon | selectedDirectWeapon, currentRaidTier | ❌ |
| updateDirectWeapon | 2826-2855 | sync | getLayerDrops, calculateAllocation, displayAllocationResults | selectedDirectWeapon | ❌ |
| toggleJudgment | 2858-2869 | sync | - | - | ✅ |
| getItemTypeLabel | 2872-2880 | sync | - | - | ❌ |
| updateAllocationChoice | 2883-2885 | sync | - | - | ❌ |
| confirmAllocation | 2888-2982 | async | getLayerDrops, getCurrentWeek, updateTomeExchangeStatus, saveDataToSupabase, showEquipmentAllocation, getItemPriority | appData, currentTeamId, currentRaidTier, supabaseClient | ✅ |
| getCurrentWeek | 2985-3000 | sync | - | currentRaidTier | ❌ |
| getItemPriority | 3003-3021 | sync | - | - | ❌ |
| updateTomeExchangeStatus | 3024-3072 | async | getPlayerEquipmentStatus, saveDataToSupabase | appData, currentRaidTier | ❌ |
| showSystemSettings | 3079-3109 | sync | exportAllData | appData, currentRaidTier | ✅ |
| exportAllData | 3111-3141 | sync | - | appData, currentRaidTier | ✅ |
| updateLoadingMessage | 3283-3288 | sync | - | - | ❌ |
| hideLoadingScreen | 3291-3297 | sync | - | - | ❌ |
| handleDiscordCallback (重複定義) | 3300-3336 | async | initializeApp | currentTeamId, isAuthenticated | ❌ |

## グローバル変数マップ

### window経由で管理される変数

```javascript
// state.js で定義
window.isAuthenticated
window.currentTeamId
window.isInitializing
window.isInitialized
window.selectedDirectWeapon
window.currentRaidTier
window.appData
window.supabaseClient

// app.js で定義
window.resetToken
window.resetTeamId

// config.js で定義
window.DISCORD_CONFIG
window.POSITIONS
window.EQUIPMENT_SLOTS
window.MATERIAL_SLOTS
window.JOB_LIST
window.WEAPON_TYPES
window.LAYER_DROPS
window.SUPABASE_CONFIG
```

### appData構造

```javascript
window.appData = {
    raidTiers: {},        // レイドティア情報
    players: {            // プレイヤーデータ
        [tierId]: {
            [position]: {
                name: string,
                job: string,
                position: string,
                equipmentPolicy: { [slot]: '零式' | 'トームストーン' },
                weaponWishes: string[],
                currentEquipment: {},
                dynamicPriority: number,
                allocationHistory: []
            }
        }
    },
    allocations: {        // 分配履歴
        [tierId]: [
            {
                id: string,
                layer: number,
                slot: string,
                position: string,
                playerName: string,
                job: string,
                equipment: {},
                timestamp: string,
                week: number,
                status: '未取得' | '取得済み' | '断章交換' | '断章交換・箱取得済'
            }
        ]
    },
    settings: {           // 設定
        positionPriority: string[]
    }
}
```

## データフロー

### 起動フロー
```
ページロード
  ↓
複数タイミングで executeInitialization 実行
  - 即座 (50ms後)
  - DOMContentLoaded
  - window.load
  - フォールバック (5秒後)
  - 最終チェック (10秒後)
  ↓
initializeApp
  - Supabaseクライアント初期化
  - handleDiscordCallback (URLパラメータチェック)
  - tryAutoLogin (localStorageチェック)
  ↓
showAuthenticatedState
  ↓
initializeMainFeatures
  - initializeDefaultRaidTier
  - loadAllData
  - showTierDashboard
```

### 装備分配フロー
```
ダッシュボード: showLayerAllocation(layer) クリック
  ↓
showEquipmentAllocation() (画面表示)
  ↓
setTimeout 100ms
  ↓
processLayerAllocation(layer)
  - getLayerDrops(layer) でドロップアイテム取得
  - calculateAllocation(layer, drops) で分配計算
    ↓ (各プレイヤー × 各アイテムで実行)
    calculatePlayerPriority(player, drop, position)
      - getPlayerEquipmentStatus でステータス確認
      - hasUnacquiredRaidPlayers で未取得者チェック
      - getPositionPriority で優先度取得
  - displayAllocationResults(layer, results) で結果表示
  ↓
ユーザーが取得者選択
  ↓
confirmAllocation(layer)
  - 分配データ作成
  - appData.allocations に追加
  - updateTomeExchangeStatus で断章交換ステータス更新
  - saveDataToSupabase でSupabase保存
  - showEquipmentAllocation で画面更新
```

### データ保存フロー
```
各保存関数 (savePlayersData, saveEquipmentPolicyData等)
  ↓
appData更新
  ↓
saveDataToSupabase(dataType, content)
  ↓
Supabase upsert
  - team_id: window.currentTeamId
  - tier_id: window.currentRaidTier.id
  - data_type: 'players' | 'allocations' | 'settings'
  - content: JSON
```

## 重要な相互依存関係

### 循環的な依存
1. **分配エンジン内部**:
   - `calculatePlayerPriority` → `getPlayerEquipmentStatus` → `appData.allocations` (読み取り)
   - `calculatePlayerPriority` → `hasUnacquiredRaidPlayers` → `getPlayerEquipmentStatus`

2. **UI更新ループ**:
   - `confirmAllocation` → `saveDataToSupabase` → `appData更新` → 次回の `calculatePlayerPriority` に影響

### グローバル状態への書き込み
- `initializeApp`: `window.supabaseClient`, `window.isAuthenticated`, `window.currentTeamId`
- `authenticateTeam`: `window.currentTeamId`
- `updateDirectWeapon`: `window.selectedDirectWeapon`
- `confirmAllocation`: `window.appData.allocations`, `window.appData.players`

## 特殊な構造

### IIFE (即時実行関数)
- 3192-3280行: 自動Discord認証処理
- URLパラメータに応じた自動認証フロー

### イベントリスナー
- 736-745行: 設定メニュー外クリックで閉じる
- 1981-1999行: JSONファイル選択時の情報表示

### 重複定義
- `handleDiscordCallback`: 360行と3300行に2つ存在
  - 360行版: OAuth2フロー処理
  - 3300行版: バックエンド連携版（未使用？）
