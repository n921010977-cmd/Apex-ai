#!/usr/bin/env node
/* Renders the HTML stage frame by frame and pipes JPEGs straight into
 * ffmpeg (no frame files on disk).
 *
 *   node render.js                 render the whole video
 *   node render.js --preview 1,5   dump PNG stills at those times instead
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const HERE = __dirname;
const OUT = path.join(HERE, 'out');
const { chromium } = require('playwright');

const FPS = 30;

async function main() {
  const outArg = process.argv.indexOf('--out');
  const outDir = outArg > -1 ? path.resolve(process.argv[outArg + 1]) : OUT;
  const timeline = JSON.parse(fs.readFileSync(path.join(outDir, 'timeline.json'), 'utf8'));
  const previewArg = process.argv.indexOf('--preview');
  const previewTimes = previewArg > -1
    ? process.argv[previewArg + 1].split(',').map(Number) : null;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  await page.goto('file://' + path.join(HERE, 'template.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(tl => window.initTimeline(tl), timeline);

  if (previewTimes) {
    for (const t of previewTimes) {
      await page.evaluate(tt => window.seek(tt), t);
      const file = path.join(outDir, `preview_${t.toFixed(2)}.png`);
      await page.screenshot({ path: file });
      console.log('wrote', file);
    }
    await browser.close();
    return;
  }

  const totalFrames = Math.ceil(timeline.total * FPS);
  const ff = spawn('ffmpeg', [
    '-y', '-v', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
    '-pix_fmt', 'yuv420p',
    path.join(outDir, 'video_noaudio.mp4'),
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let f = 0; f < totalFrames; f++) {
    const t = f / FPS;
    await page.evaluate(tt => window.seek(tt), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) {
      await new Promise(res => ff.stdin.once('drain', res));
    }
    if (f % 150 === 0) {
      const fps = f / ((Date.now() - t0) / 1000) || 0;
      console.log(`frame ${f}/${totalFrames} (${fps.toFixed(1)} fps)`);
    }
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  await browser.close();
  console.log(`rendered ${totalFrames} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
