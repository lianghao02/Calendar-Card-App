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

export const API = {
    async fetchAllEvents() {
        const url = getApiUrl();
        const token = getApiToken();
        
        if (!url) {
            console.warn("⚠️ 未設定雲端 API 網址，自動切換至 LocalStorage 本機單機模式。");
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            return {
                status: 'success',
                data: { events: localData ? JSON.parse(localData) : {} }
            };
        }
        
        // Append token to URL for GET
        const fetchUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;

        try {
            const response = await fetch(fetchUrl);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Fetch Error:', error);
            throw error;
        }
    },

    async saveDayEvents(dateKey, events) {
        const url = getApiUrl();
        const token = getApiToken();
        
        if (!url) {
            console.warn("⚠️ 未設定雲端 API 網址，行程已儲存至 LocalStorage 本機快取。");
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            const allEvents = localData ? JSON.parse(localData) : {};
            
            if (events && events.length > 0) {
                allEvents[dateKey] = events;
            } else {
                delete allEvents[dateKey];
            }
            
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allEvents));
            return { status: 'success' };
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
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Save Error:', error);
            throw error;
        }
    }
};
