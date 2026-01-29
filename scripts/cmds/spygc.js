module.exports = {
  config: {
    name: "spygc",
    version: "2.0",
    author: "SiFu",
    role: 2,
    shortDescription: "Spy group chats bot is in",
    category: "info",
    guide: {
      en: "{pn}spygc → reply with number"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const threads = await api.getThreadList(20, null, ["INBOX"]);
      const groups = threads.filter(t => t.threadName);

      if (!groups.length) {
        return api.sendMessage("❌ No group chats found.", event.threadID);
      }

      let list = groups.map(
        (g, i) =>
          `┃ ${i + 1}. ${g.threadName}\n┃    🆔 ${g.threadID}`
      ).join("\n");

      const msg =
`┏━━━━━━━━━━━━━━━━━
┃ 🕵️‍♂️ 𝗚𝗥𝗢𝗨𝗣 𝗦𝗣𝗬 𝗟𝗜𝗦𝗧
┣━━━━━━━━━━━━━━━━━
${list}
┗━━━━━━━━━━━━━━━━━
✉️ Reply with group number`;

      const sent = await api.sendMessage(msg, event.threadID);

      global.GoatBot.onReply.set(sent.messageID, {
        commandName: "spygc",
        author: event.senderID,
        groupList: groups
      });
    } catch (err) {
      console.error("spygc error:", err);
      api.sendMessage("❌ Failed to fetch group list.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    if (event.senderID !== Reply.author) return;

    const index = parseInt(args[0]);
    if (isNaN(index) || index < 1 || index > Reply.groupList.length) {
      return api.sendMessage(
        "❌ Invalid number. Reply with a valid group index.",
        event.threadID,
        event.messageID
      );
    }

    try {
      const group = Reply.groupList[index - 1];
      const info = await api.getThreadInfo(group.threadID);

      // Admin names
      let adminNames = [];
      for (const a of info.adminIDs) {
        const u = await api.getUserInfo(a.id);
        adminNames.push(u[a.id].name);
      }

      // Member names (limit for safety)
      const members = [];
      for (const id of info.participantIDs.slice(0, 40)) {
        const u = await api.getUserInfo(id);
        members.push(u[id].name);
      }

      const approval =
        info.approvalMode === true ? "ON" :
        info.approvalMode === false ? "OFF" : "Unknown";

      const result =
`┏━━━━━━━━━━━━━━━━
┃ 🕵️‍♂️ 𝗚𝗥𝗢𝗨𝗣 𝗗𝗘𝗧𝗔𝗜𝗟𝗦
┣━━━━━━━━━━━━━━━━
┃ 👥 Name      : ${info.threadName}
┃ 🆔 TID       : ${info.threadID}
┃ 🔐 Approval  : ${approval}
┃ 😄 Emoji     : ${info.emoji || "None"}
┃ 👑 Admins    : ${adminNames.join(" • ") || "None"}
┃ 💬 Messages  : ${info.messageCount}
┃ 👤 Members   : ${info.participantIDs.length}
┣━━━━━━━━━━━━━━━━━━
┃ 📋 Member List (partial)
┃ ${members.join(" │ ")}
┗━━━━━━━━━━━━━━━━━━━━`;

      api.sendMessage(result, event.threadID, event.messageID);
    } catch (err) {
      console.error("spygc reply error:", err);
      api.sendMessage("❌ Failed to load group info.", event.threadID, event.messageID);
    } finally {
      global.GoatBot.onReply.delete(event.messageID);
    }
  }
};