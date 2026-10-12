import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEventKeys } from '../js/utils.js';
import { validDate, cleanEvent, normalizeEvents, flattenEvents, backupDocument, readBackup,
    recurrenceDates, visibleRange, migrationEntries, assertRevision, moveCalendarDate } from '../js/calendar-data.js';
const event = { title: '家庭聚餐', time: '18:00', location: '家裡', description: '帶餐具', link: 'https://example.org' };
test('日期檢查含閏年與不存在的日期', () => {
    assert.equal(validDate('2028-02-29'), true);
    for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-01', null]) assert.equal(validDate(value), false);
});
test('舊資料不同日期字串映射到同一天時合併，不遺失行程', () => {
    const result = normalizeEventKeys({ '2026-10-12': [event], '2026/10/12': [{ ...event, title: '第二筆' }] });
    assert.equal(result['2026-10-12'].length, 2);
});
test('舊版非標準連結可完整備份，但匯入前必須修正', () => {
    const document = backupDocument({ '2026-10-12': [{ ...event, link: 'example.org/old' }] }, 'gas');
    assert.equal(document.events['2026-10-12'][0].link, 'example.org/old');
    assert.throws(() => readBackup(JSON.stringify(document)));
});
test('備份保留完整內容、相同資料的多次出現及全部月份', () => {
    const source = { '2026-10-12': [event, event], '2025-01-01': [{ ...event, title: '歷史行程' }] };
    const document = backupDocument(source, 'gas');
    const rows = flattenEvents(readBackup(JSON.stringify(document)));
    assert.equal(rows.length, 3); assert.deepEqual(cleanEvent(rows[0]), event);
    assert.equal(document.events['2026-10-12'][0].id, undefined);
});
test('拒絕損毀與不支援的備份，不將它視為空白資料', () => {
    assert.throws(() => readBackup('{'));
    assert.throws(() => readBackup(JSON.stringify({ format: 'other', version: 1, events: {} })));
    assert.throws(() => normalizeEvents({ '2026-02-30': [event] }));
    assert.throws(() => normalizeEvents([]));
});
test('拒絕不安全連結與超長欄位', () => {
    assert.throws(() => cleanEvent({ ...event, link: 'javascript:alert(1)' }));
    assert.throws(() => cleanEvent({ ...event, title: '長'.repeat(201) }));
});
test('版本衝突及已刪除行程都阻止覆寫', () => {
    assertRevision({ revision: 2 }, 2);
    assert.throws(() => assertRevision({ revision: 3 }, 2));
    assert.throws(() => assertRevision(null, 2));
});
test('跨年每週重複與日期範圍限制', () => {
    assert.deepEqual(recurrenceDates('2026-12-28', 'custom', '2027-01-11'), ['2026-12-28', '2027-01-04', '2027-01-11']);
    assert.throws(() => recurrenceDates('2026-10-12', 'custom', '2026-10-11'));
    assert.throws(() => recurrenceDates('2026-10-12', 'custom', '2030-10-12'));
});
test('月檢視包括前後月的週邊界，週檢視只有該週', () => {
    assert.deepEqual(visibleRange(new Date(2026, 9, 12), 'month'), { start: '2026-09-27', end: '2026-10-31' });
    assert.deepEqual(visibleRange(new Date(2026, 9, 12), 'week'), { start: '2026-10-11', end: '2026-10-17' });
});
test('遷移識別碼固定，保留有意重複的兩筆，順序不影響不同內容', async () => {
    const one = { '2026-10-12': [event, event, { ...event, title: '另一筆' }] };
    const two = { '2026-10-12': [{ ...event, title: '另一筆' }, event, event] };
    const a = await migrationEntries(one), b = await migrationEntries(two);
    assert.equal(new Set(a.map(row => row.id)).size, 3);
    assert.deepEqual(a.map(row => row.id).sort(), b.map(row => row.id).sort());
});

test('月底導覽不跳月，保留有效日期且不修改來源', () => {
    const jan = new Date(2026, 0, 31);
    assert.equal(moveCalendarDate(jan, 'month', 1).getMonth(), 1);
    assert.equal(moveCalendarDate(jan, 'month', 1).getDate(), 28);
    assert.equal(jan.getMonth(), 0); assert.equal(jan.getDate(), 31);
    assert.equal(moveCalendarDate(new Date(2028, 0, 31), 'month', 1).getDate(), 29);
    assert.equal(moveCalendarDate(new Date(2026, 2, 31), 'month', -1).getMonth(), 1);
    assert.equal(moveCalendarDate(new Date(2026, 11, 31), 'month', 1).getFullYear(), 2027);
});
test('週導覽維持七天並跨年度', () => {
    const date = moveCalendarDate(new Date(2026, 11, 28), 'week', 1);
    assert.equal(date.getFullYear(), 2027); assert.equal(date.getMonth(), 0); assert.equal(date.getDate(), 4);
});
