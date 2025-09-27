import { SlashCommandBuilder, ApplicationCommandOptionType } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export class TeamCreateCommand {
    constructor(supabaseClient = null) {
        this.supabaseClient = supabaseClient;
        this.data = new SlashCommandBuilder()
            .setName('team-create')
            .setDescription('FF14装備分配チームを作成します')
            .addStringOption(option =>
                option
                    .setName('team-name')
                    .setDescription('チーム名（3-20文字）')
                    .setRequired(true)
                    .setMinLength(3)
                    .setMaxLength(20)
            )
            .addStringOption(option =>
                option
                    .setName('leader-name')
                    .setDescription('リーダー名（省略時はDiscordユーザー名）')
                    .setRequired(false)
                    .setMaxLength(20)
            );
    }

    async execute(interaction) {
        const teamName = interaction.options.getString('team-name');
        const leaderName = interaction.options.getString('leader-name') || interaction.user.username;

        if (teamName.length < 3) {
            await interaction.reply({
                content: '❌ チーム名は3文字以上で入力してください。',
                ephemeral: true
            });
            return;
        }

        if (teamName.length > 20) {
            await interaction.reply({
                content: '❌ チーム名は20文字以内で入力してください。',
                ephemeral: true
            });
            return;
        }

        try {
            await interaction.deferReply();

            const inviteToken = randomUUID();
            const expiresAt = this.calculateTokenExpiry();
            const teamId = this.generateTeamId(teamName);

            console.log(`Creating team: ${teamName}, ID: ${teamId}`);

            const teamData = {
                team_id: teamId,
                team_name: teamName,
                creator_name: leaderName,
                creator_discord_id: interaction.user.id,
                discord_guild_id: interaction.guild?.id || null,
                discord_channel_id: interaction.channel?.id || null,
                invite_token: inviteToken,
                token_expires_at: expiresAt.toISOString(),
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

            await interaction.editReply({
                content: `✅ **${teamName}** が作成されました！\n\n` +
                        `🔗 **参加用URL（クリックしてアクセス）**\n${inviteUrl}\n\n` +
                        `⏰ URL有効期限: 24時間\n` +
                        `👑 チームリーダー: ${leaderName}\n\n` +
                        `メンバーは上記URLをクリックしてチームに参加できます。`
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