const API_URL = 'https://script.google.com/macros/s/AKfycbxQmktoDnkf6HXEbIAL8tcfKDt3n9bvuDyOuYL_pbZYDgG7w1gfhiqEoZnN9BYhHVKu/exec';

const API = {
    /**
     * Fetch all events from the Google Sheet
     */
    async fetchAllEvents() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Fetch Error:', error);
            throw error;
        }
    },

    /**
     * Save events for a specific day
     * @param {string} dateKey - Format 'YYYY-MM-DD'
     * @param {Array} events - Array of event objects
     */
    async saveDayEvents(dateKey, events) {
        // Use keepalive: true if possible, or standard fetch
        // Google Apps Script requires CORS handling, usually fetch 'text/plain' or adhering to simple request might be tricky 
        // with JSON content type. Apps Script Web App redirects.
        // Standard fetch with body often follows redirects automatically in browser.
        
        const payload = {
            action: 'save_day',
            dateKey: dateKey,
            events: events
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                // Google Apps Script often handles text/plain better to avoid preflight options check issues 
                // but let's try standard approach first or text/plain
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
