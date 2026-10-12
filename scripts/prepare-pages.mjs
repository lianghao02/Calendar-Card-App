import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const local = path.join(root, 'firebase.local.json');
const text = process.env.FIREBASE_WEB_CONFIG || (fs.existsSync(local) ? fs.readFileSync(local, 'utf8') : '');
if (!text) throw new Error('請先提供 FIREBASE_WEB_CONFIG 或被 Git 忽略的 firebase.local.json');
const input = JSON.parse(text);
if (input.enabled !== true || !/^[\w-]{1,100}$/.test(input.familyId)) throw new Error('僅在 Firebase 已設定與確認切換時準備正式部署包');
const config = {};
for (const key of ['apiKey', 'authDomain', 'projectId', 'appId']) {
    if (typeof input.config?.[key] !== 'string' || !input.config[key]) throw new Error(`缺少 Firebase 公開設定：${key}`);
    config[key] = input.config[key];
}
const target = path.join(root, 'dist', 'pages');
// 不覆寫已有部署包，避免混入不同設定；每次執行須使用乾淨工作目錄。
if (fs.existsSync(target)) throw new Error('dist/pages 已存在，請先保留並移開前次部署包');
fs.mkdirSync(target, { recursive: true });
for (const file of ['index.html', 'style.css']) fs.copyFileSync(path.join(root, file), path.join(target, file));
fs.cpSync(path.join(root, 'js'), path.join(target, 'js'), { recursive: true });
fs.writeFileSync(path.join(target, 'firebase-config.js'), `window.CALENDAR_FIREBASE = ${JSON.stringify({ enabled: true, familyId: input.familyId, config })};\n`, 'utf8');
// 正式切換包不再攜帶原 GAS 共用 Token；原網址的備份必須在切換前完成。
fs.writeFileSync(path.join(target, 'google_api_config.js'), 'window.GOOGLE_API_CONFIG = {};\n', 'utf8');
console.log('正式 Pages 部署包已準備：dist/pages。尚未發布。');
