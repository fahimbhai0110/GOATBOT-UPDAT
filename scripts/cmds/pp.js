const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pp",
    aliases: ["profilepic"],
    version: "1.1",
    author: "SiFu ⚡",
    countDown: 5,
    role: 0,
    description: {
      en: "Get profile picture"
    },
    category: "utility"
  },

  langs: {
    en: {
      error: "😿 Could not fetch profile picture",
      invalidUID: "! Invalid UID"
    }
  },

  onStart: async function ({ api, message, args, event, getLang, usersData }) {
    try {
      let uid = event.senderID;

      // reply
      if (event.messageReply) {
        uid = event.messageReply.senderID;
      }
      // mention
      else if (Object.keys(event.mentions || {}).length > 0) {
        uid = Object.keys(event.mentions)[0];
      }
      // uid or link
      else if (args[0]) {
        if (!isNaN(args[0])) {
          uid = args[0];
        } else if (args[0].includes("facebook.com")) {
          const match = args[0].match(/profile\.php\?id=(\d+)|facebook\.com\/(\d+)/);
          if (match) {
            uid = match[1] || match[2];
          } else {
            const vanity = args[0].match(/facebook\.com\/([^/?]+)/);
            if (vanity) {
              const res = await axios.get(`https://www.facebook.com/${vanity[1]}`);
              const uidMatch = res.data.match(/"userID":"(\d+)"/);
              if (uidMatch) uid = uidMatch[1];
            }
          }
        }
      }

      if (!uid || isNaN(uid)) {
        return message.reply(getLang("invalidUID"));
      }

      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const cachePath = path.join(__dirname, "cache", `pp_${uid}.jpg`);
      await fs.ensureDir(path.dirname(cachePath));

      const img = await axios.get(avatarURL, { responseType: "arraybuffer" });
      await fs.writeFile(cachePath, Buffer.from(img.data));

      await message.reply({
        attachment: fs.createReadStream(cachePath)
      });

      await fs.remove(cachePath);
    } catch (err) {
      console.error(err);
      return message.reply(getLang("error"));
    }
  }
};