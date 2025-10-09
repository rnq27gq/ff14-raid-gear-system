// データ読み込み・保存モジュール

// メイン機能初期化
async function initializeMainFeatures() {
    try {

        // チーム情報からレイドティアを自動生成
        await initializeDefaultRaidTier();

        // データ読み込み
        await loadAllData();

        // 直接ティアダッシュボードを表示（メインダッシュボードをスキップ）
        showTierDashboard();

    } catch (error) {
        console.error('メイン機能初期化エラー:', error);

        // データ読み込みエラーは通常の状態（初回起動時など）
        // エラーメッセージを表示せず、空のデータでダッシュボードを表示

        try {
            // フォールバック時もティアダッシュボードを表示
            await initializeDefaultRaidTier();
            showTierDashboard();
        } catch (fallbackError) {
            console.error('フォールバック処理エラー:', fallbackError);
            showError('ダッシュボードの表示に失敗しました');
        }
    }
}

// デフォルトレイドティア自動初期化
async function initializeDefaultRaidTier() {
    try {
        // チーム情報を取得
        const { data: teamData, error } = await window.supabaseClient
            .from('teams')
            .select('*')
            .eq('team_id', window.currentTeamId)
            .single();

        if (error) {
            // フォールバック: チームIDから基本情報を生成
            const createdAt = new Date().toISOString();
            window.currentRaidTier = {
                id: window.currentTeamId,
                name: window.currentTeamId,
                description: '零式レイド',
                created_at: createdAt,
                startDate: createdAt
            };
        } else {
            // チーム情報からレイドティアを生成
            const createdAt = teamData.created_at || new Date().toISOString();
            window.currentRaidTier = {
                id: window.currentTeamId,
                name: teamData.team_name || window.currentTeamId,
                description: '零式レイド',
                created_at: createdAt,
                startDate: createdAt
            };
        }


        // state.jsと同期
        if (window.setState) {
            window.setState({ currentRaidTier: window.currentRaidTier });
        }

    } catch (error) {
        console.error('レイドティア初期化エラー:', error);
        // 最小限のフォールバック
        window.currentRaidTier = {
            id: window.currentTeamId,
            name: window.currentTeamId,
            description: '零式レイド',
            created_at: new Date().toISOString()
        };
    }
}

// 全データ読み込み
async function loadAllData() {
    try {
        // Supabaseからデータ読み込み
        const { data: allData, error } = await window.supabaseClient
            .from('raid_data')
            .select('*')
            .eq('team_id', window.currentTeamId);

        if (error) {
            throw new Error(`データ読み込みエラー: ${error.message}`);
        }


        // データ種別ごとに分類
        if (allData && allData.length > 0) {
            allData.forEach(item => {
                const { tier_id, data_type, content } = item;

                if (data_type === 'settings') {
                    // 設定データの特殊処理
                    if (content.raidTier) {
                        // レイドティアデータ
                        if (!window.appData.raidTiers) window.appData.raidTiers = {};
                        window.appData.raidTiers[tier_id] = content.raidTier;
                    } else {
                        // その他の設定
                        if (!window.appData.settings) window.appData.settings = {};
                        window.appData.settings = { ...window.appData.settings, ...content };
                    }
                } else {
                    // その他のデータタイプ
                    if (!window.appData[data_type]) {
                        window.appData[data_type] = {};
                    }
                    window.appData[data_type][tier_id] = content;
                }
            });
        }


    } catch (error) {
        console.error('データ読み込みエラー:', error);
        // 初期データで継続
        window.appData = {
            raidTiers: {},
            players: {},
            allocations: {},
            settings: {}
        };
    }
}

// Supabaseデータ保存ヘルパー
async function saveDataToSupabase(dataType, content) {
    const { error } = await window.supabaseClient
        .from('raid_data')
        .upsert({
            team_id: window.currentTeamId,
            tier_id: window.currentRaidTier.id,
            data_type: dataType,
            content: content
        });

    if (error) {
        throw new Error(`保存エラー: ${error.message}`);
    }
}

export {
    initializeMainFeatures,
    initializeDefaultRaidTier,
    loadAllData,
    saveDataToSupabase
};
