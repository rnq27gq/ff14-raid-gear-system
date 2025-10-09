# 関数依存関係グラフ

## 起動・初期化フロー

```
[ページロード]
    │
    ├─→ [executeInitialization] (複数タイミング)
    │       │
    │       └─→ [initializeApp]
    │               ├─→ window.supabase.createClient()
    │               ├─→ [updateConnectionStatus]
    │               ├─→ [handleDiscordCallback] (条件付き)
    │               │       └─→ [joinTeamWithDiscordAuth]
    │               │               └─→ [showAuthenticatedState]
    │               │
    │               └─→ [tryAutoLogin] (条件付き)
    │                       ├─→ [handleInviteTokenAccess]
    │                       │       ├─→ [showAuthenticatedState]
    │                       │       └─→ [initializeMainFeatures]
    │                       │
    │                       └─→ [showAuthenticatedState]
    │                           └─→ [initializeMainFeatures]
    │                                   ├─→ [initializeDefaultRaidTier]
    │                                   ├─→ [loadAllData]
    │                                   └─→ [showTierDashboard]
    │
    └─→ [autoDiscordAuth] (IIFE 3192行)
            ├─→ URLパラメータチェック
            └─→ [startDiscordAuthWithToken]
```

## 認証フロー

### Discord認証
```
[startDiscordAuth]
    └─→ [startDiscordAuthWithToken]
            ├─→ Supabase招待トークン検証
            └─→ Discord OAuth URL生成 & リダイレクト
                    ↓ (Discord認証後、コールバック)
                [handleDiscordCallback]
                    ├─→ Discordトークン交換
                    ├─→ Discordユーザー情報取得
                    └─→ [joinTeamWithDiscordAuth]
                            ├─→ Supabase RPC: join_team_with_discord
                            └─→ [showAuthenticatedState]
```

### チームID/パスワード認証
```
[authenticateTeam]
    ├─→ Supabase RPC: authenticate_team
    ├─→ Supabase RPC: set_team_context
    ├─→ [showAuthenticatedState]
    └─→ [initializeMainFeatures]
```

### パスワードリセット
```
[showPasswordResetForm]
    └─→ [resetPasswordResetForm]

[getSecurityQuestion]
    └─→ Supabase RPC: get_team_reset_info

[verifySecurityAnswer]
    ├─→ Supabase RPC: verify_security_answer
    └─→ Supabase RPC: generate_reset_token

[executePasswordReset]
    ├─→ Supabase RPC: reset_password
    └─→ [showLoginForm]
```

## ダッシュボード・UI

```
[showTierDashboard]
    └─→ [renderIntegratedMemberTable]
            ├─→ [getPositionRoleClass]
            ├─→ HTML生成: [togglePolicyCell] (onclick)
            └─→ HTML生成: [saveIntegratedMemberData] (onclick)

[saveIntegratedMemberData]
    └─→ [saveDataToSupabase]
```

## プレイヤー管理

```
[showPlayerManagement]
    └─→ [showPlayerSetup]
            └─→ [showTabbedSetup]
                    ├─→ [getTabContent]
                    │       └─→ [getPositionRoleClass]
                    │
                    ├─→ HTML生成: [saveCurrentTab] (onclick)
                    └─→ HTML生成: [saveCurrentTabAndContinue] (onclick)

[saveCurrentTab]
    ├─→ [savePlayersData]
    │       └─→ [saveDataToSupabase]
    ├─→ [saveEquipmentPolicyData]
    │       └─→ [saveDataToSupabase]
    └─→ [saveWeaponWishesData]
            └─→ [saveDataToSupabase]

[saveCurrentTabAndContinue]
    ├─→ [savePlayersData]
    ├─→ [saveEquipmentPolicyData]
    ├─→ [saveWeaponWishesData]
    └─→ [showTierDashboard]
```

## 優先順位管理

```
[showPriorityManagement]
    ├─→ [getPositionRoleClass]
    ├─→ [initializeDragAndDrop]
    │       └─→ イベントリスナー設定
    │               └─→ [updatePriorityNumbers]
    │
    ├─→ HTML生成: [savePrioritySettings] (onclick)
    └─→ HTML生成: [resetPrioritySettings] (onclick)

[savePrioritySettings]
    └─→ Supabase upsert直接

[resetPrioritySettings]
    ├─→ [saveDataToSupabase]
    └─→ [showPriorityManagement]
```

## データインポート

```
[importFromJSON]
    ├─→ ファイル読み込み
    ├─→ [convertImportData]
    └─→ [importConvertedData]
            ├─→ [saveDataToSupabase] ('players')
            └─→ [saveDataToSupabase] ('allocations')

[importFromCSV]
    ├─→ CSV解析
    ├─→ [saveDataToSupabase]
    └─→ [showTabbedSetup]

[resetAllPlayersData]
    ├─→ Supabase delete
    └─→ [showTabbedSetup]

[resetCurrentTierData]
    ├─→ Supabase delete
    └─→ [showTabbedSetup]
```

## 装備分配エンジン（最重要）

### メインフロー
```
[showLayerAllocation] (ダッシュボードから呼び出し)
    ├─→ プレイヤーデータ検証
    ├─→ [showEquipmentAllocation]
    └─→ setTimeout(100ms)
            └─→ [processLayerAllocation]
                    ├─→ [getLayerDrops]
                    ├─→ [calculateAllocation]
                    └─→ [displayAllocationResults]
```

### 分配計算詳細
```
[calculateAllocation]
    └─→ drops.forEach(drop)
            └─→ players.forEach(player)
                    └─→ [calculatePlayerPriority]
                            ├─→ [getPlayerEquipmentStatus]
                            │       └─→ appData.allocations 読み取り
                            │
                            ├─→ [hasUnacquiredRaidPlayers] (装備の場合)
                            │       └─→ [getPlayerEquipmentStatus]
                            │
                            ├─→ [hasUnacquiredWeaponBoxPlayers] (武器箱の場合)
                            │       └─→ [getPlayerEquipmentStatus]
                            │
                            └─→ [getPositionPriority]
                                    └─→ appData.settings.positionPriority 読み取り
```

### 優先度計算ロジック
```
[calculatePlayerPriority]
    ├─ drop.type === 'equipment'
    │   ├─→ equipmentStatus = [getPlayerEquipmentStatus]
    │   ├─→ policy = player.equipmentPolicy[slot]
    │   │
    │   ├─ equipmentStatus === '断章交換'
    │   │   ├─→ hasUnacquiredRaidPlayer = [hasUnacquiredRaidPlayers]
    │   │   └─→ canReceive = !hasUnacquiredRaidPlayer
    │   │
    │   ├─ equipmentStatus === '断章交換・箱取得済'
    │   │   └─→ canReceive = false
    │   │
    │   ├─ policy === '零式' && equipmentStatus === '未取得'
    │   │   └─→ canReceive = true, score = 1000 + [getPositionPriority]
    │   │
    │   └─ equipmentStatus === '未取得'
    │       └─→ canReceive = true, score = 500 + [getPositionPriority]
    │
    ├─ drop.type === 'material'
    │   ├─→ materialStatus = [getPlayerEquipmentStatus]
    │   └─→ score = [getPositionPriority]
    │
    ├─ drop.type === 'weapon_box'
    │   ├─→ weaponBoxStatus = [getPlayerEquipmentStatus]
    │   ├─→ hasUnacquiredRaidPlayer = [hasUnacquiredWeaponBoxPlayers]
    │   └─→ score = 2000 + [getPositionPriority]
    │
    └─ drop.type === 'direct_weapon'
        ├─→ firstChoiceWeaponStatus = [getPlayerEquipmentStatus]
        ├─→ weaponWishes.indexOf(weaponType)
        └─→ score = 3000 + [getPositionPriority] - (wishIndex * 100)
```

### 結果表示
```
[displayAllocationResults]
    ├─→ HTML生成
    │   ├─→ 4層の場合: [updateDirectWeapon] (onchange)
    │   ├─→ 各アイテム: [updateAllocationChoice] (onchange)
    │   ├─→ 判定詳細: [toggleJudgment] (onclick)
    │   ├─→ 確定: [confirmAllocation] (onclick)
    │   └─→ キャンセル: [showTierDashboard] (onclick)
    │
    └─→ [isAllEligiblePlayersObtained] (フリロ判定)
            └─→ [getPlayerEquipmentStatus]
```

### 直ドロップ武器更新
```
[updateDirectWeapon]
    ├─→ window.selectedDirectWeapon 更新
    ├─→ [getLayerDrops] (4層)
    ├─→ [calculateAllocation]
    └─→ [displayAllocationResults]
```

### 分配確定
```
[confirmAllocation]
    ├─→ [getLayerDrops] (アイテム情報取得)
    ├─→ [getCurrentWeek] (週番号計算)
    ├─→ allocations 配列作成
    ├─→ appData.allocations 更新
    ├─→ appData.players 更新
    │   └─→ [getItemPriority] でdynamicPriority更新
    ├─→ [updateTomeExchangeStatus]
    │       └─→ [getPlayerEquipmentStatus]
    ├─→ [saveDataToSupabase] ('allocations')
    ├─→ [saveDataToSupabase] ('players')
    └─→ [showEquipmentAllocation]
```

## データ保存

```
[saveDataToSupabase]
    └─→ Supabase upsert
            ├─ team_id: window.currentTeamId
            ├─ tier_id: window.currentRaidTier.id
            ├─ data_type: 'players' | 'allocations' | 'settings'
            └─ content: JSON
```

## データ読み込み

```
[loadAllData]
    ├─→ Supabase select
    └─→ appData 更新
            ├─ appData.raidTiers
            ├─ appData.players
            ├─ appData.allocations
            └─ appData.settings
```

## システム設定

```
[showSystemSettings]
    └─→ HTML生成: [exportAllData] (onclick)

[exportAllData]
    ├─→ appData シリアライズ
    └─→ JSON ダウンロード
```

## グローバル状態への書き込み一覧

| 関数 | 書き込む変数 | タイミング |
|------|-------------|-----------|
| initializeApp | window.supabaseClient | Supabase接続成功時 |
| initializeApp | window.isInitialized | 初期化完了時 |
| initializeApp | window.isInitializing | 初期化開始/終了時 |
| tryAutoLogin | window.currentTeamId | localStorage読み取り時 |
| handleInviteTokenAccess | window.currentTeamId | 招待トークン検証後 |
| joinTeamWithDiscordAuth | window.currentTeamId | Discord認証成功後 |
| authenticateTeam | window.currentTeamId | チーム認証成功後 |
| showAuthenticatedState | window.isAuthenticated | 認証完了時 |
| logout | window.isAuthenticated | ログアウト時 |
| logout | window.currentTeamId | ログアウト時 |
| getSecurityQuestion | window.resetTeamId | セキュリティ質問取得時 |
| verifySecurityAnswer | window.resetToken | トークン生成時 |
| resetPasswordResetForm | window.resetToken | リセットフォーム初期化時 |
| resetPasswordResetForm | window.resetTeamId | リセットフォーム初期化時 |
| initializeDefaultRaidTier | window.currentRaidTier | レイドティア生成時 |
| loadAllData | window.appData | データ読み込み完了時 |
| saveIntegratedMemberData | window.appData.players | メンバーデータ保存時 |
| savePrioritySettings | window.appData.settings | 優先順位保存時 |
| resetPrioritySettings | window.appData.settings | 優先順位リセット時 |
| savePlayersData | window.appData.players | プレイヤーデータ保存時 |
| saveEquipmentPolicyData | window.appData.players | 装備方針保存時 |
| saveWeaponWishesData | window.appData.players | 武器希望保存時 |
| importConvertedData | window.appData.players | インポート時 |
| importConvertedData | window.appData.allocations | インポート時 |
| importFromCSV | window.appData.players | CSVインポート時 |
| resetAllPlayersData | window.appData.players | プレイヤーリセット時 |
| resetCurrentTierData | window.appData.players | ティアリセット時 |
| resetCurrentTierData | window.appData.allocations | ティアリセット時 |
| updateDirectWeapon | window.selectedDirectWeapon | 武器選択時 |
| confirmAllocation | window.appData.allocations | 分配確定時 |
| confirmAllocation | window.appData.players | 分配確定時 |

## 読み取り専用アクセス一覧

| 関数 | 読み取る変数 |
|------|-------------|
| showTierDashboard | window.currentRaidTier, window.appData.players |
| renderIntegratedMemberTable | window.appData.players |
| showPriorityManagement | window.appData.settings, window.appData.players, window.currentRaidTier |
| getTabContent | window.appData.players, window.currentRaidTier |
| getLayerDrops | window.selectedDirectWeapon |
| calculateAllocation | window.appData.players, window.currentRaidTier |
| getPlayerEquipmentStatus | window.appData.allocations, window.currentRaidTier |
| hasUnacquiredRaidPlayers | window.appData.players, window.currentRaidTier |
| getPositionPriority | window.appData.settings |
| displayAllocationResults | window.selectedDirectWeapon, window.currentRaidTier |
| getCurrentWeek | window.currentRaidTier |
| exportAllData | window.appData, window.currentRaidTier |
