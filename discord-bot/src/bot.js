import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { TeamCreateCommand } from './commands/team-create.js';

config();

class FF14GearAllocationBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages
            ]
        });

        this.supabaseClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        this.commands = new Collection();
        this.setupCommands();
        this.setupEventHandlers();
    }

    setupCommands() {
        const teamCreateCommand = new TeamCreateCommand(this.supabaseClient);
        this.commands.set('team-create', teamCreateCommand);
    }

    setupEventHandlers() {
        this.client.once('ready', this.onReady.bind(this));
        this.client.on('interactionCreate', this.onInteractionCreate.bind(this));
        
        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
        });

        process.on('SIGINT', this.shutdown.bind(this));
        process.on('SIGTERM', this.shutdown.bind(this));
    }

    onReady() {
        console.log(`✅ FF14 Gear Allocation Bot logged in as ${this.client.user.tag}`);
        console.log(`🤖 Serving ${this.client.guilds.cache.size} guilds`);
        
        this.client.user.setActivity('FF14装備分配システム', { type: 'WATCHING' });
    }

    async onInteractionCreate(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = this.commands.get(interaction.commandName);
        if (!command) {
            await interaction.reply({
                content: '❌ 不明なコマンドです。',
                ephemeral: true
            });
            return;
        }

        try {
            console.log(`📝 Command executed: ${interaction.commandName} by ${interaction.user.tag}`);
            await command.execute(interaction);
        } catch (error) {
            console.error(`Command execution error (${interaction.commandName}):`, error);
            
            const errorReply = {
                content: '❌ コマンド実行中にエラーが発生しました。サポートにお問い合わせください。',
                ephemeral: true
            };

            if (interaction.deferred) {
                await interaction.editReply(errorReply);
            } else {
                await interaction.reply(errorReply);
            }
        }
    }

    async start() {
        try {
            console.log('🚀 Starting FF14 Gear Allocation Bot...');
            
            if (!process.env.DISCORD_TOKEN) {
                throw new Error('DISCORD_TOKEN environment variable is required');
            }
            
            if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
                throw new Error('Supabase configuration is required');
            }

            await this.client.login(process.env.DISCORD_TOKEN);
            
        } catch (error) {
            console.error('❌ Failed to start bot:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('\n🛑 Shutting down FF14 Gear Allocation Bot...');
        
        try {
            this.client.destroy();
            console.log('✅ Bot shutdown complete');
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
        }
        
        process.exit(0);
    }
}

const bot = new FF14GearAllocationBot();
bot.start();