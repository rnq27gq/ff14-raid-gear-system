/**
 * ローディング画面管理クラス
 */
export class LoadingScreen {
  private loadingScreen: HTMLElement | null;
  private loadingMessage: HTMLElement | null;
  private mainContent: HTMLElement | null;

  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.loadingMessage = document.getElementById('loadingMessage');
    this.mainContent = document.getElementById('mainContent');
  }

  /**
   * ローディング画面を表示
   */
  show(message?: string): void {
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'block';
      this.loadingScreen.classList.add('show');
    }

    if (this.mainContent) {
      this.mainContent.style.display = 'none';
    }

    if (message) {
      this.updateMessage(message);
    }
  }

  /**
   * ローディング画面を非表示
   */
  hide(): void {
    if (this.loadingScreen) {
      this.loadingScreen.classList.remove('show');
      this.loadingScreen.style.display = 'none';
    }

    if (this.mainContent) {
      this.mainContent.style.display = 'block';
    }
  }

  /**
   * ローディングメッセージを更新
   */
  updateMessage(message: string): void {
    if (this.loadingMessage) {
      this.loadingMessage.textContent = message;
    }
  }

  /**
   * ローディング画面が表示中かどうか
   */
  isVisible(): boolean {
    if (!this.loadingScreen) return false;
    return this.loadingScreen.style.display !== 'none';
  }
}
