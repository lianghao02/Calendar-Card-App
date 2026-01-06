const getApiUrl = () => {
    return (typeof window.GOOGLE_API_CONFIG !== 'undefined' && window.GOOGLE_API_CONFIG.apiUrl) 
        ? window.GOOGLE_API_CONFIG.apiUrl 
        : '';
};

export const API = {
    async fetchAllEvents() {
        const url = getApiUrl();
        if (!url) throw new Error("API Configuration missing!");
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Fetch Error:', error);
            throw error;
        }
    },

    async saveDayEvents(dateKey, events) {
        const url = getApiUrl();
        if (!url) throw new Error("API Configuration missing!");

        const payload = {
            action: 'save_day',
            dateKey: dateKey,
            events: events
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
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
