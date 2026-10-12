import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
const require = process.env.CALENDAR_TEST_DEPENDENCIES
    ? createRequire(path.join(path.resolve(process.env.CALENDAR_TEST_DEPENDENCIES), 'package.json')) : createRequire(import.meta.url);
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } = require('firebase/firestore');
if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('規則測試必須連接本機 Firestore Emulator，不連接正式資料庫');
const env = await initializeTestEnvironment({ projectId: 'demo-family-calendar', firestore: {
    rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
} });
const identity = { firebase: { sign_in_provider: 'google.com' }, email_verified: true };
const payload = uid => ({ title: '測試行程', time: '全日', location: '', description: '', link: '', date: '2026-10-12',
    revision: 1, updatedBy: uid, updatedByName: '測試成員', updatedAt: serverTimestamp() });
await env.withSecurityRulesDisabled(async context => {
    for (const uid of ['one', 'two']) await setDoc(doc(context.firestore(), 'families/home/members/' + uid), { active: true });
    await setDoc(doc(context.firestore(), 'families/home/members/disabled'), { active: false });
});
const one = env.authenticatedContext('one', identity).firestore();
const two = env.authenticatedContext('two', identity).firestore();
const guest = env.authenticatedContext('guest', identity).firestore();
test('家庭成員共同讀寫；非成員及匿名不得存取', async () => {
    await assertSucceeds(setDoc(doc(one, 'families/home/events/e1'), payload('one')));
    await assertSucceeds(getDoc(doc(two, 'families/home/events/e1')));
    await assertFails(getDoc(doc(guest, 'families/home/events/e1')));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'families/home/events/e1')));
    await assertFails(getDoc(doc(env.authenticatedContext('disabled', identity).firestore(), 'families/home/events/e1')));
});
test('不能自行授權、冒用修改者或跨家庭寫入', async () => {
    await assertFails(setDoc(doc(guest, 'families/home/members/guest'), { active: true }));
    await assertFails(setDoc(doc(one, 'families/home/members/guest'), { active: true }));
    await assertFails(setDoc(doc(two, 'families/home/events/forged'), payload('one')));
    await assertFails(setDoc(doc(one, 'families/other/events/e1'), payload('one')));
    await assertFails(setDoc(doc(env.authenticatedContext('one', { ...identity, email_verified: false }).firestore(), 'families/home/events/e1'), payload('one')));
});
test('版本必須遞增；拒絕超長、非法欄位、危險連結與日期', async () => {
    await assertFails(updateDoc(doc(two, 'families/home/events/e1'), { title: '覆寫', updatedBy: 'two', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(two, 'families/home/events/e1'), { title: '家人更新', revision: 2, updatedBy: 'two', updatedAt: serverTimestamp() }));
    for (const patch of [{ title: '長'.repeat(201) }, { extra: true }, { date: '2026-99-99' }, { link: 'javascript:alert(1)' }]) {
        await assertFails(setDoc(doc(one, 'families/home/events/invalid'), { ...payload('one'), ...patch }));
    }
    await assertSucceeds(deleteDoc(doc(two, 'families/home/events/e1')));
});
test.after(async () => { await env.cleanup(); });
