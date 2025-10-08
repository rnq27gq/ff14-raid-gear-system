import type {
  AppState,
  AppData,
  StateListener,
  Player,
  Allocation,
  Position,
  RaidTier
} from '../../types';

/**
 * アプリケーション状態管理クラス
 */
export class StateManager {
  private state: AppState;
  private listeners: Set<StateListener>;

  constructor(initialState?: Partial<AppState>) {
    // デフォルト初期状態
    const defaultState: AppState = {
      isAuthenticated: false,
      currentTeamId: null,
      isInitializing: false,
      isInitialized: false,
      selectedDirectWeapon: '',
      currentRaidTier: null,
      appData: {
        raidTiers: {},
        players: {},
        allocations: {},
        settings: {},
        prioritySettings: {}
      }
    };

    // 初期状態をマージ
    this.state = { ...defaultState, ...initialState };
    this.listeners = new Set();
  }

  /**
   * 現在の状態を取得（読み取り専用）
   */
  getState(): Readonly<AppState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * 状態を部分的に更新
   */
  setState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * 指定されたプレイヤーを取得
   */
  getPlayer(tierId: string, position: Position): Player | undefined {
    return this.state.appData.players[position];
  }

  /**
   * プレイヤー情報を更新
   */
  updatePlayer(tierId: string, position: Position, player: Player): void {
    const currentData = this.state.appData;

    // プレイヤーを更新
    currentData.players[position] = player;

    // 状態を更新
    this.setState({
      appData: { ...currentData }
    });
  }

  /**
   * 指定されたティアの分配履歴を取得
   */
  getAllocations(tierId: string): Allocation[] {
    return Object.values(this.state.appData.allocations);
  }

  /**
   * 分配履歴を追加
   */
  addAllocation(tierId: string, allocation: Allocation): void {
    const currentData = this.state.appData;
    const key = `${allocation.position}-${allocation.slot}`;

    // 分配履歴を追加
    currentData.allocations[key] = allocation;

    // 状態を更新
    this.setState({
      appData: { ...currentData }
    });
  }

  /**
   * 状態変更リスナーを登録
   * @returns 登録解除関数
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);

    // 登録解除関数を返す
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * すべてのリスナーに状態変更を通知
   */
  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => {
      listener(currentState);
    });
  }
}
