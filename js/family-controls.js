import { openDialog, closeDialog, setupDialogs, confirmAction, cancelConfirmation } from './dialogs.js';
import { API } from './api.js';
import { state } from './state.js';
import { backupDocument, readBackup, flattenEvents, migrationEntries, visibleRange } from './calendar-data.js';

const el = id => document.getElementById(id);
let prepared = null, preparing = false, importing = false;
let accountUid, syncMessage = '';
export function refreshSyncSummary() {
    let message = syncMessage;
    if (message === '家庭行事曆已同步' || message.startsWith('本機模式') || message.startsWith('舊版 GAS 模式')) {
        const range = visibleRange(state.currentDate, state.currentView);
        const month = state.currentDate.getFullYear() + '-' + String(state.currentDate.getMonth() + 1).padStart(2, '0');
        const count = Object.entries(state.events).filter(([date]) => state.currentView === 'month' ? date.startsWith(month) : date >= range.start && date <= range.end).reduce((total, [, rows]) => total + rows.length, 0);
        message = (state.currentView === 'month' ? '本月' : '本週') + ' ' + count + ' 筆・' + (message === '家庭行事曆已同步' ? '已同步' : message);
    }
    el('sync-status').textContent = message;
}
export function setSyncStatus(message) {
    syncMessage = message;
    refreshSyncSummary();
    const account = API.isCloud ? API.currentAccount() : null;
    const uid = account?.uid || null;
    if (accountUid !== undefined && accountUid !== uid) {
        cancelConfirmation();
        prepared = null; closeDialog('import-modal');
        closeDialog('event-modal');
        closeDialog('share-modal-overlay'); closeDialog('event-list-modal-overlay');
        el('share-text-preview').value = '';
        state.selectedDates.clear(); state.isSelectionMode = false;
        for (const input of document.querySelectorAll('#event-modal input, #event-modal textarea')) input.value = '';
        state.editingEvent = null;
    }
    accountUid = uid;
    el('account-label').textContent = account ? `${account.label}｜${account.allowed ? '家庭成員' : '尚未核准'}` : '';
    el('login-btn').hidden = !API.isCloud || !!account;
    el('login-btn').disabled = API.isCloud && !API.loginReady;
    el('login-help').hidden = !API.isCloud || !!account;
    el('logout-btn').hidden = !account;
    el('import-btn').hidden = !account?.allowed;
    state.canEdit = !API.isCloud || account?.allowed === true;
    for (const control of document.querySelectorAll('.requires-edit, .add-event-btn, .event-edit-btn')) control.disabled = !state.canEdit || state.saving;
    el('backup-btn').disabled = API.isCloud && !account?.allowed;
    el('share-btn').disabled = !state.canEdit || (state.isSelectionMode && !state.selectedDates.size);
    el('select-mode-btn').disabled = !state.canEdit;
}
function download(events, source) {
    const content = JSON.stringify(backupDocument(events, source), null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url;
    anchor.download = `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function operation(button, action) {
    if (button.disabled) return;
    button.disabled = true;
    try { await action(); } catch (error) { alert(error.message); }
    finally { button.disabled = false; }
}
export function setupFamilyControls() {
    const login = el('login-btn'), logout = el('logout-btn');
    state.canEdit = !API.isCloud;
    const cancelImport = () => { if (!importing) { prepared = null; closeDialog('import-modal'); } };
    setupDialogs({ 'import-modal': cancelImport });
    document.addEventListener('click', event => { if (!el('account-menu').contains(event.target)) el('account-menu').open = false; });
    login.hidden = !API.isCloud;
    login.disabled = API.isCloud;
    el('login-help').hidden = !API.isCloud;
    login.addEventListener('click', () => operation(login, () => API.signIn()));
    logout.addEventListener('click', () => operation(logout, async () => {
        if (state.saving || importing) throw new Error('請等待目前儲存／匯入完成');
        if (document.getElementById('event-modal').classList.contains('active') && !await confirmAction('登出家庭行事曆？', '登出會關閉目前尚未儲存的行程表單。', '確認登出')) return;
        await API.signOut();
    }));
    el('backup-btn').addEventListener('click', () => operation(el('backup-btn'), async () => {
        const result = await API.fetchAllEvents();
        download(result.data.events, API.isCloud ? 'family' : result.isFallback ? 'local' : 'gas');
    }));
    el('legacy-backup-btn').addEventListener('click', () => operation(el('legacy-backup-btn'), async () => {
        const result = await API.readLegacyBackup(); download(result.events, result.source);
    }));
    el('import-btn').addEventListener('click', () => { el('backup-file').value = ''; el('backup-file').click(); });
    el('backup-file').addEventListener('change', async event => {
        if (preparing || importing) return;
        const file = event.target.files?.[0]; if (!file) return;
        preparing = true; prepared = null;
        const uid = API.currentAccount()?.uid;
        try {
            if (file.size > 5 * 1024 * 1024) throw new Error('備份超過 5 MB，請先分割或檢查檔案');
            const events = readBackup(await file.text());
            const rows = flattenEvents(events);
            if (!rows.length || rows.length > 5000) throw new Error('請選擇含 1～5,000 筆行程的備份');
            const existing = flattenEvents((await API.fetchAllEvents()).data.events);
            const entries = await migrationEntries(events);
            if (API.currentAccount()?.uid !== uid) throw new Error('帳號已變更，請重新預覽');
            const ids = new Set(existing.map(row => row.id));
            const repeated = entries.filter(row => ids.has(row.id)).length;
            // 一般行程即使內容相同，也可能是有意安排；只提示，不擅自刪除。
            const signature = row => JSON.stringify([row.date, row.title, row.time, row.location, row.description, row.link]);
            const contents = new Set(existing.map(signature));
            const similar = entries.filter(row => !ids.has(row.id) && contents.has(signature(row))).length;
            prepared = { uid, entries };
            el('import-summary').textContent = `共 ${entries.length} 筆，已匯入 ${repeated} 筆將略過；另有 ${similar} 筆內容與現有行程相同，確認後仍會新增。預覽前 100 筆：`;
            const preview = el('import-preview'); preview.replaceChildren();
            rows.slice(0, 100).forEach(row => {
                const item = document.createElement('div'); item.className = 'import-row';
                item.textContent = `${row.date} ${row.time || '全日'}｜${row.title}｜${row.location}｜${row.description}｜${row.link}`;
                preview.append(item);
            });
            openDialog('import-modal');
        } catch (error) { alert('無法預覽：' + error.message); }
        finally { preparing = false; }
    });
    el('import-cancel').addEventListener('click', cancelImport);
    el('import-confirm').addEventListener('click', () => operation(el('import-confirm'), async () => {
        if (!prepared || importing) return;
        if (prepared.uid !== API.currentAccount()?.uid) throw new Error('帳號已變更，請重新預覽');
        importing = true; el('import-cancel').disabled = true;
        try {
            const result = await API.importEntries(prepared.entries, progress => {
                el('import-summary').textContent = `已處理 ${progress.processed} 筆，新增 ${progress.imported} 筆，略過 ${progress.skipped} 筆。`;
            });
            prepared = null; closeDialog('import-modal');
            alert(`匯入完成：新增 ${result.imported} 筆，略過 ${result.skipped} 筆。原備份仍保留。`);
        } catch (error) {
            throw new Error(`匯入中止：${error.message}。已完成的批次保留，可用同一份備份重試，不會覆寫已匯入的紀錄。`);
        } finally { importing = false; el('import-cancel').disabled = false; }
    }));
}
