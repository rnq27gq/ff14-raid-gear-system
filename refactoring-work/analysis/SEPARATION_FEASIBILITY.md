# 分離可能性評価

## 評価基準

### 独立性レベル (0-5段階)
- **Level 5**: 完全独立 (他に依存せず、他からも参照されない)
- **Level 4**: 高独立 (最小限の依存のみ)
- **Level 3**: 中独立 (適度な依存関係)
- **Level 2**: 低独立 (多くの依存関係)
- **Level 1**: 密結合 (複雑な相互依存)
- **Level 0**: 分離不可 (コア機能と密接)

## コンポーネント別評価

### A. CSS定義 (21-1564行、1543行)
**独立性レベル: 5 (完全独立)**
- ✅ 他のJavaScriptコードに依存なし
- ✅ 純粋なスタイル定義
- ✅ HTML要素のクラス・IDのみ参照
- ✅ 分離時の副作用なし

**分離方法**:
```css
/* css/style.css として完全分離 */
<link rel="stylesheet" href="css/style.css">
```

**検証項目**: UI表示の完全一致

---

### B. 設定・定数 (1744-1796行)
**独立性レベル: 4 (高独立)**

#### B1. DISCORD_CONFIG
```javascript
const DISCORD_CONFIG = {
    client_id: '1421136327843250286',
    redirect_uri: window.location.origin + window.location.pathname,
    scope: 'identify',
    response_type: 'code'
};
```
- ✅ 他の関数から参照のみ
- ✅ 修正が他に影響なし
- ⚠️ `window.location` への依存

#### B2. SUPABASE_CONFIG
```javascript
window.SUPABASE_CONFIG = {
    SUPABASE_URL: '{{SUPABASE_URL}}',
    SUPABASE_ANON_KEY: '{{SUPABASE_ANON_KEY}}'
};
```
- ✅ グローバル設定として参照
- ✅ プレースホルダー形式
- ✅ 分離安全

**分離方法**: `js/config.js` として分離

---

### C. ユーティリティ関数 (1753-1796行)
**独立性レベル: 4 (高独立)**

#### C1. getPositionRoleClass(position)
```javascript
function getPositionRoleClass(position) {
    const roleMapping = {
        'MT': 'tank', 'ST': 'tank',
        'H1': 'healer', 'H2': 'healer',
        'D1': 'melee', 'D2': 'melee',
        'D3': 'ranged', 'D4': 'caster'
    };
    return roleMapping[position] || '';
}
```
- ✅ 純粋関数 (副作用なし)
- ✅ 引数のみに依存
- ✅ 戻り値のみで影響

#### C2. getDisplayTeamName(teamName)
```javascript
function getDisplayTeamName(teamName) {
    return teamName && teamName.length > 20
        ? teamName.substring(0, 20) + '...'
        : teamName;
}
```
- ✅ 純粋関数
- ✅ 完全独立

**分離方法**: `js/utils.js` として分離

---

### D. メッセージ表示機能 (2667-2713行)
**独立性レベル: 3 (中独立)**

#### D1. showError/showSuccess/showMessage
```javascript
function showError(message) { showMessage(message, 'error'); }
function showSuccess(message) { showMessage(message, 'success'); }
function showMessage(message, type) {
    // DOM操作によるメッセージ表示
}
```
- ✅ 機能的に独立
- ⚠️ DOM要素への依存 (特定のHTML構造)
- ⚠️ CSS クラスへの依存

**分離方法**: `js/ui.js` として分離
**注意点**: HTML構造とCSS定義の維持が必要

---

### E. 認証システム (1910-2653行、743行)
**独立性レベル: 1 (密結合)**

#### E1. 認証関連関数群
- `initializeApp()` - アプリケーション初期化
- `tryAutoLogin()` - 自動ログイン試行
- `startDiscordAuth()` - Discord認証開始
- `authenticateTeam()` - チーム認証
- `createNewTeam()` - チーム作成

**高結合要因**:
- ❌ グローバル変数の大量操作 (isAuthenticated, currentTeamId等)
- ❌ Supabaseクライアントとの密結合
- ❌ DOM要素の直接操作
- ❌ 他機能との初期化チェーン
- ❌ UI状態の複雑な切り替え

**分離リスク**: **極高**
- 認証状態が全機能に影響
- 初期化順序の依存関係
- エラーハンドリングの統合

---

### F. プレイヤー管理 (3248-3888行、640行)
**独立性レベル: 2 (低独立)**

#### F1. プレイヤー管理機能
- `showPlayerManagement()` - プレイヤー管理画面
- `showTabbedSetup()` - タブ式設定
- `savePlayersData()` - データ保存

**結合要因**:
- ⚠️ グローバルデータ依存 (allData, currentData)
- ⚠️ Supabaseとの直接通信
- ⚠️ 複雑なタブシステム
- ⚠️ HTML構造との密結合

**分離可能性**: **中程度**
- タブシステムの完全な移植が必要
- データ管理インターフェースの設計が必要

---

### G. 装備分配システム (3926-4705行、779行)
**独立性レベル: 1 (密結合)**

#### G1. 装備分配機能
- `showEquipmentAllocation()` - 装備分配画面
- `calculateAllocation()` - 分配計算
- `processLayerAllocation()` - 層分配処理

**高結合要因**:
- ❌ 複雑な計算ロジック
- ❌ プレイヤーデータとの密結合
- ❌ 優先順位システムとの連携
- ❌ 大量のDOM操作
- ❌ 統計データとの相互参照

**分離リスク**: **極高**
- システムの核心機能
- データ整合性の維持が困難

---

### H. 統計・履歴 (4789-5315行、526行)
**独立性レベル: 2 (低独立)**

#### H1. 統計機能
- `showStatistics()` - 統計表示
- `generatePlayerStatistics()` - 統計生成
- `showAllocationHistory()` - 履歴表示

**結合要因**:
- ⚠️ 分配データとの依存
- ⚠️ プレイヤーデータとの結合
- ⚠️ 編集機能との統合

**分離可能性**: **中程度**
- データインターフェースの設計で分離可能

---

### I. ダッシュボード (2795-3030行、235行)
**独立性レベル: 0 (分離不可)**

#### I1. メインダッシュボード
- `showMainDashboard()` - メインダッシュボード
- `displayRaidTiers()` - 層表示
- `selectRaidTier()` - 層選択

**分離不可要因**:
- ❌ 全機能のエントリーポイント
- ❌ 認証状態と密結合
- ❌ 全データの初期化
- ❌ UI状態管理の中枢

**分離方針**: 最後まで残す (コア機能)

---

## 分離優先順位マトリックス

| コンポーネント | 独立性 | 分離難易度 | リスク | 優先順位 |
|-------------|-------|----------|-------|----------|
| CSS定義 | 5 | 極低 | 極低 | 1 (最優先) |
| 設定・定数 | 4 | 低 | 低 | 2 |
| ユーティリティ | 4 | 低 | 低 | 3 |
| メッセージ表示 | 3 | 中 | 中 | 4 |
| 統計・履歴 | 2 | 高 | 中 | 5 |
| プレイヤー管理 | 2 | 高 | 高 | 6 |
| 装備分配 | 1 | 極高 | 極高 | 7 |
| 認証システム | 1 | 極高 | 極高 | 8 |
| ダッシュボード | 0 | - | - | 最後 |

## 安全分離戦略

### フェーズ3実行計画
1. **CSS分離** (リスク: 0%) - 即座実行可能
2. **設定分離** (リスク: 5%) - 設定値のみ
3. **ユーティリティ分離** (リスク: 10%) - 純粋関数
4. **メッセージ機能分離** (リスク: 20%) - DOM依存の管理
5. **段階的高リスク分離** (リスク: 50%+) - 慎重な設計が必要

この評価により、安全な分離順序が確立されました。