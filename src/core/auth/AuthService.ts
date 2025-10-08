import type { StateManager } from '../state/StateManager';
import type { SupabaseStorageClient } from '../storage/SupabaseClient';

/**
 * 認証サービス基底クラス
 */
export abstract class AuthService {
  protected stateManager: StateManager;
  protected storage: SupabaseStorageClient;

  constructor(stateManager: StateManager, storage: SupabaseStorageClient) {
    this.stateManager = stateManager;
    this.storage = storage;
  }

  /**
   * 認証を実行
   */
  abstract authenticate(credentials: unknown): Promise<boolean>;

  /**
   * ログアウト
   */
  abstract logout(): void;

  /**
   * 自動ログインを試行
   */
  abstract tryAutoLogin(): Promise<boolean>;
}
