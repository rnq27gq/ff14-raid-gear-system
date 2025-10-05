// グローバル状態管理

// 認証状態
let isAuthenticated = false;
let currentTeamId = null;

// 初期化状態
let isInitializing = false;
let isInitialized = false;

// 選択状態
let selectedDirectWeapon = ''; // 直ドロップ武器の選択状態を保持
let currentRaidTier = null;

// アプリケーションデータ
let appData = {
    raidTiers: {},
    players: {},
    allocations: {},
    settings: {},
    prioritySettings: {}
};

// Supabaseクライアント（initializeAppで初期化）
let supabaseClient = null;

// 状態更新関数（逆方向: windowから読み取る）
function updateGlobalState() {
    // windowオブジェクトの値が優先される
    isAuthenticated = window.isAuthenticated ?? isAuthenticated;
    currentTeamId = window.currentTeamId ?? currentTeamId;
    isInitializing = window.isInitializing ?? isInitializing;
    isInitialized = window.isInitialized ?? isInitialized;
    selectedDirectWeapon = window.selectedDirectWeapon ?? selectedDirectWeapon;
    currentRaidTier = window.currentRaidTier ?? currentRaidTier;
    appData = window.appData ?? appData;
    supabaseClient = window.supabaseClient ?? supabaseClient;
}

// グローバルスコープに即座に公開
window.isAuthenticated = isAuthenticated;
window.currentTeamId = currentTeamId;
window.isInitializing = isInitializing;
window.isInitialized = isInitialized;
window.selectedDirectWeapon = selectedDirectWeapon;
window.currentRaidTier = currentRaidTier;
window.appData = appData;
window.supabaseClient = supabaseClient;
window.updateGlobalState = updateGlobalState;

// 状態セッター（他のモジュールから使用）
window.setState = function(updates) {
    if (updates.hasOwnProperty('isAuthenticated')) isAuthenticated = updates.isAuthenticated;
    if (updates.hasOwnProperty('currentTeamId')) currentTeamId = updates.currentTeamId;
    if (updates.hasOwnProperty('isInitializing')) isInitializing = updates.isInitializing;
    if (updates.hasOwnProperty('isInitialized')) isInitialized = updates.isInitialized;
    if (updates.hasOwnProperty('selectedDirectWeapon')) selectedDirectWeapon = updates.selectedDirectWeapon;
    if (updates.hasOwnProperty('currentRaidTier')) currentRaidTier = updates.currentRaidTier;
    if (updates.hasOwnProperty('appData')) appData = updates.appData;
    if (updates.hasOwnProperty('supabaseClient')) supabaseClient = updates.supabaseClient;

    updateGlobalState();
};

// 状態ゲッター
window.getState = function() {
    return {
        isAuthenticated,
        currentTeamId,
        isInitializing,
        isInitialized,
        selectedDirectWeapon,
        currentRaidTier,
        appData,
        supabaseClient
    };
};
