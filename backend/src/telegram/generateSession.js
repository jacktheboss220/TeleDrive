// One-off interactive script: run `npm run generate-session`, log in with your
// Telegram account, paste the printed string into .env as TG_SESSION.
require('dotenv').config();
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const rl = readline.createInterface({ input, output });

(async () => {
  const apiId = Number(process.env.TG_API_ID);
  const apiHash = process.env.TG_API_HASH;
  if (!apiId || !apiHash) {
    console.error('Set TG_API_ID and TG_API_HASH in .env first (get them from my.telegram.org).');
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: () => rl.question('Phone number (with country code): '),
    password: () => rl.question('2FA password (blank if none): '),
    phoneCode: () => rl.question('Code sent to Telegram: '),
    onError: (err) => console.error(err),
  });

  console.log('\nLogged in. Put this in .env as TG_SESSION:\n');
  console.log(client.session.save());
  console.log();

  await client.disconnect();
  rl.close();
  process.exit(0);
})();
