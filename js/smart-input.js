function parseChineseNumber(str) {
    if (!str) return NaN;
    if (/^\d+$/.test(str)) return parseInt(str, 10);

    const digits = { '零': 0, '一': 1, '二': 2, '兩': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
    if (str in digits) return digits[str];
    if (str === '十') return 10;

    if (str.includes('十')) {
        const parts = str.split('十');
        if (parts.length !== 2) return NaN;
        const tens = parts[0] === '' ? 1 : digits[parts[0]];
        const ones = parts[1] === '' ? 0 : digits[parts[1]];
        if (tens === undefined || ones === undefined) return NaN;
        return tens * 10 + ones;
    }
    return NaN;
}

export function parseSmartInput(text, baseDate = new Date()) {
    if (!text || !text.trim()) return null;

    const { date, cleanText, recurrence } = parseDateKeyword(text, baseDate);

    const lines = cleanText.split('\n');
    let title = '';
    let link = '';
    let description = '';
    let time = '';
    let location = '';

    let firstLine = lines[0] || '';

    // 1. 解析網址
    const urlMatch = firstLine.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
        link = urlMatch[0];
        firstLine = firstLine.replace(urlMatch[0], '').trim();
    }

    // 2. 解析時間（支援 HH:MM 與中文時間，並驗證 0..23 / 0..59）
    const isPM = /(晚上|下午|夜間)/.test(firstLine);
    const isAM = /(早上|上午|清晨|凌晨)/.test(firstLine);
    let timeFound = false;

    const timeColonMatch = firstLine.match(/(\d{1,2})[:：](\d{1,2})/);
    if (timeColonMatch) {
        let h = parseInt(timeColonMatch[1], 10);
        const m = parseInt(timeColonMatch[2], 10);
        if (h > 23 || m > 59) {
            return { error: '時間格式無效，小時須為 0～23、分鐘須為 0～59' };
        }
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;

        firstLine = firstLine.replace(timeColonMatch[0], '').replace(/(晚上|下午|夜間|早上|上午|清晨|凌晨|中午)/g, '').trim();
        time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        timeFound = true;
    }

    if (!timeFound) {
        const timeCnMatch = firstLine.match(/([0-9零一二兩三四五六七八九十]+)點(半|([0-9零一二兩三四五六七八九十]+)分?)?/);
        if (timeCnMatch) {
            let h = parseChineseNumber(timeCnMatch[1]);
            let m = 0;
            if (timeCnMatch[2] === '半') {
                m = 30;
            } else if (timeCnMatch[3]) {
                m = parseChineseNumber(timeCnMatch[3]);
            }
            if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
                return { error: '時間格式無效，小時須為 0～23、分鐘須為 0～59' };
            }
            if (isPM && h < 12) h += 12;
            if (isAM && h === 12) h = 0;

            firstLine = firstLine.replace(timeCnMatch[0], '').replace(/(晚上|下午|夜間|早上|上午|清晨|凌晨|中午)/g, '').trim();
            time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
    }

    // 3. 解析地點（避免把「在家工作」之類含「在」的活動標題誤切為地點）
    const explicitLocMatch = firstLine.match(/地點[:：]\s*(.+?)(?=[，,。\n]|$)/);
    if (explicitLocMatch) {
        location = explicitLocMatch[1].trim();
        firstLine = firstLine.replace(explicitLocMatch[0], '').trim();
    } else {
        const prepLocMatch = firstLine.match(/(?:^|[\s，,])在([^\s，,。]+)/);
        if (prepLocMatch) {
            const candidateTitle = firstLine.replace(prepLocMatch[0], '').replace(/^[，,\s]+|[，,\s]+$/g, '').trim();
            if (candidateTitle) {
                location = prepLocMatch[1].trim();
                firstLine = candidateTitle;
            }
        }
    }

    firstLine = firstLine.replace(/^[，,\s]+|[，,\s]+$/g, '').trim();
    title = firstLine;

    // 4. 解析其餘多行附註與連結
    const descLines = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^https?:\/\//.test(line)) {
            if (!link) link = line;
            else descLines.push(line);
        } else {
            descLines.push(line);
        }
    }
    description = descLines.join('\n');

    return {
        date,
        data: {
            title,
            time,
            location,
            description,
            link,
            recurrence
        }
    };
}

function parseDateKeyword(text, baseDate) {
    const today = new Date(baseDate);
    today.setHours(0, 0, 0, 0);
    let targetDate = new Date(today);
    let extractedText = text;
    let found = false;
    let recurrence = 'none';

    const normText = text.trim().replace(/周/g, '週').replace(/禮拜/g, '週');

    // 1. 明確日期：YYYY/MM/DD 或 MM/DD
    const explicitDateMatch = normText.match(/^(?:(\d{4})[/\-\.])?(\d{1,2})[/\-\.](\d{1,2})/);
    if (explicitDateMatch) {
        const yStr = explicitDateMatch[1];
        const m = parseInt(explicitDateMatch[2], 10);
        const d = parseInt(explicitDateMatch[3], 10);

        let year = yStr ? parseInt(yStr, 10) : today.getFullYear();
        if (!yStr && today.getMonth() === 11 && m === 1 && today.getDate() > 15) {
            year += 1;
        }

        const testDate = new Date(year, m - 1, d);
        if (testDate.getFullYear() === year && testDate.getMonth() === m - 1 && testDate.getDate() === d) {
            targetDate = testDate;
            extractedText = normText.substring(explicitDateMatch[0].length).trim();
            found = true;
        }
    } else if (normText.startsWith('明天')) {
        targetDate.setDate(today.getDate() + 1);
        extractedText = normText.replace('明天', '').trim();
        found = true;
    } else if (normText.startsWith('後天')) {
        targetDate.setDate(today.getDate() + 2);
        extractedText = normText.replace('後天', '').trim();
        found = true;
    } else if (normText.startsWith('大後天')) {
        targetDate.setDate(today.getDate() + 3);
        extractedText = normText.replace('大後天', '').trim();
        found = true;
    } else if (normText.startsWith('今晚') || normText.startsWith('今天') || normText.startsWith('今日')) {
        extractedText = normText.replace(/^今[晚天日]/, '').trim();
        found = true;
    } else {
        const weekMap = { '日': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 };
        const everyWeekMatch = normText.match(/^每週([日一二三四五六])/);
        if (everyWeekMatch) {
            const targetDay = weekMap[everyWeekMatch[1]];
            let diff = targetDay - today.getDay();
            if (diff < 0) diff += 7;
            targetDate.setDate(today.getDate() + diff);
            extractedText = normText.substring(everyWeekMatch[0].length).trim();
            recurrence = 'weekly_current_month';
            found = true;
        } else {
            const weekMatch = normText.match(/^(下下週|下週|週|星期)([日一二三四五六])/);
            if (weekMatch) {
                const prefix = weekMatch[1];
                const targetDay = weekMap[weekMatch[2]];
                let diff = targetDay - today.getDay();
                if (prefix === '下週') {
                    diff += 7;
                } else if (prefix === '下下週') {
                    diff += 14;
                } else if (diff <= 0) {
                    diff += 7;
                }
                targetDate.setDate(today.getDate() + diff);
                extractedText = normText.substring(weekMatch[0].length).trim();
                found = true;
            }
        }
    }

    return found
        ? { date: targetDate, cleanText: extractedText, recurrence }
        : { date: today, cleanText: text.trim(), recurrence };
}
