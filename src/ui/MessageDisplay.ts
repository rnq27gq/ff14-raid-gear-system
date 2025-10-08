/**
 * メッセージ表示タイプ
 */
export type MessageType = 'error' | 'success' | 'info';

/**
 * メッセージ表示オプション
 */
export interface MessageOptions {
  duration?: number; // 表示時間（ミリ秒）
  autoHide?: boolean; // 自動非表示
}

/**
 * メッセージ表示クラス
 */
export class MessageDisplay {
  private errorElement: HTMLElement | null;
  private successElement: HTMLElement | null;

  constructor() {
    this.errorElement = document.getElementById('errorMessage');
    this.successElement = document.getElementById('successMessage');
  }

  /**
   * エラーメッセージを表示
   */
  showError(message: string, options?: MessageOptions): void {
    this.showMessage(message, 'error', options);
  }

  /**
   * 成功メッセージを表示
   */
  showSuccess(message: string, options?: MessageOptions): void {
    this.showMessage(message, 'success', options);
  }

  /**
   * 情報メッセージを表示
   */
  showInfo(message: string, options?: MessageOptions): void {
    this.showMessage(message, 'info', options);
  }

  /**
   * メッセージを表示
   */
  showMessage(message: string, type: MessageType, options?: MessageOptions): void {
    const { duration = this.getDefaultDuration(type), autoHide = true } = options || {};

    try {
      // DOM要素の存在確認
      if (!this.errorElement || !this.successElement) {
        this.fallbackToConsole(message, type);
        return;
      }

      // 全メッセージを隠す
      this.hideAll();

      // メッセージを表示
      const targetElement = this.getTargetElement(type);
      if (targetElement) {
        targetElement.textContent = message;
        targetElement.style.display = 'block';

        // 自動非表示
        if (autoHide) {
          setTimeout(() => {
            this.hide(type);
          }, duration);
        }
      }
    } catch (error) {
      console.error('メッセージ表示エラー:', error);
      this.fallbackToConsole(message, type);
    }
  }

  /**
   * すべてのメッセージを非表示
   */
  hideAll(): void {
    if (this.errorElement) {
      this.errorElement.style.display = 'none';
    }
    if (this.successElement) {
      this.successElement.style.display = 'none';
    }
  }

  /**
   * 特定のメッセージを非表示
   */
  hide(type: MessageType): void {
    const targetElement = this.getTargetElement(type);
    if (targetElement) {
      targetElement.style.display = 'none';
    }
  }

  /**
   * メッセージタイプに応じた表示時間を取得
   */
  private getDefaultDuration(type: MessageType): number {
    switch (type) {
      case 'error':
        return 5000;
      case 'success':
        return 3000;
      case 'info':
        return 4000;
      default:
        return 3000;
    }
  }

  /**
   * メッセージタイプに応じた要素を取得
   */
  private getTargetElement(type: MessageType): HTMLElement | null {
    switch (type) {
      case 'error':
        return this.errorElement;
      case 'success':
      case 'info':
        return this.successElement;
      default:
        return null;
    }
  }

  /**
   * コンソールへのフォールバック
   */
  private fallbackToConsole(message: string, type: MessageType): void {
    switch (type) {
      case 'error':
        console.error('Error:', message);
        break;
      case 'success':
        console.log('Success:', message);
        break;
      case 'info':
        console.info('Info:', message);
        break;
    }
  }
}
