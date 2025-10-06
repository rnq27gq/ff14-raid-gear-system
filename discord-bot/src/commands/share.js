import { SlashCommandBuilder } from 'discord.js';
import { randomUUID } from 'crypto';

export class ShareCommand {
    constructor(supabaseClient = null) {
        this.supabaseClient = supabaseClient;
        this.data = new SlashCommandBuilder()
            .setName('share')
            .setDescription('FF14装備分配システムの専用URLを作成します');
    }

    async execute(interaction) {
        const guildId = interaction.guild?.id;
        const guildName = interaction.guild?.name || 'Unknown Server';
        const leaderName = interaction.user.username;

        try {
            await interaction.deferReply();

            const inviteToken = randomUUID();
            const teamId = this.generateTeamId(guildName);

            console.log(`Creating team: ${guildName}, ID: ${teamId}`);

            const teamData = {
                team_id: teamId,
                team_name: guildName,
                creator_name: leaderName,
                creator_discord_id: interaction.user.id,
                discord_guild_id: guildId,
                discord_channel_id: null,
                invite_token: inviteToken,
                token_expires_at: null,
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
                content: `FF14装備分配システムの専用URLを作成しました！\n\n` +
                        `専用URL（クリックしてアクセス）\n${inviteUrl}`
            });

        } catch (error) {
            console.error('Team creation error:', error);

            await interaction.editReply({
                content: `エラーが発生しました。しばらく後でお試しください。`
            });
        }
    }

    generateTeamId(teamName) {
        const cleaned = teamName.replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
        const timestamp = Date.now().toString(36);
        return `${cleaned}-${timestamp}`.toLowerCase();
    }

    generateInviteUrl(token) {
        const baseUrl = process.env.WEB_APP_URL || 'https://rnq27gq.github.io/ff14-raid-gear-system';
        return `${baseUrl}?token=${token}`;
    }
}
