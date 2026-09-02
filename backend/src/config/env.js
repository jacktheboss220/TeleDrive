require('dotenv').config();

const required = [
  'TG_API_ID',
  'TG_API_HASH',
  'TG_CHANNEL_ID',
  'MONGO_URI',
  'JWT_SECRET',
  'AUTH_USERNAME',
  'AUTH_PASSWORD',
];
for (const key of required) {
  if (!process.env[key]) console.warn(`[env] Missing ${key} - set it in .env`);
}

module.exports = {
  TG_API_ID: Number(process.env.TG_API_ID),
  TG_API_HASH: process.env.TG_API_HASH,
  TG_SESSION: process.env.TG_SESSION || '',
  TG_CHANNEL_ID: process.env.TG_CHANNEL_ID,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/teledrive',
  JWT_SECRET: process.env.JWT_SECRET,
  AUTH_USERNAME: process.env.AUTH_USERNAME,
  AUTH_PASSWORD: process.env.AUTH_PASSWORD,
  PORT: Number(process.env.PORT) || 3000,
};
