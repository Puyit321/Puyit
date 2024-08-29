const fs = require("fs");
const axios = require("axios");
const path = require("path");

const config = {
  name: "video",
  version: "1.0",
  role: 0,
  credits: "Kenneth Aceberos",
  description: "Downloads yt videos",
  usePrefix: true,
  aliases: ["video", "ytvideo"]
};

module.exports = {
  config,
  async run({
    api,
    event,
    args,
    prefix
  }) {
    const musicName = args.join(' ');
    if (!musicName) {
      api.sendMessage(`To get started, type ${prefix}video and the title of the song you want.`, event.threadID, event.messageID);
      return;
    }
    try {
      const f = await api.sendMessage(`Searching for "${musicName}"...`, event.threadID, event.messageID);
      const searchResults = await axios.get(`https://me0xn4hy3i.execute-api.us-east-1.amazonaws.com/staging/api/resolve/resolveYoutubeSearch?search=${encodeURIComponent(musicName)}`);
      api.unsendMessage(f.messageID);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fpath = path.join(__dirname, 'cache', `${timestamp}_vid.mp4`);
      const fpath_ = path.join(__dirname, 'cache', `${timestamp}.png`);
      if (!searchResults.data.data.length) {
        return api.sendMessage("Can't find the search.", event.threadID, event.messageID);
      } else {
        const {
          videoId,
          url,
          duration,
          imgSrc,
          title,
          views
        } = searchResults.data.data[0];
        const imgSrc_ = await axios.get(imgSrc, { responseType: "arraybuffer" });
        fs.writeFileSync(fpath_, Buffer.from(imgSrc_.data, "utf-8"));
        api.sendMessage({
          body: `🎧 Found a video!
━━━━━━━━━
Title: ${title}
━━━━━━━━━
Views: ${views}
━━━━━━━━━
Duration: ${duration}
━━━━━━━━━

⌛ Now downloading...`,
          attachment: fs.createReadStream(fpath_)
        }, event.threadID, () => fs.unlinkSync(fpath_), event.messageID);
        const stream = await axios.get((await axios.get(`https://joncll.serv00.net/videodl.php`,
        {
          params: {
            url
          }
        })).data.video, {
          responseType: "arraybuffer"
        });
          if (stream.headers['content-length'] > 1024 * 1024 * 50) {
            api.sendMessage("❌ Limit is only at 50MB. File too big, try again on another video.", event.threadID, event.messageID);
            fs.unlinkSync(fpath);
            return;
          }
          fs.writeFileSync(fpath, Buffer.from(stream.data, "utf-8"));
          api.sendMessage({
            body: `🎥 ${title}`,
            attachment: fs.createReadStream(fpath)
          }, event.threadID, () => {
            fs.unlinkSync(fpath);
          }, event.messageID);
    }
    } catch (error) {
      api.sendMessage('An error occurred while processing your request. ' + error.toString(), event.threadID, event.messageID);
    }
  }
};