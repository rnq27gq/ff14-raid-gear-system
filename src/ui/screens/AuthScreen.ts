import type { TeamAuth } from '../../core/auth/TeamAuth';
import type { MessageDisplay } from '../MessageDisplay';

/**
 * 認証画面
 */
export class AuthScreen {
  private teamAuth: TeamAuth;
  private messageDisplay: MessageDisplay;
  private container: HTMLElement;

  constructor(container: HTMLElement, teamAuth: TeamAuth, messageDisplay: MessageDisplay) {
    this.container = container;
    this.teamAuth = teamAuth;
    this.messageDisplay = messageDisplay;
  }

  /**
   * 認証画面を表示
   */
  render(): void {
    this.container.innerHTML = `
      <div class="auth-screen show">
        <div class="auth-card">
          <h2>FF14 零式装備分配システム</h2>
          <p class="auth-description">チームID/パスワードでログインしてください</p>

          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <label for="teamIdInput">チームID</label>
              <input
                type="text"
                id="teamIdInput"
                class="form-control"
                placeholder="team-abc-123"
                required
              />
            </div>

            <div class="form-group">
              <label for="passwordInput">パスワード</label>
              <input
                type="password"
                id="passwordInput"
                class="form-control"
                placeholder="パスワード"
                required
              />
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              ログイン
            </button>
          </form>

          <div class="auth-footer">
            <p class="text-muted">初めての方は管理者に連絡してチームIDを取得してください</p>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * イベントリスナーを設定
   */
  private attachEventListeners(): void {
    const loginForm = document.getElementById('loginForm') as HTMLFormElement;
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
  }

  /**
   * ログイン処理
   */
  private async handleLogin(event: Event): Promise<void> {
    event.preventDefault();

    const teamIdInput = document.getElementById('teamIdInput') as HTMLInputElement;
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;

    if (!teamIdInput || !passwordInput) {
      this.messageDisplay.showError('入力フォームが見つかりません');
      return;
    }

    const teamId = teamIdInput.value.trim();
    const password = passwordInput.value;

    if (!teamId || !password) {
      this.messageDisplay.showError('チームIDとパスワードを入力してください');
      return;
    }

    try {
      this.messageDisplay.showInfo('ログイン中...');

      const success = await this.teamAuth.authenticate({ teamId, password });

      if (success) {
        this.messageDisplay.showSuccess('ログインしました');
        // UIManagerがstate変更を検知して画面を切り替える
      } else {
        this.messageDisplay.showError('チームIDまたはパスワードが正しくありません');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      this.messageDisplay.showError('ログインに失敗しました');
    }
  }

  /**
   * 画面をクリア
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}
