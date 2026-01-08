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

export const API = {
    async fetchAllEvents() {
        const url = getApiUrl();
        const token = getApiToken();
        if (!url) throw new Error("API Configuration missing!");
        
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
        if (!url) throw new Error("API Configuration missing!");

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
