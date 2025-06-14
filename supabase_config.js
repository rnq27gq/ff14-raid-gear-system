// Supabase設定ファイル
// 注意: 本番環境では環境変数を使用することを推奨

class SupabaseConfig {
    constructor() {
        // Supabaseプロジェクトの設定（要更新）
        // Supabaseプロジェクトの設定
        this.SUPABASE_URL = 'https://bpzvuwhnjvbfohopeoxr.supabase.co';
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwenZ1d2huanZiZm9ob3Blb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE3MDMsImV4cCI6MjA2NTQ0NzcwM30.pYiMUoptXLpWyFAlUkCE973ipObCEQgOUyILEpodVC8';
        
        // チーム設定
        this.currentTeamId = localStorage.getItem('ff14_team_id') || null;
        
        // Supabaseクライアント
        this.supabase = null;
    }
    
    // Supabaseクライアント初期化
    async initialize() {
        try {
            // SupabaseライブラリがCDNから読み込まれているか確認
            if (typeof window.supabase === 'undefined') {
                console.error('Supabase JavaScript ライブラリが読み込まれていません');
                return false;
            }
            
            // Supabaseクライアント作成
            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            
            if (!this.supabase) {
                throw new Error('Supabaseクライアントの作成に失敗しました');
            }
            
            console.log('Supabase initialized successfully');
            return true;
        } catch (error) {
            console.error('Supabase初期化エラー:', error);
            return false;
        }
    }
    
    // チームID設定
    setTeamId(teamId) {
        this.currentTeamId = teamId;
        localStorage.setItem('ff14_team_id', teamId);
        
        // RLS用のセッション変数設定  
        return this.supabase.rpc('set_team_context', { team_id: teamId });
    }
    
    // 認証状態確認
    isAuthenticated() {
        return this.currentTeamId !== null;
    }
    
    // データ保存
    async saveData(tierIds, dataType, content) {
        if (!this.isAuthenticated()) {
            throw new Error('チーム認証が必要です');
        }
        
        try {
            const { data, error } = await this.supabase
                .from('raid_data')
                .upsert({
                    team_id: this.currentTeamId,
                    tier_id: tierIds,
                    data_type: dataType,
                    content: content
                }, {
                    onConflict: 'team_id,tier_id,data_type'
                });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('データ保存エラー:', error);
            throw error;
        }
    }
    
    // データ読み込み
    async loadData(tierIds = null, dataType = null) {
        if (!this.isAuthenticated()) {
            throw new Error('チーム認証が必要です');
        }
        
        try {
            let query = this.supabase
                .from('raid_data')
                .select('*')
                .eq('team_id', this.currentTeamId);
            
            if (tierIds) query = query.eq('tier_id', tierIds);
            if (dataType) query = query.eq('data_type', dataType);
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            throw error;
        }
    }
    
    // チーム認証
    async authenticateTeam(teamId, password) {
        try {
            if (!this.supabase) {
                throw new Error('Supabaseクライアントが初期化されていません');
            }
            
            console.log('認証試行:', teamId);
            
            const { data, error } = await this.supabase.rpc('authenticate_team', {
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
            
            await this.setTeamId(teamId);
            return true;
        } catch (error) {
            console.error('認証エラー:', error);
            throw error;
        }
    }
    
    // リアルタイム更新監視
    subscribeToChanges(callback) {
        if (!this.isAuthenticated()) return null;
        
        return this.supabase
            .channel('raid_data_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'raid_data',
                filter: `team_id=eq.${this.currentTeamId}`
            }, callback)
            .subscribe();
    }
}

// グローバルインスタンス
const supabaseConfig = new SupabaseConfig();