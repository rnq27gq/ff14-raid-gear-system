// Discord OAuth2設定
const DISCORD_CONFIG = {
    client_id: '1421136327843250286', // 正しいクライアントID
    redirect_uri: window.location.origin + window.location.pathname,
    scope: 'identify',
    response_type: 'code'
};

// GitHub Actionsによってデプロイ時に認証情報が注入されます
window.SUPABASE_CONFIG = {
    SUPABASE_URL: '{{SUPABASE_URL}}',
    SUPABASE_ANON_KEY: '{{SUPABASE_ANON_KEY}}'
};