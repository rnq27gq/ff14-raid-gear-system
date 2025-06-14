// Supabase認証情報テンプレート
// このファイルをコピーして config/supabase_credentials.js を作成してください

const SUPABASE_CONFIG = {
    // Supabaseプロジェクト設定
    SUPABASE_URL: 'https://bpzvuwhnjvbfohopeoxr.supabase.co',
    SUPABASE_ANON_KEY: 'YOUR_NEW_SUPABASE_ANON_KEY_HERE', // 🔑 新しいAPIキーに置き換えてください
    
    // デモ認証情報
    DEMO_TEAM_ID: 'demo-team',
    DEMO_PASSWORD: 'demo123'
};

// 使用方法: window.SUPABASE_CONFIG でアクセス
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}