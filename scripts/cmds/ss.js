const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const CACHE_DIR = path.join(__dirname, 'cache');

module.exports = {
  config: {
    name: "screenshot",
    aliases: ["ss", "webss", "snap"],
    version: "2.5",
    author: "SiFu",
    countDown: 10,
    role: 0,
    longDescription: "Captures a website screenshot with stylish fonts and device options.",
    category: "tools",
    guide: {
      en: "{pn} <URL> [--mobile | --tablet]\nExample: {pn} google.com --mobile"
    }
  },

  onStart: async function ({ args, message, event }) {
    let userUrl = args[0];
    
    if (!userUrl) {
      return message.reply("😊 𝖯𝗅𝖾𝖺𝗌𝖾 𝗉𝗋𝗈𝗏𝗂𝖽𝖾 𝖺 𝖴𝖱𝖫.\n𝖴𝗌𝖺𝗀𝖾: `!𝗌𝖼𝗋𝖾𝖾𝗇𝗌𝗁𝗈𝗍 𝗁𝗍𝗍𝗉𝗌://𝗀𝗈𝗈𝗀𝗅𝖾.𝖼𝗈𝗆` 𝗈𝗋 𝖺𝖽𝖽 `--𝗆𝗈𝖻𝗂𝗅𝖾` 𝖿𝗈𝗋 𝗆𝗈𝖻𝗂𝗅𝖾 𝗏𝗂𝖾𝗐.");
    }

    // Auto-fix URL format
    if (!userUrl.startsWith('http')) {
      userUrl = 'https://' + userUrl;
    }

    // Determine Device Type
    let device = "desktop";
    if (args.includes("--mobile")) device = "mobile";
    if (args.includes("--tablet")) device = "tablet";

    // Ensure cache directory exists
    await fs.ensureDir(CACHE_DIR);

    // Stylish Status Message
    const msgInfo = await message.reply(`⏳ 𝖯𝗋𝗈𝖼𝖾𝗌𝗌𝗂𝗇𝗀: 𝖢𝖺𝗉𝗍𝗎𝗋𝗂𝗇𝗀 𝗒𝗈𝗎𝗋 𝗌𝖼𝗋𝖾𝖾𝗇𝗌𝗁𝗈𝗍...\n🌐 𝖴𝖱𝖫: ${userUrl}\n📱 𝖬𝗈𝖽𝖾: ${device.toUpperCase()}`);
    message.reaction("📸", event.messageID);

    const tempFilePath = path.join(CACHE_DIR, `ss_${Date.now()}.png`);

    try {
      const API_ENDPOINT = `https://dev.oculux.xyz/api/screenshot`;
      
      const response = await axios({
        method: 'get',
        url: API_ENDPOINT,
        params: {
          url: userUrl,
          device: device,
          fullPage: true
        },
        responseType: 'stream',
        timeout: 60000
      });

      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Stylish Success Message
      await message.reply({
        body: `🍓 𝐒𝐜𝐫𝐞𝐞𝐧𝐬𝐡𝐨𝐭 𝐂𝐚𝐩𝐭𝐮𝐫𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲!\n\n━━━━━━━━━━━━━━━━━━\n🌐 𝗨𝗥𝗟: ${userUrl}\n📱 𝗗𝗲𝘃𝗶𝗰𝗲: ${device.toUpperCase()}\n━━━━━━━━━━━━━━━━━━`,
        attachment: fs.createReadStream(tempFilePath)
      });

      message.reaction("✅", event.messageID);

    } catch (error) {
      console.error(error);
      message.reaction("❌", event.messageID);
      
      const status = error.response?.status;
      let errorText = "𝖢𝗈𝗎𝗅𝖽 𝗇𝗈𝗍 𝖼𝖺𝗉𝗍𝗎𝗋𝖾 𝗌𝖼𝗋𝖾𝖾𝗇𝗌𝗁𝗈𝗍.";
      
      if (status === 404) errorText = "𝖳𝗁𝖾 𝗐𝖾𝖻𝗌𝗂𝗍𝖾 𝗐𝖺𝗌 𝗇𝗈𝗍 𝖿𝗈𝗎𝗇𝖽.";
      if (status === 403) errorText = "𝖠𝖼𝖼𝖾𝗌𝗌 𝖽𝖾𝗇𝗂𝖾𝖽 𝖻𝗒 𝗍𝗁𝖾 𝗌𝖾𝗋𝗏𝖾𝗋.";
      
      message.reply(`😿 𝐄𝐫𝐫𝐨𝐫: ${errorText}`);
    } finally {
      if (await fs.pathExists(tempFilePath)) {
        await fs.unlink(tempFilePath);
      }
    }
  }
};