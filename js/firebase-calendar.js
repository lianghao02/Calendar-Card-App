import { cleanEvent, groupEvents, assertRevision, MAX_CHANGES, validDate } from './calendar-data.js';

// 固定 SDK 版本，維持原生 ES Modules 與免建置部署。
const SDK = 'https://www.gstatic.com/firebasejs/12.4.0/';
let appSdk, authSdk, dbSdk, auth, db, collectionRef, unsubscribe, generation = 0, rangeGeneration = 0;
let onData, onStatus, user, allowed = false, onlineSnapshot = false, lastRange;
const settings = () => window.CALENDAR_FIREBASE;
export const cloudEnabled = () => settings()?.enabled === true;
export const loginReady = () => !!auth;
const status = message => onStatus?.(message);
function requireMember() {
    if (!user || !allowed) throw new Error('請先以核准的家庭帳號登入');
    if (!navigator.onLine) throw new Error('目前離線，尚未儲存。請保留輸入並在連線後重試。');
}
function failure(error) {
    if (error.code === 'auth/popup-blocked') return 'Google 登入視窗被瀏覽器阻擋。請用 Safari 或 Chrome 開啟此網址再登入；iPhone 的 App 內頁面可按指南針圖示開啟 Safari。';
    if (error.code === 'auth/popup-closed-by-user') return 'Google 登入尚未完成。請再次按「Google 登入」；若登入視窗立即關閉，請用 Safari 或 Chrome 開啟此網址。';
    if (error.code === 'auth/unauthorized-domain') return '此網址尚未允許 Google 登入，請回報目前網址，等待管理者完成設定。';
    if (error.code === 'auth/operation-not-supported-in-this-environment') return '目前瀏覽器不支援 Google 登入，請用 Safari 或 Chrome 開啟此網址。';
    if (error.code === 'auth/network-request-failed') return 'Google 登入連線失敗，請確認網路後重試。';
    if (error.code === 'permission-denied') return '存取遭拒絕，請確認家庭成員資格及資料庫規則。';
    return error.code ? `雲端操作失敗（${error.code}），請保留輸入後重試。` : error.message;
}
export async function initializeCloud(dataCallback, statusCallback) {
    onData = dataCallback; onStatus = statusCallback;
    status('登入服務載入中…');
    const config = settings();
    if (!/^[\w-]{1,100}$/.test(config.familyId) || !['apiKey', 'authDomain', 'projectId', 'appId'].every(key => config.config?.[key])) {
        throw new Error('Firebase 尚未設定完成；為保護資料，不會自動切換成本機模式。');
    }
    [appSdk, authSdk, dbSdk] = await Promise.all([
        import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')
    ]);
    const app = appSdk.initializeApp(config.config, 'family-calendar');
    auth = authSdk.getAuth(app);
    db = dbSdk.initializeFirestore(app, { localCache: dbSdk.memoryLocalCache() });
    collectionRef = dbSdk.collection(db, 'families', config.familyId, 'events');
    authSdk.onAuthStateChanged(auth, async current => {
        const session = ++generation;
        unsubscribe?.(); unsubscribe = null; onlineSnapshot = false;
        user = current; allowed = false; onData({});
        if (!user) { status('請登入核准的家庭 Google 帳號'); return; }
        status('確認家庭成員資格中…');
        try {
            const member = await dbSdk.getDocFromServer(dbSdk.doc(db, 'families', config.familyId, 'members', user.uid));
            if (session !== generation) return;
            allowed = member.exists() && member.data().active === true;
            if (!allowed) { status(`此帳號尚未獲准加入家庭；成員 UID：${user.uid}`); return; }
            status('已登入家庭行事曆，讀取中…');
            if (lastRange) watchRange(lastRange);
        } catch (error) { if (session === generation) status(failure(error)); }
    });
}
export async function signIn() {
    if (!auth) throw new Error('Firebase 尚未初始化完成');
    if (user) { await authSdk.signOut(auth); return; }
    try {
        // 直接由使用者點擊開啟，避免等待其他操作後才請求彈出視窗。
        await authSdk.signInWithPopup(auth, new authSdk.GoogleAuthProvider());
    } catch (error) {
        const message = failure(error);
        status(message);
        throw new Error(message);
    }
}
export async function signOut() { if (auth) await authSdk.signOut(auth); }
export function currentAccount() { return user ? { uid: user.uid, label: user.email || user.displayName || '家庭成員', allowed } : null; }
export function watchRange(range) {
    lastRange = range;
    if (!allowed) return;
    unsubscribe?.(); onlineSnapshot = false;
    status('讀取家庭行程中…');
    const session = generation, watch = ++rangeGeneration;
    const query = dbSdk.query(collectionRef, dbSdk.where('date', '>=', range.start), dbSdk.where('date', '<=', range.end));
    unsubscribe = dbSdk.onSnapshot(query, { includeMetadataChanges: true }, snapshot => {
        if (session !== generation || watch !== rangeGeneration) return;
        onlineSnapshot = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
        onData(groupEvents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
        status(onlineSnapshot ? '家庭行事曆已同步' : '目前顯示快取；尚未確認最新雲端資料');
    }, error => { if (session === generation && watch === rangeGeneration) { onlineSnapshot = false; if (error.code === 'permission-denied') allowed = false; onData({}); status(failure(error)); } });
}
export async function readAll() {
    requireMember();
    const snapshot = await dbSdk.getDocsFromServer(collectionRef);
    return groupEvents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
}
export async function commitChanges(changes) {
    requireMember();
    if (!onlineSnapshot) throw new Error('雲端資料尚未同步完成，請保留輸入後重試');
    if (!changes.length || changes.length > MAX_CHANGES) throw new Error('一次最多處理 100 筆行程');
    if (changes.some(change => change.after && !validDate(change.after.date))) throw new Error('行程日期無效');
    const session = generation;
    const uid = user.uid;
    const name = (user.displayName || '家庭成員').slice(0, 100);
    status('儲存至家庭行事曆中…');
    try {
        await dbSdk.runTransaction(db, async transaction => {
            if (session !== generation) throw new Error('帳號已變更，請重新登入');
            const refs = changes.map(change => dbSdk.doc(collectionRef, change.id));
            const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
            for (let i = 0; i < changes.length; i++) {
                const change = changes[i]; const snapshot = snapshots[i];
                if (change.before) assertRevision(snapshot.exists() ? snapshot.data() : null, change.before.revision);
                else if (snapshot.exists()) throw new Error('行程識別碼已存在，請重新確認');
                if (!change.after) transaction.delete(refs[i]);
                else transaction.set(refs[i], { ...cleanEvent(change.after), date: change.after.date,
                    revision: (change.before?.revision || 0) + 1,
                    updatedBy: uid, updatedByName: name, updatedAt: dbSdk.serverTimestamp() });
            }
        });
        if (session === generation) status('家庭行程已儲存');
    } catch (error) { if (session === generation) status(failure(error)); throw new Error(failure(error)); }
}
export async function importEntries(entries, progress) {
    requireMember();
    const session = generation; const uid = user.uid;
    const name = (user.displayName || '家庭成員').slice(0, 100);
    let imported = 0, skipped = 0;
    // 分批可重試；同一來源內容及出現次序產生相同識別碼，已修改的匯入資料也不會被覆寫。
    for (let offset = 0; offset < entries.length; offset += MAX_CHANGES) {
        const chunk = entries.slice(offset, offset + MAX_CHANGES);
        const result = await dbSdk.runTransaction(db, async transaction => {
            if (session !== generation) throw new Error('帳號已變更，匯入已停止；已完成的批次保留');
            const refs = chunk.map(entry => dbSdk.doc(collectionRef, entry.id));
            const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
            let written = 0;
            chunk.forEach((entry, index) => {
                if (snapshots[index].exists()) return;
                transaction.set(refs[index], { ...cleanEvent(entry), date: entry.date, revision: 1,
                    updatedBy: uid, updatedByName: name, updatedAt: dbSdk.serverTimestamp() }); written++;
            });
            return { written, skipped: chunk.length - written };
        });
        imported += result.written; skipped += result.skipped;
        progress?.({ imported, skipped, processed: Math.min(offset + chunk.length, entries.length) });
    }
    return { imported, skipped };
}
