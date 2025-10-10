        // ===== モジュールインポート =====
        import { showSystemSettings, exportAllData } from './modules/system-settings.js';
        import { showPriorityManagement, savePrioritySettings, resetPrioritySettings } from './modules/priority-manager.js';
        import { initializeMainFeatures, initializeDefaultRaidTier, loadAllData, saveDataToSupabase } from './modules/data-loader.js';
        import { showTierDashboard, togglePolicyCell, saveIntegratedMemberData, getPositionRoleClass } from './modules/dashboard.js';
        import { showPlayerManagement, showPlayerSetup, showTabbedSetup, saveCurrentTab, saveCurrentTabAndContinue } from './modules/player-management.js';
        import { importFromJSON, importFromCSV, clearCSVData, resetAllPlayersData, resetCurrentTierData, cleanupOldWeaponData } from './modules/data-import.js';
        import { getLayerDrops, calculateAllocation, calculatePlayerPriority, getPlayerEquipmentStatus, hasUnacquiredRaidPlayers, hasUnacquiredWeaponBoxPlayers, isAllEligiblePlayersObtained, getPositionPriority, getMaterialPriority } from './modules/allocation-engine.js';
        import { displayAllocationResults, updateDirectWeapon, toggleJudgment, getItemTypeLabel, updateAllocationChoice, confirmAllocation, getCurrentWeek, getItemPriority, updateTomeExchangeStatus } from './modules/allocation-ui.js';
        import { tryAutoLogin, handleInviteTokenAccess, showInviteWelcomeScreen, startDiscordAuth, startDiscordAuthWithToken, handleDiscordCallback, joinTeamWithDiscordAuth, authenticateTeam, createNewTeam, showSignupForm, showLoginForm, showPasswordResetForm, showAuthenticatedState, logout, resetPasswordResetForm, getSecurityQuestion, verifySecurityAnswer, executePasswordReset, updateConnectionStatus } from './modules/auth-manager.js';

        try {

        // グローバル変数はstate.jsで定義済み
        // window.isAuthenticated, window.currentTeamId等を使用

        // 確実な初期化システム v2 - キャッシュ問題対応版

        // 外部スクリプト依存チェック
        setTimeout(() => {

            if (typeof showMessage === 'undefined') {
                // フォールバック実装
                window.showMessage = function(msg, type) {
                    const el = document.getElementById(type === 'error' ? 'errorMessage' : 'successMessage');
                    if (el) {
                        el.textContent = msg;
                        el.style.display = 'block';
                        setTimeout(() => el.style.display = 'none', 3000);
                    }
                };
                window.showError = msg => showMessage(msg, 'error');
                window.showSuccess = msg => showMessage(msg, 'success');
            }
        }, 100);

        // 初期化実行関数
        async function executeInitialization(trigger) {
            if (window.isInitialized || window.isInitializing) {
                return false;
            }

            try {
                await initializeApp();
                return true;
            } catch (error) {
                console.error(`${trigger}: 初期化エラー:`, error);
                return false;
            }
        }

        // 1. 即座に初期化を試行
        setTimeout(() => executeInitialization('即座初期化'), 50);

        // 2. DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            executeInitialization('DOMContentLoaded');
        });

        // 3. ライブラリ読み込み完了を待つ
        window.addEventListener('load', () => {
            executeInitialization('Window load');
        });

        // 4. フォールバック（5秒後に強制初期化）
        setTimeout(() => {
            executeInitialization('フォールバック');
        }, 5000);

        // 5. ページ表示後の最終チェック（10秒後）
        setTimeout(() => {
            if (!window.isInitialized) {
                executeInitialization('最終フォールバック');
            } else {
            }
        }, 10000);
        
        // アプリ初期化
        async function initializeApp() {
            // 重複初期化防止
            if (window.isInitializing || window.isInitialized) {
                return;
            }
            
            window.isInitializing = true;
            updateGlobalState();

            try {

                // デバッグ: 設定値の確認

                // Supabaseクライアントが既に存在する場合はスキップ
                if (window.supabaseClient) {
                    window.isInitialized = true;
                    window.isInitializing = false;
                    updateGlobalState();
                    await tryAutoLogin();
                    return;
                }
                
                // Supabaseライブラリの確認
                if (typeof window.supabase === 'undefined') {
                    throw new Error('Supabase JavaScriptライブラリが読み込まれていません');
                }
                
                
                // Supabaseクライアント作成（機密情報は外部ファイルから）
                const supabaseUrl = window.SUPABASE_CONFIG?.SUPABASE_URL;
                const supabaseKey = window.SUPABASE_CONFIG?.SUPABASE_ANON_KEY;
                
                // プレースホルダーチェック
                if (!supabaseUrl || !supabaseKey ||
                    supabaseUrl.includes('{{') || supabaseKey.includes('{{')) {
                    console.error('Supabase設定エラー:', { supabaseUrl, supabaseKey });
                    throw new Error('Supabase認証情報が正しく設定されていません。GitHub Secretsの設定とデプロイを確認してください。');
                }
                
                window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

                // state.jsの setState を使って同期
                if (window.setState) {
                    window.setState({ supabaseClient: window.supabaseClient });
                }

                if (!window.supabaseClient) {
                    throw new Error('Supabaseクライアントの作成に失敗しました');
                }
                
                
                // 接続状態更新
                updateConnectionStatus(true);
                
                // Discord認証コールバック確認
                const discordCallbackHandled = await handleDiscordCallback();
                
                // Discord認証が処理されなかった場合のみ自動ログイン試行
                if (!discordCallbackHandled) {
                    await tryAutoLogin();
                }
                
                
                // 初期化完了フラグ設定
                window.isInitialized = true;
                window.isInitializing = false;
                updateGlobalState();
                
            } catch (error) {
                console.error('アプリ初期化エラー:', error);

                // Supabase接続エラーなど重大な問題のみユーザーに通知
                if (error.message && !error.message.includes('No rows')) {
                    // 重大なエラーのみ表示
                    if (error.message.includes('Supabase') || error.message.includes('認証情報')) {
                        showError('システムの初期化に失敗しました: ' + error.message);
                    }
                }

                updateConnectionStatus(false);

                // 初期化失敗時はフラグをリセット
                window.isInitializing = false;
                updateGlobalState();
            }
        }

        // initializeApp関数をグローバルに登録
        window.initializeApp = initializeApp;
        
        function toggleSettingsMenu() {
            const menu = document.getElementById('settingsMenu');
            if (menu) {
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            }
        }

        // 設定メニュー外クリックで閉じる
        document.addEventListener('click', function(event) {
            const menu = document.getElementById('settingsMenu');
            const settingsBtn = document.querySelector('.settings-btn');

            if (menu && settingsBtn && menu.style.display === 'block') {
                if (!menu.contains(event.target) && !settingsBtn.contains(event.target)) {
                    menu.style.display = 'none';
                }
            }
        });

        // メッセージ表示関数はjs/ui.jsに分離
        
        // エラーハンドリング
        window.addEventListener('unhandledrejection', function(event) {
            console.error('未処理のエラー:', event.reason);
            showError('予期しないエラーが発生しました');
        });
        
        // ======================
        // メイン機能の実装
        // ======================

        // state.jsで定義されたグローバル変数を使用
        // app.js内ではwindow.appData, window.currentRaidTier等を直接参照
        // 装備分配システム
        function showEquipmentAllocation() {
            const content = document.getElementById('content');
            
            // プレイヤーデータの確認
            const players = window.appData.players[window.currentRaidTier.id] || {};
            const playerCount = Object.keys(players).length;
            
            if (playerCount === 0) {
                showError('プレイヤー情報が設定されていません。メンバー設定を完了してください。');
                return;
            }
            
            content.innerHTML = `
                <div class="navigation-top-left">
                    <button class="nav-button" onclick="showTierDashboard()">レイドダッシュボードに戻る</button>
                </div>

                <h1>分配計算</h1>
                <h2>${window.currentRaidTier.name}</h2>

                <div class="section" id="allocationResults" style="display: none;">
                    <h3>分配結果</h3>
                    <div id="allocationContent"></div>
                </div>
            `;
        }
        
        // 直接層別分配を実行（ダッシュボードから呼び出し）
        async function showLayerAllocation(layer) {
            // プレイヤーデータの確認
            const players = window.appData.players[window.currentRaidTier.id] || {};
            const playerCount = Object.keys(players).length;
            
            if (playerCount === 0) {
                showError('メンバー情報が登録されていません。まずメンバー管理から設定してください。');
                return;
            }
            
            if (playerCount < 8) {
                if (!confirm(`メンバーが${playerCount}人しか登録されていません。分配を続行しますか？`)) {
                    return;
                }
            }
            
            // 装備分配画面を表示してから該当層の処理を実行
            showEquipmentAllocation();
            
            // 少し待ってから分配処理を実行（DOM更新のため）
            setTimeout(() => {
                processLayerAllocation(layer);
            }, 100);
        }
        
        // 層別装備分配処理
        async function processLayerAllocation(layer) {
            try {
                showMessage('分配処理中...', 'info');
                
                // 層別ドロップアイテムを取得
                const drops = getLayerDrops(layer);
                
                // 分配優先度を計算
                const allocationResults = calculateAllocation(layer, drops);
                
                // 結果を表示
                displayAllocationResults(layer, allocationResults);
                
            } catch (error) {
                console.error('分配処理エラー:', error);
                showError('分配処理に失敗しました: ' + error.message);
            }
        }

        // 統計情報表示機能はjs/statistics.jsに分離

        // ======================
        // グローバル関数登録（onclick用）
        // ======================
        if (typeof window !== 'undefined') {
            // データ・状態変数の公開（statistics.js等で参照）
            window.appData = window.appData;
            window.currentRaidTier = window.currentRaidTier;
            window.supabase = supabase;

            // ヘルパー関数の公開
            window.saveDataToSupabase = saveDataToSupabase;

            // ダッシュボード
            window.showTierDashboard = showTierDashboard;
            window.togglePolicyCell = togglePolicyCell;
            window.saveIntegratedMemberData = saveIntegratedMemberData;

            // 優先順位管理
            window.showPriorityManagement = showPriorityManagement;
            window.savePrioritySettings = savePrioritySettings;
            window.resetPrioritySettings = resetPrioritySettings;

            // システム設定
            window.showSystemSettings = showSystemSettings;
            window.exportAllData = exportAllData;

            // データインポート・リセット
            window.importFromJSON = importFromJSON;
            window.importFromCSV = importFromCSV;
            window.clearCSVData = clearCSVData;
            window.resetAllPlayersData = resetAllPlayersData;
            window.resetCurrentTierData = resetCurrentTierData;
            window.cleanupOldWeaponData = cleanupOldWeaponData;

            // UI関数（onclick用）
            window.authenticateTeam = authenticateTeam;
            window.logout = logout;
            window.toggleSettingsMenu = toggleSettingsMenu;
            window.startDiscordAuth = startDiscordAuth;
            window.createNewTeam = createNewTeam;
            window.showLoginForm = showLoginForm;
            window.showSignupForm = showSignupForm;
            window.showPasswordResetForm = showPasswordResetForm;
            window.getSecurityQuestion = getSecurityQuestion;
            window.verifySecurityAnswer = verifySecurityAnswer;
            window.executePasswordReset = executePasswordReset;
            window.showTierDashboard = showTierDashboard;
            window.showPlayerManagement = showPlayerManagement;
            window.showTabbedSetup = showTabbedSetup;
            window.saveCurrentTab = saveCurrentTab;
            window.saveCurrentTabAndContinue = saveCurrentTabAndContinue;
            window.showEquipmentAllocation = showEquipmentAllocation;
            window.showLayerAllocation = showLayerAllocation;
            window.confirmAllocation = confirmAllocation;
            window.toggleJudgment = toggleJudgment;
            window.updateDirectWeapon = updateDirectWeapon;
            window.updateAllocationChoice = updateAllocationChoice;
            window.showPriorityManagement = showPriorityManagement;
            window.savePrioritySettings = savePrioritySettings;
            window.resetPrioritySettings = resetPrioritySettings;
            window.showSystemSettings = showSystemSettings;
            window.exportAllData = exportAllData;
            window.togglePolicyCell = togglePolicyCell;
            window.saveIntegratedMemberData = saveIntegratedMemberData;

        }

        } catch (error) {
            console.error("🚨 メインスクリプト実行エラー:", error);
            console.error("スタックトレース:", error.stack);
            alert("システムの初期化でエラーが発生しました: " + error.message);
        }


