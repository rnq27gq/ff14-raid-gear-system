import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { ShareCommand } from './commands/share.js';

config();

async function deployCommands() {
    try {
        console.log('🚀 Started refreshing application (/) commands.');

        const commands = [];

        const shareCommand = new ShareCommand();
        commands.push(shareCommand.data.toJSON());

        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        if (process.argv[2] === 'global') {
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands },
            );
            console.log('✅ Successfully reloaded global application (/) commands.');
        } else {
            const guildId = process.argv[2];
            if (!guildId) {
                console.error('❌ Please specify a guild ID or "global"');
                console.log('Usage: node deploy-commands.js <guild-id|global>');
                process.exit(1);
            }

            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded application (/) commands for guild ${guildId}.`);
        }

    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        process.exit(1);
    }
}

deployCommands();