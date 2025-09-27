import { SlashCommandBuilder, ApplicationCommandOptionType } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export class TeamCreateCommand {
    constructor(supabaseClient = null) {
        this.supabaseClient = supabaseClient;
        this.data = new SlashCommandBuilder()
            .setName('team-create')
            .setDescription('FF14装備分配システムの専用URLを作成します')
            .addStringOption(option =>
                option
                    .setName('scope')
                    .setDescription('運用範囲を選択してください')
                    .setRequired(true)
                    .addChoices(
                        { name: 'サーバー全体で使用', value: 'server' },
                        { name: 'このチャンネルのみで使用', value: 'channel' }
                    )
            );
    }

    async execute(interaction) {
        const scope = interaction.options.getString('scope');
        const guildName = interaction.guild?.name || 'Unknown Server';
        const channelName = interaction.channel?.name || 'unknown-channel';
        const leaderName = interaction.user.username;

        // チーム名とIDを設定
        const teamName = scope === 'server' ? guildName : `${guildName}-${channelName}`;

        // 既存のチーム確認
        const guildId = interaction.guild?.id;
        const channelId = scope === 'channel' ? interaction.channel?.id : null;

        try {
            // 既存チーム確認
            if (this.supabaseClient) {
                const { data: existingTeam } = await this.supabaseClient
                    .from('teams')
                    .select('*')
                    .eq('discord_guild_id', guildId)
                    .eq('discord_channel_id', channelId || null)
                    .single();

                if (existingTeam) {
                    const scopeText = scope === 'server' ? 'サーバー' : 'チャンネル';
                    await interaction.reply({
                        content: `❌ この${scopeText}には既にFF14装備分配システムが設定されています。\n既存のURLを使用してください。`,
                        ephemeral: true
                    });
                    return;
                }
            }
        } catch (error) {
            // 既存チームなし（正常）
        }

        try {
            await interaction.deferReply();

            const inviteToken = randomUUID();
            const teamId = this.generateTeamId(teamName);

            console.log(`Creating ${scope} team: ${teamName}, ID: ${teamId}`);

            const teamData = {
                team_id: teamId,
                team_name: teamName,
                creator_name: leaderName,
                creator_discord_id: interaction.user.id,
                discord_guild_id: guildId,
                discord_channel_id: channelId,
                invite_token: inviteToken,
                token_expires_at: null, // 永続化：有効期限なし
                auth_method: 'discord',
                created_at: new Date().toISOString()
            };

            if (this.supabaseClient) {
                console.log('Inserting team data into Supabase...');
                const { data, error } = await this.supabaseClient
                    .from('teams')
                    .insert(teamData);

                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }
                console.log('Team data inserted successfully');
            } else {
                console.log('Using mock Supabase client - team data not saved');
            }

            const inviteUrl = this.generateInviteUrl(inviteToken);

            const scopeText = scope === 'server' ? 'サーバー全体' : 'このチャンネル';
            await interaction.editReply({
                content: `✅ **FF14装備分配システム** の専用URLを作成しました！\n\n` +
                        `📋 **チーム名**: ${teamName}\n` +
                        `🎯 **運用範囲**: ${scopeText}\n` +
                        `👑 **作成者**: ${leaderName}\n\n` +
                        `🔗 **専用URL（クリックしてアクセス）**\n<${inviteUrl}>\n\n` +
                        `✨ このURLは**永続的**に利用できます\n` +
                        `📌 ブックマークして繰り返しご利用ください`
            });

        } catch (error) {
            console.error('Team creation error:', error);
            
            const errorMessage = error.message.includes('duplicate') 
                ? 'このチーム名は既に使用されています。別の名前をお試しください。'
                : 'チーム作成中にエラーが発生しました。しばらく後でお試しください。';

            await interaction.editReply({
                content: `❌ ${errorMessage}`,
                ephemeral: true
            });
        }
    }

    generateTeamId(teamName) {
        const cleaned = teamName.replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
        const timestamp = Date.now().toString(36);
        return `${cleaned}-${timestamp}`.toLowerCase();
    }

    generateInviteUrl(token) {
        const baseUrl = process.env.WEB_APP_URL || 'https://your-domain.github.io/FF14_Gear_Allocation_System';
        return `${baseUrl}?token=${token}`;
    }

    calculateTokenExpiry() {
        const hours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS) || 24;
        return new Date(Date.now() + hours * 60 * 60 * 1000);
    }
}