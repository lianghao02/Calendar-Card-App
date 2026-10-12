export const MAX_CHANGES = 100;
const fields = { title: 200, time: 20, location: 500, description: 2000, link: 2048 };
export function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(0);
    date.setFullYear(y, m - 1, d); date.setHours(12, 0, 0, 0);
    return y >= 1000 && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
export function cleanEvent(input, { strictLink = true } = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('行程格式無效');
    const event = {};
    for (const [key, max] of Object.entries(fields)) {
        const value = input[key] ?? '';
        if (typeof value !== 'string' || value.length > max) throw new Error(`行程欄位 ${key} 無效或過長`);
        event[key] = value;
    }
    if (!event.title.trim()) throw new Error('行程標題不可空白');
    if (strictLink && event.link && !/^https?:\/\/\S+$/i.test(event.link)) throw new Error('行程連結須為 HTTP 或 HTTPS 網址');
    return event;
}
export function normalizeEvents(input, options = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('行事曆資料格式無效');
    const output = {};
    for (const [date, list] of Object.entries(input)) {
        if (!validDate(date) || !Array.isArray(list)) throw new Error(`日期或行程清單無效：${date}`);
        output[date] = list.map((event, index) => ({ ...cleanEvent(event, options),
            id: typeof event.id === 'string' && /^[\w-]{1,100}$/.test(event.id) ? event.id : `legacy_${date}_${index}`,
            revision: Number.isSafeInteger(event.revision) && event.revision >= 0 ? event.revision : 0
        }));
    }
    return output;
}
export function flattenEvents(events) {
    return Object.entries(events).flatMap(([date, list]) => list.map(event => ({ ...event, date })));
}
export function groupEvents(events) {
    const grouped = {};
    for (const event of events) (grouped[event.date] ??= []).push(event);
    for (const list of Object.values(grouped)) list.sort((a, b) => (a.time === '全日' ? 0 : 1) - (b.time === '全日' ? 0 : 1) || (a.time || '').localeCompare(b.time || '') || a.id.localeCompare(b.id));
    return grouped;
}
export function assertRevision(current, expected) {
    if (!current || current.revision !== expected) throw new Error('行程已被家人修改或刪除。請保留輸入，重新讀取後再確認。');
}
export function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function moveCalendarDate(date, view, direction) {
    const next = new Date(date);
    if (view === 'week') next.setDate(next.getDate() + direction * 7);
    else {
        const day = next.getDate();
        next.setDate(1);
        next.setMonth(next.getMonth() + direction);
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(day, lastDay));
    }
    return next;
}
export function visibleRange(date, view) {
    const start = new Date(date.getFullYear(), date.getMonth(), view === 'week' ? date.getDate() : 1);
    start.setDate(start.getDate() - start.getDay());
    const end = view === 'week' ? new Date(start) : new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setDate(end.getDate() + (6 - end.getDay()));
    return { start: dateKey(start), end: dateKey(end) };
}
export function recurrenceDates(start, mode, endValue) {
    if (!validDate(start)) throw new Error('日期無效');
    const [y, m, d] = start.split('-').map(Number);
    const cursor = new Date(y, m - 1, d, 12);
    let end = new Date(cursor);
    if (mode === 'weekly_current_month') end = new Date(y, m, 0, 12);
    else if (mode === 'weekly_3_month') end = new Date(y, m + 2, d, 12);
    else if (mode === 'custom') {
        if (!validDate(endValue)) throw new Error('請填寫有效的重複結束日期');
        const [ey, em, ed] = endValue.split('-').map(Number); end = new Date(ey, em - 1, ed, 12);
    } else if (mode !== 'none') throw new Error('重複模式無效');
    if (end < cursor) throw new Error('結束日期不可早於開始日期');
    const dates = [];
    while (cursor <= end) {
        dates.push(dateKey(cursor));
        if (dates.length > MAX_CHANGES) throw new Error('一次最多建立 100 筆重複行程，請縮短日期範圍');
        cursor.setDate(cursor.getDate() + 7);
    }
    return dates;
}
export function backupDocument(events, source) {
    const normalized = normalizeEvents(events, { strictLink: false });
    const clean = {};
    for (const [date, list] of Object.entries(normalized)) clean[date] = list.map(event => cleanEvent(event, { strictLink: false }));
    return { format: 'calendar-card-backup', version: 1, source, exportedAt: new Date().toISOString(), events: clean };
}
export function readBackup(text) {
    const data = JSON.parse(text);
    if (data?.format !== 'calendar-card-backup' || data.version !== 1) throw new Error('不是支援的行事曆備份檔');
    return normalizeEvents(data.events);
}
export async function migrationEntries(events) {
    const counts = new Map();
    const entries = [];
    for (const event of flattenEvents(normalizeEvents(events))) {
        const payload = { date: event.date, ...cleanEvent(event) };
        const key = JSON.stringify(payload);
        const occurrence = counts.get(key) || 0; counts.set(key, occurrence + 1);
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${key}:${occurrence}`));
        const id = 'import_' + Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
        entries.push({ id, ...payload });
    }
    return entries;
}
