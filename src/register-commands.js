import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error('Defina DISCORD_TOKEN e DISCORD_CLIENT_ID no arquivo .env.');
}

const commands = [
  new SlashCommandBuilder()
    .setName('entrar')
    .setDescription('Entra no seu canal de voz e inicia a transcrição da reunião.'),
  new SlashCommandBuilder()
    .setName('sair')
    .setDescription('Encerra a transcrição e desconecta do canal de voz.')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
const route = DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID)
  : Routes.applicationCommands(DISCORD_CLIENT_ID);

await rest.put(route, { body: commands });
console.log(DISCORD_GUILD_ID ? 'Comandos registrados no servidor.' : 'Comandos globais registrados.');
