// Supabase関連の型定義

// チーム情報
export interface Team {
  team_id: string;
  team_name: string;
  password_hash: string;
  creator_name?: string;
  created_at: string;
  invite_token?: string;
  token_expires_at?: string;
}

// Discordユーザー情報
export interface DiscordUser {
  id: string;
  username: string;
  avatar?: string;
}

// Discord認証トークンレスポンス
export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

// チーム参加レスポンス
export interface TeamJoinResponse {
  team_id: string;
  team_name: string;
  success: boolean;
}
