//base by Tech-God
//re-upload? recode? copy code? give credit ya :)
//YouTube: @techgod143
//Instagram: techgod143
//Telegram: t.me/techgod143
//GitHub: @techgod143
//WhatsApp: +254714091722
//want more free bot scripts? subscribe to my youtube channel: https://youtube.com/@techgod143

require('./settings');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const FileType = require('file-type');
const path = require('path');
const axios = require('axios');
const PhoneNumber = require('awesome-phonenumber');
const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
} = require('./lib/exif');
const {
  smsg,
  isUrl,
  generateMessageTag,
  getBuffer,
  getSizeMedia,
  fetch,
  await,
  sleep,
  reSize,
} = require('./lib/myfunc');
const {
  default: makeWASocket,
  delay,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidDecode,
  makeInMemoryStore,
} = require('@whiskeysockets/baileys');
const readline = require('readline');
const NodeCache = require('node-cache');

// Define global PHONENUMBER_MCC if not already defined
if (typeof PHONENUMBER_MCC === 'undefined') {
  global.PHONENUMBER_MCC = {
    '254': 'Kenya',
    '91': 'India',
    '1': 'USA',
    // Add more country codes as needed
  };
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const store = makeInMemoryStore({
  logger: pino().child({
    level: 'silent',
    stream: 'store',
  }),
});

async function startXeonBotInc() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const XeonBotInc = makeWASocket({
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys),
    },
  });

  store.bind(XeonBotInc.ev);

  // Login using pairing code
  if (!state.creds.registered) {
    console.log(chalk.green('Pairing code required!'));

    let phoneNumber = await question(
      chalk.greenBright('Please type your WhatsApp number with country code (e.g., +254714091722): ')
    );
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Validate the phone number
    while (!Object.keys(global.PHONENUMBER_MCC).some((v) => phoneNumber.startsWith(v))) {
      console.log(chalk.redBright('Invalid phone number. Please include the country code (e.g., +254714091722).'));
      phoneNumber = await question(
        chalk.greenBright('Re-enter your WhatsApp number with country code: ')
      );
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    }

    // Request pairing code
    const code = await XeonBotInc.requestPairingCode(phoneNumber);
    console.log(chalk.green(`Your Pairing Code: ${code}`));

    rl.close(); // Close readline interface
  }

  XeonBotInc.ev.on('connection.update', (update) => {
    const { connection } = update;
    if (connection === 'open') {
      console.log(chalk.greenBright('Connection established!'));
    }
  });

  XeonBotInc.ev.on('creds.update', saveCreds);

  XeonBotInc.ev.on('messages.upsert', (chatUpdate) => {
    console.log(chatUpdate); // You can add your message handling logic here
  });
}

startXeonBotInc().catch((err) => {
  console.error('Error starting the bot:', err);
  rl.close();
});

// Watch for file updates
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(chalk.redBright(`Reloading script: ${__filename}`));
  delete require.cache[require.resolve(__filename)];
  require(__filename);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Caught exception:', err);
});
