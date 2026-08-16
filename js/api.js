const getApiUrl = () => {
    return (typeof window.GOOGLE_API_CONFIG !== 'undefined' && window.GOOGLE_API_CONFIG.apiUrl)
        ? window.GOOGLE_API_CONFIG.apiUrl
        : '';
};

const getApiToken = () => {
    return (typeof window.GOOGLE_API_CONFIG !== 'undefined' && window.GOOGLE_API_CONFIG.apiToken)
        ? window.GOOGLE_API_CONFIG.apiToken
        : '';
};

const LOCAL_STORAGE_KEY = 'calendar_events_fallback';

function ensureApiSuccess(data, fallbackMessage) {
    if (!data || typeof data !== 'object') {
        throw new Error(fallbackMessage);
    }
    if (data.status === 'error') {
        throw new Error(data.message || fallbackMessage);
    }
    return data;
}

/**
 * 解析 LocalStorage 資料。
 * 若 LocalStorage 存在非空字串但 JSON 解析失敗（資料損毀），
 * 必須明確拋出 Error 並停止寫入，防止空物件覆寫損毀資料，保留手動救援機會。
 */
function parseLocalStorageEvents() {
    const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (rawData === null || rawData.trim() === '') {
        return {};
    }
    try {
        const parsed = JSON.parse(rawData);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
        }
        throw new Error("LocalStorage 資料結構無效");
    } catch (e) {
        console.error("LocalStorage 資料損毀:", e);
        throw new Error("LocalStorage 資料損毀，停止寫入以保護原始紀錄: " + e.message);
    }
}

export const API = {
    async fetchAllEvents() {
        const url = getApiUrl();
        const token = getApiToken();

        if (!url || !token) {
            if (!url) {
                console.warn("⚠️ 未設定雲端 API 網址，自動切換至 LocalStorage 本機單機模式。");
            } else {
                console.warn("⚠️ 未設定 API Token，自動切換至 LocalStorage 本機單機模式。");
            }
            try {
                const events = parseLocalStorageEvents();
                return {
                    status: 'success',
                    data: { events: events },
                    isFallback: true
                };
            } catch (err) {
                console.error("單機模式 LocalStorage 讀取失敗，降級顯示空白日曆:", err);
                return {
                    status: 'success',
                    data: { events: {} },
                    isFallback: true
                };
            }
        }

        // Append token to URL for GET
        const fetchUrl = `${url}?token=${encodeURIComponent(token)}`;

        try {
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
            }
            const data = await response.json();
            return ensureApiSuccess(data, 'API 讀取失敗');
        } catch (error) {
            console.error('API Fetch Error:', error);
            // 🔒 當 API 發生 403 Token 錯誤時，自動降級切換至 LocalStorage 單機模式
            if (error.message && error.message.includes('403')) {
                console.warn('⚠️ 雲端 Token 驗證失敗 (403 Forbidden)，自動降級至 LocalStorage 單機模式。');
                try {
                    const fallbackEvents = parseLocalStorageEvents();
                    return {
                        status: 'success',
                        data: { events: fallbackEvents },
                        isFallback: true
                    };
                } catch (fallbackErr) {
                    return { status: 'success', data: { events: {} }, isFallback: true };
                }
            }
            throw error;
        }
    },

    async saveDayEvents(dateKey, events) {
        const url = getApiUrl();
        const token = getApiToken();

        if (!url || !token) {
            console.warn("⚠️ 未設定雲端 API 網址或 Token，行程已儲存至 LocalStorage 本機快取。");
            // 讀取既有 LocalStorage，若已損毀則 parseLocalStorageEvents 會拋錯並中斷執行，不覆寫壞資料
            const allEvents = parseLocalStorageEvents();

            if (Array.isArray(events) && events.length > 0) {
                allEvents[dateKey] = events;
            } else {
                delete allEvents[dateKey];
            }

            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allEvents));
            } catch (storageErr) {
                console.error("LocalStorage 寫入失敗:", storageErr);
                throw new Error("本機儲存空間已滿或寫入失敗");
            }
            return { status: 'success', isFallback: true };
        }

        const payload = {
            action: 'save_day',
            dateKey: dateKey,
            events: events,
            apiToken: token // Send token in body for POST
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors', // Specific for GAS to handle Simple Requests
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8' // Standard for GAS
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`伺服器回應錯誤! 狀態碼: ${response.status}`);
            }

            const data = await response.json();
            return ensureApiSuccess(data, 'API 儲存失敗');
        } catch (error) {
            console.error('API Save Error:', error);
            if (error.message && error.message.includes('403')) {
                console.warn('⚠️ 雲端 Token 驗證失敗 (403)，自動改將行程儲存至 LocalStorage 本機快取。');
                try {
                    const allEvents = parseLocalStorageEvents();
                    if (Array.isArray(events) && events.length > 0) {
                        allEvents[dateKey] = events;
                    } else {
                        delete allEvents[dateKey];
                    }
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allEvents));
                    return { status: 'success', isFallback: true };
                } catch (fallbackErr) {
                    throw new Error("本機儲存空間已滿或寫入失敗");
                }
            }
            throw error;
        }
    }
};
