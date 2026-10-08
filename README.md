# Bot de transcrição de reuniões no Discord

O bot entra no canal de voz de quem executou `/entrar`, captura cada participante separadamente, converte pequenos trechos de voz em texto e publica as falas no canal de texto onde o comando foi usado. `/sair` encerra a sessão.

## Requisitos

- Node.js 22.12 ou superior.
- Ou Docker Desktop com Docker Compose.
- Aplicação e bot criados no [Discord Developer Portal](https://discord.com/developers/applications).
- Chave da API da OpenAI com acesso ao endpoint de transcrição.

O recebimento de áudio de voz depende de um recurso da biblioteca discord.js que não é uma API de recebimento oficialmente documentada pelo Discord, então pode exigir manutenção se o protocolo mudar. As transcrições são enviadas em trechos; a separação por pessoa vem do fluxo de áudio recebido, mas os horários exatos não são sincronizados.

## Configuração

1. No Developer Portal, crie uma aplicação, adicione um bot e copie o token. Mantenha o token em segredo.
2. Em OAuth2 > URL Generator, selecione os escopos `bot` e `applications.commands`. Dê ao bot permissões para ver e enviar mensagens no canal de texto e conectar/falar no canal de voz. Abra o link gerado para convidá-lo ao servidor.
3. Copie `.env.example` para `.env` e preencha `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` e `OPENAI_API_KEY`. Para registrar comandos só no servidor de teste, preencha também `DISCORD_GUILD_ID`.
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

Entre no canal de voz e execute `/entrar` em um canal de texto. O bot avisará que a transcrição começou. Avise todos os participantes e obtenha consentimento antes de gravar/transcrever. Execute `/sair` para terminar.

O áudio é mantido em memória durante cada chamada e não é arquivado pelo bot; os arquivos WAV são construídos em memória para envio à API e o diretório temporário é limpo quando a chamada termina. A transcrição é enviada ao canal de texto e, portanto, fica sujeita às permissões e à retenção desse servidor. Não use para conversas sem consentimento ou com dados sensíveis sem avaliar as regras aplicáveis.

## Limites desta versão

- Um servidor pode ter uma sessão de transcrição ativa por vez.
- Cada trecho por participante é limitado a 90 segundos; a biblioteca encerra o trecho após silêncio.
- A saída é texto simples, sem resumo, timestamps, exportação ou edição.
- O custo da transcrição depende do modelo configurado e do volume de áudio. `TRANSCRIPTION_MODEL` pode ser ajustado para um modelo de transcrição disponível na sua conta.
# treinador-ukai-bot
# treinador-ukai-bot
# treinador-ukai-bot
