# FF14装備分配システム リファクタリング実行計画

## 現状（2024-09-29時点）

### 完了済み（2/7ステップ）
- ✅ **ステップ1**: CSS分離（リスク3点） - 1543行削除
- ✅ **ステップ2**: 設定・定数分離（リスク8点） - 14行削除

### 現在の構成
- `index.html`: 3796行（187KB）- メイン機能
- `css/style.css`: 30KB - スタイル定義
- `js/config.js`: 437バイト - 設定・定数
- **累積削減**: 1557行（29.1%）、48KB削減

---

## 残り実行予定（5ステップ）

### ステップ3: ユーティリティ関数分離（リスク予測：12点）
**実行時期**: 即座実行可能
**所要時間**: 30分程度

#### 分離対象関数
```javascript
// 対象関数（純粋関数、副作用なし）
function getPositionRoleClass(position) {
    const roleMapping = {
        'MT': 'tank', 'ST': 'tank',
        'H1': 'healer', 'H2': 'healer',
        'D1': 'melee', 'D2': 'melee',
        'D3': 'ranged', 'D4': 'caster'
    };
    return roleMapping[position] || '';
}

function getDisplayTeamName(teamName) {
    return teamName && teamName.length > 20
        ? teamName.substring(0, 20) + '...'
        : teamName;
}
```

#### 実行手順
1. **セーフポイント作成**: `git tag safe-point-before-utils-separation`
2. **js/utils.js作成**: 2つの純粋関数を移動
3. **index.html更新**: `<script src="js/utils.js"></script>` 追加
4. **グローバルスコープ確保**: `window.getPositionRoleClass = getPositionRoleClass;`
5. **動作確認**: 15箇所の呼び出し元でロール表示確認
6. **コミット**: `git tag safe-point-utils-separated`

#### リスク軽減策
- フォールバック関数の実装
- 関数存在チェック: `typeof getPositionRoleClass === 'function'`
- 即座復旧: `git reset --hard safe-point-before-utils-separation`

---

### ステップ4: メッセージ表示機能分離（リスク予測：22点）
**実行時期**: ステップ3完了後
**所要時間**: 1時間程度

#### 分離対象関数
```javascript
// UI管理機能
function showError(message) { showMessage(message, 'error'); }
function showSuccess(message) { showMessage(message, 'success'); }
function showMessage(message, type) {
    // DOM操作によるメッセージ表示
    const messageElement = document.querySelector('.message-container');
    // ... 複雑な表示ロジック
}
```

#### 実行手順
1. **セーフポイント作成**: `git tag safe-point-before-ui-separation`
2. **js/ui.js作成**: メッセージ表示機能を移動
3. **DOM依存確認**: 必要なHTML要素の存在確認
4. **エラーハンドリング強化**: DOM要素不在時の安全処理
5. **動作確認**: 全エラー・成功メッセージ表示テスト
6. **コミット**: `git tag safe-point-ui-separated`

#### 注意点
- DOM要素への依存関係
- CSS クラスとの連携確認
- エラー表示の連鎖処理

---

### ステップ5: 統計・履歴機能分離（リスク予測：45点）
**実行時期**: ステップ4完了後
**所要時間**: 2-3時間

#### 分離対象（中リスク）
```javascript
// 統計機能（323行）
function showStatistics()
function generatePlayerStatistics()
function calculateStatistics()
function showStatisticsEditMode()

// 履歴機能（137行）
function showAllocationHistory()
function generateHistoryTable()
function filterAllocationHistory()
```

#### 実行手順
1. **詳細分析**: 460行の依存関係マッピング
2. **データインターフェース設計**: 分配データとの結合部分
3. **js/statistics.js作成**: 統計・履歴機能の慎重分離
4. **データ整合性確認**: 分配データとの連携テスト
5. **UI表示確認**: 統計テーブル、履歴フィルターの動作
6. **回帰テスト**: 全統計機能の完全動作確認

#### 高リスク要因
- 分配データとの密結合
- 複雑な統計計算ロジック
- 編集機能との統合

---

### ステップ6: プレイヤー管理分離（リスク予測：58点）
**実行時期**: ステップ5完了後
**所要時間**: 4-6時間

#### 分離対象（高リスク）
```javascript
// プレイヤー管理（640行）
function showPlayerManagement()
function showTabbedSetup()          // 複雑なタブシステム
function savePlayersData()
function importFromJSON()           // データインポート
function importFromCSV()            // CSVインポート機能
```

#### 実行手順
1. **タブシステム完全解析**: 3タブの相互依存関係
2. **データフロー設計**: プレイヤーデータの全機能への影響分析
3. **段階的分離**: タブごとに慎重分離
4. **インポート機能テスト**: JSON/CSV読み込みの完全確認
5. **全機能連携テスト**: 装備分配への影響確認

#### 極高リスク要因
- 複雑なタブシステム（3タブ × 多機能）
- プレイヤーデータの全システムへの影響
- インポート/エクスポート機能との統合

---

### ステップ7: 最終分離（装備分配・認証システム）（リスク予測：78-85点）
**実行時期**: ステップ6完了後
**所要時間**: 1-2日間

#### 分離対象（極高リスク）

##### 7A: 装備分配システム（リスク78点）
```javascript
// 779行の複雑な分配ロジック
function showEquipmentAllocation()
function calculateAllocation()      // システムの核心価値
function processLayerAllocation()
function calculatePlayerPriority()  // 複雑な優先順位計算
```

##### 7B: 認証システム（リスク85点）
```javascript
// 743行の認証システム
function initializeApp()           // 全機能の前提条件
function tryAutoLogin()
function startDiscordAuth()        // Discord認証複雑連携
function authenticateTeam()
```

#### 実行手順
1. **完全バックアップ**: 複数のセーフポイント作成
2. **依存関係完全マッピング**: 1500行以上の詳細分析
3. **インターフェース設計**: コア機能間の安全な結合部
4. **段階的実装**: 小刻みなコミット（10-20行単位）
5. **継続的テスト**: 各段階での全機能動作確認
6. **フォールバック準備**: 失敗時の即座復旧体制

#### 成功基準
- ✅ 機能欠損：0件
- ✅ UI崩れ：0件
- ✅ データ整合性：100%保証
- ✅ パフォーマンス：劣化なし

---

## 全体スケジュール

### Phase 1: 低リスクステップ（1-2日）
- ステップ3: ユーティリティ関数分離
- ステップ4: メッセージ表示機能分離

### Phase 2: 中リスクステップ（2-3日）
- ステップ5: 統計・履歴機能分離

### Phase 3: 高リスクステップ（3-4日）
- ステップ6: プレイヤー管理分離

### Phase 4: 極高リスクステップ（5-7日）
- ステップ7A: 装備分配システム分離
- ステップ7B: 認証システム分離

### **総所要時間予測**: 1-2週間

---

## セーフティネット

### 即座復旧コマンド
```bash
# 各段階での復旧
git reset --hard safe-point-[step-name]

# 完全初期化（最終手段）
git reset --hard safe-point-before-css-separation
```

### タグ一覧
```
safe-point-before-css-separation    # リファクタリング開始前
safe-point-css-separated           # ステップ1完了
safe-point-config-separated        # ステップ2完了
safe-point-utils-separated         # ステップ3完了予定
safe-point-ui-separated            # ステップ4完了予定
safe-point-statistics-separated    # ステップ5完了予定
safe-point-player-management-separated # ステップ6完了予定
safe-point-equipment-separated     # ステップ7A完了予定
safe-point-auth-separated          # ステップ7B完了予定
```

### 品質保証チェックリスト
- [ ] 全機能動作確認（109個の関数）
- [ ] UI表示完全一致（CSS適用確認）
- [ ] データ整合性（Supabase連携）
- [ ] 認証フロー（Discord OAuth2）
- [ ] 装備分配計算（核心機能）
- [ ] 統計・履歴表示
- [ ] プレイヤー管理（インポート含む）
- [ ] パフォーマンス（読み込み時間）

---

## 最終目標

### リファクタリング完了時の構成
```
index.html              # HTMLテンプレートのみ（推定1000行）
css/style.css          # スタイル定義（30KB）
js/config.js           # 設定・定数（437バイト）
js/utils.js            # ユーティリティ関数
js/ui.js               # UI管理機能
js/statistics.js       # 統計・履歴機能
js/player-management.js # プレイヤー管理
js/equipment.js        # 装備分配システム
js/auth.js             # 認証システム
js/main.js             # メイン統合ロジック
```

### 期待効果
- **可読性**: モジュール化による理解しやすさ
- **保守性**: 機能別の独立した修正
- **拡張性**: 新機能の追加容易性
- **デバッグ性**: 問題箇所の特定迅速化
- **チーム開発**: 複数人での並行開発可能

---

*この計画はautocompact対応のため、各ステップの詳細手順と安全装置を明記しています。*
*問題発生時は即座に前の安全ポイントに復旧し、計画を見直してください。*