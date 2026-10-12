import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const directory of ['js', 'apps-script', 'scripts']) {
    for (const file of fs.readdirSync(path.join(root, directory))) {
        if (/\.m?js$/.test(file)) execFileSync(process.execPath, ['--check', path.join(root, directory, file)], { stdio: 'inherit' });
    }
}
console.log('全部 JavaScript 語法檢查通過');
