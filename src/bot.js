import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prism from 'prism-media';
import OpenAI, { toFile } from 'openai';
import wavefile from 'wavefile';
const { WaveFile } = wavefile;
import {
  Client,
  Events,
  GatewayIntentBits
} from 'discord.js';
import {
  AudioPlayerStatus,
  EndBehaviorType,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus
} from '@discordjs/voice';

const { DISCORD_TOKEN, OPENAI_API_KEY } = process.env;
if (!DISCORD_TOKEN || !OPENAI_API_KEY) {
  throw new Error('Defina DISCORD_TOKEN e OPENAI_API_KEY no arquivo .env.');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const tempDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.tmp');
const sessions = new Map();

client.once(Events.ClientReady, readyClient => {
  console.log(`Bot conectado como ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'entrar') {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      await interaction.reply({ content: 'Entre em um canal de voz primeiro.', ephemeral: true });
      return;
    }
    if (sessions.has(interaction.guildId)) {
      await interaction.reply({ content: 'Já estou transcrevendo neste servidor. Use /sair para encerrar.', ephemeral: true });
      return;
    }

    await interaction.deferReply();
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false
    });
    const session = { connection, textChannel: interaction.channel, closing: false };
    sessions.set(interaction.guildId, session);

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      if (!session.closing) finishSession(interaction.guildId, 'A conexão de voz foi interrompida.');
    });
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
      await interaction.editReply('Entrei no canal. **A transcrição começou.** Avise os participantes e obtenha o consentimento de todos antes de continuar. Use /sair para encerrar.');
      watchSpeakers(connection, session);
    } catch (error) {
      sessions.delete(interaction.guildId);
      connection.destroy();
      await interaction.editReply(`Não consegui conectar ao canal de voz: ${error.message}`);
    }
  }

  if (interaction.commandName === 'sair') {
    const session = sessions.get(interaction.guildId);
    if (!session) {
      await interaction.reply({ content: 'Não há transcrição ativa neste servidor.', ephemeral: true });
      return;
    }
    finishSession(interaction.guildId, 'Transcrição encerrada pelo comando /sair.');
    await interaction.reply('Transcrição encerrada. Os trechos de áudio em processamento serão finalizados.');
  }
});

function watchSpeakers(connection, session) {
  const receiver = connection.receiver;
  receiver.speaking.on('start', userId => {
    const member = connection.joinConfig.guildId
      ? client.guilds.cache.get(connection.joinConfig.guildId)?.members.cache.get(userId)
      : null;
    if (member?.user.bot || session.closing) return;

    const audio = receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: 900 }
    });
    const decoder = new prism.opus.Decoder({ rate: 48_000, channels: 2, frameSize: 960 });
    const chunks = [];
    let bytes = 0;
    audio.pipe(decoder);
    decoder.on('data', chunk => {
      bytes += chunk.length;
      // Evita consumir memória sem limite se uma captura não encerrar corretamente.
      if (bytes <= 48_000 * 2 * 2 * 90) chunks.push(chunk);
      else audio.destroy(new Error('Trecho excedeu 90 segundos.'));
    });
    decoder.on('error', error => console.error('Falha ao decodificar áudio:', error.message));
    decoder.on('end', () => {
      if (chunks.length && !session.closing) {
        void transcribeChunk(Buffer.concat(chunks), userId, session);
      }
    });
  });
}

async function transcribeChunk(pcm, userId, session) {
  const filePath = path.join(tempDir, `${randomUUID()}.wav`);
  try {
    await mkdir(tempDir, { recursive: true });
    const wav = new WaveFile();
    wav.fromScratch(2, 48_000, '16', pcm);
    const data = Buffer.from(wav.toBuffer());
    const audioFile = await toFile(data, 'reuniao.wav', { type: 'audio/wav' });
    const result = await openai.audio.transcriptions.create({
      file: audioFile,
      model: process.env.TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe',
      language: 'pt'
    });
    const text = result.text?.trim();
    if (!text || !session.textChannel) return;
    const guild = client.guilds.cache.get(session.connection.joinConfig.guildId);
    const username = guild?.members.cache.get(userId)?.displayName || 'Participante';
    await session.textChannel.send(`**${escapeMarkdown(username)}:** ${text}`);
  } catch (error) {
    console.error('Falha na transcrição:', error.message);
    if (session.textChannel) await session.textChannel.send('Não consegui transcrever um trecho de áudio.').catch(() => {});
  } finally {
    await unlink(filePath).catch(() => {});
  }
}

function finishSession(guildId, message) {
  const session = sessions.get(guildId);
  if (!session) return;
  session.closing = true;
  sessions.delete(guildId);
  session.connection.destroy();
  session.textChannel?.send(message).catch(() => {});
}

function escapeMarkdown(value) {
  return value.replace(/[\\_*~`|>]/g, '\\$&');
}

client.login(DISCORD_TOKEN);
