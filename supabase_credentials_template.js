// Supabase認証情報テンプレート
// このファイルをコピーして config/supabase_credentials.js を作成してください

const SUPABASE_CONFIG = {
    // Supabaseプロジェクト設定
    SUPABASE_URL: 'https://bpzvuwhnjvbfohopeoxr.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwenZ1d2huanZiZm9ob3Blb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE3MDMsImV4cCI6MjA2NTQ0NzcwM30.pYiMUoptXLpWyFAlUkCE973ipObCEQgOUyILEpodVC8', // 🔑 新しいAPIキーに置き換えてください
    
    // デモ認証情報
    DEMO_TEAM_ID: 'demo-team',
    DEMO_PASSWORD: 'demo123'
};

// 使用方法: window.SUPABASE_CONFIG でアクセス
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}