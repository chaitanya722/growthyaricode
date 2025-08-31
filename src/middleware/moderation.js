const leoProfanity = require('leo-profanity');
const nsfw = require('nsfwjs');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Load NSFW model once
let nsfwModel;
(async () => {
  nsfwModel = await nsfw.load();
  console.log('NSFW Model loaded');
})();

// Text Moderation
function moderateText(text) {
  if (!text) return false;
  return leoProfanity.check(text);
}

// Image Moderation
async function moderateImage(imagePath) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const predictions = await nsfwModel.classify(canvas);
  const pornScore = predictions.find(p => p.className.toLowerCase().includes('porn'))?.probability || 0;
  return pornScore > 0.7; // flag if probability >70%
}

// Video Moderation (sample 1 frame per second)
async function moderateVideo(videoPath) {
  return new Promise((resolve, reject) => {
    let flagged = false;
    const tempDir = path.join(__dirname, 'temp_frames');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    ffmpeg(videoPath)
      .on('end', async () => {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          const flaggedImg = await moderateImage(path.join(tempDir, file));
          if (flaggedImg) {
            flagged = true;
            break;
          }
        }
        // Clean temp frames
        files.forEach(f => fs.unlinkSync(path.join(tempDir, f)));
        resolve(flagged);
      })
      .on('error', (err) => reject(err))
      .screenshots({
        count: 5, // sample 5 frames
        folder: tempDir,
        size: '320x240'
      });
  });
}

module.exports = { moderateText, moderateImage, moderateVideo };
