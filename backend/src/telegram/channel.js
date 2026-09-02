const env = require('../config/env');

async function getChannel(client) {
  return client.getEntity(env.TG_CHANNEL_ID);
}

async function getMessage(client, channel, messageId) {
  const [message] = await client.getMessages(channel, { ids: [messageId] });
  return message;
}

module.exports = { getChannel, getMessage };
