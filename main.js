//base by Tech-God
//re-upload? recode? copy code? give credit ya :)
//YouTube: @techgod143
//Instagram: techgod143
//Telegram: t.me/techgod143
//GitHub: @techgod143
//WhatsApp: +917466008456
//want more free bot scripts? subscribe to my youtube channel: https://youtube.com/@techgod143

require("./settings");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const chalk = require("chalk");
const FileType = require("file-type");
const path = require("path");
const axios = require("axios");
const PhoneNumber = require("awesome-phonenumber");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require("./lib/exif");
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require("./lib/myfunc");
const {
  default: makeWASocket,
  delay,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  makeInMemoryStore,
  jidDecode,
  proto,
} = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const readline = require("readline");

// Ensure PHONENUMBER_MCC is defined only if not already declared
if (typeof PHONENUMBER_MCC === "undefined") {
  global.PHONENUMBER_MCC = {
    "254": "Kenya",
    "91": "India",
    "1": "USA",
    // Add other country codes as needed
  };
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const pairingCode = process.argv.includes("--pairing-code");
const useMobile = process.argv.includes("--mobile");

// Initialize in-memory store
const store = makeInMemoryStore({
  logger: pino().child({
    level: "silent",
    stream: "store",
  }),
});

async function validatePhoneNumber() {
  let phoneNumber = await question(
    chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFor example: +916909137213 : `))
  );
  phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  // Validate phone number
  while (!Object.keys(global.PHONENUMBER_MCC).some((v) => phoneNumber.startsWith(v))) {
    console.log(
      chalk.bgBlack(
        chalk.redBright("Invalid input. Start with the country code of your WhatsApp Number, Example: +916909137213")
      )
    );
    phoneNumber = await question(
      chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFor example: +916909137213 : `))
    );
    phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
  }

  return phoneNumber;
}

async function startXeonBotInc() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(`./session`);
  const msgRetryCounterCache = new NodeCache();

  const XeonBotInc = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !pairingCode,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: "fatal" }).child({ level: "fatal" })
      ),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    msgRetryCounterCache,
    defaultQueryTimeoutMs: undefined,
  });

  store.bind(XeonBotInc.ev);

  // Login using pairing code
  if (pairingCode && !state.creds.registered) {
    if (useMobile) throw new Error("Cannot use pairing code with mobile API");

    // Validate and get phone number
    const phoneNumber = await validatePhoneNumber();

    // Generate pairing code
    setTimeout(async () => {
      const code = await XeonBotInc.requestPairingCode(phoneNumber);
      const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
      console.log(
        chalk.black(chalk.bgGreen(`Your Pairing Code: `)),
        chalk.black(chalk.white(formattedCode))
      );
    }, 3000);

    rl.close(); // Close readline interface
  }

  XeonBotInc.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log(chalk.greenBright("🌿 Connected successfully!"));
    } else if (
      connection === "close" &&
      lastDisconnect &&
      lastDisconnect.error &&
      lastDisconnect.error.output.statusCode !== 401
    ) {
      console.log(chalk.redBright("Connection closed. Attempting to reconnect..."));
      startXeonBotInc();
    }
  });

  XeonBotInc.ev.on("creds.update", saveCreds);

  XeonBotInc.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek.message) return;

      mek.message =
        Object.keys(mek.message)[0] === "ephemeralMessage"
          ? mek.message.ephemeralMessage.message
          : mek.message;

      const m = smsg(XeonBotInc, mek, store);
      require("./XeonBug5")(XeonBotInc, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });
}

// Start the bot
startXeonBotInc();

// Watch for file updates
const file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update detected in ${__filename}`));
  delete require.cache[file];
  require(file);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  const e = String(err);
  if (
    e.includes("conflict") ||
    e.includes("Socket connection timeout") ||
    e.includes("not-authorized") ||
    e.includes("already-exists") ||
    e.includes("rate-overlimit") ||
    e.includes("Connection Closed") ||
    e.includes("Timed Out") ||
    e.includes("Value not found")
  )
    return;

  console.log("Caught exception:", err);
});
