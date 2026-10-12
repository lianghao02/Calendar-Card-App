import { API as legacy } from './legacy-api.js';
import * as cloud from './firebase-calendar.js';
import { normalizeEvents, flattenEvents, groupEvents, assertRevision, cleanEvent } from './calendar-data.js';
import { normalizeEventKeys } from './utils.js';

export const API = {
    get isCloud() { return cloud.cloudEnabled(); },
    get loginReady() { return cloud.loginReady(); },
    async fetchAllEvents() {
        if (this.isCloud) return { data: { events: await cloud.readAll() } };
        const result = await legacy.fetchAllEvents();
        result.data.events = normalizeEvents(normalizeEventKeys(result.data.events), { strictLink: false });
        return result;
    },
    async initialize(onData, onStatus) {
        if (this.isCloud) return cloud.initializeCloud(onData, onStatus);
        const result = await this.fetchAllEvents();
        onData(result.data.events);
        onStatus(result.isFallback ? '本機模式：僅存於此瀏覽器，請先匯出備份' : '舊版 GAS 模式：請先匯出備份');
        return result;
    },
    watchRange(range) { if (this.isCloud) cloud.watchRange(range); },
    async commitChanges(changes) {
        if (this.isCloud) return cloud.commitChanges(changes);
        const result = await this.fetchAllEvents();
        const rows = new Map(flattenEvents(result.data.events).map(event => [event.id, event]));
        const dates = new Set();
        for (const change of changes) {
            if (change.before) {
                const current = rows.get(change.id);
                assertRevision(current, change.before.revision);
                if (JSON.stringify({ date: current.date, ...cleanEvent(current, { strictLink: false }) }) !== JSON.stringify({ date: change.before.date, ...cleanEvent(change.before, { strictLink: false }) })) throw new Error('原行程已變更，請重新讀取後再確認');
                dates.add(change.before.date);
            } else if (rows.has(change.id)) throw new Error('行程識別碼已存在');
            if (change.after) { rows.set(change.id, { ...change.after, id: change.id, revision: (change.before?.revision || 0) + 1 }); dates.add(change.after.date); }
            else rows.delete(change.id);
        }
        const grouped = groupEvents([...rows.values()]);
        // 舊服務仍為逐日寫入；正式 Firebase 版使用單一交易。
        for (const date of dates) await legacy.saveDayEvents(date, grouped[date] || []);
        return grouped;
    },
    async readLocalBackup() {
        const text = localStorage.getItem('calendar_events_fallback');
        if (text === null) return {};
        return normalizeEvents(normalizeEventKeys(JSON.parse(text)), { strictLink: false });
    },
    async readLegacyBackup() {
        const result = await legacy.fetchAllEvents();
        return { events: normalizeEvents(normalizeEventKeys(result.data.events), { strictLink: false }), source: result.isFallback ? 'local' : 'gas' };
    },
    importEntries: cloud.importEntries,
    signIn: cloud.signIn,
    signOut: cloud.signOut,
    currentAccount: cloud.currentAccount,
};
