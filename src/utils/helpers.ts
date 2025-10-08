import type { Position, Role } from '../types/common';

/**
 * ポジションからロールクラス名を取得
 * @param position - プレイヤーポジション (MT, ST, H1, H2, D1-D4)
 * @returns ロールクラス名 ('tank', 'healer', 'dps')
 */
export function getPositionRoleClass(position: Position): Role | '' {
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
 * @param teamName - 元のチーム名
 * @returns 表示用チーム名
 */
export function getDisplayTeamName(teamName: string | null | undefined): string {
  if (!teamName) return '';
  const hyphenIndex = teamName.indexOf('-');
  return hyphenIndex !== -1 ? teamName.substring(0, hyphenIndex) : teamName;
}
