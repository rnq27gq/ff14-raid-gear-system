        console.log('🚀 メインスクリプト開始 - v2.2-scope-fix');
        console.log('実行時刻:', new Date().toLocaleTimeString());

        try {

        // グローバル変数はstate.jsで定義済み
        // window.isAuthenticated, window.currentTeamId等を使用
        
        // 確実な初期化システム v2 - キャッシュ問題対応版
        console.log('=== 初期化システム v2 開始 ===');
        console.log('スクリプト実行確認: OK');

        // 外部スクリプト依存チェック
        setTimeout(() => {
            console.log('外部スクリプト状況:');
            console.log('- showMessage:', typeof showMessage);
            console.log('- showError:', typeof showError);
            console.log('- SUPABASE_CONFIG:', typeof window.SUPABASE_CONFIG);

            if (typeof showMessage === 'undefined') {
                console.warn('⚠️ UI関数が読み込まれていません。フォールバック実装します');
                // フォールバック実装
                window.showMessage = function(msg, type) {
                    console.log(`${type}: ${msg}`);
                    const el = document.getElementById(type === 'error' ? 'errorMessage' : 'successMessage');
                    if (el) {
                        el.textContent = msg;
                        el.style.display = 'block';
                        setTimeout(() => el.style.display = 'none', 3000);
                    }
                };
                window.showError = msg => showMessage(msg, 'error');
                window.showSuccess = msg => showMessage(msg, 'success');
            }
        }, 100);

        // 初期化実行関数
        async function executeInitialization(trigger) {
            if (window.isInitialized || window.isInitializing) {
                console.log(`${trigger}: 既に初期化済み/初期化中 - スキップ`);
                return false;
            }

            console.log(`${trigger}: 初期化を実行`);
            try {
                await initializeApp();
                console.log(`${trigger}: 初期化成功`);
                return true;
            } catch (error) {
                console.error(`${trigger}: 初期化エラー:`, error);
                return false;
            }
        }

        // 1. 即座に初期化を試行
        setTimeout(() => executeInitialization('即座初期化'), 50);

        // 2. DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded: DOM準備完了');
            executeInitialization('DOMContentLoaded');
        });

        // 3. ライブラリ読み込み完了を待つ
        window.addEventListener('load', () => {
            console.log('Window load: 全リソース読み込み完了');
            executeInitialization('Window load');
        });

        // 4. フォールバック（5秒後に強制初期化）
        setTimeout(() => {
            console.log('フォールバック初期化チェック');
            executeInitialization('フォールバック');
        }, 5000);

        // 5. ページ表示後の最終チェック（10秒後）
        setTimeout(() => {
            if (!window.isInitialized) {
                console.warn('⚠️ 初期化が完了していません。手動初期化を実行します');
                executeInitialization('最終フォールバック');
            } else {
                console.log('✅ 自動初期化が正常に完了しました');
            }
        }, 10000);
        
        // アプリ初期化
        async function initializeApp() {
            // 重複初期化防止
            if (window.isInitializing || window.isInitialized) {
                console.log('初期化スキップ: 既に初期化済みまたは初期化中');
                return;
            }
            
            window.isInitializing = true;
            updateGlobalState();

            try {
                console.log('アプリ初期化開始');

                // デバッグ: 設定値の確認
                console.log('=== Supabase設定確認 ===');
                console.log('SUPABASE_CONFIG:', window.SUPABASE_CONFIG);
                console.log('URL:', window.SUPABASE_CONFIG?.SUPABASE_URL);
                console.log('KEY length:', window.SUPABASE_CONFIG?.SUPABASE_ANON_KEY?.length);
                console.log('URL contains placeholder:', window.SUPABASE_CONFIG?.SUPABASE_URL?.includes('{{'));
                console.log('KEY contains placeholder:', window.SUPABASE_CONFIG?.SUPABASE_ANON_KEY?.includes('{{'));
                console.log('=========================');

                // Supabaseクライアントが既に存在する場合はスキップ
                if (window.supabaseClient) {
                    console.log('Supabaseクライアント既存のため初期化スキップ');
                    window.isInitialized = true;
                    window.isInitializing = false;
                    updateGlobalState();
                    await tryAutoLogin();
                    return;
                }
                
                // Supabaseライブラリの確認
                if (typeof window.supabase === 'undefined') {
                    throw new Error('Supabase JavaScriptライブラリが読み込まれていません');
                }
                
                console.log('Supabaseライブラリ確認完了');
                
                // Supabaseクライアント作成（機密情報は外部ファイルから）
                const supabaseUrl = window.SUPABASE_CONFIG?.SUPABASE_URL;
                const supabaseKey = window.SUPABASE_CONFIG?.SUPABASE_ANON_KEY;
                
                // プレースホルダーチェック
                if (!supabaseUrl || !supabaseKey ||
                    supabaseUrl.includes('{{') || supabaseKey.includes('{{')) {
                    console.error('Supabase設定エラー:', { supabaseUrl, supabaseKey });
                    throw new Error('Supabase認証情報が正しく設定されていません。GitHub Secretsの設定とデプロイを確認してください。');
                }
                
                window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

                // state.jsの setState を使って同期
                if (window.setState) {
                    window.setState({ supabaseClient: window.supabaseClient });
                }

                if (!window.supabaseClient) {
                    throw new Error('Supabaseクライアントの作成に失敗しました');
                }
                
                console.log('Supabaseクライアント作成完了');
                
                // 接続状態更新
                updateConnectionStatus(true);
                
                // Discord認証コールバック確認
                const discordCallbackHandled = await handleDiscordCallback();
                
                // Discord認証が処理されなかった場合のみ自動ログイン試行
                if (!discordCallbackHandled) {
                    await tryAutoLogin();
                }
                
                console.log('アプリ初期化完了');
                
                // 初期化完了フラグ設定
                window.isInitialized = true;
                window.isInitializing = false;
                updateGlobalState();
                
            } catch (error) {
                console.error('アプリ初期化エラー:', error);

                // Supabase接続エラーなど重大な問題のみユーザーに通知
                if (error.message && !error.message.includes('No rows')) {
                    console.warn('初期化エラー（非致命的）:', error.message);
                    // 重大なエラーのみ表示
                    if (error.message.includes('Supabase') || error.message.includes('認証情報')) {
                        showError('システムの初期化に失敗しました: ' + error.message);
                    }
                }

                updateConnectionStatus(false);

                // 初期化失敗時はフラグをリセット
                window.isInitializing = false;
                updateGlobalState();
            }
        }

        // initializeApp関数をグローバルに登録
        window.initializeApp = initializeApp;

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
                console.log('自動ログイン開始:', savedTeamId);
                window.currentTeamId = savedTeamId;
                
                // チームコンテキスト設定
                try {
                    const { data: contextData, error: contextError } = await window.supabaseClient.rpc('set_team_context', {
                        team_id: savedTeamId
                    });
                    
                    if (contextError) {
                        console.error('コンテキスト設定エラー:', contextError);
                    } else {
                        console.log('チームコンテキスト設定完了');
                    }
                } catch (error) {
                    console.error('自動ログイン中のコンテキスト設定エラー:', error);
                }
                
                await showAuthenticatedState();
                
                // メイン機能の初期化
                await initializeMainFeatures();
                
                console.log('自動ログイン完了');
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
                    console.warn('チームコンテキスト設定をスキップ:', contextErr);
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
                    <h2>🎮 チーム招待</h2>
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
                        <strong>📝 ご注意:</strong><br>
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
                
                console.log('認証試行:', teamId);
                
                // Supabase認証
                const { data, error } = await window.supabaseClient.rpc('authenticate_team', {
                    p_team_id: teamId,
                    p_password: password
                });
                
                console.log('認証結果:', { data, error });
                
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
                console.log('チームコンテキスト設定中...');
                const { data: contextData, error: contextError } = await window.supabaseClient.rpc('set_team_context', {
                    team_id: teamId
                });
                
                if (contextError) {
                    console.error('コンテキスト設定エラー:', contextError);
                } else {
                    console.log('チームコンテキスト設定完了');
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
                
                console.log('チーム作成試行:', teamId);
                
                // Supabaseでセキュリティ質問付きチーム作成
                const { data, error } = await window.supabaseClient.rpc('create_team_with_security', {
                    p_team_id: teamId,
                    p_team_name: teamId, // チーム名はチームIDと同じに設定
                    p_password: password,
                    p_created_by: createdBy,
                    p_security_question: finalSecurityQuestion,
                    p_security_answer: securityAnswer
                });
                
                console.log('チーム作成結果:', { data, error });
                
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

        // 設定メニュー切り替え
        function toggleSettingsMenu() {
            const menu = document.getElementById('settingsMenu');
            if (menu) {
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            }
        }

        // 設定メニュー外クリックで閉じる
        document.addEventListener('click', function(event) {
            const menu = document.getElementById('settingsMenu');
            const settingsBtn = document.querySelector('.settings-btn');

            if (menu && settingsBtn && menu.style.display === 'block') {
                if (!menu.contains(event.target) && !settingsBtn.contains(event.target)) {
                    menu.style.display = 'none';
                }
            }
        });

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
            console.log('Supabase接続状態:', isOnline ? 'オンライン' : 'オフライン');
        }
        
        // メッセージ表示関数はjs/ui.jsに分離
        
        // エラーハンドリング
        window.addEventListener('unhandledrejection', function(event) {
            console.error('未処理のエラー:', event.reason);
            showError('予期しないエラーが発生しました');
        });
        
        // ======================
        // メイン機能の実装
        // ======================

        // state.jsで定義されたグローバル変数を使用
        // app.js内ではwindow.appData, window.currentRaidTier等を直接参照

        // メイン機能初期化
        async function initializeMainFeatures() {
            try {
                console.log('メイン機能初期化開始');

                // チーム情報からレイドティアを自動生成
                await initializeDefaultRaidTier();

                // データ読み込み
                await loadAllData();

                // 直接ティアダッシュボードを表示（メインダッシュボードをスキップ）
                showTierDashboard();

                console.log('メイン機能初期化完了');
            } catch (error) {
                console.error('メイン機能初期化エラー:', error);

                // データ読み込みエラーは通常の状態（初回起動時など）
                // エラーメッセージを表示せず、空のデータでダッシュボードを表示
                console.log('フォールバック: 空のデータでダッシュボード表示（初回起動またはデータなし）');

                try {
                    // フォールバック時もティアダッシュボードを表示
                    await initializeDefaultRaidTier();
                    showTierDashboard();
                } catch (fallbackError) {
                    console.error('フォールバック処理エラー:', fallbackError);
                    showError('ダッシュボードの表示に失敗しました');
                }
            }
        }

        // デフォルトレイドティア自動初期化
        async function initializeDefaultRaidTier() {
            try {
                // チーム情報を取得
                const { data: teamData, error } = await window.supabaseClient
                    .from('teams')
                    .select('*')
                    .eq('team_id', window.currentTeamId)
                    .single();

                if (error) {
                    console.warn('チーム情報取得エラー:', error);
                    // フォールバック: チームIDから基本情報を生成
                    window.currentRaidTier = {
                        id: window.currentTeamId,
                        name: window.currentTeamId,
                        description: '零式レイド',
                        created_at: new Date().toISOString()
                    };
                } else {
                    // チーム情報からレイドティアを生成
                    window.currentRaidTier = {
                        id: window.currentTeamId,
                        name: teamData.team_name || window.currentTeamId,
                        description: '零式レイド',
                        created_at: teamData.created_at || new Date().toISOString()
                    };
                }

                console.log('✅ レイドティア自動初期化完了:', window.currentRaidTier);

                // state.jsと同期
                if (window.setState) {
                    window.setState({ currentRaidTier: window.currentRaidTier });
                }

            } catch (error) {
                console.error('レイドティア初期化エラー:', error);
                // 最小限のフォールバック
                window.currentRaidTier = {
                    id: window.currentTeamId,
                    name: window.currentTeamId,
                    description: '零式レイド',
                    created_at: new Date().toISOString()
                };
            }
        }
        
        // 全データ読み込み
        async function loadAllData() {
            try {
                // Supabaseからデータ読み込み
                const { data: allData, error } = await window.supabaseClient
                    .from('raid_data')
                    .select('*')
                    .eq('team_id', window.currentTeamId);
                
                if (error) {
                    throw new Error(`データ読み込みエラー: ${error.message}`);
                }
                
                console.log('読み込みデータ:', allData);
                
                // データ種別ごとに分類
                if (allData && allData.length > 0) {
                    allData.forEach(item => {
                        const { tier_id, data_type, content } = item;
                        
                        if (data_type === 'settings') {
                            // 設定データの特殊処理
                            if (content.raidTier) {
                                // レイドティアデータ
                                if (!window.appData.raidTiers) window.appData.raidTiers = {};
                                window.appData.raidTiers[tier_id] = content.raidTier;
                            } else {
                                // その他の設定
                                if (!window.appData.settings) window.appData.settings = {};
                                window.appData.settings = { ...window.appData.settings, ...content };
                            }
                        } else {
                            // その他のデータタイプ
                            if (!window.appData[data_type]) {
                                window.appData[data_type] = {};
                            }
                            window.appData[data_type][tier_id] = content;
                        }
                    });
                }
                
                console.log('整理済みデータ:', window.appData);
                
            } catch (error) {
                console.error('データ読み込みエラー:', error);
                // 初期データで継続
                window.appData = {
                    raidTiers: {},
                    players: {},
                    allocations: {},
                    settings: {}
                };
            }
        }
        
        // メインダッシュボード表示
        // ティア固有ダッシュボード
        function showTierDashboard() {
            if (!window.currentRaidTier) return;

            const content = document.getElementById('content');
            const players = window.appData.players[window.currentRaidTier.id] || {};
            const positions = ['MT', 'ST', 'D1', 'D2', 'D3', 'D4', 'H1', 'H2'];

            content.innerHTML = `
                <h1>${window.currentRaidTier.name}</h1>

                <div class="section">
                    <h3>装備分配</h3>
                    <div class="dashboard-layer-grid">
                        <button class="dashboard-layer-button" onclick="showLayerAllocation(1)">1層</button>
                        <button class="dashboard-layer-button" onclick="showLayerAllocation(2)">2層</button>
                        <button class="dashboard-layer-button" onclick="showLayerAllocation(3)">3層</button>
                        <button class="dashboard-layer-button" onclick="showLayerAllocation(4)">4層</button>
                    </div>
                </div>

                <div class="section">
                    <h3>メンバー設定</h3>
                    ${renderIntegratedMemberTable(players, positions)}
                </div>

                <div class="section">
                    <div class="navigation">
                        <button class="nav-button" onclick="showPriorityManagement()">優先順位設定</button>
                        <button class="nav-button" onclick="showStatistics()">統計情報</button>
                        <button class="nav-button" onclick="showAllocationHistory()">配布履歴</button>
                    </div>
                </div>
            `;
        }

        // ポジションからロールクラスを取得
        function getPositionRoleClass(position) {
            if (position === 'MT' || position === 'ST') return 'tank';
            if (position === 'H1' || position === 'H2') return 'healer';
            return 'dps';
        }

        // 一体化メンバーテーブルのレンダリング
        function renderIntegratedMemberTable(players, positions) {
            const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
            const allWeapons = [
                'ナイト', '戦士', '暗黒騎士', 'ガンブレイカー',
                '白魔道士', '占星術士', '学者', '賢者',
                'モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー',
                '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー',
                '吟遊詩人', '機工士', '踊り子'
            ];

            const roleJobs = {
                'MT': ['ナイト', '戦士', '暗黒騎士', 'ガンブレイカー'],
                'ST': ['ナイト', '戦士', '暗黒騎士', 'ガンブレイカー'],
                'H1': ['白魔道士', '占星術士'],
                'H2': ['学者', '賢者'],
                'D1': ['モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー'],
                'D2': ['モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー'],
                'D3': ['吟遊詩人', '機工士', '踊り子'],
                'D4': ['黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー']
            };

            return `
                <div class="integrated-table-container">
                    <table class="integrated-member-table">
                        <thead>
                            <tr>
                                <th style="width: 40px;">ロール</th>
                                <th style="width: 110px;">名前</th>
                                <th style="width: 85px;">ジョブ</th>
                                <th colspan="10" style="text-align: center;">装備方針（零式=〇、トームストーン=空白）</th>
                                <th style="width: 85px;">武器第2希望</th>
                                <th style="width: 85px;">武器第3希望</th>
                            </tr>
                            <tr>
                                <th colspan="3"></th>
                                ${slots.map(slot => `<th style="width: 42px; font-size: 12px;">${slot}</th>`).join('')}
                                <th colspan="2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${positions.map(position => {
                                const player = players[position] || {};
                                const mainWeapon = player.job || '';
                                const weaponWishes = player.weaponWishes || [];

                                return `
                                    <tr data-position="${position}">
                                        <td class="position-cell ${getPositionRoleClass(position)}">${position}</td>
                                        <td>
                                            <input type="text"
                                                   class="table-input"
                                                   id="integrated-${position}-name"
                                                   value="${player.name || ''}"
                                                   placeholder="名前">
                                        </td>
                                        <td>
                                            <select class="table-select" id="integrated-${position}-job">
                                                <option value="">選択</option>
                                                ${roleJobs[position].map(job => `
                                                    <option value="${job}" ${player.job === job ? 'selected' : ''}>${job}</option>
                                                `).join('')}
                                            </select>
                                        </td>
                                        ${slots.map(slot => {
                                            const isRaid = player.equipmentPolicy && player.equipmentPolicy[slot] === '零式';
                                            return `
                                                <td class="policy-cell ${isRaid ? 'policy-raid' : ''}"
                                                    onclick="togglePolicyCell('${position}', '${slot}')"
                                                    data-position="${position}"
                                                    data-slot="${slot}">
                                                    ${isRaid ? '零式' : ''}
                                                </td>
                                            `;
                                        }).join('')}
                                        <td>
                                            <select class="table-select" id="integrated-${position}-weapon2">
                                                <option value="">選択</option>
                                                ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                                    <option value="${job}" ${weaponWishes[1] === job ? 'selected' : ''}>${job}</option>
                                                `).join('')}
                                            </select>
                                        </td>
                                        <td>
                                            <select class="table-select" id="integrated-${position}-weapon3">
                                                <option value="">選択</option>
                                                ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                                    <option value="${job}" ${weaponWishes[2] === job ? 'selected' : ''}>${job}</option>
                                                `).join('')}
                                            </select>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    <div style="text-align: center; margin-top: 15px;">
                        <button class="save-btn" onclick="saveIntegratedMemberData()">一括保存</button>
                    </div>
                </div>
            `;
        }

        // 装備方針セルのクリック切り替え
        function togglePolicyCell(position, slot) {
            const cell = document.querySelector(`.policy-cell[data-position="${position}"][data-slot="${slot}"]`);
            if (!cell) return;

            const isCurrentlyRaid = cell.classList.contains('policy-raid');

            if (isCurrentlyRaid) {
                cell.classList.remove('policy-raid');
                cell.textContent = '';
            } else {
                cell.classList.add('policy-raid');
                cell.textContent = '零式';
            }
        }

        // 一体化テーブルのデータ保存
        async function saveIntegratedMemberData() {
            try {
                const positions = ['MT', 'ST', 'D1', 'D2', 'D3', 'D4', 'H1', 'H2'];
                const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
                const players = {};

                // 各プレイヤーのデータを収集
                for (const position of positions) {
                    const nameInput = document.getElementById(`integrated-${position}-name`);
                    const jobSelect = document.getElementById(`integrated-${position}-job`);
                    const weapon2Select = document.getElementById(`integrated-${position}-weapon2`);
                    const weapon3Select = document.getElementById(`integrated-${position}-weapon3`);

                    const name = nameInput?.value.trim();
                    const job = jobSelect?.value;

                    // 名前とジョブが入力されている場合のみ保存
                    if (name && job) {
                        // 装備方針の収集
                        const equipmentPolicy = {};
                        for (const slot of slots) {
                            const cell = document.querySelector(`.policy-cell[data-position="${position}"][data-slot="${slot}"]`);
                            equipmentPolicy[slot] = cell?.classList.contains('policy-raid') ? '零式' : 'トームストーン';
                        }

                        // 武器希望の収集
                        const weaponWishes = [
                            job, // 第一希望は必ずメインジョブ
                            weapon2Select?.value || '',
                            weapon3Select?.value || '',
                            '' // 第四希望は省略
                        ];

                        players[position] = {
                            name,
                            job,
                            equipmentPolicy,
                            weaponWishes
                        };
                    }
                }

                // データ検証
                if (Object.keys(players).length === 0) {
                    showError('少なくとも1人のメンバー情報を入力してください');
                    return;
                }

                // appDataに保存
                if (!window.appData.players) window.appData.players = {};
                window.appData.players[window.currentRaidTier.id] = players;

                // Supabaseに保存
                await saveDataToSupabase('players', players);

                showSuccess(`${Object.keys(players).length}人のメンバー情報を保存しました`);

            } catch (error) {
                console.error('メンバーデータ保存エラー:', error);
                showError('メンバー情報の保存に失敗しました: ' + error.message);
            }
        }

        // 優先順位管理画面
        function showPriorityManagement() {
            const content = document.getElementById('content');
            const players = window.appData.players[window.currentRaidTier.id] || {};
            
            if (Object.keys(players).length === 0) {
                showError('プレイヤー情報が設定されていません。まずメンバー管理から設定してください。');
                return;
            }
            
            // 現在の優先順位を取得（デフォルト: D1→D2→D3→D4→MT→ST→H1→H2）
            const defaultPriority = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
            const currentPriority = window.appData.settings?.positionPriority || defaultPriority;
            
            content.innerHTML = `
                <div class="navigation-top-left">
                    <button class="nav-button" onclick="showTierDashboard()">レイドダッシュボードに戻る</button>
                </div>
                
                <h1>ポジション間優先順位設定</h1>
                <h2>${window.currentRaidTier.name}</h2>
                
                <div class="section">
                    <h3>ポジション間優先順位設定</h3>
                    <p>装備・素材すべての判定ロジックに作用する優先順位です。ドラッグ&ドロップで順序を変更できます。</p>
                    
                    <div class="priority-container">
                        <div class="priority-list" id="priorityList">
                            ${currentPriority.map((position, index) => {
                                const player = players[position];
                                if (!player) return '';
                                
                                // ロール別クラス判定
                                const roleClass = getPositionRoleClass(position);
                                
                                return `
                                    <div class="priority-item" data-position="${position}" draggable="true">
                                        <div class="priority-rank">${index + 1}</div>
                                        <div class="priority-info">
                                            <span class="position-badge ${roleClass}">${position}</span>
                                            <span class="player-name">${player.name}</span>
                                            <span class="player-job">[${player.job}]</span>
                                        </div>
                                        <div class="drag-handle">⋮⋮</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="priority-actions">
                        <button onclick="savePrioritySettings()" class="primary-btn">
                            優先順位を保存
                        </button>
                        <button onclick="resetPrioritySettings()" class="secondary-btn">
                            デフォルトに戻す
                        </button>
                    </div>
                </div>
                
                <div class="section" style="background-color: #f8f9fa; border-left: 4px solid #17a2b8;">
                    <h4>💡 優先順位の仕組み</h4>
                    <p><strong>装備分配：</strong> 装備方針（零式/トームストーン）とポジション優先順位の組み合わせで取得者を決定</p>
                    <p><strong>素材分配：</strong> ポジション優先順位に基づいて武器石、硬化薬、強化薬、強化繊維の取得者を決定</p>
                    <p><strong>武器分配：</strong> 武器希望順位とポジション優先順位の組み合わせで取得者を決定</p>
                    <p><strong>Note：</strong> 優先順位は装備・素材すべての判定ロジックに作用します。ドラッグ&ドロップで順序を調整できます。</p>
                </div>
            `;
            
            // ドラッグ&ドロップ機能を初期化
            initializeDragAndDrop();
        }
        
        // ドラッグ&ドロップ機能初期化
        function initializeDragAndDrop() {
            const priorityList = document.getElementById('priorityList');
            if (!priorityList) return;
            
            let draggedElement = null;
            
            priorityList.addEventListener('dragstart', function(e) {
                if (e.target.classList.contains('priority-item')) {
                    draggedElement = e.target;
                    e.target.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                }
            });
            
            priorityList.addEventListener('dragend', function(e) {
                if (e.target.classList.contains('priority-item')) {
                    e.target.classList.remove('dragging');
                    draggedElement = null;
                    // 全ての drag-over クラスを削除
                    document.querySelectorAll('.priority-item').forEach(item => {
                        item.classList.remove('drag-over');
                    });
                }
            });
            
            priorityList.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                // ドラッグされている要素以外にホバー効果を適用
                const closestItem = e.target.closest('.priority-item');
                if (closestItem && closestItem !== draggedElement) {
                    // 全ての drag-over クラスを削除
                    document.querySelectorAll('.priority-item').forEach(item => {
                        item.classList.remove('drag-over');
                    });
                    // 現在の要素に drag-over クラスを追加
                    closestItem.classList.add('drag-over');
                }
            });
            
            priorityList.addEventListener('dragleave', function(e) {
                const closestItem = e.target.closest('.priority-item');
                if (closestItem && !priorityList.contains(e.relatedTarget)) {
                    closestItem.classList.remove('drag-over');
                }
            });
            
            priorityList.addEventListener('drop', function(e) {
                e.preventDefault();
                
                const closestItem = e.target.closest('.priority-item');
                if (draggedElement && closestItem && draggedElement !== closestItem) {
                    // ドロップ位置を計算
                    const rect = closestItem.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    
                    if (e.clientY < midpoint) {
                        // 上半分にドロップ - 前に挿入
                        priorityList.insertBefore(draggedElement, closestItem);
                    } else {
                        // 下半分にドロップ - 後に挿入
                        priorityList.insertBefore(draggedElement, closestItem.nextSibling);
                    }
                    
                    updatePriorityNumbers();
                }
                
                // 全ての drag-over クラスを削除
                document.querySelectorAll('.priority-item').forEach(item => {
                    item.classList.remove('drag-over');
                });
            });
        }
        
        // 優先順位番号更新
        function updatePriorityNumbers() {
            const items = document.querySelectorAll('.priority-item');
            items.forEach((item, index) => {
                const rankElement = item.querySelector('.priority-rank');
                if (rankElement) {
                    rankElement.textContent = index + 1;
                }
            });
        }
        
        // 優先順位設定保存
        async function savePrioritySettings() {
            try {
                const items = document.querySelectorAll('.priority-item');
                const newPriority = Array.from(items).map(item => item.dataset.position);
                
                // 設定を保存
                if (!window.appData.settings) window.appData.settings = {};
                window.appData.settings.positionPriority = newPriority;
                
                // Supabaseに保存
                const { error } = await window.supabaseClient
                    .from('raid_data')
                    .upsert({
                        team_id: window.currentTeamId,
                        tier_id: window.currentRaidTier.id,
                        data_type: 'settings',
                        content: { positionPriority: newPriority }
                    });
                
                if (error) {
                    throw new Error(`保存エラー: ${error.message}`);
                }
                
                showSuccess('優先順位設定を保存しました');
                
            } catch (error) {
                console.error('優先順位保存エラー:', error);
                showError('優先順位設定の保存に失敗しました: ' + error.message);
            }
        }
        
        // 優先順位設定リセット
        async function resetPrioritySettings() {
            if (confirm('優先順位をデフォルト（D1→D2→D3→D4→MT→ST→H1→H2）に戻しますか？')) {
                const defaultPriority = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
                
                // 設定をリセット
                if (!window.appData.settings) {
                    window.appData.settings = {};
                }
                window.appData.settings.positionPriority = defaultPriority;
                
                // Supabaseに保存
                try {
                    await saveDataToSupabase('settings', { positionPriority: defaultPriority });
                    showSuccess('優先順位をデフォルトに戻しました');
                } catch (error) {
                    console.error('設定保存エラー:', error);
                    showError('設定の保存に失敗しました');
                }
                
                // 画面を再読み込み
                showPriorityManagement();
            }
        }
        
        // プレイヤー管理機能
        function showPlayerManagement() {
            showPlayerSetup();
        }
        
        // プレイヤー設定画面（タブ形式）
        function showPlayerSetup() {
            showTabbedSetup('players');
        }
        
        // タブ形式のセットアップ画面
        function showTabbedSetup(activeTab = 'players') {
            const content = document.getElementById('content');
            
            content.innerHTML = `
                <h1>メンバー・装備設定</h1>
                <h2>${window.currentRaidTier.name}</h2>
                
                <div class="section">
                    <div class="navigation">
                        <button class="nav-button" onclick="showTierDashboard()">レイドダッシュボードに戻る</button>
                    </div>
                </div>
                
                <div class="tab-container">
                    <div class="tab-nav">
                        <button class="tab-button ${activeTab === 'players' ? 'active' : ''}" onclick="showTabbedSetup('players')">
                            メンバー情報
                        </button>
                        <button class="tab-button ${activeTab === 'policy' ? 'active' : ''}" onclick="showTabbedSetup('policy')">
                            装備方針
                        </button>
                        <button class="tab-button ${activeTab === 'weapons' ? 'active' : ''}" onclick="showTabbedSetup('weapons')">
                            武器希望
                        </button>
                    </div>
                    
                    <div class="tab-content">
                        ${getTabContent(activeTab)}
                    </div>
                    
                    <div class="navigation" style="display: flex; gap: 10px; justify-content: center; align-items: center;">
                        <button class="save-btn" onclick="saveCurrentTab('${activeTab}')">
                            ${activeTab === 'players' ? 'メンバー情報を保存' : activeTab === 'policy' ? '装備方針を保存' : '武器希望を保存'}
                        </button>
                        <button class="nav-button" onclick="saveCurrentTabAndContinue('${activeTab}')">
                            設定完了
                        </button>
                    </div>
                </div>
            `;
        }
        
        // タブコンテンツ生成
        function getTabContent(tabName) {
            const players = window.appData.players[window.currentRaidTier.id] || {};
            const positions = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
            
            if (tabName === 'players') {
                return `
                    <h3>8人のメンバー情報を入力してください</h3>
                    <div class="player-grid">
                        ${positions.map(position => {
                            const player = players[position] || {};
                            const roleJobs = {
                                'MT': ['ナイト', '戦士', '暗黒騎士', 'ガンブレイカー'],
                                'ST': ['ナイト', '戦士', '暗黒騎士', 'ガンブレイカー'],
                                'H1': ['白魔道士', '占星術士'],
                                'H2': ['学者', '賢者'],
                                'D1': ['モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー'],
                                'D2': ['モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー'],
                                'D3': ['吟遊詩人', '機工士', '踊り子'],
                                'D4': ['黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー']
                            };
                            
                            return `
                                <div class="player-card">
                                    <div class="player-header">
                                        <span class="position-badge ${getPositionRoleClass(position)}">${position}</span>
                                    </div>
                                    
                                    <div style="margin: 10px 0;">
                                        <label>プレイヤー名（必須）:</label>
                                        <input type="text" id="${position}-name" value="${player.name || ''}" 
                                               placeholder="プレイヤー名を入力" class="job-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem;">
                                    </div>
                                    
                                    
                                    <div style="margin: 10px 0;">
                                        <label>ジョブ（必須）:</label>
                                        <select id="${position}-job" class="job-select">
                                            <option value="">ジョブを選択</option>
                                            ${roleJobs[position].map(job => `
                                                <option value="${job}" ${player.job === job ? 'selected' : ''}>${job}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            } else if (tabName === 'policy') {
                if (Object.keys(players).length === 0) {
                    return `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <p>まずメンバー情報タブでプレイヤー情報を設定してください。</p>
                        </div>
                    `;
                }
                
                const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
                
                return `
                    <h3>各プレイヤーの装備方針を設定</h3>
                    <p>零式：零式装備を優先取得、トームストーン：トームストーン装備で十分</p>
                    <div class="player-grid">
                        ${positions.map(position => {
                            const player = players[position];
                            if (!player) return '';
                            
                            return `
                                <div class="player-card">
                                    <div class="player-header">
                                        <span class="player-name">${player.name}</span>
                                        <span class="position-badge ${getPositionRoleClass(position)}">${position} - ${player.job}</span>
                                    </div>
                                    <div class="equipment-policy">
                                        <div class="policy-grid">
                                            ${slots.map(slot => `
                                                <div class="policy-item">
                                                    <label>${slot}</label>
                                                    <select id="${position}-${slot}-policy">
                                                        <option value="零式" ${(player.equipmentPolicy && player.equipmentPolicy[slot] === '零式') ? 'selected' : ''}>零式</option>
                                                        <option value="トームストーン" ${(player.equipmentPolicy && player.equipmentPolicy[slot] === 'トームストーン') ? 'selected' : ''}>トームストーン</option>
                                                    </select>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            } else if (tabName === 'weapons') {
                if (Object.keys(players).length === 0) {
                    return `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <p>まずメンバー情報タブでプレイヤー情報を設定してください。</p>
                        </div>
                    `;
                }
                
                const allWeapons = [
                    'ナイト', '戦士', '暗黒騎士', 'ガンブレイカー',
                    '白魔道士', '占星術士', '学者', '賢者',
                    'モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー',
                    '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー',
                    '吟遊詩人', '機工士', '踊り子'
                ];
                
                return `
                    <h3>4層直ドロップ武器の希望順位を設定</h3>
                    <p>第一希望は自動的にメインジョブになります。第二〜第四希望を選択してください。</p>
                    <div class="player-grid">
                        ${positions.map(position => {
                            const player = players[position];
                            if (!player) return '';
                            
                            const weaponWishes = player.weaponWishes || [];
                            const mainWeapon = player.job;
                            
                            return `
                                <div class="player-card">
                                    <div class="player-header">
                                        <span class="player-name">${player.name}</span>
                                        <span class="position-badge ${getPositionRoleClass(position)}">${position} - ${player.job}</span>
                                    </div>
                                    <div class="weapon-wishes">
                                        <div class="wish-priority">
                                            <label>第一希望 (メインジョブ):</label>
                                            <input type="text" value="${mainWeapon}" readonly style="background-color: #e9ecef; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; min-width: 120px;">
                                        </div>
                                        <div class="wish-priority">
                                            <label>第二希望:</label>
                                            <select id="${position}-weapon-wish-2">
                                                <option value="">選択</option>
                                                ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                                    <option value="${job}" ${weaponWishes[1] === job ? 'selected' : ''}>${job}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                        <div class="wish-priority">
                                            <label>第三希望:</label>
                                            <select id="${position}-weapon-wish-3">
                                                <option value="">選択</option>
                                                ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                                    <option value="${job}" ${weaponWishes[2] === job ? 'selected' : ''}>${job}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                        <div class="wish-priority">
                                            <label>第四希望:</label>
                                            <select id="${position}-weapon-wish-4">
                                                <option value="">選択</option>
                                                ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                                    <option value="${job}" ${weaponWishes[3] === job ? 'selected' : ''}>${job}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
            
            return '';
        }
        
        // 現在のタブのみ保存
        async function saveCurrentTab(currentTab) {
            try {
                if (currentTab === 'players') {
                    await savePlayersData();
                    showSuccess('メンバー情報を保存しました');
                } else if (currentTab === 'policy') {
                    await saveEquipmentPolicyData();
                    showSuccess('装備方針を保存しました');
                } else if (currentTab === 'weapons') {
                    await saveWeaponWishesData();
                    showSuccess('武器希望を保存しました');
                }
            } catch (error) {
                console.error('保存エラー:', error);
                showError('保存に失敗しました: ' + error.message);
            }
        }

        // 現在のタブを保存して次へ進む
        async function saveCurrentTabAndContinue(currentTab) {
            try {
                if (currentTab === 'players') {
                    await savePlayersData();
                } else if (currentTab === 'policy') {
                    await saveEquipmentPolicyData();
                } else if (currentTab === 'weapons') {
                    await saveWeaponWishesData();
                }
                
                showSuccess('設定を保存しました');
                
                // 全て設定済みかチェックしてダッシュボードへ
                if (Object.keys(window.appData.players[window.currentRaidTier.id] || {}).length > 0) {
                    showTierDashboard();
                } else {
                    showError('メンバー情報が設定されていません。');
                }
            } catch (error) {
                console.error('設定保存エラー:', error);
                showError('設定の保存に失敗しました: ' + error.message);
            }
        }
        
        // プレイヤー情報保存
        async function savePlayersData() {
            const positions = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
            
            if (!window.appData.players[window.currentRaidTier.id]) {
                window.appData.players[window.currentRaidTier.id] = {};
            }
            
            for (const position of positions) {
                const nameInput = document.getElementById(`${position}-name`);
                const jobSelect = document.getElementById(`${position}-job`);
                
                if (!nameInput || !jobSelect) continue;
                
                const name = nameInput.value.trim();
                const job = jobSelect.value;
                
                if (!name || !job) {
                    throw new Error(`${position}のプレイヤー名とジョブを入力してください。`);
                }
                
                // 既存データがある場合は保持
                const existingPlayer = window.appData.players[window.currentRaidTier.id][position] || {};
                
                window.appData.players[window.currentRaidTier.id][position] = {
                    name: name,
                    job: job,
                    position: position,
                    equipmentPolicy: existingPlayer.equipmentPolicy || {},
                    weaponWishes: existingPlayer.weaponWishes || [],
                    currentEquipment: existingPlayer.currentEquipment || {},
                    dynamicPriority: existingPlayer.dynamicPriority || 0,
                    allocationHistory: existingPlayer.allocationHistory || []
                };
            }
            
            // Supabaseに保存
            await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);
        }
        
        // 装備方針保存
        async function saveEquipmentPolicyData() {
            const players = window.appData.players[window.currentRaidTier.id];
            const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
            
            for (const [position, player] of Object.entries(players)) {
                for (const slot of slots) {
                    const policyElement = document.getElementById(`${position}-${slot}-policy`);
                    if (policyElement) {
                        const policy = policyElement.value;
                        player.equipmentPolicy[slot] = policy;
                    }
                }
            }
            
            // Supabaseに保存
            await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);
        }
        
        // タブ専用保存関数
        async function savePlayersDataTab() {
            try {
                await savePlayersData();
                showSuccess('メンバー情報を保存しました');
            } catch (error) {
                console.error('メンバー情報保存エラー:', error);
                showError('メンバー情報の保存に失敗しました: ' + error.message);
            }
        }
        
        async function saveEquipmentPolicyDataTab() {
            try {
                await saveEquipmentPolicyData();
                showSuccess('装備方針を保存しました');
            } catch (error) {
                console.error('装備方針保存エラー:', error);
                showError('装備方針の保存に失敗しました: ' + error.message);
            }
        }
        
        async function saveWeaponWishesDataTab() {
            try {
                await saveWeaponWishesData();
                showSuccess('武器希望を保存しました');
            } catch (error) {
                console.error('武器希望保存エラー:', error);
                showError('武器希望の保存に失敗しました: ' + error.message);
            }
        }
        
        // 武器希望保存
        async function saveWeaponWishesData() {
            const players = window.appData.players[window.currentRaidTier.id];
            
            for (const [position, player] of Object.entries(players)) {
                const mainJob = player.job;
                const wish2Element = document.getElementById(`${position}-weapon-wish-2`);
                const wish3Element = document.getElementById(`${position}-weapon-wish-3`);
                const wish4Element = document.getElementById(`${position}-weapon-wish-4`);
                
                // 第一希望はメインジョブ、第二〜第四希望は選択された値
                player.weaponWishes = [
                    mainJob,
                    wish2Element ? wish2Element.value : '',
                    wish3Element ? wish3Element.value : '',
                    wish4Element ? wish4Element.value : ''
                ].filter(wish => wish !== ''); // 空の値を除外
            }
            
            // Supabaseに保存
            await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);
        }
        
        // データ移行機能
        
        // JSONファイルからのインポート
        async function importFromJSON() {
            const fileInput = document.getElementById('jsonFileInput');
            const file = fileInput.files[0];
            
            if (!file) {
                showError('JSONファイルを選択してください。');
                return;
            }
            
            try {
                showMessage('ファイルを読み込み中...', 'info');
                
                const text = await file.text();
                const importData = JSON.parse(text);
                
                // データ形式の検証と変換
                const convertedData = await convertImportData(importData);
                
                if (!convertedData) {
                    showError('対応していないデータ形式です。');
                    return;
                }
                
                // 詳細情報の表示
                let playerCount = 0;
                let tierCount = 0;
                
                if (convertedData.type === 'collaborative') {
                    tierCount = Object.keys(convertedData.players || {}).length;
                    playerCount = Object.values(convertedData.players || {}).reduce((total, tierPlayers) => {
                        return total + Object.keys(tierPlayers || {}).length;
                    }, 0);
                } else if (convertedData.type === 'simple') {
                    playerCount = Object.keys(convertedData.players || {}).length;
                    tierCount = 1;
                }
                
                // 確認ダイアログ
                const confirmMessage = `以下のデータをインポートします：
                
プレイヤー数: ${playerCount}人
レイドティア数: ${tierCount}個
データ形式: ${convertedData.type === 'collaborative' ? '共同利用版' : '簡易版'}

現在のデータを上書きします。よろしいですか？`;
                
                if (!confirm(confirmMessage)) {
                    return;
                }
                
                // データをインポート
                await importConvertedData(convertedData);
                
                showSuccess(`データのインポートが完了しました。（${playerCount}人のプレイヤーを登録）`);
                showTabbedSetup('players'); // メンバー情報タブに移動
                
            } catch (error) {
                console.error('インポートエラー:', error);
                if (error.name === 'SyntaxError') {
                    showError('JSONファイルの形式が正しくありません。ファイルを確認してください。');
                } else {
                    showError('インポートに失敗しました: ' + error.message);
                }
            }
        }
        
        // JSONファイル選択時の処理
        document.addEventListener('DOMContentLoaded', function() {
            // ファイル選択時の情報表示を設定
            document.addEventListener('change', function(event) {
                if (event.target.id === 'jsonFileInput') {
                    const file = event.target.files[0];
                    const fileInfo = document.getElementById('jsonFileInfo');
                    const fileName = document.getElementById('selectedFileName');
                    const fileDetails = document.getElementById('fileDetails');
                    
                    if (file && fileInfo && fileName && fileDetails) {
                        fileName.textContent = file.name;
                        fileDetails.textContent = `サイズ: ${(file.size / 1024).toFixed(2)} KB, 最終更新: ${new Date(file.lastModified).toLocaleString()}`;
                        fileInfo.style.display = 'block';
                    } else if (fileInfo) {
                        fileInfo.style.display = 'none';
                    }
                }
            });
        });
        
        // CSVからのインポート
        async function importFromCSV() {
            const csvText = document.getElementById('csvTextArea').value.trim();
            
            if (!csvText) {
                showError('CSVデータを入力してください。');
                return;
            }
            
            try {
                const lines = csvText.split('\n').filter(line => line.trim());
                const players = {};
                
                for (let i = 1; i < lines.length; i++) { // ヘッダー行をスキップ
                    const columns = lines[i].split(',').map(col => col.trim());
                    
                    if (columns.length < 4) continue;
                    
                    const [position, name, job] = columns;
                    
                    players[position] = {
                        name: name,
                        job: job,
                        position: position,
                        equipmentPolicy: {},
                        weaponWishes: [job],
                        currentEquipment: {},
                        dynamicPriority: 0,
                        allocationHistory: []
                    };
                }
                
                if (Object.keys(players).length === 0) {
                    showError('有効なプレイヤーデータが見つかりません。');
                    return;
                }
                
                // 確認ダイアログ
                if (!confirm(`${Object.keys(players).length}人のプレイヤーデータをインポートします。よろしいですか？`)) {
                    return;
                }
                
                // データを保存
                window.appData.players[window.currentRaidTier.id] = players;
                await saveDataToSupabase('players', players);
                
                showSuccess('CSVデータのインポートが完了しました。');
                showTabbedSetup('players'); // メンバー情報タブに移動
                
            } catch (error) {
                console.error('CSVインポートエラー:', error);
                showError('CSVインポートに失敗しました: ' + error.message);
            }
        }
        
        // CSVデータクリア
        function clearCSVData() {
            const csvTextArea = document.getElementById('csvTextArea');
            if (csvTextArea) {
                csvTextArea.value = '';
                showSuccess('CSVデータをクリアしました。');
            }
        }
        
        // プレイヤーデータのみリセット
        async function resetAllPlayersData() {
            if (!confirm('現在のレイドティアのプレイヤー情報をすべて削除します。よろしいですか？')) {
                return;
            }
            
            if (!confirm('本当によろしいですか？プレイヤー情報、装備方針、武器希望がすべて削除されます。')) {
                return;
            }
            
            try {
                // プレイヤーデータのみ削除
                if (window.appData.players[window.currentRaidTier.id]) {
                    delete window.appData.players[window.currentRaidTier.id];
                }
                
                // Supabaseからプレイヤーデータのみ削除
                await window.supabaseClient
                    .from('raid_data')
                    .delete()
                    .eq('team_id', window.currentTeamId)
                    .eq('tier_id', window.currentRaidTier.id)
                    .eq('data_type', 'players');
                
                showSuccess('プレイヤーデータをリセットしました。');
                showTabbedSetup('players'); // メンバー情報タブに移動
                
            } catch (error) {
                console.error('プレイヤーデータリセットエラー:', error);
                showError('プレイヤーデータのリセットに失敗しました: ' + error.message);
            }
        }
        
        // 現在のティアデータをリセット
        async function resetCurrentTierData() {
            if (!confirm('現在のレイドティアのすべてのデータを削除します。この操作は取り消せません。よろしいですか？')) {
                return;
            }
            
            if (!confirm('本当によろしいですか？すべてのプレイヤー情報、装備方針、分配履歴が削除されます。')) {
                return;
            }
            
            try {
                // ローカルデータを削除
                if (window.appData.players[window.currentRaidTier.id]) {
                    delete window.appData.players[window.currentRaidTier.id];
                }
                if (window.appData.allocations[window.currentRaidTier.id]) {
                    delete window.appData.allocations[window.currentRaidTier.id];
                }
                
                // Supabaseからも削除
                await window.supabaseClient
                    .from('raid_data')
                    .delete()
                    .eq('team_id', window.currentTeamId)
                    .eq('tier_id', window.currentRaidTier.id);
                
                showSuccess('レイドティアデータをリセットしました。');
                showTabbedSetup('players'); // メンバー情報タブに移動
                
            } catch (error) {
                console.error('リセットエラー:', error);
                showError('データのリセットに失敗しました: ' + error.message);
            }
        }
        
        // インポートデータの変換
        async function convertImportData(importData) {
            // collaborative_index.html形式の場合
            if (importData.raidTiers && importData.players && importData.allocations) {
                return {
                    type: 'collaborative',
                    players: importData.players,
                    allocations: importData.allocations
                };
            }
            
            // 単純なプレイヤーリスト形式の場合
            if (Array.isArray(importData) && importData.length > 0 && importData[0].name) {
                const players = {};
                importData.forEach((player, index) => {
                    const positions = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
                    const position = positions[index] || `D${index - 3}`;
                    
                    players[position] = {
                        name: player.name,
                        characterName: player.characterName || '',
                        job: player.job,
                        position: position,
                        equipmentPolicy: player.equipmentPolicy || {},
                        weaponWishes: player.weaponWishes || [player.job],
                        currentEquipment: player.currentEquipment || {},
                        dynamicPriority: player.dynamicPriority || 0,
                        allocationHistory: player.allocationHistory || []
                    };
                });
                
                return {
                    type: 'simple',
                    players: players
                };
            }
            
            return null;
        }
        
        // 変換済みデータのインポート
        async function importConvertedData(convertedData) {
            if (convertedData.type === 'collaborative') {
                // 現在のティアに対応するデータがある場合はそれを使用
                const tierData = Object.values(convertedData.players)[0] || {};
                window.appData.players[window.currentRaidTier.id] = tierData;
                
                // 分配履歴も移行
                if (convertedData.allocations) {
                    const allocationData = Object.values(convertedData.allocations)[0] || {};
                    window.appData.allocations[window.currentRaidTier.id] = allocationData;
                    await saveDataToSupabase('allocations', allocationData);
                }
            } else if (convertedData.type === 'simple') {
                window.appData.players[window.currentRaidTier.id] = convertedData.players;
            }
            
            // Supabaseに保存
            await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);
        }
        
        // Supabaseデータ保存ヘルパー
        async function saveDataToSupabase(dataType, content) {
            const { error } = await window.supabaseClient
                .from('raid_data')
                .upsert({
                    team_id: window.currentTeamId,
                    tier_id: window.currentRaidTier.id,
                    data_type: dataType,
                    content: content
                });
                
            if (error) {
                throw new Error(`保存エラー: ${error.message}`);
            }
        }
        
        // 装備分配システム
        function showEquipmentAllocation() {
            const content = document.getElementById('content');
            
            // プレイヤーデータの確認
            const players = window.appData.players[window.currentRaidTier.id] || {};
            const playerCount = Object.keys(players).length;
            
            if (playerCount === 0) {
                showError('プレイヤー情報が設定されていません。メンバー設定を完了してください。');
                return;
            }
            
            content.innerHTML = `
                <div class="navigation-top-left">
                    <button class="nav-button" onclick="showTierDashboard()">レイドダッシュボードに戻る</button>
                </div>
                
                <h1>装備分配システム</h1>
                <h2>${window.currentRaidTier.name}</h2>
                
                <div class="section" id="allocationResults" style="display: none;">
                    <h3>分配結果</h3>
                    <div id="allocationContent"></div>
                </div>
            `;
        }
        
        // 直接層別分配を実行（ダッシュボードから呼び出し）
        async function showLayerAllocation(layer) {
            // プレイヤーデータの確認
            const players = window.appData.players[window.currentRaidTier.id] || {};
            const playerCount = Object.keys(players).length;
            
            if (playerCount === 0) {
                showError('メンバー情報が登録されていません。まずメンバー管理から設定してください。');
                return;
            }
            
            if (playerCount < 8) {
                if (!confirm(`メンバーが${playerCount}人しか登録されていません。分配を続行しますか？`)) {
                    return;
                }
            }
            
            // 装備分配画面を表示してから該当層の処理を実行
            showEquipmentAllocation();
            
            // 少し待ってから分配処理を実行（DOM更新のため）
            setTimeout(() => {
                processLayerAllocation(layer);
            }, 100);
        }
        
        // 層別装備分配処理
        async function processLayerAllocation(layer) {
            try {
                showMessage('分配処理中...', 'info');
                
                // 層別ドロップアイテムを取得
                const drops = getLayerDrops(layer);
                
                // 分配優先度を計算
                const allocationResults = calculateAllocation(layer, drops);
                
                // 結果を表示
                displayAllocationResults(layer, allocationResults);
                
            } catch (error) {
                console.error('分配処理エラー:', error);
                showError('分配処理に失敗しました: ' + error.message);
            }
        }
        
        // 層別ドロップアイテム定義
        function getLayerDrops(layer) {
            const drops = {
                1: [
                    { name: '耳装備', slot: '耳', type: 'equipment', itemLevel: '' },
                    { name: '首装備', slot: '首', type: 'equipment', itemLevel: '' },
                    { name: '腕装備', slot: '腕', type: 'equipment', itemLevel: '' },
                    { name: '指装備', slot: '指', type: 'equipment', itemLevel: '' }
                ],
                2: [
                    { name: '頭装備', slot: '頭', type: 'equipment', itemLevel: '' },
                    { name: '手装備', slot: '手', type: 'equipment', itemLevel: '' },
                    { name: '足装備', slot: '足', type: 'equipment', itemLevel: '' },
                    { name: '武器石', slot: '武器石', type: 'material', itemLevel: '' },
                    { name: '硬化薬', slot: '硬化薬', type: 'material', itemLevel: '' }
                ],
                3: [
                    { name: '胴装備', slot: '胴', type: 'equipment', itemLevel: '' },
                    { name: '脚装備', slot: '脚', type: 'equipment', itemLevel: '' },
                    { name: '強化薬', slot: '強化薬', type: 'material', itemLevel: '' },
                    { name: '強化繊維', slot: '強化繊維', type: 'material', itemLevel: '' }
                ],
                4: [
                    { name: '胴装備', slot: '胴', type: 'equipment', itemLevel: '' },
                    { name: '武器箱', slot: '武器箱', type: 'weapon_box', itemLevel: '' },
                    { name: '直ドロップ武器', slot: '直ドロップ武器', type: 'direct_weapon', itemLevel: '', weapon: window.selectedDirectWeapon || null }
                ]
            };
            
            return drops[layer] || [];
        }
        
        // 分配優先度計算
        function calculateAllocation(layer, drops) {
            const players = window.appData.players[window.currentRaidTier.id] || {};
            const results = {};
            
            drops.forEach(drop => {
                const allCandidates = [];
                
                Object.entries(players).forEach(([position, player]) => {
                    const priority = calculatePlayerPriority(player, drop);
                    allCandidates.push({
                        position,
                        player,
                        priority: priority.score,
                        reason: priority.reason,
                        type: priority.type,
                        canReceive: priority.canReceive
                    });
                });
                
                // 優先度順でソート（全プレイヤー）
                allCandidates.sort((a, b) => b.priority - a.priority);
                
                // 取得可能な候補者のみ抽出
                const candidates = allCandidates.filter(c => c.canReceive);
                
                // 直ドロ武器の特別処理
                if (drop.type === 'direct_weapon' && drop.weapon) {
                    // 第一希望者を探す
                    const firstChoiceCandidates = candidates.filter(c => {
                        const weaponWishes = c.player.weaponWishes || [];
                        return weaponWishes[0] === drop.weapon;
                    });
                    
                    if (firstChoiceCandidates.length > 0) {
                        // 第一希望者がいる場合は最優先者のみ
                        results[drop.slot] = {
                            drop,
                            candidates: allCandidates,
                            recommended: firstChoiceCandidates[0],
                            isMultipleRecommended: false
                        };
                    } else {
                        // 第一希望者がいない場合、第二希望以降をチェック
                        const otherChoiceCandidates = candidates.filter(c => {
                            const weaponWishes = c.player.weaponWishes || [];
                            return weaponWishes.includes(drop.weapon) && weaponWishes[0] !== drop.weapon;
                        });
                        
                        if (otherChoiceCandidates.length > 1) {
                            // 複数の第二希望以降がある場合
                            results[drop.slot] = {
                                drop,
                                candidates: allCandidates,
                                recommended: null,
                                multipleRecommended: otherChoiceCandidates,
                                isMultipleRecommended: true
                            };
                        } else {
                            // 単一の第二希望以降
                            results[drop.slot] = {
                                drop,
                                candidates: allCandidates,
                                recommended: otherChoiceCandidates[0] || null,
                                isMultipleRecommended: false
                            };
                        }
                    }
                } else {
                    // 通常の装備・素材処理
                    results[drop.slot] = {
                        drop,
                        candidates: allCandidates, // 全プレイヤーの判定結果
                        recommended: candidates[0] || null, // 最優先の取得可能者
                        isMultipleRecommended: false
                    };
                }
            });
            
            return results;
        }
        
        // プレイヤー優先度計算
        function calculatePlayerPriority(player, drop) {
            let score = 0;
            let canReceive = false;
            let reason = 'Pass';
            let type = 'pass';
            
            if (drop.type === 'equipment') {
                // 装備の場合
                const policy = player.equipmentPolicy?.[drop.slot] || 'トームストーン';
                
                // 現在の装備状況を取得（分配履歴から）
                const equipmentStatus = getPlayerEquipmentStatus(player.position, drop.slot);
                
                // 断章交換者の特別処理
                if (equipmentStatus === '断章交換') {
                    // 未取得者がいるかチェック
                    const hasUnacquiredRaidPlayer = hasUnacquiredRaidPlayers(drop.slot, player.position);
                    
                    if (hasUnacquiredRaidPlayer) {
                        // 未取得者がいる場合は分配対象外
                        type = 'pass';
                        reason = 'Pass (断章交換 - 他に未取得者あり)';
                    } else {
                        // 未取得者がいない場合は復活
                        canReceive = true;
                        type = 'need';
                        score = 1000 + getPositionPriority(player.position) - (player.dynamicPriority || 0);
                        reason = 'Need (断章交換 - 復活)';
                    }
                } else if (equipmentStatus === '断章交換・箱取得済') {
                    // 断章交換・箱取得済は完全に分配対象外
                    type = 'pass';
                    reason = 'Pass (断章交換・箱取得済)';
                } else if (policy === '零式' && equipmentStatus === '未取得') {
                    canReceive = true;
                    type = 'need';
                    score = 1000 + getPositionPriority(player.position) - (player.dynamicPriority || 0);
                    reason = 'Need (零式)';
                } else if (equipmentStatus === '未取得') {
                    canReceive = true;
                    type = 'greed';
                    score = 500 + getPositionPriority(player.position) - (player.dynamicPriority || 0);
                    reason = 'Greed (トーム可)';
                } else {
                    type = 'pass';
                    reason = 'Pass (所持済み)';
                }
            } else if (drop.type === 'material') {
                // 強化素材の場合（分配優先度設定に基づく）
                const materialStatus = getPlayerEquipmentStatus(player.position, drop.slot);
                
                // 断章交換素材の特別処理
                if (materialStatus === '断章交換') {
                    type = 'pass';
                    reason = 'Pass (断章交換)';
                } else if (materialStatus === '断章交換・箱取得済') {
                    type = 'pass';
                    reason = 'Pass (断章交換・箱取得済)';
                } else if (materialStatus === '未取得') {
                    canReceive = true;
                    type = 'need';
                    score = getPositionPriority(player.position) - (player.dynamicPriority || 0);
                    reason = 'Need (素材)';
                } else {
                    type = 'pass';
                    reason = 'Pass (取得済み)';
                }
            } else if (drop.type === 'weapon_box') {
                // 武器箱の場合（装備方針は「武器」スロットを参照）
                const weaponBoxStatus = getPlayerEquipmentStatus(player.position, '武器箱');
                const weaponPolicy = player.equipmentPolicy?.['武器'] || 'トームストーン';
                
                if (weaponBoxStatus === '断章交換') {
                    // 未取得者がいるかチェック（武器方針で判定）
                    const hasUnacquiredRaidPlayer = hasUnacquiredWeaponBoxPlayers(player.position);
                    
                    if (hasUnacquiredRaidPlayer) {
                        type = 'pass';
                        reason = 'Pass (断章交換 - 他に未取得者あり)';
                    } else {
                        canReceive = true;
                        type = 'need';
                        score = 2000 + getPositionPriority(player.position) - (player.dynamicPriority || 0);
                        reason = 'Need (断章交換 - 復活)';
                    }
                } else if (weaponBoxStatus === '断章交換・箱取得済') {
                    type = 'pass';
                    reason = 'Pass (断章交換・箱取得済)';
                } else if (weaponPolicy === '零式' && weaponBoxStatus === '未取得') {
                    canReceive = true;
                    type = 'need';
                    score = 2000 + getPositionPriority(player.position) - (player.dynamicPriority || 0);
                    reason = 'Need (武器箱)';
                } else if (weaponBoxStatus === '未取得') {
                    canReceive = true;
                    type = 'greed';
                    score = 500 + getPositionPriority(player.position) - (player.dynamicPriority || 0);
                    reason = 'Greed (武器箱 - トーム可)';
                } else {
                    type = 'pass';
                    reason = 'Pass (武器箱取得済み)';
                }
            } else if (drop.type === 'direct_weapon') {
                // 直ドロップ武器の場合（武器希望に基づく）
                const weaponWishes = player.weaponWishes || [];
                const firstChoiceWeaponStatus = getPlayerEquipmentStatus(player.position, '直ドロップ武器');
                const weaponType = drop.weapon; // 選択された武器種
                
                // 第一希望武器を既に取得済みの場合はPass
                if (firstChoiceWeaponStatus === '取得済み') {
                    type = 'pass';
                    reason = 'Pass (第一希望武器取得済み)';
                } else if (weaponType && weaponWishes.includes(weaponType)) {
                    // 希望している武器の場合
                    canReceive = true;
                    type = 'need';
                    const wishIndex = weaponWishes.indexOf(weaponType);
                    score = 3000 + getPositionPriority(player.position) - (wishIndex * 100) - (player.dynamicPriority || 0);
                    reason = `Need (第${wishIndex + 1}希望)`;
                } else {
                    // 希望していない武器の場合はPass
                    type = 'pass';
                    reason = 'Pass (希望なし)';
                }
            }
            
            return { canReceive, score, reason, type };
        }
        
        // プレイヤーの装備状況取得
        function getPlayerEquipmentStatus(position, slot) {
            const allocations = window.appData.allocations[window.currentRaidTier.id] || [];
            const allocation = allocations.find(alloc => 
                alloc.position === position && alloc.slot === slot
            );
            
            if (allocation && allocation.status) {
                return allocation.status;
            }
            
            // 既存のデータでstatusがない場合は「取得済み」とみなす
            if (allocation) {
                return '取得済み';
            }
            
            return '未取得';
        }
        
        // 同じスロットで零式方針の未取得者がいるかチェック
        function hasUnacquiredRaidPlayers(slot, excludePosition) {
            const players = window.appData.players[window.currentRaidTier.id] || {};
            
            for (const [position, player] of Object.entries(players)) {
                if (position === excludePosition) continue;
                
                const policy = player.equipmentPolicy?.[slot] || 'トームストーン';
                const equipmentStatus = getPlayerEquipmentStatus(position, slot);
                
                // 零式方針で未取得のプレイヤーがいるか
                if (policy === '零式' && equipmentStatus === '未取得') {
                    return true;
                }
            }
            
            return false;
        }
        
        // 武器箱：未取得者がいるかチェック（武器方針で判定）
        function hasUnacquiredWeaponBoxPlayers(excludePosition) {
            const players = window.appData.players[window.currentRaidTier.id] || {};
            
            for (const [position, player] of Object.entries(players)) {
                if (position === excludePosition) continue;
                
                const weaponPolicy = player.equipmentPolicy?.['武器'] || 'トームストーン';
                const weaponBoxStatus = getPlayerEquipmentStatus(position, '武器箱');
                
                // 武器を零式方針にしていて武器箱未取得のプレイヤーがいるか
                if (weaponPolicy === '零式' && weaponBoxStatus === '未取得') {
                    return true;
                }
            }
            
            return false;
        }
        
        // 分配対象の全員が取得済みまたは断章交換・箱取得済かを判定
        function isAllEligiblePlayersObtained(drop, candidates) {
            const players = window.appData.players[window.currentRaidTier.id] || {};
            
            // 4層直ドロ武器の特別処理
            if (drop.type === 'direct_weapon') {
                const weaponType = drop.weapon;
                
                // 武器が選択されていない場合はフリロ
                if (!weaponType) {
                    return true;
                }
                
                let hasEligiblePlayer = false;
                
                for (const [position, player] of Object.entries(players)) {
                    const weaponWishes = player.weaponWishes || [];
                    
                    // 第一希望武器の取得状況をチェック
                    const firstChoiceWeaponStatus = getPlayerEquipmentStatus(position, '直ドロップ武器');
                    const weaponBoxStatus = getPlayerEquipmentStatus(position, '武器箱');
                    
                    // 第一希望武器を既に取得済みの場合は対象外
                    if (firstChoiceWeaponStatus === '取得済み') {
                        continue;
                    }
                    
                    // この武器を希望していて第一希望武器未取得のプレイヤーがいるかチェック
                    if (weaponWishes.includes(weaponType)) {
                        hasEligiblePlayer = true;
                        break;
                    }
                }
                
                // 希望者がいない、または希望者全員が取得済み = フリロ
                return !hasEligiblePlayer;
            }
            
            // 通常装備の処理
            for (const [position, player] of Object.entries(players)) {
                const policy = player.equipmentPolicy?.[drop.slot] || 'トームストーン';
                const equipmentStatus = getPlayerEquipmentStatus(position, drop.slot);
                
                // 零式方針で未取得のプレイヤーがいる場合はフリロ対象外
                if (policy === '零式' && equipmentStatus === '未取得') {
                    return false;
                }
                
                // 断章交換で未取得者がいない場合は復活対象も考慮
                if (equipmentStatus === '断章交換') {
                    const hasUnacquiredRaidPlayer = hasUnacquiredRaidPlayers(drop.slot, position);
                    if (!hasUnacquiredRaidPlayer) {
                        return false; // 断章交換者が復活可能 = フリロ対象外
                    }
                }
            }
            
            // 全員が取得済み、トーム方針、または断章交換・箱取得済 = フリロ
            return true;
        }
        
        // ポジション間優先順位取得（装備・素材共通）
        function getPositionPriority(position) {
            // 設定された優先順位を取得（デフォルト: D1D2D3D4MTSTH1H2）
            const savedPriority = window.appData.settings?.positionPriority || ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
            const positionIndex = savedPriority.indexOf(position);
            return 800 - (positionIndex * 50); // 高い順位ほど高スコア
        }
        
        // 強化素材の分配優先度取得（互換性のため残す）
        function getMaterialPriority(position, materialType) {
            return getPositionPriority(position);
        }
        
        // 分配結果表示
        function displayAllocationResults(layer, results) {
            const allocationResults = document.getElementById('allocationResults');
            const allocationContent = document.getElementById('allocationContent');
            
            let html = `
                <div class="allocation-header">
                    <h4>${layer}層 装備分配結果</h4>
                    <p>推奨分配者が自動計算されました。必要に応じて変更してください。</p>
                </div>
            `;
            
            // 直ドロップ武器選択（4層のみ）
            if (layer === 4) {
                html += `
                    <div class="weapon-selection">
                        <h5>直ドロップ武器選択:</h5>
                        <select id="directWeaponSelect" onchange="updateDirectWeapon()" style="width: 100%; padding: 5px;">
                            <option value="" ${window.selectedDirectWeapon === '' ? 'selected' : ''}>武器を選択してください</option>
                            <option value="ナイト" ${window.selectedDirectWeapon === 'ナイト' ? 'selected' : ''}>ナイト武器</option>
                            <option value="戦士" ${window.selectedDirectWeapon === '戦士' ? 'selected' : ''}>戦士武器</option>
                            <option value="暗黒騎士" ${window.selectedDirectWeapon === '暗黒騎士' ? 'selected' : ''}>暗黒騎士武器</option>
                            <option value="ガンブレイカー" ${window.selectedDirectWeapon === 'ガンブレイカー' ? 'selected' : ''}>ガンブレイカー武器</option>
                            <option value="白魔道士" ${window.selectedDirectWeapon === '白魔道士' ? 'selected' : ''}>白魔道士武器</option>
                            <option value="学者" ${window.selectedDirectWeapon === '学者' ? 'selected' : ''}>学者武器</option>
                            <option value="占星術士" ${window.selectedDirectWeapon === '占星術士' ? 'selected' : ''}>占星術士武器</option>
                            <option value="賢者" ${window.selectedDirectWeapon === '賢者' ? 'selected' : ''}>賢者武器</option>
                            <option value="モンク" ${window.selectedDirectWeapon === 'モンク' ? 'selected' : ''}>モンク武器</option>
                            <option value="竜騎士" ${window.selectedDirectWeapon === '竜騎士' ? 'selected' : ''}>竜騎士武器</option>
                            <option value="忍者" ${window.selectedDirectWeapon === '忍者' ? 'selected' : ''}>忍者武器</option>
                            <option value="侍" ${window.selectedDirectWeapon === '侍' ? 'selected' : ''}>侍武器</option>
                            <option value="リーパー" ${window.selectedDirectWeapon === 'リーパー' ? 'selected' : ''}>リーパー武器</option>
                            <option value="ヴァイパー" ${window.selectedDirectWeapon === 'ヴァイパー' ? 'selected' : ''}>ヴァイパー武器</option>
                            <option value="黒魔道士" ${window.selectedDirectWeapon === '黒魔道士' ? 'selected' : ''}>黒魔道士武器</option>
                            <option value="召喚士" ${window.selectedDirectWeapon === '召喚士' ? 'selected' : ''}>召喚士武器</option>
                            <option value="赤魔道士" ${window.selectedDirectWeapon === '赤魔道士' ? 'selected' : ''}>赤魔道士武器</option>
                            <option value="ピクトマンサー" ${window.selectedDirectWeapon === 'ピクトマンサー' ? 'selected' : ''}>ピクトマンサー武器</option>
                            <option value="吟遊詩人" ${window.selectedDirectWeapon === '吟遊詩人' ? 'selected' : ''}>吟遊詩人武器</option>
                            <option value="機工士" ${window.selectedDirectWeapon === '機工士' ? 'selected' : ''}>機工士武器</option>
                            <option value="踊り子" ${window.selectedDirectWeapon === '踊り子' ? 'selected' : ''}>踊り子武器</option>
                        </select>
                    </div>
                `;
            }
            
            html += `<div class="allocation-grid">`;
            
            Object.entries(results).forEach(([itemKey, result]) => {
                const drop = result.drop;
                const needCandidates = result.candidates.filter(c => c.type === 'need');
                const greedCandidates = result.candidates.filter(c => c.type === 'greed');
                const passCandidates = result.candidates.filter(c => c.type === 'pass');
                
                html += `
                    <div class="allocation-item">
                        <div class="item-header">
                            <h5>${drop.name} ${drop.itemLevel}</h5>
                            <span class="item-type">${getItemTypeLabel(drop.type)}</span>
                        </div>
                        
                        <div class="predicted-winner">
                            <strong>予測取得者:</strong> 
                            ${(() => {
                                if (result.isMultipleRecommended && result.multipleRecommended) {
                                    return result.multipleRecommended.map(r => 
                                        `${r.player.name} (${r.position}) [${r.player.job}]`
                                    ).join('<br>');
                                } else if (result.recommended) {
                                    return `${result.recommended.player.name} (${result.recommended.position}) [${result.recommended.player.job}]`;
                                } else {
                                    const isFreeLot = isAllEligiblePlayersObtained(drop, result.candidates);
                                    return isFreeLot ? 'フリロ' : '該当者なし';
                                }
                            })()}
                        </div>
                        
                        <div class="allocation-choice">
                            <label>実際の取得者:</label>
                            <select id="allocation-${itemKey}" onchange="updateAllocationChoice('${itemKey}')">
                                <option value="">選択してください</option>
                                ${result.candidates.map(candidate => {
                                    // 単一推奨者の場合
                                    if (result.recommended?.position === candidate.position) {
                                        return `<option value="${candidate.position}" selected>
                                            ${candidate.player.name} (${candidate.position}) [${candidate.player.job}]
                                        </option>`;
                                    }
                                    // 複数推奨者の場合
                                    if (result.isMultipleRecommended && result.multipleRecommended?.some(r => r.position === candidate.position)) {
                                        return `<option value="${candidate.position}" style="background-color: #fff3cd;">
                                            ${candidate.player.name} (${candidate.position}) [${candidate.player.job}] ★
                                        </option>`;
                                    }
                                    // 通常の候補者
                                    return `<option value="${candidate.position}">
                                        ${candidate.player.name} (${candidate.position}) [${candidate.player.job}]
                                    </option>`;
                                }).join('')}
                            </select>
                        </div>
                        
                        <div class="judgment-details">
                            <div class="judgment-section">
                                <button class="judgment-toggle" onclick="toggleJudgment('${itemKey}')">
                                    判定詳細を表示 ▼
                                </button>
                                <div id="judgment-${itemKey}" class="judgment-content" style="display: none;">
                                    ${needCandidates.length > 0 ? `
                                        <div class="need-section">
                                            <h6>Need (${needCandidates.length}人)</h6>
                                            ${needCandidates.map(candidate => `
                                                <div class="candidate-item need">
                                                    ${candidate.player.name} (${candidate.position}): ${candidate.reason} (${candidate.priority})
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                    
                                    ${greedCandidates.length > 0 ? `
                                        <div class="greed-section">
                                            <h6>Greed (${greedCandidates.length}人)</h6>
                                            ${greedCandidates.map(candidate => `
                                                <div class="candidate-item greed">
                                                    ${candidate.player.name} (${candidate.position}): ${candidate.reason} (${candidate.priority})
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                    
                                    ${passCandidates.length > 0 ? `
                                        <div class="pass-section">
                                            <h6>Pass (${passCandidates.length}人)</h6>
                                            ${passCandidates.map(candidate => `
                                                <div class="candidate-item pass">
                                                    ${candidate.player.name} (${candidate.position}): ${candidate.reason}
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                </div>
                
                <div class="allocation-actions">
                    <button onclick="confirmAllocation(${layer})" class="confirm-btn">
                        分配を確定
                    </button>
                    <button onclick="showTierDashboard()" class="cancel-btn">
                        キャンセル
                    </button>
                </div>
            `;
            
            allocationContent.innerHTML = html;
            allocationResults.style.display = 'block';
            
            // 結果表示エリアまでスクロール
            allocationResults.scrollIntoView({ behavior: 'smooth' });
        }
        
        // 直ドロップ武器更新
        function updateDirectWeapon() {
            console.log('updateDirectWeapon関数が呼び出されました');
            
            const weaponSelect = document.getElementById('directWeaponSelect');
            if (!weaponSelect) {
                console.error('武器選択プルダウンが見つかりません');
                showError('武器選択プルダウンが見つかりません');
                return;
            }
            
            const selectedWeapon = weaponSelect.value;
            console.log('選択された武器:', selectedWeapon);
            console.log('プルダウンの全選択肢:', weaponSelect.options.length);
            
            // グローバル変数に選択状態を保存
            window.selectedDirectWeapon = selectedWeapon;
            console.log('選択状態を保存:', window.selectedDirectWeapon);
            
            try {
                // 直ドロップ武器の分配を再計算
                const drops = getLayerDrops(4);
                console.log('4層のドロップアイテム:', drops);
                
                const allocationResults = calculateAllocation(4, drops);
                displayAllocationResults(4, allocationResults);
                
                if (selectedWeapon) {
                    showSuccess(`${selectedWeapon}を選択しました`);
                } else {
                    console.log('武器選択がクリアされました');
                }
            } catch (error) {
                console.error('武器選択処理エラー:', error);
                showError('武器選択処理でエラーが発生しました: ' + error.message);
            }
        }
        
        // 判定詳細の表示切り替え
        function toggleJudgment(itemKey) {
            const content = document.getElementById(`judgment-${itemKey}`);
            const button = content.previousElementSibling;
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                button.textContent = '判定詳細を隠す ▲';
            } else {
                content.style.display = 'none';
                button.textContent = '判定詳細を表示 ▼';
            }
        }
        
        // アイテムタイプラベル
        function getItemTypeLabel(type) {
            const labels = {
                'equipment': '装備',
                'material': '強化素材',
                'weapon_box': '武器箱',
                'direct_weapon': '直ドロップ武器'
            };
            return labels[type] || type;
        }
        
        // 分配選択更新
        function updateAllocationChoice(slot) {
            // 選択変更時の処理（必要に応じて実装）
            console.log(`${slot}の分配選択が変更されました`);
        }
        
        // 分配確定
        async function confirmAllocation(layer) {
            try {
                const allocations = [];
                const selects = document.querySelectorAll('[id^="allocation-"]');
                const allocationId = Date.now().toString();
                
                selects.forEach(select => {
                    const itemKey = select.id.replace('allocation-', '');
                    const position = select.value;
                    
                    if (position && position !== 'discard' && position !== 'フリロ') {
                        const player = window.appData.players[window.currentRaidTier.id][position];
                        const drops = getLayerDrops(layer);
                        const drop = drops.find(d => d.slot === itemKey || d.name.includes(itemKey));
                        
                        if (drop && player) {
                            const allocation = {
                                id: `${allocationId}-${itemKey}`,
                                layer: parseInt(layer) || layer,
                                slot: drop.slot,
                                position: position,
                                playerName: player.name,
                                characterName: player.characterName || '',
                                job: player.job,
                                equipment: {
                                    name: drop.name,
                                    slot: drop.slot,
                                    itemLevel: drop.itemLevel
                                },
                                timestamp: new Date().toISOString(),
                                week: getCurrentWeek(),
                                raidTier: window.currentRaidTier.name,
                                // 詳細情報
                                itemType: drop.type,
                                equipmentName: drop.name,
                                equipmentSlot: drop.slot,
                                winner: position,
                                winnerName: player.name
                            };
                            
                            allocations.push(allocation);
                        }
                    }
                });
                
                if (allocations.length === 0) {
                    showError('分配する装備が選択されていません。');
                    return;
                }
                
                // 分配履歴に記録
                if (!window.appData.allocations[window.currentRaidTier.id]) {
                    window.appData.allocations[window.currentRaidTier.id] = [];
                }
                
                allocations.forEach(allocation => {
                    window.appData.allocations[window.currentRaidTier.id].push(allocation);
                    
                    // プレイヤーの装備状況更新
                    const player = window.appData.players[window.currentRaidTier.id][allocation.position];
                    if (player) {
                        // 現在装備の更新
                        if (!player.currentEquipment) player.currentEquipment = {};
                        player.currentEquipment[allocation.slot] = true;
                        
                        // 分配履歴の更新
                        if (!player.allocationHistory) player.allocationHistory = [];
                        player.allocationHistory.push({
                            equipment: allocation.equipment,
                            timestamp: allocation.timestamp,
                            week: allocation.week,
                            layer: allocation.layer
                        });
                        
                        // 動的優先度更新
                        const itemPriority = getItemPriority(allocation.slot);
                        player.dynamicPriority = (player.dynamicPriority || 0) + itemPriority;
                    }
                });
                
                // 断章交換者の自動ステータス更新
                await updateTomeExchangeStatus(allocations);
                
                // Supabaseに保存
                await saveDataToSupabase('allocations', window.appData.allocations[window.currentRaidTier.id]);
                await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);
                
                showSuccess(`${layer}層の装備分配を確定しました。${allocations.length}件の装備が分配されました。`);
                showEquipmentAllocation(); // 装備分配画面に戻る
                
            } catch (error) {
                console.error('分配確定エラー:', error);
                showError('分配の確定に失敗しました: ' + error.message);
            }
        }
        
        // 現在の週番号取得
        function getCurrentWeek() {
            const now = new Date();
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const weekNumber = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
            return weekNumber;
        }
        
        // アイテム優先度取得
        function getItemPriority(slot) {
            const priorities = {
                '武器': 3,
                '胴': 2,
                '脚': 2,
                '頭': 1,
                '手': 1,
                '足': 1,
                '耳': 1,
                '首': 1,
                '腕': 1,
                '指': 1,
                '武器石': 1,
                '硬化薬': 1,
                '強化薬': 1,
                '強化繊維': 1
            };
            return priorities[slot] || 1;
        }
        
        // 断章交換者の自動ステータス更新
        async function updateTomeExchangeStatus(allocations) {
            try {
                const currentAllocations = window.appData.allocations[window.currentRaidTier.id] || [];
                let hasUpdates = false;
                
                // 各装備スロットについて断章交換者をチェック
                const equipmentSlots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
                
                for (const slot of equipmentSlots) {
                    // 今回のアロケーションでこのスロットの装備が分配されたかチェック
                    const slotAllocations = allocations.filter(alloc => alloc.slot === slot);
                    
                    if (slotAllocations.length > 0) {
                        // このスロットで断章交換ステータスの人をチェック
                        const players = window.appData.players[window.currentRaidTier.id] || {};
                        
                        for (const [position, player] of Object.entries(players)) {
                            const currentStatus = getPlayerEquipmentStatus(position, slot);
                            
                            // 断章交換ステータスの人が装備を取得した場合
                            if (currentStatus === '断章交換') {
                                const receivedAllocation = slotAllocations.find(alloc => alloc.position === position);
                                
                                if (receivedAllocation) {
                                    // ステータスを「断章交換・箱取得済」に更新
                                    const existingAllocation = currentAllocations.find(alloc => 
                                        alloc.position === position && alloc.slot === slot
                                    );
                                    
                                    if (existingAllocation) {
                                        existingAllocation.status = '断章交換・箱取得済';
                                        hasUpdates = true;
                                        console.log(`${player.name}(${position})の${slot}ステータスを「断章交換・箱取得済」に更新`);
                                    }
                                }
                            }
                        }
                    }
                }
                
                if (hasUpdates) {
                    // 更新があった場合は再保存
                    await saveDataToSupabase('allocations', window.appData.allocations[window.currentRaidTier.id]);
                    console.log('断章交換ステータスの自動更新が完了しました');
                }
                
            } catch (error) {
                console.error('断章交換ステータス更新エラー:', error);
                // エラーが発生しても分配処理自体は続行
            }
        }
        
        // 統計情報表示機能はjs/statistics.jsに分離

        // ======================
        // システム設定・データエクスポート機能
        // ======================
        function showSystemSettings() {
            try {
                if (!window.appData.currentTier) {
                    showError('tierを選択してください');
                    return;
                }

                const currentView = document.getElementById('currentView');
                currentView.innerHTML = `
                    <div class="content-section">
                        <h2>システム設定</h2>
                        <div class="settings-container">
                            <div class="setting-group">
                                <h3>データ管理</h3>
                                <button onclick="exportAllData()" class="primary-button">全データエクスポート</button>
                                <p class="setting-description">現在のtierの全データをJSON形式でエクスポートします</p>
                            </div>
                            <div class="setting-group">
                                <h3>チーム情報</h3>
                                <p><strong>チームID:</strong> ${window.appData.teamId || '未設定'}</p>
                                <p><strong>現在のTier:</strong> ${window.currentRaidTier.name || '未設定'}</p>
                                <p><strong>登録プレイヤー数:</strong> ${window.appData.players?.[window.currentRaidTier.id]?.length || 0}名</p>
                            </div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('システム設定表示エラー:', error);
                showError('システム設定の表示に失敗しました');
            }
        }

        function exportAllData() {
            try {
                if (!window.appData.currentTier) {
                    showError('tierを選択してください');
                    return;
                }

                const exportData = {
                    teamId: window.appData.teamId,
                    tier: window.currentRaidTier,
                    players: window.appData.players[window.currentRaidTier.id] || [],
                    allocations: window.appData.allocations[window.currentRaidTier.id] || [],
                    prioritySettings: window.appData.prioritySettings || {},
                    exportDate: new Date().toISOString()
                };

                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `ff14_gear_allocation_${window.currentRaidTier.id}_${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);

                showSuccess('データをエクスポートしました');
            } catch (error) {
                console.error('データエクスポートエラー:', error);
                showError('データのエクスポートに失敗しました');
            }
        }

        // ======================
        // グローバル関数登録（onclick用）
        // ======================
        if (typeof window !== 'undefined') {
            // データ・状態変数の公開（statistics.js等で参照）
            window.appData = window.appData;
            window.currentRaidTier = window.currentRaidTier;
            window.supabase = supabase;

            // ヘルパー関数の公開
            window.saveDataToSupabase = saveDataToSupabase;

            // UI関数（onclick用）
            window.authenticateTeam = authenticateTeam;
            window.logout = logout;
            window.toggleSettingsMenu = toggleSettingsMenu;
            window.startDiscordAuth = startDiscordAuth;
            window.createNewTeam = createNewTeam;
            window.showLoginForm = showLoginForm;
            window.showSignupForm = showSignupForm;
            window.showPasswordResetForm = showPasswordResetForm;
            window.getSecurityQuestion = getSecurityQuestion;
            window.verifySecurityAnswer = verifySecurityAnswer;
            window.executePasswordReset = executePasswordReset;
            window.showTierDashboard = showTierDashboard;
            window.showPlayerManagement = showPlayerManagement;
            window.showTabbedSetup = showTabbedSetup;
            window.saveCurrentTab = saveCurrentTab;
            window.saveCurrentTabAndContinue = saveCurrentTabAndContinue;
            window.showLayerAllocation = showLayerAllocation;
            window.confirmAllocation = confirmAllocation;
            window.toggleJudgment = toggleJudgment;
            window.showPriorityManagement = showPriorityManagement;
            window.savePrioritySettings = savePrioritySettings;
            window.resetPrioritySettings = resetPrioritySettings;
            window.showSystemSettings = showSystemSettings;
            window.exportAllData = exportAllData;
            window.togglePolicyCell = togglePolicyCell;
            window.saveIntegratedMemberData = saveIntegratedMemberData;

            console.log('✅ グローバル関数登録完了 (27関数 + データ変数)');
        }

        } catch (error) {
            console.error("🚨 メインスクリプト実行エラー:", error);
            console.error("スタックトレース:", error.stack);
            alert("システムの初期化でエラーが発生しました: " + error.message);
        }

        console.log("✅ メインスクリプト実行完了");

        // 自動Discord認証処理
        (async function autoDiscordAuth() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const inviteToken = urlParams.get('token');
                const teamId = urlParams.get('team');
                const discordCode = urlParams.get('code');
                const discordState = urlParams.get('state');

                console.log('🔍 URL パラメータ確認:', { inviteToken, teamId, discordCode, discordState });

                // Discord認証コールバック処理
                if (discordCode && discordState) {
                    console.log('🎯 Discord認証コールバック検出');
                    updateLoadingMessage('Discord認証を処理中...');

                    try {
                        const savedState = sessionStorage.getItem('discord_oauth_state');
                        const savedToken = sessionStorage.getItem('invite_token');

                        if (savedState !== discordState) {
                            throw new Error('認証状態が一致しません。セキュリティエラーの可能性があります。');
                        }

                        // Discord認証処理
                        await handleDiscordCallback(discordCode, savedToken);
                        return;

                    } catch (error) {
                        console.error('❌ Discord認証エラー:', error);
                        showError('Discord認証に失敗しました: ' + error.message);
                        hideLoadingScreen();
                        return;
                    }
                }

                // 招待URL経由の初回アクセス
                if (inviteToken && teamId) {
                    console.log('✅ 招待URL検出 - 自動Discord認証開始');
                    updateLoadingMessage('招待リンクを確認中...');

                    // 招待トークンの検証
                    const { data: tokenValidation, error: tokenError } = await window.supabaseClient
                        .from('team_invite_tokens')
                        .select('team_id, expires_at')
                        .eq('token', inviteToken)
                        .single();

                    if (tokenError || !tokenValidation) {
                        throw new Error('招待リンクが無効です。チームリーダーに新しい招待リンクを依頼してください。');
                    }

                    // トークン期限確認
                    if (new Date(tokenValidation.expires_at) < new Date()) {
                        throw new Error('招待リンクの有効期限が切れています。チームリーダーに新しい招待リンクを依頼してください。');
                    }

                    if (tokenValidation.team_id !== teamId) {
                        throw new Error('招待リンクのチーム情報が一致しません。');
                    }

                    console.log('✅ 招待トークン検証成功 - Discord認証へリダイレクト');
                    updateLoadingMessage('Discord認証画面に移動します...');

                    // Discord OAuth開始
                    await new Promise(resolve => setTimeout(resolve, 1000)); // UX向上のための1秒待機
                    startDiscordAuthWithToken(inviteToken);
                    return;
                }

                // 招待トークンなし - localStorageに保存済みteam_idを確認
                const savedTeamId = localStorage.getItem('ff14_team_id');
                if (savedTeamId) {
                    console.log('✅ 保存済みteam_id検出 - 自動ログイン実行');
                    updateLoadingMessage('ログイン情報を確認中...');
                    // tryAutoLoginを実行（既にinitializeMainFeaturesで呼ばれている）
                    hideLoadingScreen();
                    return;
                }

                // 保存済みログイン情報もない - エラー表示
                console.warn('⚠️ 招待トークンも保存済みログイン情報もありません');
                hideLoadingScreen();
                showError(
                    'このシステムは招待リンク経由でのみアクセスできます。\n\n' +
                    'Discord サーバーで /team-create コマンドを実行して\n' +
                    '招待リンクを取得してください。'
                );

            } catch (error) {
                console.error('❌ 自動認証エラー:', error);
                hideLoadingScreen();
                showError('認証処理でエラーが発生しました: ' + error.message);
            }
        })();

        // ローディング画面更新ヘルパー
        function updateLoadingMessage(message) {
            const loadingMessage = document.getElementById('loadingMessage');
            if (loadingMessage) {
                loadingMessage.textContent = message;
            }
        }

        // ローディング画面非表示
        function hideLoadingScreen() {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.remove('show');
                loadingScreen.style.display = 'none';
            }
        }

        // Discord認証コールバック処理
        async function handleDiscordCallback(code, inviteToken) {
            try {
                console.log('🔐 Discord認証コールバック処理開始');

                // バックエンドでDiscordトークン交換
                const response = await fetch('https://your-backend-url/api/discord/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: code,
                        invite_token: inviteToken
                    })
                });

                if (!response.ok) {
                    throw new Error('Discord認証に失敗しました');
                }

                const { user, team } = await response.json();

                // チーム情報を保存
                window.currentTeamId = team.id;
                sessionStorage.setItem('currentTeamId', team.id);
                sessionStorage.setItem('discordUser', JSON.stringify(user));

                // 認証成功
                window.isAuthenticated = true;
                console.log('✅ Discord認証成功:', user.username);

                // URLをクリーンアップ
                window.history.replaceState({}, document.title, window.location.pathname);

                // メイン画面を表示
                await initializeApp();

            } catch (error) {
                console.error('❌ Discord認証コールバックエラー:', error);
                throw error;
            }
        }
