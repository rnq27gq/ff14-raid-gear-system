import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { SupabaseConfig, AppData, Team, Position } from '../../types';

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
      // プレイヤーデータを読み込み
      const { data: playersData, error: playersError } = await this.client
        .from('players')
        .select('*')
        .eq('raid_tier_id', teamId);

      if (playersError && playersError.code !== 'PGRST116') {
        throw new Error(playersError.message);
      }

      // 分配履歴を読み込み
      const { data: allocationsData, error: allocationsError } = await this.client
        .from('allocations')
        .select('*')
        .eq('raid_tier_id', teamId);

      if (allocationsError && allocationsError.code !== 'PGRST116') {
        throw new Error(allocationsError.message);
      }

      // 設定データを読み込み（team_dataから）
      const { data: settingsData, error: settingsError } = await this.client
        .from('team_data')
        .select('data')
        .eq('team_id', teamId)
        .eq('data_type', 'settings')
        .single();

      const { data: priorityData, error: priorityError } = await this.client
        .from('team_data')
        .select('data')
        .eq('team_id', teamId)
        .eq('data_type', 'prioritySettings')
        .single();

      // プレイヤーデータを変換
      const players: AppData['players'] = {};
      if (playersData) {
        playersData.forEach((player: any) => {
          const weaponWishes = player.weapon_wishes || [];
          const position = player.position as Position;
          players[position] = {
            name: player.name,
            job: player.job,
            position: player.position,
            policies: player.equipment_policy || {},
            weaponWish1: weaponWishes[0] || undefined,
            weaponWish2: weaponWishes[1] || undefined,
            dynamicPriority: player.dynamic_priority || 0
          };
        });
      }

      // 分配データを変換
      const allocations: AppData['allocations'] = {};
      if (allocationsData) {
        allocationsData.forEach((alloc: any) => {
          const key = `${alloc.position}-${alloc.slot}`;
          allocations[key] = {
            position: alloc.position,
            slot: alloc.slot,
            status: alloc.status,
            layer: alloc.layer,
            week: alloc.week,
            timestamp: alloc.timestamp
          };
        });
      }

      return {
        raidTiers: {},
        players,
        allocations,
        settings: (settingsError?.code === 'PGRST116') ? {} : (settingsData?.data || {}),
        prioritySettings: (priorityError?.code === 'PGRST116') ? {} : (priorityData?.data || {})
      };
    } catch (error) {
      console.error('チームデータ読み込みエラー:', error);
      return defaultData;
    }
  }

  /**
   * データを保存
   */
  async saveData(teamId: string, dataType: string, content: unknown): Promise<void> {
    if (dataType === 'players') {
      // プレイヤーデータを正規化テーブルに保存
      const players = content as AppData['players'];
      const playerRecords = Object.entries(players)
        .filter(([_, player]) => player !== undefined)
        .map(([position, player]) => {
          const weaponWishes: string[] = [];
          if (player!.weaponWish1) weaponWishes.push(player!.weaponWish1);
          if (player!.weaponWish2) weaponWishes.push(player!.weaponWish2);

          return {
            raid_tier_id: teamId,
            position,
            name: player!.name,
            job: player!.job,
            equipment_policy: player!.policies,
            weapon_wishes: weaponWishes,
            dynamic_priority: player!.dynamicPriority
          };
        });

      // 既存データを削除して新規挿入
      await this.client
        .from('players')
        .delete()
        .eq('raid_tier_id', teamId);

      if (playerRecords.length > 0) {
        const { error } = await this.client
          .from('players')
          .insert(playerRecords);

        if (error) {
          throw new Error(error.message);
        }
      }
    } else if (dataType === 'allocations') {
      // 分配データを正規化テーブルに保存
      const allocations = content as AppData['allocations'];
      const allocationRecords = Object.values(allocations).map((alloc) => ({
        raid_tier_id: teamId,
        position: alloc.position,
        slot: alloc.slot,
        status: alloc.status,
        layer: alloc.layer,
        week: alloc.week,
        timestamp: alloc.timestamp
      }));

      // 既存データを削除して新規挿入
      await this.client
        .from('allocations')
        .delete()
        .eq('raid_tier_id', teamId);

      if (allocationRecords.length > 0) {
        const { error } = await this.client
          .from('allocations')
          .insert(allocationRecords);

        if (error) {
          throw new Error(error.message);
        }
      }
    } else {
      // 設定データはteam_dataテーブルに保存
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
