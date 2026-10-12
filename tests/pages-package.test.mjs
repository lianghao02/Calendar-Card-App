import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
test('部署包只包含網站與公開設定，不包含 GAS Token 或未知設定', () => {
    const base = path.resolve(os.tmpdir());
    const fixture = fs.mkdtempSync(path.join(base, 'calendar-package-test-'));
    try {
        fs.mkdirSync(path.join(fixture, 'scripts')); fs.mkdirSync(path.join(fixture, 'js'));
        fs.copyFileSync(new URL('../scripts/prepare-pages.mjs', import.meta.url), path.join(fixture, 'scripts/prepare-pages.mjs'));
        fs.writeFileSync(path.join(fixture, 'index.html'), '<html></html>', 'utf8');
        fs.writeFileSync(path.join(fixture, 'style.css'), '', 'utf8');
        fs.writeFileSync(path.join(fixture, 'google_api_config.js'), '原設定不應被複製', 'utf8');
        const env = { ...process.env, FIREBASE_WEB_CONFIG: JSON.stringify({ enabled: true, familyId: 'home',
            config: { apiKey: 'example', authDomain: 'example.firebaseapp.com', projectId: 'example', appId: 'example', privateKey: '不可輸出' } }) };
        const script = path.join(fixture, 'scripts/prepare-pages.mjs');
        execFileSync(process.execPath, [script], { env });
        const target = path.join(fixture, 'dist/pages');
        assert.equal(fs.readFileSync(path.join(target, 'google_api_config.js'), 'utf8'), 'window.GOOGLE_API_CONFIG = {};\n');
        const runtime = fs.readFileSync(path.join(target, 'firebase-config.js'), 'utf8');
        assert.ok(runtime.includes('example.firebaseapp.com')); assert.ok(!runtime.includes('privateKey'));
        assert.equal(fs.existsSync(path.join(target, 'firebase.local.json')), false);
        assert.throws(() => execFileSync(process.execPath, [script], { env, stdio: 'pipe' }));
    } finally {
        const resolved = path.resolve(fixture);
        if (path.dirname(resolved) !== base || !path.basename(resolved).startsWith('calendar-package-test-')) throw new Error('測試清理路徑不在預期暫存目錄');
        fs.rmSync(resolved, { recursive: true });
    }
});
