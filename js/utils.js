export function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function normalizeEventKeys(rawEvents) {
    const normalized = {};
    for (const [key, value] of Object.entries(rawEvents)) {
        // Check if key is already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
            normalized[key] = value;
        } else {
            // Try to parse date string
            const d = new Date(key);
            if (!isNaN(d.getTime())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const date = String(d.getDate()).padStart(2, '0');
                const newKey = `${y}-${m}-${date}`;
                normalized[newKey] = value;
            } else {
                 normalized[key] = value;
            }
        }
    }
    return normalized;
}
