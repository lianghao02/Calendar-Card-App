import test from 'node:test';
import assert from 'node:assert/strict';
import { API } from '../js/api.js';
globalThis.window = {};
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
const key = 'calendar_events_fallback';
const content = { title: '舊行程', time: '全日', location: '', description: '', link: '' };
test('Firebase 關閉時不載入 SDK，保留本機行程', async () => {
    storage.set(key, JSON.stringify({ '2026-10-12': [content] }));
    const response = await API.fetchAllEvents();
    assert.equal(response.isFallback, true); assert.equal(response.data.events['2026-10-12'][0].title, '舊行程');
});
test('新增、修改、跨日移動與刪除保留其他日資料', async () => {
    storage.set(key, JSON.stringify({ '2026-10-12': [content], '2026-10-20': [{ ...content, title: '不可動' }] }));
    const result = await API.fetchAllEvents();
    const before = { ...result.data.events['2026-10-12'][0], date: '2026-10-12' };
    await API.commitChanges([{ id: before.id, before, after: { ...content, title: '移動後', date: '2026-10-13' } }]);
    let saved = (await API.fetchAllEvents()).data.events;
    assert.equal(saved['2026-10-12'], undefined); assert.equal(saved['2026-10-13'][0].title, '移動後');
    const moved = { ...saved['2026-10-13'][0], date: '2026-10-13' };
    await API.commitChanges([{ id: moved.id, before: moved, after: { ...content, date: '2026-10-13' } }]);
    saved = (await API.fetchAllEvents()).data.events;
    const revised = { ...saved['2026-10-13'][0], date: '2026-10-13' };
    await API.commitChanges([{ id: revised.id, before: revised, after: null }]);
    await API.commitChanges([{ id: 'new_1', before: null, after: { ...content, date: '2026-10-14' } }]);
    saved = (await API.fetchAllEvents()).data.events;
    assert.equal(saved['2026-10-13'], undefined); assert.equal(saved['2026-10-20'][0].title, '不可動');
    assert.equal(saved['2026-10-14'][0].title, '舊行程');
});
test('損毀的本機資料不可用空白覆寫', async () => {
    storage.set(key, '{損毀');
    await assert.rejects(API.fetchAllEvents());
    await assert.rejects(API.commitChanges([{ id: 'x', before: null, after: { ...content, date: '2026-10-12' } }]));
    assert.equal(storage.get(key), '{損毀');
});
test('本機原行程被別的分頁修改時阻止覆寫', async () => {
    storage.set(key, JSON.stringify({ '2026-10-12': [content] }));
    const before = { ...(await API.fetchAllEvents()).data.events['2026-10-12'][0], date: '2026-10-12' };
    storage.set(key, JSON.stringify({ '2026-10-12': [{ ...content, title: '別人更新' }] }));
    await assert.rejects(API.commitChanges([{ id: before.id, before, after: { ...content, date: '2026-10-12' } }]));
    assert.equal(JSON.parse(storage.get(key))['2026-10-12'][0].title, '別人更新');
});
