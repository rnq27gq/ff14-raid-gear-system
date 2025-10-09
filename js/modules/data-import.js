// データインポート・リセットモジュール

// JSONファイルからのインポート
async function importFromJSON() {
    const fileInput = document.getElementById('jsonFileInput');
    const file = fileInput.files[0];

    if (!file) {
        showError('JSONファイルを選択してください。');
        return;
    }

    try {
        showMessage('ファイルを読み込み中...', 'info');

        const text = await file.text();
        const importData = JSON.parse(text);

        // データ形式の検証と変換
        const convertedData = await convertImportData(importData);

        if (!convertedData) {
            showError('対応していないデータ形式です。');
            return;
        }

        // 詳細情報の表示
        let playerCount = 0;
        let tierCount = 0;

        if (convertedData.type === 'collaborative') {
            tierCount = Object.keys(convertedData.players || {}).length;
            playerCount = Object.values(convertedData.players || {}).reduce((total, tierPlayers) => {
                return total + Object.keys(tierPlayers || {}).length;
            }, 0);
        } else if (convertedData.type === 'simple') {
            playerCount = Object.keys(convertedData.players || {}).length;
            tierCount = 1;
        }

        // 確認ダイアログ
        const confirmMessage = `以下のデータをインポートします：

プレイヤー数: ${playerCount}人
レイドティア数: ${tierCount}個
データ形式: ${convertedData.type === 'collaborative' ? '共同利用版' : '簡易版'}

現在のデータを上書きします。よろしいですか？`;

        if (!confirm(confirmMessage)) {
            return;
        }

        // データをインポート
        await importConvertedData(convertedData);

        showSuccess(`データのインポートが完了しました。（${playerCount}人のプレイヤーを登録）`);
        showTabbedSetup('players'); // メンバー情報タブに移動

    } catch (error) {
        console.error('インポートエラー:', error);
        if (error.name === 'SyntaxError') {
            showError('JSONファイルの形式が正しくありません。ファイルを確認してください。');
        } else {
            showError('インポートに失敗しました: ' + error.message);
        }
    }
}

// JSONファイル選択時の処理（イベントリスナー）
document.addEventListener('DOMContentLoaded', function() {
    // ファイル選択時の情報表示を設定
    document.addEventListener('change', function(event) {
        if (event.target.id === 'jsonFileInput') {
            const file = event.target.files[0];
            const fileInfo = document.getElementById('jsonFileInfo');
            const fileName = document.getElementById('selectedFileName');
            const fileDetails = document.getElementById('fileDetails');

            if (file && fileInfo && fileName && fileDetails) {
                fileName.textContent = file.name;
                fileDetails.textContent = `サイズ: ${(file.size / 1024).toFixed(2)} KB, 最終更新: ${new Date(file.lastModified).toLocaleString()}`;
                fileInfo.style.display = 'block';
            } else if (fileInfo) {
                fileInfo.style.display = 'none';
            }
        }
    });
});

// CSVからのインポート
async function importFromCSV() {
    const csvText = document.getElementById('csvTextArea').value.trim();

    if (!csvText) {
        showError('CSVデータを入力してください。');
        return;
    }

    try {
        const lines = csvText.split('\n').filter(line => line.trim());
        const players = {};

        for (let i = 1; i < lines.length; i++) { // ヘッダー行をスキップ
            const columns = lines[i].split(',').map(col => col.trim());

            if (columns.length < 4) continue;

            const [position, name, job] = columns;

            players[position] = {
                name: name,
                job: job,
                position: position,
                equipmentPolicy: {},
                weaponWishes: [job],
                currentEquipment: {},
                dynamicPriority: 0,
                allocationHistory: []
            };
        }

        if (Object.keys(players).length === 0) {
            showError('有効なプレイヤーデータが見つかりません。');
            return;
        }

        // 確認ダイアログ
        if (!confirm(`${Object.keys(players).length}人のプレイヤーデータをインポートします。よろしいですか？`)) {
            return;
        }

        // データを保存
        window.appData.players[window.currentRaidTier.id] = players;
        await saveDataToSupabase('players', players);

        showSuccess('CSVデータのインポートが完了しました。');
        showTabbedSetup('players'); // メンバー情報タブに移動

    } catch (error) {
        console.error('CSVインポートエラー:', error);
        showError('CSVインポートに失敗しました: ' + error.message);
    }
}

// CSVデータクリア
function clearCSVData() {
    const csvTextArea = document.getElementById('csvTextArea');
    if (csvTextArea) {
        csvTextArea.value = '';
        showSuccess('CSVデータをクリアしました。');
    }
}

// プレイヤーデータのみリセット
async function resetAllPlayersData() {
    if (!confirm('現在のレイドティアのプレイヤー情報をすべて削除します。よろしいですか？')) {
        return;
    }

    if (!confirm('本当によろしいですか？プレイヤー情報、装備方針、武器希望がすべて削除されます。')) {
        return;
    }

    try {
        // プレイヤーデータのみ削除
        if (window.appData.players[window.currentRaidTier.id]) {
            delete window.appData.players[window.currentRaidTier.id];
        }

        // Supabaseからプレイヤーデータのみ削除
        await window.supabaseClient
            .from('raid_data')
            .delete()
            .eq('team_id', window.currentTeamId)
            .eq('tier_id', window.currentRaidTier.id)
            .eq('data_type', 'players');

        showSuccess('プレイヤーデータをリセットしました。');
        showTabbedSetup('players'); // メンバー情報タブに移動

    } catch (error) {
        console.error('プレイヤーデータリセットエラー:', error);
        showError('プレイヤーデータのリセットに失敗しました: ' + error.message);
    }
}

// 現在のティアデータをリセット
async function resetCurrentTierData() {
    if (!confirm('現在のレイドティアのすべてのデータを削除します。この操作は取り消せません。よろしいですか？')) {
        return;
    }

    if (!confirm('本当によろしいですか？すべてのプレイヤー情報、装備方針、分配履歴が削除されます。')) {
        return;
    }

    try {
        // ローカルデータを削除
        if (window.appData.players[window.currentRaidTier.id]) {
            delete window.appData.players[window.currentRaidTier.id];
        }
        if (window.appData.allocations[window.currentRaidTier.id]) {
            delete window.appData.allocations[window.currentRaidTier.id];
        }

        // Supabaseからも削除
        await window.supabaseClient
            .from('raid_data')
            .delete()
            .eq('team_id', window.currentTeamId)
            .eq('tier_id', window.currentRaidTier.id);

        showSuccess('レイドティアデータをリセットしました。');
        showTabbedSetup('players'); // メンバー情報タブに移動

    } catch (error) {
        console.error('リセットエラー:', error);
        showError('データのリセットに失敗しました: ' + error.message);
    }
}

// インポートデータの変換
async function convertImportData(importData) {
    // collaborative_index.html形式の場合
    if (importData.raidTiers && importData.players && importData.allocations) {
        return {
            type: 'collaborative',
            players: importData.players,
            allocations: importData.allocations
        };
    }

    // 単純なプレイヤーリスト形式の場合
    if (Array.isArray(importData) && importData.length > 0 && importData[0].name) {
        const players = {};
        importData.forEach((player, index) => {
            const positions = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
            const position = positions[index] || `D${index - 3}`;

            players[position] = {
                name: player.name,
                characterName: player.characterName || '',
                job: player.job,
                position: position,
                equipmentPolicy: player.equipmentPolicy || {},
                weaponWishes: player.weaponWishes || [player.job],
                currentEquipment: player.currentEquipment || {},
                dynamicPriority: player.dynamicPriority || 0,
                allocationHistory: player.allocationHistory || []
            };
        });

        return {
            type: 'simple',
            players: players
        };
    }

    return null;
}

// 変換済みデータのインポート
async function importConvertedData(convertedData) {
    if (convertedData.type === 'collaborative') {
        // 現在のティアに対応するデータがある場合はそれを使用
        const tierData = Object.values(convertedData.players)[0] || {};
        window.appData.players[window.currentRaidTier.id] = tierData;

        // 分配履歴も移行
        if (convertedData.allocations) {
            const allocationData = Object.values(convertedData.allocations)[0] || {};
            window.appData.allocations[window.currentRaidTier.id] = allocationData;
            await saveDataToSupabase('allocations', allocationData);
        }
    } else if (convertedData.type === 'simple') {
        window.appData.players[window.currentRaidTier.id] = convertedData.players;
    }

    // Supabaseに保存
    await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);
}

export {
    importFromJSON,
    importFromCSV,
    clearCSVData,
    resetAllPlayersData,
    resetCurrentTierData
};
