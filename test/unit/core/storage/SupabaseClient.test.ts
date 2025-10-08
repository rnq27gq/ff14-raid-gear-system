import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseStorageClient } from '../../../../src/core/storage/SupabaseClient';
import type { SupabaseConfig } from '../../../../src/types';

// Supabaseクライアントのモック
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn()
};

// createClientのモック
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

describe('SupabaseStorageClient', () => {
  let client: SupabaseStorageClient;
  const config: SupabaseConfig = {
    url: 'https://test.supabase.co',
    anonKey: 'test-anon-key'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    client = new SupabaseStorageClient(config);
  });

  describe('初期化', () => {
    it('Supabaseクライアントが作成される', () => {
      expect(client).toBeInstanceOf(SupabaseStorageClient);
    });
  });

  describe('setTeamContext', () => {
    it('チームコンテキストを設定できる', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: true,
        error: null
      });

      mockSupabaseClient.rpc = mockRpc;

      await client.setTeamContext('team-123');

      expect(mockRpc).toHaveBeenCalledWith('set_team_context', {
        team_id: 'team-123'
      });
    });

    it('エラーが発生した場合は例外をスローする', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Context error' }
      });

      mockSupabaseClient.rpc = mockRpc;

      await expect(client.setTeamContext('team-123')).rejects.toThrow('Context error');
    });
  });

  describe('authenticateTeam', () => {
    it('認証に成功するとtrueを返す', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: true,
        error: null
      });

      mockSupabaseClient.rpc = mockRpc;

      const result = await client.authenticateTeam('team-123', 'password');

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('authenticate_team', {
        p_team_id: 'team-123',
        p_password: 'password'
      });
    });

    it('認証に失敗するとfalseを返す', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: false,
        error: null
      });

      mockSupabaseClient.rpc = mockRpc;

      const result = await client.authenticateTeam('team-123', 'wrong-password');

      expect(result).toBe(false);
    });

    it('エラーが発生した場合は例外をスローする', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Auth error' }
      });

      mockSupabaseClient.rpc = mockRpc;

      await expect(
        client.authenticateTeam('team-123', 'password')
      ).rejects.toThrow('Auth error');
    });
  });

  describe('loadTeamData', () => {
    it('チームデータを読み込める', async () => {
      const mockFrom = vi.fn((table: string) => {
        if (table === 'players') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                data: [
                  { position: 'MT', name: 'Player1', job: 'PLD', equipment_policy: {}, weapon_wishes: [], dynamic_priority: 0 }
                ],
                error: null
              }))
            }))
          };
        } else if (table === 'allocations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                data: [
                  { position: 'MT', slot: '武器', status: 'allocated', layer: 1, week: 1, timestamp: '2025-01-01' }
                ],
                error: null
              }))
            }))
          };
        } else if (table === 'team_data') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { data: {} },
                    error: null
                  })
                }))
              }))
            }))
          };
        }
      });

      mockSupabaseClient.from = mockFrom;

      const result = await client.loadTeamData('team-123');

      expect(result.players).toEqual({
        MT: { name: 'Player1', job: 'PLD', position: 'MT', policies: {}, weaponWish1: undefined, weaponWish2: undefined, dynamicPriority: 0 }
      });
      expect(result.allocations).toEqual({
        'MT-武器': { position: 'MT', slot: '武器', status: 'allocated', layer: 1, week: 1, timestamp: '2025-01-01' }
      });
    });

    it('データが存在しない場合は空のデータを返す', async () => {
      const mockFrom = vi.fn((table: string) => {
        if (table === 'players' || table === 'allocations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }
              }))
            }))
          };
        } else if (table === 'team_data') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                }))
              }))
            }))
          };
        }
      });

      mockSupabaseClient.from = mockFrom;

      const result = await client.loadTeamData('team-123');

      expect(result).toEqual({
        raidTiers: {},
        players: {},
        allocations: {},
        settings: {},
        prioritySettings: {}
      });
    });
  });

  describe('saveData', () => {
    it('データを保存できる', async () => {
      const mockDelete = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      }));

      const mockInsert = vi.fn().mockResolvedValue({
        data: {},
        error: null
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'players') {
          return {
            delete: mockDelete,
            insert: mockInsert
          };
        }
        return {
          upsert: vi.fn().mockResolvedValue({ data: {}, error: null })
        };
      });

      mockSupabaseClient.from = mockFrom;

      const testData = { MT: { name: 'Player1', job: 'PLD', position: 'MT', policies: {}, dynamicPriority: 0 } };
      await client.saveData('team-123', 'players', testData);

      expect(mockFrom).toHaveBeenCalledWith('players');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith([
        {
          raid_tier_id: 'team-123',
          position: 'MT',
          name: 'Player1',
          job: 'PLD',
          equipment_policy: {},
          weapon_wishes: [],
          dynamic_priority: 0
        }
      ]);
    });

    it('エラーが発生した場合は例外をスローする', async () => {
      const mockDelete = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      }));

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Save error' }
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'players') {
          return {
            delete: mockDelete,
            insert: mockInsert
          };
        }
        return {
          upsert: vi.fn().mockResolvedValue({ data: {}, error: null })
        };
      });

      mockSupabaseClient.from = mockFrom;

      await expect(
        client.saveData('team-123', 'players', { MT: { name: 'Test', job: 'PLD', position: 'MT', policies: {}, dynamicPriority: 0 } })
      ).rejects.toThrow('Save error');
    });
  });

  describe('verifyInviteToken', () => {
    it('有効なトークンの場合はチーム情報を返す', async () => {
      const mockTeam = {
        team_id: 'team-123',
        team_name: 'Test Team',
        invite_token: 'valid-token',
        token_expires_at: null
      };

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockTeam,
              error: null
            })
          }))
        }))
      }));

      mockSupabaseClient.from = mockFrom;

      const result = await client.verifyInviteToken('valid-token');

      expect(result).toEqual(mockTeam);
    });

    it('無効なトークンの場合はnullを返す', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          }))
        }))
      }));

      mockSupabaseClient.from = mockFrom;

      const result = await client.verifyInviteToken('invalid-token');

      expect(result).toBeNull();
    });
  });
});
