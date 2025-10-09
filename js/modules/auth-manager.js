// 認証管理モジュール

import { initializeMainFeatures } from './data-loader.js';

// 自動ログイン試行
async function tryAutoLogin() {
    // 招待トークンがある場合は特別な処理
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token');

    if (inviteToken) {
        await handleInviteTokenAccess(inviteToken);
        return;
    }

    const savedTeamId = localStorage.getItem('ff14_team_id');
    if (savedTeamId) {
        window.currentTeamId = savedTeamId;

        // チームコンテキスト設定
        try {
            const { data: contextData, error: contextError } = await window.supabaseClient.rpc('set_team_context', {
                team_id: savedTeamId
            });

            if (contextError) {
                console.error('コンテキスト設定エラー:', contextError);
            } else {
            }
        } catch (error) {
            console.error('自動ログイン中のコンテキスト設定エラー:', error);
        }

        await showAuthenticatedState();

        // メイン機能の初期化
        await initializeMainFeatures();

    }
}

// 招待トークンでのアクセス処理
async function handleInviteTokenAccess(inviteToken) {
    try {
        showMessage('招待リンクを確認中...', 'info');

        // 招待トークンの検証（永続化対応）
        const { data: team, error } = await window.supabaseClient
            .from('teams')
            .select('*')
            .eq('invite_token', inviteToken)
            .single();

        if (error || !team) {
            showError('招待リンクが無効です');
            return;
        }

        // 有効期限チェック（nullの場合は永続）
        if (team.token_expires_at && new Date(team.token_expires_at) < new Date()) {
            showError('招待リンクの有効期限が切れています');
            return;
        }

        // 招待トークンで直接ログイン
        showMessage('チームにアクセス中...', 'info');

        // チーム情報を保存
        window.currentTeamId = team.team_id;
        localStorage.setItem('ff14_team_id', team.team_id);
        localStorage.setItem('ff14_invite_access', 'true');

        // チームコンテキスト設定
        try {
            const { data: contextData, error: contextError } = await window.supabaseClient.rpc('set_team_context', {
                team_id: team.team_id
            });

            if (contextError) {
                console.error('コンテキスト設定エラー:', contextError);
            }
        } catch (contextErr) {
        }

        // 認証状態を表示
        await showAuthenticatedState();
        showSuccess(`「${getDisplayTeamName(team.team_name)}」にアクセスしました！`);

        // メイン機能の初期化
        await initializeMainFeatures();

        // URLからトークンパラメータを削除
        const url = new URL(window.location);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());

    } catch (error) {
        console.error('招待トークンアクセスエラー:', error);
        showError('招待リンクの処理中にエラーが発生しました');
    }
}

// 招待歓迎画面表示
function showInviteWelcomeScreen(team) {
    hideMessage();

    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.innerHTML = `
            <h2>チーム招待</h2>
            <div style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
                <h3 style="margin: 0 0 10px 0; color: #007bff;">
                    「${getDisplayTeamName(team.team_name)}」へようこそ！
                </h3>
                <p style="margin: 0; color: #666;">
                    チームリーダー: ${team.creator_name || 'Unknown'}
                </p>
            </div>

            <div class="auth-methods">
                <button class="discord-auth-btn" onclick="startDiscordAuth()">
                    <div class="discord-icon"></div>
                    Discordでチームに参加
                </button>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px; font-size: 14px; color: #856404;">
                <strong>ご注意:</strong><br>
                • Discord認証でチームに参加します<br>
                • 一度参加すると、このDiscordアカウントでログインできます<br>
                • チームメンバーとして装備分配に参加できます
            </div>

            <div style="margin-top: 20px; font-size: 12px; color: #888;">
                <p>従来のチームID・パスワード方式をご希望の場合は、<br>
                チームリーダーにお問い合わせください。</p>
            </div>
        `;
    }

    // 認証画面を表示
    const authScreen = document.getElementById('authScreen');
    if (authScreen) {
        authScreen.classList.add('show');
    }
}

// Discord認証開始
function startDiscordAuth() {
    // URLパラメータから招待トークンを確認
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token');

    if (inviteToken) {
        // 招待トークン付きDiscord認証
        startDiscordAuthWithToken(inviteToken);
    } else {
        // 通常のDiscord認証（まだチームがない場合）
        showError('Discord認証は招待リンクからのみ利用できます。\nチームリーダーから招待リンクをもらってアクセスしてください。');
    }
}

// 招待トークン付きDiscord認証
async function startDiscordAuthWithToken(inviteToken) {
    try {
        // 招待トークンの検証
        showMessage('招待リンクを確認中...', 'info');

        const { data: tokenValidation, error: tokenError } = await window.supabaseClient
            .from('teams')
            .select('*')
            .eq('invite_token', inviteToken)
            .single();

        if (tokenError || !tokenValidation) {
            throw new Error('招待リンクが無効です');
        }

        // 有効期限チェック（nullの場合は永続）
        if (tokenValidation.token_expires_at && new Date(tokenValidation.token_expires_at) < new Date()) {
            throw new Error('招待リンクの有効期限が切れています');
        }

        // Discord認証URL生成
        const state = btoa(JSON.stringify({
            inviteToken: inviteToken,
            timestamp: Date.now()
        }));

        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?` +
            `client_id=${DISCORD_CONFIG.client_id}&` +
            `redirect_uri=${encodeURIComponent(DISCORD_CONFIG.redirect_uri)}&` +
            `response_type=${DISCORD_CONFIG.response_type}&` +
            `scope=${DISCORD_CONFIG.scope}&` +
            `state=${encodeURIComponent(state)}`;

        // Discord認証画面にリダイレクト
        window.location.href = discordAuthUrl;

    } catch (error) {
        console.error('Discord認証開始エラー:', error);
        showError('Discord認証の開始に失敗しました: ' + error.message);
    }
}

// Discord OAuth2コールバック処理
async function handleDiscordCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (!code || !state) return false;

    try {
        showMessage('Discord認証処理中...', 'info');

        // stateデコード
        const stateData = JSON.parse(atob(state));
        const { inviteToken } = stateData;

        // Discordトークン交換
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: DISCORD_CONFIG.client_id,
                client_secret: 'KbWBwS5AS5T6p-J75GTjOH-0rnXI5HoG', // 一時的にフロントエンドで使用
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: DISCORD_CONFIG.redirect_uri,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Discordトークン交換に失敗しました');
        }

        const tokenData = await tokenResponse.json();

        // Discordユーザー情報取得
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userResponse.ok) {
            throw new Error('Discordユーザー情報取得に失敗しました');
        }

        const userData = await userResponse.json();

        // チーム参加処理
        await joinTeamWithDiscordAuth(inviteToken, userData, tokenData.access_token);

        return true;

    } catch (error) {
        console.error('Discord認証エラー:', error);
        showError('Discord認証に失敗しました: ' + error.message);

        // URLからパラメータをクリア
        window.history.replaceState({}, document.title, window.location.pathname);
        return false;
    }
}

// Discord認証でチーム参加
async function joinTeamWithDiscordAuth(inviteToken, discordUser, accessToken) {
    try {
        // Supabaseでチーム参加処理
        const { data, error } = await window.supabaseClient.rpc('join_team_with_discord', {
            p_invite_token: inviteToken,
            p_discord_id: discordUser.id,
            p_discord_username: discordUser.username,
            p_discord_avatar: discordUser.avatar,
            p_access_token: accessToken
        });

        if (error) {
            throw new Error(`チーム参加エラー: ${error.message}`);
        }

        if (!data) {
            throw new Error('チーム参加に失敗しました');
        }

        // 認証成功
        window.currentTeamId = data.team_id;
        localStorage.setItem('ff14_team_id', data.team_id);
        localStorage.setItem('ff14_discord_auth', 'true');

        await showAuthenticatedState();
        showSuccess('Discordアカウントでログインしました！');

        // URLからパラメータをクリア
        window.history.replaceState({}, document.title, window.location.pathname);

    } catch (error) {
        console.error('チーム参加エラー:', error);
        showError('チーム参加に失敗しました: ' + error.message);
        throw error;
    }
}

// チーム認証
async function authenticateTeam() {
    const teamId = document.getElementById('mainTeamIdInput')?.value;
    const password = document.getElementById('mainPasswordInput')?.value;

    if (!teamId || !password) {
        showError('チームIDとパスワードを入力してください');
        return;
    }

    try {
        showMessage('認証中...', 'info');

        // Supabaseクライアント確認
        if (!window.supabaseClient) {
            throw new Error('Supabaseクライアントが初期化されていません');
        }


        // Supabase認証
        const { data, error } = await window.supabaseClient.rpc('authenticate_team', {
            p_team_id: teamId,
            p_password: password
        });


        if (error) {
            throw new Error(`認証エラー: ${error.message}`);
        }

        if (!data) {
            throw new Error('チームIDまたはパスワードが正しくありません');
        }

        // 認証成功
        window.currentTeamId = teamId;
        localStorage.setItem('ff14_team_id', teamId);

        // チームコンテキスト設定
        const { data: contextData, error: contextError } = await window.supabaseClient.rpc('set_team_context', {
            team_id: teamId
        });

        if (contextError) {
            console.error('コンテキスト設定エラー:', contextError);
        } else {
        }

        await showAuthenticatedState();
        showSuccess('ログインしました');

        // メイン機能の初期化
        await initializeMainFeatures();

    } catch (error) {
        console.error('認証エラー:', error);
        showError('認証に失敗しました: ' + error.message);
    }
}

// 新規チーム作成
async function createNewTeam() {
    const teamId = document.getElementById('signupTeamIdInput').value;
    const createdBy = document.getElementById('signupCreatedByInput').value;
    const password = document.getElementById('signupPasswordInput').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirmInput').value;
    const securityQuestionSelect = document.getElementById('signupSecurityQuestionSelect').value;
    const customQuestion = document.getElementById('signupCustomQuestionInput').value;
    const securityAnswer = document.getElementById('signupSecurityAnswerInput').value;

    // バリデーション
    if (!teamId || !createdBy || !password || !passwordConfirm || !securityQuestionSelect || !securityAnswer) {
        showError('すべての項目を入力してください');
        return;
    }

    if (teamId.length < 3) {
        showError('チームIDは3文字以上で入力してください');
        return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(teamId)) {
        showError('チームIDは英数字、ハイフン、アンダースコアのみ使用可能です');
        return;
    }

    if (password.length < 6) {
        showError('パスワードは6文字以上で入力してください');
        return;
    }

    if (password !== passwordConfirm) {
        showError('パスワードが一致しません');
        return;
    }

    // セキュリティ質問の検証
    let finalSecurityQuestion;
    if (securityQuestionSelect === 'custom') {
        if (!customQuestion.trim()) {
            showError('カスタム質問を入力してください');
            return;
        }
        finalSecurityQuestion = customQuestion.trim();
    } else {
        const questionTexts = {
            'favorite_job': '好きなジョブは何ですか？',
            'first_datacenter': '最初にプレイしたデータセンターは？',
            'main_character': 'メインキャラクターの名前は？',
            'favorite_raid': '好きな零式レイドは？',
            'fc_name': '所属FCの名前は？'
        };
        finalSecurityQuestion = questionTexts[securityQuestionSelect];
    }

    try {
        showMessage('チーム作成中...', 'info');

        // Supabaseクライアント確認
        if (!window.supabaseClient) {
            throw new Error('Supabaseクライアントが初期化されていません');
        }


        // Supabaseでセキュリティ質問付きチーム作成
        const { data, error } = await window.supabaseClient.rpc('create_team_with_security', {
            p_team_id: teamId,
            p_team_name: teamId, // チーム名はチームIDと同じに設定
            p_password: password,
            p_created_by: createdBy,
            p_security_question: finalSecurityQuestion,
            p_security_answer: securityAnswer
        });


        if (error) {
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                throw new Error('このチームIDは既に使用されています');
            }
            throw new Error(`チーム作成エラー: ${error.message}`);
        }

        if (!data) {
            throw new Error('チーム作成に失敗しました');
        }

        // 作成成功 - 自動ログイン
        showSuccess('チームが作成されました！自動ログインします...');

        // 少し待ってから自動ログイン
        setTimeout(async () => {
            // 入力フィールドに値を設定
            document.getElementById('mainTeamIdInput').value = teamId;
            document.getElementById('mainPasswordInput').value = password;

            // ログイン画面に戻る
            showLoginForm();

            // 自動ログイン
            await authenticateTeam();
        }, 1000);

    } catch (error) {
        console.error('チーム作成エラー:', error);
        showError('チーム作成に失敗しました: ' + error.message);
    }
}

// 新規登録画面表示
function showSignupForm() {
    const authScreen = document.getElementById('authScreen');
    if (authScreen) authScreen.classList.remove('show');

    const signupScreen = document.getElementById('signupScreen');
    if (signupScreen) signupScreen.style.display = 'block';

    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.style.display = 'none';

    // 入力フィールドをクリア
    const signupTeamIdInput = document.getElementById('signupTeamIdInput');
    if (signupTeamIdInput) signupTeamIdInput.value = '';

    const signupPasswordInput = document.getElementById('signupPasswordInput');
    if (signupPasswordInput) signupPasswordInput.value = '';

    const signupPasswordConfirmInput = document.getElementById('signupPasswordConfirmInput');
    if (signupPasswordConfirmInput) signupPasswordConfirmInput.value = '';
}

// ログイン画面表示
function showLoginForm() {
    const authScreen = document.getElementById('authScreen');
    if (authScreen) authScreen.classList.add('show');

    const signupScreen = document.getElementById('signupScreen');
    if (signupScreen) signupScreen.style.display = 'none';

    const passwordResetScreen = document.getElementById('passwordResetScreen');
    if (passwordResetScreen) passwordResetScreen.style.display = 'none';

    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.style.display = 'none';
}

// パスワードリセット画面表示
function showPasswordResetForm() {
    const authScreen = document.getElementById('authScreen');
    if (authScreen) authScreen.classList.remove('show');

    const signupScreen = document.getElementById('signupScreen');
    if (signupScreen) signupScreen.style.display = 'none';

    const passwordResetScreen = document.getElementById('passwordResetScreen');
    if (passwordResetScreen) passwordResetScreen.style.display = 'block';

    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.style.display = 'none';

    // リセット画面の初期化
    resetPasswordResetForm();
}

// 認証後の状態表示
async function showAuthenticatedState() {
    window.isAuthenticated = true;

    // UI切り替え（安全な要素アクセス）
    const authScreen = document.getElementById('authScreen');
    if (authScreen) authScreen.classList.remove('show');

    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.classList.add('authenticated');
        mainContent.style.display = 'block'; // Override inline style from showLoginForm
    }
}

// ログアウト（Discord OAuth利用時は基本的に不要）
function logout() {
    window.isAuthenticated = false;
    window.currentTeamId = null;

    // ローカルストレージクリア
    localStorage.removeItem('ff14_team_id');
    localStorage.removeItem('ff14_discord_auth');
    localStorage.removeItem('ff14_invite_access');

    // UI切り替え
    const authScreen = document.getElementById('authScreen');
    if (authScreen) authScreen.classList.add('show');

    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.classList.remove('authenticated');

    // 入力欄クリア
    const mainTeamIdInput = document.getElementById('mainTeamIdInput');
    if (mainTeamIdInput) mainTeamIdInput.value = '';

    const mainPasswordInput = document.getElementById('mainPasswordInput');
    if (mainPasswordInput) mainPasswordInput.value = '';

    showSuccess('ログアウトしました');
}

// パスワードリセット関連関数

// パスワードリセットフォームの初期化
function resetPasswordResetForm() {
    // 全ステップを非表示にしてステップ1のみ表示
    document.getElementById('resetStep1').style.display = 'block';
    document.getElementById('resetStep2').style.display = 'none';
    document.getElementById('resetStep3').style.display = 'none';

    // 入力欄をクリア
    document.getElementById('resetTeamIdInput').value = '';
    document.getElementById('resetSecurityAnswerInput').value = '';
    document.getElementById('resetNewPasswordInput').value = '';
    document.getElementById('resetNewPasswordConfirmInput').value = '';

    // グローバル変数をクリア
    window.resetToken = null;
    window.resetTeamId = null;
}

// セキュリティ質問取得
async function getSecurityQuestion() {
    const teamId = document.getElementById('resetTeamIdInput').value.trim();

    if (!teamId) {
        showError('チームIDを入力してください');
        return;
    }

    try {
        showMessage('チーム情報を取得中...', 'info');

        if (!window.supabaseClient) {
            throw new Error('Supabaseクライアントが初期化されていません');
        }

        const { data, error } = await window.supabaseClient.rpc('get_team_reset_info', {
            p_team_id: teamId
        });

        if (error) {
            throw new Error(`チーム情報取得エラー: ${error.message}`);
        }

        if (!data || data.length === 0) {
            showError('指定されたチームIDが見つかりません');
            return;
        }

        const teamInfo = data[0];

        if (!teamInfo.security_question) {
            showError('このチームにはセキュリティ質問が設定されていません。チーム作成者に相談してください。');
            return;
        }

        // チーム情報とセキュリティ質問を表示
        const teamInfoDisplay = document.getElementById('teamInfoDisplay');
        teamInfoDisplay.innerHTML = `
            <strong>チーム名:</strong> ${getDisplayTeamName(teamInfo.team_name)}<br>
            <strong>作成者:</strong> ${teamInfo.created_by || '未設定'}<br>
            <strong>作成日:</strong> ${new Date(teamInfo.created_at).toLocaleDateString('ja-JP')}
        `;

        const securityQuestionDisplay = document.getElementById('securityQuestionDisplay');
        securityQuestionDisplay.textContent = `Q: ${teamInfo.security_question}`;

        // ステップ2を表示
        document.getElementById('resetStep1').style.display = 'none';
        document.getElementById('resetStep2').style.display = 'block';

        window.resetTeamId = teamId;
        showSuccess('セキュリティ質問を取得しました');

    } catch (error) {
        console.error('セキュリティ質問取得エラー:', error);
        showError('セキュリティ質問の取得に失敗しました: ' + error.message);
    }
}

// セキュリティ質問の答え確認
async function verifySecurityAnswer() {
    const answer = document.getElementById('resetSecurityAnswerInput').value.trim();

    if (!answer) {
        showError('セキュリティ質問の答えを入力してください');
        return;
    }

    try {
        showMessage('セキュリティ質問を確認中...', 'info');

        if (!window.supabaseClient || !window.resetTeamId) {
            throw new Error('システムエラーが発生しました');
        }

        const { data, error } = await window.supabaseClient.rpc('verify_security_answer', {
            p_team_id: window.resetTeamId,
            p_answer: answer
        });

        if (error) {
            throw new Error(`セキュリティ質問確認エラー: ${error.message}`);
        }

        if (!data) {
            showError('セキュリティ質問の答えが正しくありません');
            return;
        }

        // リセットトークンを生成
        const tokenResult = await window.supabaseClient.rpc('generate_reset_token', {
            p_team_id: window.resetTeamId
        });

        if (tokenResult.error) {
            throw new Error(`トークン生成エラー: ${tokenResult.error.message}`);
        }

        window.resetToken = tokenResult.data;

        // ステップ3を表示
        document.getElementById('resetStep2').style.display = 'none';
        document.getElementById('resetStep3').style.display = 'block';

        showSuccess('セキュリティ質問の確認が完了しました');

    } catch (error) {
        console.error('セキュリティ質問確認エラー:', error);
        showError('セキュリティ質問の確認に失敗しました: ' + error.message);
    }
}

// パスワードリセット実行
async function executePasswordReset() {
    const newPassword = document.getElementById('resetNewPasswordInput').value;
    const newPasswordConfirm = document.getElementById('resetNewPasswordConfirmInput').value;

    if (!newPassword || !newPasswordConfirm) {
        showError('新しいパスワードを入力してください');
        return;
    }

    if (newPassword.length < 6) {
        showError('パスワードは6文字以上で入力してください');
        return;
    }

    if (newPassword !== newPasswordConfirm) {
        showError('パスワードが一致しません');
        return;
    }

    try {
        showMessage('パスワードをリセット中...', 'info');

        if (!window.supabaseClient || !window.resetTeamId || !window.resetToken) {
            throw new Error('システムエラーが発生しました');
        }

        const { data, error } = await window.supabaseClient.rpc('reset_password', {
            p_team_id: window.resetTeamId,
            p_token: window.resetToken,
            p_new_password: newPassword
        });

        if (error) {
            throw new Error(`パスワードリセットエラー: ${error.message}`);
        }

        if (!data) {
            showError('パスワードリセットに失敗しました。トークンの有効期限が切れている可能性があります。');
            return;
        }

        showSuccess('パスワードが正常にリセットされました！新しいパスワードでログインしてください。');

        // ログイン画面に戻る
        setTimeout(() => {
            showLoginForm();
            // ログインフォームに新しい値を設定
            document.getElementById('mainTeamIdInput').value = window.resetTeamId;
        }, 2000);

    } catch (error) {
        console.error('パスワードリセットエラー:', error);
        showError('パスワードリセットに失敗しました: ' + error.message);
    }
}

// 接続状態更新（シンプルヘッダーでは表示しない）
function updateConnectionStatus(isOnline) {
    // シンプルヘッダーには接続ステータス表示がないため何もしない
}

export {
    tryAutoLogin,
    handleInviteTokenAccess,
    showInviteWelcomeScreen,
    startDiscordAuth,
    startDiscordAuthWithToken,
    handleDiscordCallback,
    joinTeamWithDiscordAuth,
    authenticateTeam,
    createNewTeam,
    showSignupForm,
    showLoginForm,
    showPasswordResetForm,
    showAuthenticatedState,
    logout,
    resetPasswordResetForm,
    getSecurityQuestion,
    verifySecurityAnswer,
    executePasswordReset,
    updateConnectionStatus
};
