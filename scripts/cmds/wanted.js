const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "wanted",
    aliases: ["wan"],
    version: "3.1",
    author: "sifu",
    countDown: 5,
    role: 0,
    shortDescription: "Create a single wanted poster",
    longDescription: "Generate a wanted poster for yourself, a tagged user, or a random member.",
    category: "fun",
    guide: "{pn} | {pn} reply | {pn} r"
  },

  onStart: async function ({ message, event, api, args }) {
    const { senderID, threadID, messageReply, mentions } = event;
    let targetID, targetName;

    if (args[0] === "r") {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const participants = threadInfo.participantIDs;
        targetID = participants[Math.floor(Math.random() * participants.length)];
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
      } catch (e) {
        targetID = senderID;
        targetName = "Criminal";
      }
    } 
    else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      targetName = mentions[targetID].replace('@', '');
    } else if (messageReply) {
      targetID = messageReply.senderID;
      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID].name;
    } 
    else {
      targetID = senderID;
      const userInfo = await api.getUserInfo(senderID);
      targetName = userInfo[senderID].name;
    }

    try {
      const waitMsg = await message.reply("💕 𝐏𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠...");
      
      // র্যান্ডম টাকা (Bounty)
      const randomMoney = Math.floor(Math.random() * (900000000 - 500000 + 1)) + 500000;
      const formattedMoney = randomMoney.toLocaleString() + "-"; // One Piece স্টাইল dash

      const imagePath = await createSingleWanted(targetID, targetName, formattedMoney);
      
      await message.reply({
        attachment: fs.createReadStream(imagePath)
      });
      
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      api.unsendMessage(waitMsg.messageID);
      
    } catch (error) {
      console.error(error);
      message.reply("😿 𝐄𝐫𝐫𝐨𝐫: 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐜𝐫𝐞𝐚𝐭𝐞 𝐩𝐨𝐬𝐭𝐞𝐫.");
    }
  }
};

async function createSingleWanted(id, name, money) {
  const fbToken = "6628568379|c1e620fa708a1d5696fb991c1bde5662"; 
  const avatarUrl = `https://graph.facebook.com/${id}/picture?width=1000&height=1000&access_token=${fbToken}`;
  const backgroundUrl = "https://i.imgur.com/wNX2LRT.jpeg"; // আপনার নতুন লিঙ্ক

  try {
    const [avatar, background, fontName, fontMoney] = await Promise.all([
      jimp.read(avatarUrl),
      jimp.read(backgroundUrl),
      jimp.loadFont(jimp.FONT_SANS_64_BLACK), 
      jimp.loadFont(jimp.FONT_SANS_32_BLACK) 
    ]);

    // ১. প্রোফাইল পিকচার রিসাইজ এবং পজিশন (নতুন ইমেজের বক্স অনুযায়ী)
    // x: 82, y: 255 পজিশনে বসানো হয়েছে এবং বক্সের মাপ অনুযায়ী রিসাইজ করা হয়েছে
    avatar.resize(350, 355); 
    background.composite(avatar, 67, 220);

    // ২. ইউজারের নাম (নামের পজিশন একটু উপরে অ্যাডজাস্ট করা হয়েছে)
    background.print(
      fontName,
      0, 785, 
      {
        text: name.toUpperCase(),
        alignmentX: jimp.HORIZONTAL_ALIGN_CENTER
      },
      770 // ইমেজ উইডথ অনুযায়ী সেন্টার
    );

    // ৩. টাকার অংক (Bounty পজিশন)
    background.print(
      fontMoney,
      130, 915, 
      {
        text: money,
        alignmentX: jimp.HORIZONTAL_ALIGN_CENTER
      },
      500 
    );

    const path = `wanted_${id}_${Date.now()}.png`;
    await background.writeAsync(path);
    return path;
  } catch (e) {
    throw new Error("Image Processing Failed");
  }
}