// 랜딩 페이지용 데모 녹화: 위젯에 가상 플레이 입력을 넣고 30fps 프레임을 PNG로 남긴다 (ffmpeg로 mp4 변환)
// 숫자는 앱의 실제 통계 모듈(sessionManager)로 계산한다.
// 사용 (앱 저장소 iidxwidget-app 폴더에서): node_modules/electron/dist/electron.exe <이 파일> <scenario>
//   scenario: play | combo | dp | themes2 (그 밖에 gauge | ln | themes는 예전 장면)
//   환경 변수 IIDXWIDGET_APP: 앱 폴더 (기본: 이 저장소 옆의 IIDXwidget/iidxwidget-app)
//   환경 변수 IIDXWIDGET_THEME_DIR: themes2의 스크래치 이미지가 있는 폴더 (기본: 이 저장소의 상위 폴더, 작업 공간)
//   결과: tools/out/<scenario>/0000.png ... → ffmpeg로 mp4 변환:
//   ffmpeg -framerate 30 -i out/combo/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 24 -preset slow -movflags +faststart ../assets/combo.mp4
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const APP = process.env.IIDXWIDGET_APP || path.resolve(__dirname, '../../IIDXwidget/iidxwidget-app');
const OUT_ROOT = path.join(__dirname, 'out');
const SCENARIO = process.argv[process.argv.length - 1];
const OUT = `${OUT_ROOT}/${SCENARIO}`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const { translations } = require(APP + '/localization/translations');
const { DEFAULT_SETTINGS } = require(APP + '/settingsStore');
const { createSessionManager } = require(APP + '/sessionManager');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 재현 가능한 난수
let seed = 20260927;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
settings.seenUpdateGuide = '3.0.0';
const DP = SCENARIO === 'dp';
if (DP) settings.widget.buttonLayout = 'DP';
if (SCENARIO === 'gauge') settings.widget.kpsGauge.preset = 'iidx';

let win = null;
const session = createSessionManager({
  config: { maLengths: { global: 2000, perButton: 300 }, cnThresholdMs: 200 },
  onChange: stats => win && !win.isDestroyed() && win.webContents.send('stats', stats)
});
ipcMain.handle('get-translations', () => translations);
ipcMain.handle('get-language', () => 'ko');
ipcMain.handle('load-settings', () => settings);
ipcMain.handle('get-stats', () => session.snapshot());
ipcMain.handle('get-app-version', () => '3.0.0');

function send(events) {
  const stamped = events.map(e => ({ ...e, timestamp: Date.now() }));
  session.handleEvents(stamped);
  win.webContents.send('controller-data', stamped);
}

// ─── 가상 플레이 ─────────────────────────────
const disc = { 1: 128, 2: 128 };
function scratch(side, dir) {
  disc[side] = (disc[side] + dir * 3 + 256) % 256;
  send([{ type: 'axis', axis: 'X', discRaw: disc[side], side }]);
}
function tap(side, button, holdMs) {
  send([{ type: 'button', button: `button ${button}`, pressed: true, side }]);
  setTimeout(() => send([{ type: 'button', button: `button ${button}`, pressed: false, side }]), holdMs);
}
// kps 정도의 속도로 durationMs 동안 친다
async function play({ side = 1, kps, durationMs, longNotes = false, scratchEvery = 1800 }) {
  const end = Date.now() + durationMs;
  let nextScratch = Date.now() + 400;
  let scratchDir = 1;
  while (Date.now() < end) {
    const now = Date.now();
    if (now >= nextScratch) {
      // 스크래치 한 번: 250ms 동안 한 방향으로 돌림
      scratchDir = -scratchDir;
      const until = now + 260;
      const spin = setInterval(() => { if (Date.now() > until) clearInterval(spin); else scratch(side, scratchDir); }, 25);
      nextScratch = now + scratchEvery * (0.7 + rand() * 0.6);
    }
    const chord = rand() < 0.25 ? 2 : 1;
    const used = new Set();
    for (let i = 0; i < chord; i++) {
      let b; do { b = 1 + Math.floor(rand() * 7); } while (used.has(b));
      used.add(b);
      const hold = longNotes && rand() < 0.12 ? 350 + rand() * 300 : 45 + rand() * 40;
      tap(side, b, hold);
    }
    await sleep(chord * 1000 / kps * (0.7 + rand() * 0.6));
  }
}

// ─── 녹화 ─────────────────────────────────
// 위젯 영역만 잘라서 메모리에 모았다가 끝나고 한꺼번에 쓴다 (녹화 중 파일 쓰기로 프레임이 밀리지 않게)
async function record(durationMs, action) {
  const crop = DP ? { x: 140, y: 130, width: 1040, height: 380 } : { x: 140, y: 130, width: 520, height: 380 };
  let last = null;
  const frames = [];
  win.webContents.on('paint', (event, dirty, image) => { last = image; });
  win.webContents.setFrameRate(60);
  const start = Date.now();
  const timer = setInterval(() => {
    if (!last) return;
    // 늦게 불린 만큼 같은 프레임을 채워 30fps를 맞춘다
    const due = Math.floor((Date.now() - start) / (1000 / 30));
    const image = last.crop(crop);
    while (frames.length <= due) frames.push(image);
  }, 1000 / 60);
  await action();
  await sleep(durationMs);
  clearInterval(timer);
  frames.forEach((image, n) => fs.writeFileSync(`${OUT}/${String(n).padStart(4, '0')}.png`, image.toPNG()));
  return frames.length;
}

const gifData = file => `data:image/${file.endsWith('.png') ? 'png' : 'gif'};base64,` + fs.readFileSync(file).toString('base64');
const DEPLOY = process.env.IIDXWIDGET_THEME_DIR || path.resolve(__dirname, '../..');
const lazy = fn => { let v; return () => (v ??= fn()); };
const FERN = lazy(() => gifData(DEPLOY + '/pouting-frieren.gif'));
const TOWER = lazy(() => gifData(DEPLOY + '/989db557c9bf931a105d804d3530b732b9e9f98ef1c3bc59982e9adaa6c5c17b4227d5a02f7da92d949594013b140b7401333d07b1c792e9abc257c9a0488c921278df00c8a06fbafd73dcb053e32c92976fe4bd27348edfa1cf8013e66fbf13.gif'));
// 이미지에 어울리는 색: 페른(보라 머리) → 보라, 게임 건물(초록 바닥·금색·하늘색 빛) → 초록·금색
const IMAGE_THEMES = [
  { image: FERN, colors: { containerBackground: '#170f22', background: '#241634', accent: '#5e4280', fontColor: '#f1e6ff', activeColor: '#c58bff', lnColor: '#ffc9a8' } },
  { image: TOWER, colors: { containerBackground: '#0a1710', background: '#10261a', accent: '#2d5e41', fontColor: '#eef6d8', activeColor: '#ffcf4a', lnColor: '#5fe3ff' } },
  // 사진(검은 모자, 베이지 벽) → 어두운 갈색·베이지
  { image: lazy(() => gifData(DEPLOY + '/엄준식.png')), colors: { containerBackground: '#141210', background: '#221e1a', accent: '#4f4740', fontColor: '#f2eadc', activeColor: '#e9dcc4', lnColor: '#d7a45f' } }
];

const THEMES = [
  { containerBackground: '#000000', background: '#000000', accent: '#444444', fontColor: '#cccccc', activeColor: '#ffffff', lnColor: '#ffb74d' },
  { containerBackground: '#1b1030', background: '#2b1850', accent: '#5a3d8a', fontColor: '#f0e6ff', activeColor: '#ff66cc', lnColor: '#66ffcc' },
  { containerBackground: '#0c1a24', background: '#10283a', accent: '#1f4c66', fontColor: '#d6f3ff', activeColor: '#4fe0ff', lnColor: '#ffd166' },
  { containerBackground: '#1a0d0d', background: '#2a1212', accent: '#5c2323', fontColor: '#ffe3d6', activeColor: '#ff7043', lnColor: '#ffd54f' }
];

app.whenReady().then(async () => {
  const width = DP ? 1320 : 800;
  win = new BrowserWindow({ show: false, width, height: 600, useContentSize: true, transparent: false, backgroundColor: '#0e0f13',
    webPreferences: { preload: path.join(APP, 'preload.js'), contextIsolation: true, offscreen: true } });
  await win.loadFile(path.join(APP, 'renderer/widget/index.html'));
  // 녹화 배경: 방송 화면 느낌의 어두운 배경 (위젯 영역 밖)
  await win.webContents.insertCSS('html, body { background: #0e0f13 !important; }');
  await sleep(1500);
  let frames = 0;
  try {
    if (SCENARIO === 'play') {
      frames = await record(9000, async () => { play({ kps: 13, durationMs: 9000 }); });
    } else if (SCENARIO === 'gauge') {
      frames = await record(11000, async () => {
        (async () => {
          for (const k of [6, 12, 18, 24, 32, 42, 46, 46, 30, 14]) await play({ kps: k, durationMs: 1100, scratchEvery: 99999 });
        })();
      });
    } else if (SCENARIO === 'dp') {
      frames = await record(9000, async () => { play({ side: 1, kps: 8, durationMs: 9000 }); play({ side: 2, kps: 8, durationMs: 9000, scratchEvery: 2300 }); });
    } else if (SCENARIO === 'ln') {
      frames = await record(8000, async () => { play({ kps: 7, durationMs: 8000, longNotes: true, scratchEvery: 99999 }); });
    } else if (SCENARIO === 'combo') {
      // 입력 계기판·KPS 스피드미터·릴리즈·롱노트를 한 장면에: KPS를 끝값까지 올렸다 내리고 롱노트를 섞는다
      frames = await record(12500, async () => {
        (async () => {
          for (const k of [7, 10, 16, 24, 32, 42, 46, 46, 28, 12]) await play({ kps: k, durationMs: 1200, longNotes: true, scratchEvery: 1600 });
        })();
      });
    } else if (SCENARIO === 'themes2') {
      // 스크래치 이미지(움직이는 GIF)와 그에 맞춘 색 세트
      const apply = theme => {
        settings.widget.colors = theme.colors;
        settings.widget.discImagePath = theme.image ? theme.image() : null;
        settings.widget.discImageMode = 'single';
        win.webContents.send('settings-updated');
      };
      apply(IMAGE_THEMES[0]);
      await sleep(800);
      frames = await record(10500, async () => {
        play({ kps: 9, durationMs: 10500 });
        (async () => {
          await sleep(3500); apply(IMAGE_THEMES[1]);
          await sleep(3500); apply(IMAGE_THEMES[2]);
        })();
      });
    } else if (SCENARIO === 'themes') {
      frames = await record(10000, async () => {
        play({ kps: 9, durationMs: 10000 });
        (async () => {
          for (const theme of THEMES.slice(1).concat(THEMES[0])) {
            await sleep(2500);
            settings.widget.colors = theme;
            win.webContents.send('settings-updated');
          }
        })();
      });
    }
  } catch (e) { fs.writeFileSync(OUT + '/error.txt', e.stack); }
  fs.writeFileSync(OUT + '/frames.txt', String(frames));
  session.dispose();
  app.exit(0);
});
