const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");

module.exports = {
  config: {
    name: "upt",
    aliases: ["up", "uptime"],
    version: "4.5",
    author: "SiFu",
    role: 0,
    countDown: 5,
    category: "system",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const uptimeBot = process.uptime();
    const formatTime = sec => {
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${d}d ${h}h ${m}m ${s}s`;
    };

    // System Stats
    const totalMem = os.totalmem() / 1024 / 1024 / 1024; // GB
    const freeMem = os.freemem() / 1024 / 1024 / 1024; // GB
    const usedMem = totalMem - freeMem;
    const ramPercent = (usedMem / totalMem) * 100;

    const cpuModel = os.cpus()[0].model.split('@')[0].trim();
    const cores = os.cpus().length;
    const ping = Date.now() - event.timestamp;

    // Canvas Setup
    const width = 850;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Dark Cyberpunk Background
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Decorative Grid lines
    ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for(let i=0; i<width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
    for(let i=0; i<height; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }

    // 3. Main Glass Card
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = "rgba(0, 213, 255, 0.3)";
    ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
    const r = 20;
    ctx.beginPath();
    ctx.moveTo(40 + r, 40);
    ctx.lineTo(width - 40 - r, 40);
    ctx.quadraticCurveTo(width - 40, 40, width - 40, 40 + r);
    ctx.lineTo(width - 40, height - 40 - r);
    ctx.quadraticCurveTo(width - 40, height - 40, width - 40 - r, height - 40);
    ctx.lineTo(40 + r, height - 40);
    ctx.quadraticCurveTo(40, height - 40, 40, height - 40 - r);
    ctx.lineTo(40, 40 + r);
    ctx.quadraticCurveTo(40, 40, 40 + r, 40);
    ctx.fill();
    ctx.restore();

    // 4. Header Section
    ctx.fillStyle = "#00f2ff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("SYSTEM CORE ANALYTICS", 70, 90);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "14px sans-serif";
    ctx.fillText("Real-time monitoring and server status", 70, 115);

    // 5. Info Grid
    const stats = [
      { label: "BOT UPTIME", val: formatTime(uptimeBot), color: "#22c55e" },
      { label: "PING LATENCY", val: `${ping}ms`, color: "#eab308" },
      { label: "PROCESSOR", val: `${cpuModel}`, color: "#ec4899" },
      { label: "PLATFORM", val: `${os.platform()} (${os.arch()})`, color: "#3b82f6" }
    ];

    stats.forEach((s, i) => {
      const x = 70;
      const y = 170 + (i * 75);
      
      ctx.fillStyle = s.color;
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(s.label, x, y);

      ctx.fillStyle = "#ffffff";
      ctx.font = "600 18px sans-serif";
      ctx.fillText(s.val, x, y + 25);
    });

    // 6. RAM Progress Visualization
    const barX = 450;
    const barY = 170;
    const barW = 320;
    const barH = 25;

    // RAM Label
    ctx.fillStyle = "#00f2ff";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`RAM USAGE: ${ramPercent.toFixed(1)}%`, barX, barY - 15);

    // RAM Background bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(barX, barY, barW, barH);

    // RAM Progress bar
    const ramGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    ramGrad.addColorStop(0, "#00f2ff");
    ramGrad.addColorStop(1, "#3b82f6");
    ctx.fillStyle = ramGrad;
    ctx.fillRect(barX, barY, barW * (ramPercent / 100), barH);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${usedMem.toFixed(2)} GB / ${totalMem.toFixed(2)} GB`, barX, barY + 45);

    // 7. Circular Ping/Health Gauge (Right Side)
    const centerX = 610;
    const centerY = 370;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * 0.85)); // 85% Health
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("STABLE", centerX, centerY + 8);

    // Final Footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "italic 14px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Hostname: ${os.hostname()}`, width - 70, height - 60);

    // Save and Send
    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
    const filePath = path.join(cachePath, `upt_${Date.now()}.png`);
    
    await fs.writeFile(filePath, canvas.toBuffer());

    return api.sendMessage(
      { body: "⚡ ULTIMATE INFORMATION ⚡", attachment: fs.createReadStream(filePath) },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );
  }
}; hm