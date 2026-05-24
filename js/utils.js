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

/**
 * 將字串進行 HTML 安全轉義，防止 XSS 攻擊
 * @param {string} str 
 * @returns {string} 轉義後的安全字串
 */
export function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 驗證並安全化連結，阻擋 javascript: 等危險協議
 * @param {string} url 
 * @returns {string} 安全的連結字串，如果不安全則返回空字串
 */
export function sanitizeLink(url) {
    if (!url) return '';
    const trimmed = url.trim();
    const lowercase = trimmed.toLowerCase();
    
    // 阻擋 javascript:, data:, vbscript: 等協議
    if (lowercase.startsWith('javascript:') || 
        lowercase.startsWith('data:') || 
        lowercase.startsWith('vbscript:')) {
        return '';
    }
    
    // 對連結進行轉義，避免屬性溢出 (如 " onclick="...)
    return escapeHTML(trimmed);
}
