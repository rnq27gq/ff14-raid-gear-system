import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TeamAuth } from '../../../../src/core/auth/TeamAuth';
import { StateManager } from '../../../../src/core/state/StateManager';
import { SupabaseStorageClient } from '../../../../src/core/storage/SupabaseClient';

// SupabaseClientのモック
vi.mock('../../../../src/core/storage/SupabaseClient');

describe('TeamAuth', () => {
  let stateManager: StateManager;
  let storageClient: SupabaseStorageClient;
  let teamAuth: TeamAuth;

  beforeEach(() => {
    stateManager = new StateManager();
    storageClient = new SupabaseStorageClient({
      url: 'https://test.supabase.co',
      anonKey: 'test-key'
    });
    teamAuth = new TeamAuth(stateManager, storageClient);
  });

  describe('authenticate', () => {
    it('正しい認証情報で認証成功する', async () => {
      const mockAuthenticateTeam = vi.fn().mockResolvedValue(true);
      const mockSetTeamContext = vi.fn().mockResolvedValue(undefined);

      storageClient.authenticateTeam = mockAuthenticateTeam;
      storageClient.setTeamContext = mockSetTeamContext;

      const result = await teamAuth.authenticate({
        teamId: 'team-123',
        password: 'correct-password'
      });

      expect(result).toBe(true);
      expect(mockAuthenticateTeam).toHaveBeenCalledWith('team-123', 'correct-password');
      expect(mockSetTeamContext).toHaveBeenCalledWith('team-123');

      const state = stateManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentTeamId).toBe('team-123');
    });

    it('誤った認証情報で認証失敗する', async () => {
      const mockAuthenticateTeam = vi.fn().mockResolvedValue(false);
      storageClient.authenticateTeam = mockAuthenticateTeam;

      const result = await teamAuth.authenticate({
        teamId: 'team-123',
        password: 'wrong-password'
      });

      expect(result).toBe(false);

      const state = stateManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentTeamId).toBe(null);
    });

    it('エラーが発生した場合は例外をスローする', async () => {
      const mockAuthenticateTeam = vi.fn().mockRejectedValue(new Error('Auth error'));
      storageClient.authenticateTeam = mockAuthenticateTeam;

      await expect(
        teamAuth.authenticate({ teamId: 'team-123', password: 'password' })
      ).rejects.toThrow('Auth error');
    });
  });

  describe('logout', () => {
    it('ログアウトすると状態がリセットされる', async () => {
      // まず認証
      const mockAuthenticateTeam = vi.fn().mockResolvedValue(true);
      const mockSetTeamContext = vi.fn().mockResolvedValue(undefined);
      storageClient.authenticateTeam = mockAuthenticateTeam;
      storageClient.setTeamContext = mockSetTeamContext;

      await teamAuth.authenticate({ teamId: 'team-123', password: 'password' });

      // ログアウト
      teamAuth.logout();

      const state = stateManager.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentTeamId).toBe(null);
    });

    it('localStorageから認証情報を削除する', async () => {
      const mockRemoveItem = vi.fn();
      Storage.prototype.removeItem = mockRemoveItem;

      // まず認証
      const mockAuthenticateTeam = vi.fn().mockResolvedValue(true);
      const mockSetTeamContext = vi.fn().mockResolvedValue(undefined);
      storageClient.authenticateTeam = mockAuthenticateTeam;
      storageClient.setTeamContext = mockSetTeamContext;

      await teamAuth.authenticate({ teamId: 'team-123', password: 'password' });

      // ログアウト
      teamAuth.logout();

      expect(mockRemoveItem).toHaveBeenCalledWith('ff14_team_id');
    });
  });

  describe('tryAutoLogin', () => {
    it('localStorageにチームIDがある場合は自動ログインする', async () => {
      const mockGetItem = vi.fn().mockReturnValue('team-123');
      const mockSetTeamContext = vi.fn().mockResolvedValue(undefined);
      const mockLoadTeamData = vi.fn().mockResolvedValue({
        raidTiers: {},
        players: {},
        allocations: {},
        settings: {},
        prioritySettings: {}
      });

      Storage.prototype.getItem = mockGetItem;
      storageClient.setTeamContext = mockSetTeamContext;
      storageClient.loadTeamData = mockLoadTeamData;

      const result = await teamAuth.tryAutoLogin();

      expect(result).toBe(true);
      expect(mockGetItem).toHaveBeenCalledWith('ff14_team_id');
      expect(mockSetTeamContext).toHaveBeenCalledWith('team-123');

      const state = stateManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentTeamId).toBe('team-123');
    });

    it('localStorageにチームIDがない場合は自動ログインしない', async () => {
      const mockGetItem = vi.fn().mockReturnValue(null);
      Storage.prototype.getItem = mockGetItem;

      const result = await teamAuth.tryAutoLogin();

      expect(result).toBe(false);

      const state = stateManager.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('自動ログイン中にエラーが発生した場合はfalseを返す', async () => {
      const mockGetItem = vi.fn().mockReturnValue('team-123');
      const mockSetTeamContext = vi.fn().mockRejectedValue(new Error('Context error'));

      Storage.prototype.getItem = mockGetItem;
      storageClient.setTeamContext = mockSetTeamContext;

      const result = await teamAuth.tryAutoLogin();

      expect(result).toBe(false);
    });
  });
});
