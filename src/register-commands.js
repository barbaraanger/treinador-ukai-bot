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
    .setDescription('Encerra a transcrição e desconecta do canal de voz.'),
  new SlashCommandBuilder()
    .setName('vocabulario')
    .setDescription('Ensina ao bot nomes e termos para melhorar a transcrição.')
    .addSubcommand(subcommand => subcommand
      .setName('adicionar')
      .setDescription('Adiciona um termo e formas que a transcrição costuma errar.')
      .addStringOption(option => option
        .setName('termo')
        .setDescription('A forma correta do termo')
        .setRequired(true)
        .setMaxLength(100))
      .addStringOption(option => option
        .setName('variacoes')
        .setDescription('Formas erradas separadas por vírgula, para corrigir automaticamente')
        .setRequired(false)
        .setMaxLength(100)))
    .addSubcommand(subcommand => subcommand
      .setName('remover')
      .setDescription('Remove um termo do vocabulário.')
      .addStringOption(option => option
        .setName('termo')
        .setDescription('A forma correta do termo')
        .setRequired(true)
        .setMaxLength(100)))
    .addSubcommand(subcommand => subcommand
      .setName('listar')
      .setDescription('Mostra o vocabulário salvo para este servidor.'))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
const route = DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID)
  : Routes.applicationCommands(DISCORD_CLIENT_ID);

await rest.put(route, { body: commands });
console.log(DISCORD_GUILD_ID ? 'Comandos registrados no servidor.' : 'Comandos globais registrados.');
