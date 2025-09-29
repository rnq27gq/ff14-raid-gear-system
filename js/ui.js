// UI管理機能

/**
 * エラーメッセージを表示
 * @param {string} message - 表示するメッセージ
 */
function showError(message) {
    showMessage(message, 'error');
}

/**
 * 成功メッセージを表示
 * @param {string} message - 表示するメッセージ
 */
function showSuccess(message) {
    showMessage(message, 'success');
}

/**
 * メッセージを表示（エラーハンドリング強化版）
 * @param {string} message - 表示するメッセージ
 * @param {string} type - メッセージタイプ ('error' | 'success')
 */
function showMessage(message, type) {
    try {
        const errorEl = document.getElementById('errorMessage');
        const successEl = document.getElementById('successMessage');

        // DOM要素の存在確認
        if (!errorEl || !successEl) {
            console.warn('メッセージ表示要素が見つかりません:', { errorEl, successEl });

            // フォールバック: コンソールにログ出力
            if (type === 'error') {
                console.error('Error:', message);
            } else if (type === 'success') {
                console.log('Success:', message);
            }
            return;
        }

        // 全メッセージを隠す
        errorEl.style.display = 'none';
        successEl.style.display = 'none';

        if (type === 'error') {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => {
                if (errorEl) {
                    errorEl.style.display = 'none';
                }
            }, 5000);
        } else if (type === 'success') {
            successEl.textContent = message;
            successEl.style.display = 'block';
            setTimeout(() => {
                if (successEl) {
                    successEl.style.display = 'none';
                }
            }, 3000);
        }
    } catch (error) {
        console.error('メッセージ表示エラー:', error);
        // 最終フォールバック
        if (type === 'error') {
            console.error('Error:', message);
        } else if (type === 'success') {
            console.log('Success:', message);
        }
    }
}

// グローバルスコープに関数を登録（下位互換性のため）
if (typeof window !== 'undefined') {
    window.showError = showError;
    window.showSuccess = showSuccess;
    window.showMessage = showMessage;
}