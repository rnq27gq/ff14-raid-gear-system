import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { SupabaseConfig, AppData, Team } from '../../types';

/**
 * Supabaseストレージクライアント
 */
export class SupabaseStorageClient {
  private client: SupabaseClientType;

  constructor(config: SupabaseConfig) {
    this.client = createClient(config.url, config.anonKey);
  }

  /**
   * チームコンテキストを設定
   */
  async setTeamContext(teamId: string): Promise<void> {
    const { data, error } = await this.client.rpc('set_team_context', {
      team_id: teamId
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * チーム認証
   */
  async authenticateTeam(teamId: string, password: string): Promise<boolean> {
    const { data, error } = await this.client.rpc('authenticate_team', {
      p_team_id: teamId,
      p_password: password
    });

    if (error) {
      throw new Error(error.message);
    }

    return data === true;
  }

  /**
   * チームデータを読み込み
   */
  async loadTeamData(teamId: string): Promise<AppData> {
    const defaultData: AppData = {
      raidTiers: {},
      players: {},
      allocations: {},
      settings: {},
      prioritySettings: {}
    };

    try {
      // 各データタイプを読み込み
      const dataTypes = ['players', 'allocations', 'settings', 'prioritySettings'];
      const results = await Promise.all(
        dataTypes.map(async (dataType) => {
          const { data, error } = await this.client
            .from('team_data')
            .select('data')
            .eq('team_id', teamId)
            .eq('data_type', dataType)
            .single();

          // データが存在しない場合は空オブジェクト/配列を返す
          if (error && error.code === 'PGRST116') {
            return { dataType, data: {} };
          }

          if (error) {
            throw new Error(error.message);
          }

          return { dataType, data: data?.data || {} };
        })
      );

      // 結果をマージ
      const loadedData: AppData = { ...defaultData };
      results.forEach(({ dataType, data }) => {
        (loadedData as any)[dataType] = data;
      });

      return loadedData;
    } catch (error) {
      console.error('チームデータ読み込みエラー:', error);
      return defaultData;
    }
  }

  /**
   * データを保存
   */
  async saveData(teamId: string, dataType: string, content: unknown): Promise<void> {
    const { error } = await this.client
      .from('team_data')
      .upsert(
        {
          team_id: teamId,
          data_type: dataType,
          data: content
        },
        { onConflict: 'team_id,data_type' }
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * 招待トークンを検証
   */
  async verifyInviteToken(token: string): Promise<Team | null> {
    const { data, error } = await this.client
      .from('teams')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) {
      throw new Error(error.message);
    }

    return data as Team;
  }

  /**
   * 新しいチームを作成
   */
  async createTeam(teamName: string, password: string, creatorName: string): Promise<string> {
    const { data, error } = await this.client.rpc('create_team', {
      p_team_name: teamName,
      p_password: password,
      p_creator_name: creatorName
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as string;
  }

  /**
   * 生のSupabaseクライアントを取得（高度な操作用）
   */
  getClient(): SupabaseClientType {
    return this.client;
  }
}
