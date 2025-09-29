// ユーティリティ関数集

/**
 * ポジションからロールクラス名を取得
 * @param {string} position - プレイヤーポジション (MT, ST, H1, H2, D1-D4)
 * @returns {string} ロールクラス名 ('tank', 'healer', 'dps')
 */
function getPositionRoleClass(position) {
    if (position === 'MT' || position === 'ST') {
        return 'tank';
    } else if (position === 'H1' || position === 'H2') {
        return 'healer';
    } else if (position.startsWith('D')) {
        return 'dps';
    }
    return '';
}

/**
 * チーム名の表示用整形
 * @param {string} teamName - 元のチーム名
 * @returns {string} 表示用チーム名
 */
function getDisplayTeamName(teamName) {
    if (!teamName) return '';
    const hyphenIndex = teamName.indexOf('-');
    return hyphenIndex !== -1 ? teamName.substring(0, hyphenIndex) : teamName;
}

// グローバルスコープに関数を登録（下位互換性のため）
if (typeof window !== 'undefined') {
    window.getPositionRoleClass = getPositionRoleClass;
    window.getDisplayTeamName = getDisplayTeamName;
}