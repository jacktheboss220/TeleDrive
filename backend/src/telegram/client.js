const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const env = require('../config/env');

let clientPromise;

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new TelegramClient(new StringSession(env.TG_SESSION), env.TG_API_ID, env.TG_API_HASH, {
        connectionRetries: 5,
      });
      await client.connect();
      return client;
    })();
  }
  return clientPromise;
}

module.exports = { getClient };
