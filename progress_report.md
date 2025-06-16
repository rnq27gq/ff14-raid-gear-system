# FF14 零式装備分配システム - プログレスレポート

## プロジェクト概要
- **プロジェクト名**: FF14 零式装備分配システム (Supabase版)
- **リポジトリ**: https://github.com/rnq27gq/ff14-raid-gear-system
- **デプロイ先**: GitHub Pages (自動デプロイ)
- **主要技術**: HTML/CSS/JavaScript, Supabase PostgreSQL, GitHub Actions

## 最新の作業状況 (2025-06-14)

### 完了した主要機能実装

#### 1. **ナビゲーション体系の完全統一**
- **レイドダッシュボード中心設計**: showTierDashboard()を中核とした遷移
- **表記統一**: 全画面で「ティアダッシュボード」→「レイドダッシュボード」に変更
- **修正対象画面**: 
  - 優先順位管理 (行2144)
  - メンバー管理 (行2342) 
  - 装備分配システム (行2962)
  - 統計情報 (行3517)
  - 統計情報編集 (行3652)
  - 分配履歴 (行3837)
- **装備分配キャンセルボタン**: showMainDashboard() → showTierDashboard() (行3317)

#### 2. **統計情報編集機能の完全実装**
- **編集開始ボタン**: 統計情報画面に配置 (行3456)
- **編集可能インターフェース**: チェックボックスによる取得状況編集
- **保存機能修正**: `saveToSupabase()` → `saveDataToSupabase('allocations', data)`
- **非同期処理**: async/await + try-catch エラーハンドリング
- **データ整合性**: 手動編集マーカー ('Manual') 付与

#### 3. **ポジション間優先順位システムの完全統合**
- **デフォルト順序**: D1→D2→D3→D4→MT→ST→H1→H2
- **装備分配への適用**: 装備方針（零式/トームストーン）+ ポジション優先順位
- **統一関数**: `getPositionPriority(position)` で装備・素材共通処理
- **スコア計算統合**:
  - 零式Need: `1000 + getPositionPriority() - dynamicPriority`
  - トームGreed: `500 + getPositionPriority() - dynamicPriority`
  - 武器箱: `2000 + getPositionPriority() - dynamicPriority`
  - 直ドロ武器: `3000 + getPositionPriority() - wishIndex*100 - dynamicPriority`

#### 4. **ドラッグ&ドロップUI最適化**
- **視覚的フィードバック強化**:
  - `.dragging`: 回転・透明度・影効果
  - `.drag-over`: 緑枠・背景色変更・スケール
- **操作性向上**: 
  - ドロップ位置計算 (上半分/下半分)
  - ホバー効果とアニメーション
  - より大きなドラッグハンドル (20px)
- **コンパクト化**: パディング・マージン最適化 (移動しやすさ維持)

#### 5. **説明文とメッセージの正確性向上**
- **優先順位説明更新**: 装備・素材両方への影響を明記
- **リセット確認メッセージ**: 正しいデフォルト順序表示
- **機能説明簡潔化**: 冗長な説明を実用的な内容に変更

### 最新のコミット履歴
```
e23d422 - 優先順位リセット確認メッセージのデフォルト並び修正
0382487 - memo.md更新対応: UI最適化とナビゲーション統一  
17843c5 - memo.md更新対応: ナビゲーション修正と分配ロジック改善
6447862 - memo.md要望完了: ダッシュボード改善と統計編集機能追加
```

## 技術的な実装詳細

### 重要な関数とファイル構造
- **メインファイル**: `supabase_index.html` (3800+ lines)
- **設定ファイル**: `memo.md` (要望管理)
- **認証情報**: `supabase_credentials_template.js`
- **CI/CD**: `.github/workflows/deploy.yml`

### 核心機能の実装箇所と修正履歴
1. **分配ロジック**: `calculatePlayerPriority()` (行3026-3169)
   - 全装備タイプにポジション優先順位適用済み
2. **優先順位管理**: `showPriorityManagement()` (行2128-2193)
   - コンパクト化と説明文更新済み
3. **統計編集**: `saveStatisticsChanges()` (行3772-3829)
   - 非同期保存とエラーハンドリング修正済み
4. **ドラッグ&ドロップ**: `initializeDragAndDrop()` (行2199-2272)
   - 視覚的フィードバックと操作性大幅改善済み
5. **優先順位取得**: `getPositionPriority()` (行3170-3175)
   - 装備・素材統一処理、設定値参照

### データベース構造 (Supabase)
- **テーブル**: `raid_data`
- **RLS**: Row Level Security 有効
- **データ型**: allocations, players, settings, equipment_policies
- **優先順位保存**: settings.positionPriority

## 現在の課題と注意点

### 解決済み課題
- ✅ 統計情報編集の保存エラー (`saveToSupabase` → `saveDataToSupabase`)
- ✅ ポジション優先順位の装備分配への未適用
- ✅ ドラッグ&ドロップUIの操作性問題
- ✅ ナビゲーションの不整合（全画面統一完了）
- ✅ 表記不統一（ティア/レイドダッシュボード）
- ✅ 説明文の不正確性
- ✅ UIのコンパクト化要請

### システムの特徴
- **Need/Greed/Pass システム**: FF14の標準的な分配方式
- **装備方針**: 零式 vs トームストーン preference
- **動的優先度**: 過去の取得履歴による調整
- **直ドロップ武器**: 希望順位による分配
- **ポジション優先順位**: 装備・素材分配の統一基準
- **リアルタイム同期**: Supabase経由

### 分配ロジックの詳細
- **装備分配**: `装備方針` + `ポジション優先順位` + `動的優先度`
- **素材分配**: `ポジション優先順位` + `動的優先度`
- **武器分配**: `武器希望順位` + `ポジション優先順位` + `動的優先度`

## 開発環境とワークフロー

### 推奨開発手順
1. **memo.md確認**: 新要望をチェック
2. **TodoWrite活用**: タスク管理で進捗追跡
3. **並行ツール使用**: Task, Grep, Read等で効率化
4. **段階的コミット**: 機能単位でのcommit/push
5. **表記統一確認**: レイドダッシュボード表記の一貫性

### デプロイメント
- **自動デプロイ**: GitHub Pages (main branch)
- **認証情報**: GitHub Secrets経由で注入
- **動作確認**: デプロイ後の機能テスト推奨

## 次回作業時の準備

### 再開時のチェックリスト
1. `memo.md` の新要望確認
2. 最新のデプロイ状況確認
3. Supabaseの接続状態確認
4. 機能テスト実施:
   - 優先順位のドラッグ&ドロップ
   - 統計情報編集・保存
   - 装備分配での優先順位適用
   - ナビゲーション遷移

### よく使用するコマンドパターン
```bash
# 状況確認
git status && git log --oneline -5

# 要望対応の標準フロー
TodoWrite → Task/Grep/Read → Edit/MultiEdit → TodoWrite → Commit

# コミット&プッシュ
git add . && git commit -m "memo.md対応: [概要]" && git push origin main
```

### 重要なファイルパス
- `/mnt/c/users/hirqt/CPJ/FF14_Gear_Allocation_System/supabase_index.html`
- `/mnt/c/users/hirqt/CPJ/FF14_Gear_Allocation_System/memo.md`
- `/mnt/c/users/hirqt/CPJ/FF14_Gear_Allocation_System/supabase_credentials_template.js`

### デバッグ時の確認ポイント
- **ナビゲーション**: showTierDashboard() の正しい呼び出し
- **優先順位**: getPositionPriority() の設定値参照
- **保存処理**: saveDataToSupabase() の正しいパラメータ
- **表記統一**: 「レイドダッシュボード」表記の一貫性

---

**プロジェクト状態**: 🟢 安定稼働中・主要機能完全実装済み  
**最終更新**: 2025-06-14  
**次回作業**: memo.md新要望対応  
**重要**: ナビゲーション・優先順位・統計編集の3大機能は完全統合済み