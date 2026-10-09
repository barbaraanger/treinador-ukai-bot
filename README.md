# Bot de transcrição de reuniões no Discord

O bot entra no canal de voz de quem executou `/entrar`, captura cada participante separadamente, converte trechos de voz em texto e publica as falas no canal `Metricas treinos`. Cada sessão fica em uma thread cujo título recebe um resumo quando `/sair` encerra a reunião.

## Requisitos

- Node.js 22.12 ou superior.
- Ou Docker Desktop com Docker Compose.
- Aplicação e bot criados no [Discord Developer Portal](https://discord.com/developers/applications).
- Chave da API da Groq com acesso à transcrição de áudio.

O recebimento de áudio de voz depende de um recurso da biblioteca discord.js que não é uma API de recebimento oficialmente documentada pelo Discord, então pode exigir manutenção se o protocolo mudar. As transcrições são enviadas em trechos; a separação por pessoa vem do fluxo de áudio recebido, mas os horários exatos não são sincronizados.

## Configuração

1. No Developer Portal, crie uma aplicação, adicione um bot e copie o token. Mantenha o token em segredo.
2. Em OAuth2 > URL Generator, selecione os escopos `bot` e `applications.commands`. Dê ao bot permissões para ver e enviar mensagens, criar threads públicas e enviar mensagens em threads no canal `Metricas treinos`, além de conectar/falar no canal de voz. Abra o link gerado para convidá-lo ao servidor.
3. Copie `.env.example` para `.env` e preencha `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` e `GROQ_API_KEY`. `METRICS_CHANNEL_ID` define o canal de destino. Para registrar comandos só no servidor de teste, preencha também `DISCORD_GUILD_ID`.
4. No terminal, dentro desta pasta, execute:

   ```sh
   npm install
   npm run register
   npm start
   ```

### Iniciar com Docker (sem instalar Node.js)

1. Instale e abra o [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/).
2. Copie `.env.example` para `.env` e preencha as credenciais como descrito acima.
3. No PowerShell, entre na pasta do projeto:

   ```powershell
   cd "C:\Users\Barbara\Documents\Codex\2026-10-07\cr\outputs\discord-transcriber"
   ```

4. Construa a imagem e registre os comandos do bot no Discord:

   ```powershell
   docker compose build
   docker compose run --rm discord-transcriber npm run register
   ```

5. Inicie o bot:

   ```powershell
   docker compose up -d
   ```

Para ver os logs: `docker compose logs -f`. Para parar: `docker compose down`. O Docker Desktop precisa permanecer aberto enquanto o bot estiver em uso. O container reinicia automaticamente se o processo do bot cair.

Sem `DISCORD_GUILD_ID`, os comandos serão globais e podem demorar para aparecer. Para testar, prefira o registro no servidor de teste.

## Uso

Entre no canal de voz e execute `/entrar` em um canal de texto. O bot publicará a transcrição em `Metricas treinos`, em uma thread. Ao executar `/sair`, o bot resume as falas e atualiza o título da thread. Avise todos os participantes e obtenha consentimento antes de gravar/transcrever.

Use `/vocabulario adicionar` para ensinar nomes e termos. Informe a grafia correta em `termo` e, se necessário, as formas que costumam sair erradas em `variacoes`, separadas por vírgula. O bot passa os termos ao Whisper e substitui essas variações exatas na transcrição. `/vocabulario listar` mostra os termos e `/vocabulario remover` apaga um. O vocabulário fica salvo por servidor e sobrevive a reinícios do container.

O áudio é mantido em memória durante cada chamada e não é arquivado pelo bot; os arquivos WAV são construídos em memória para envio à API. A transcrição é enviada ao canal de texto e, portanto, fica sujeita às permissões e à retenção desse servidor. Não use para conversas sem consentimento ou com dados sensíveis sem avaliar as regras aplicáveis.

## Limites desta versão

- Um servidor pode ter uma sessão de transcrição ativa por vez.
- O bot acumula trechos de cada participante até 8 segundos antes de enviar à Groq; ao encerrar com `/sair`, envia também o áudio restante. Cada captura individual termina após silêncio e é limitada a 90 segundos.
- A saída é texto simples, sem resumo, timestamps, exportação ou edição.
- O custo da transcrição depende do modelo configurado e do volume de áudio. O padrão é `whisper-large-v3`, que prioriza precisão; use `whisper-large-v3-turbo` para menor custo e latência. `GROQ_TRANSCRIPTION_PROMPT` permite passar contexto curto e vocabulário do assunto (até 224 tokens).
- `GROQ_SUMMARY_MODEL` pode ser ajustado para um modelo de chat disponível na sua conta; o padrão é `openai/gpt-oss-20b`.
# treinador-ukai-bot
# treinador-ukai-bot
# treinador-ukai-bot
