import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TeamCreateCommand } from '../src/commands/team-create.js';
import { MockSupabaseClient } from '../src/utils/mock-supabase.js';

describe('TeamCreateCommand', () => {
    test('チーム作成コマンドの基本構造が正しい', () => {
        const command = new TeamCreateCommand();
        
        assert.strictEqual(command.data.name, 'team-create');
        assert.strictEqual(command.data.description, 'FF14装備分配チームを作成します');
        assert.strictEqual(command.data.options.length, 2);
        
        const teamNameOption = command.data.options[0];
        assert.strictEqual(teamNameOption.name, 'team-name');
        assert.strictEqual(teamNameOption.required, true);
        assert.strictEqual(teamNameOption.min_length, 3);
        assert.strictEqual(teamNameOption.max_length, 20);
        
        const leaderNameOption = command.data.options[1];
        assert.strictEqual(leaderNameOption.name, 'leader-name');
        assert.strictEqual(leaderNameOption.required, false);
        assert.strictEqual(leaderNameOption.max_length, 20);
    });
    
    test('有効なチーム名でチーム作成が成功する', async () => {
        const mockSupabase = new MockSupabaseClient();
        const command = new TeamCreateCommand(mockSupabase);
        
        const mockInteraction = {
            user: {
                id: '123456789',
                username: 'testuser',
                discriminator: '0001'
            },
            guild: {
                id: '987654321'
            },
            channel: {
                id: '555666777'
            },
            options: {
                getString: (name) => {
                    if (name === 'team-name') return 'テストチーム';
                    if (name === 'leader-name') return null;
                    return null;
                }
            },
            deferReply: async () => {},
            editReply: async (content) => mockInteraction.lastReply = content
        };
        
        mockSupabase.setMockResponse('teams', 'insert', {
            data: [{
                id: 1,
                team_id: 'test-team-123',
                team_name: 'テストチーム',
                creator_name: 'testuser',
                creator_discord_id: '123456789',
                discord_guild_id: '987654321',
                discord_channel_id: '555666777',
                invite_token: 'mock-token-123',
                auth_method: 'discord'
            }]
        });
        
        await command.execute(mockInteraction);
        
        assert.ok(mockInteraction.lastReply);
        assert.ok(mockInteraction.lastReply.content);
        assert.ok(mockInteraction.lastReply.content.includes('テストチーム'));
        assert.ok(mockInteraction.lastReply.content.includes('mock-token-123'));
    });
    
    test('チーム名が短すぎる場合エラーを返す', async () => {
        const command = new TeamCreateCommand();
        const mockInteraction = {
            options: {
                getString: (name) => name === 'team-name' ? 'ab' : null
            },
            reply: async (content) => mockInteraction.lastReply = content
        };
        
        await command.execute(mockInteraction);
        
        assert.ok(mockInteraction.lastReply.content.includes('3文字以上'));
        assert.strictEqual(mockInteraction.lastReply.ephemeral, true);
    });
    
    test('チーム名が長すぎる場合エラーを返す', async () => {
        const command = new TeamCreateCommand();
        const mockInteraction = {
            options: {
                getString: (name) => name === 'team-name' ? 'a'.repeat(21) : null
            },
            reply: async (content) => mockInteraction.lastReply = content
        };
        
        await command.execute(mockInteraction);
        
        assert.ok(mockInteraction.lastReply.content.includes('20文字以内'));
        assert.strictEqual(mockInteraction.lastReply.ephemeral, true);
    });
    
    test('招待URLが正しい形式で生成される', async () => {
        const mockSupabase = new MockSupabaseClient();
        const command = new TeamCreateCommand(mockSupabase);
        
        const token = 'test-uuid-token';
        mockSupabase.setMockResponse('teams', 'insert', {
            data: [{ invite_token: token }]
        });
        
        const result = await command.generateInviteUrl(token);
        
        assert.ok(result.startsWith('https://'));
        assert.ok(result.includes('token=' + token));
    });
    
    test('招待トークンの有効期限が24時間後に設定される', async () => {
        const command = new TeamCreateCommand();
        
        const expiresAt = command.calculateTokenExpiry();
        const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime());
        
        assert.ok(timeDiff < 1000); // 1秒以内の誤差
    });
});