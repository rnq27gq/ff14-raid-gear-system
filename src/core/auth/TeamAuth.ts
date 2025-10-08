import { AuthService } from './AuthService';
import type { StateManager } from '../state/StateManager';
import type { SupabaseStorageClient } from '../storage/SupabaseClient';
import type { RaidTier } from '../../types';

/**
 * チーム認証の認証情報
 */
export interface TeamCredentials {
  teamId: string;
  password: string;
}

/**
 * チームID/パスワード認証サービス
 */
export class TeamAuth extends AuthService {
  constructor(stateManager: StateManager, storage: SupabaseStorageClient) {
    super(stateManager, storage);
  }

  /**
   * チームID/パスワードで認証
   */
  async authenticate(credentials: TeamCredentials): Promise<boolean> {
    try {
      const { teamId, password } = credentials;

      // Supabaseで認証
      const isAuthenticated = await this.storage.authenticateTeam(teamId, password);

      if (!isAuthenticated) {
        return false;
      }

      // チームコンテキストを設定
      await this.storage.setTeamContext(teamId);

      // 状態を更新
      this.stateManager.setState({
        isAuthenticated: true,
        currentTeamId: teamId
      });

      // localStorageに保存
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ff14_team_id', teamId);
      }

      return true;
    } catch (error) {
      console.error('認証エラー:', error);
      throw error;
    }
  }

  /**
   * ログアウト
   */
  logout(): void {
    // 状態をリセット
    this.stateManager.setState({
      isAuthenticated: false,
      currentTeamId: null,
      currentRaidTier: null
    });

    // localStorageから削除
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ff14_team_id');
      localStorage.removeItem('ff14_discord_auth');
      localStorage.removeItem('ff14_invite_access');
    }
  }

  /**
   * 自動ログインを試行
   */
  async tryAutoLogin(): Promise<boolean> {
    try {
      // localStorageからチームIDを取得
      if (typeof localStorage === 'undefined') {
        return false;
      }

      const savedTeamId = localStorage.getItem('ff14_team_id');
      if (!savedTeamId) {
        return false;
      }

      // チームコンテキストを設定
      await this.storage.setTeamContext(savedTeamId);

      // チームデータを読み込み
      const appData = await this.storage.loadTeamData(savedTeamId);

      // デフォルトのレイドティアを作成
      const defaultTier: RaidTier = {
        id: savedTeamId,
        name: 'メインティア',
        createdAt: new Date().toISOString()
      };

      // 状態を更新
      this.stateManager.setState({
        isAuthenticated: true,
        currentTeamId: savedTeamId,
        currentRaidTier: defaultTier,
        appData
      });

      return true;
    } catch (error) {
      console.error('自動ログインエラー:', error);
      return false;
    }
  }
}
