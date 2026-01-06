import { formatDateKey } from './utils.js';

export function parseSmartInput(text) {
    if (!text.trim()) return null;

    // 1. 解析日期 (Date)
    const parseResult = parseDateKeyword(text);
    if (!parseResult) {
        return { error: '無法辨識日期' };
    }

    const { date, cleanText } = parseResult;

    // 2. 解析內容 (Content)
    const lines = cleanText.split('\n');
    let title = '';
    let link = '';
    let description = '';
    let time = '';
    let location = '';

    let firstLine = lines[0] || '';

    // --- Parse Link (Variable positions) ---
    const urlMatch = firstLine.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
        link = urlMatch[0];
        firstLine = firstLine.replace(urlMatch[0], '').trim();
    }
    
    // --- Parse Time (Enhanced) ---
    // 支援: 20:00, 8點, 8:00, 8點半, 晚上七點半 (Chinese Numerals)
    
    // Helper to convert Chinese/Arabic numbers to Integer
    const parseNumber = (str) => {
        if (!str) return 0;
        if (str.match(/^\d+$/)) return parseInt(str);
        
        const cnNums = {'零':0, '一':1, '二':2, '兩':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10, '十一':11, '十二':12};
        return cnNums[str] || 0;
    };

    // 先找是否有上下午修飾詞
    let periodOffset = 0; // 0, 12
    if (firstLine.match(/(晚上|下午|夜間)/)) {
        periodOffset = 12;
    }

    let timeFound = false;

    // 1. HH:MM (Colon format) - mostly digits
    const timeColonMatch = firstLine.match(/(\d{1,2})[:：](\d{1,2})/);
    if (timeColonMatch) {
        let h = parseInt(timeColonMatch[1]);
        const m = parseInt(timeColonMatch[2]);
        
        if (periodOffset === 12 && h < 12) h += 12;
        if (periodOffset === 12 && h === 12) h = 12;

        firstLine = firstLine.replace(/(晚上|下午|夜間|早上|上午|中午)/g, '');

        const hStr = String(h).padStart(2, '0');
        const mStr = String(m).padStart(2, '0');
        time = `${hStr}:${mStr}`;
        firstLine = firstLine.replace(timeColonMatch[0], '').trim();
        timeFound = true;
    }

    if (!timeFound) {
        // 2. Chinese/Mixed Format: "七點半", "7點30", "十二點"
        // Pattern: [Numbers]點 [Half/Numbers分]?
        // Capture groups: 1=(Hour), 2=(Half or MinutePart), 3=(Minute)
        const timeCnMatch = firstLine.match(/([0-9零一二兩三四五六七八九十]+)點(半|([0-9零一二兩三四五六七八九十]+)分)?/);
        
        if (timeCnMatch) {
            let h = parseNumber(timeCnMatch[1]);
            let m = 0;
            
            if (timeCnMatch[2] === '半') {
                m = 30;
            } else if (timeCnMatch[3]) {
                m = parseNumber(timeCnMatch[3]);
            }

            if (periodOffset === 12 && h < 12) h += 12;
            if (periodOffset === 12 && h === 12) h = 12;

            firstLine = firstLine.replace(/(晚上|下午|夜間|早上|上午|中午)/g, '');

            const hStr = String(h).padStart(2, '0');
            const mStr = String(m).padStart(2, '0');
            time = `${hStr}:${mStr}`;
            firstLine = firstLine.replace(timeCnMatch[0], '').trim();
        }
    }

    // --- Parse Location ---
    // 支援: 在XX, 地點:XX
    const locMatch = firstLine.match(/(?:在|地點[:：])\s*(.+?)(?=[，,。 ]|$)/);
    if (locMatch) {
        location = locMatch[1];
        firstLine = firstLine.replace(locMatch[0], '').trim();
    }

    firstLine = firstLine.replace(/^[，,]+|[，,]+$/g, '').trim();
    title = firstLine;

    // Process remaining lines for Link and Description
    let descLines = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^https?:\/\//)) {
            if (!link) link = line; 
            else descLines.push(line); 
        } else {
            descLines.push(line);
        }
    }
    description = descLines.join('\n');

    return {
        date: date,
        data: {
            title,
            time,
            location,
            description,
            link
        }
    };
}

function parseDateKeyword(text) {
    const today = new Date();
    let targetDate = new Date(today);
    let extractedText = text;
    let found = false;

    let normText = text.replace(/周/g, '週').replace(/禮拜/g, '週');

    // 1. Explicit Date: YYYY/MM/DD or MM/DD
    // Regex: (YYYY)?[-/.]MM[-/.]DD
    const explicitDateMatch = normText.match(/^(\d{4})?[/\-\.]?(\d{1,2})[/\-\.](\d{1,2})/);
    if (explicitDateMatch) {
        const yStr = explicitDateMatch[1];
        const m = parseInt(explicitDateMatch[2]);
        const d = parseInt(explicitDateMatch[3]);
        
        if (yStr) {
            targetDate.setFullYear(parseInt(yStr));
        }
        // Handle year wrap-around for MM/DD? (e.g. in Dec, typing 1/1 means next year)
        // Current logic: defaults to current year if no YYYY.
        
        targetDate.setMonth(m - 1, d);
        
        // Basic check for next year
        // If today is Dec and input is Jan, probably next year.
        if (!yStr && today.getMonth() === 11 && m === 1 && today.getDate() > 15) {
             targetDate.setFullYear(today.getFullYear() + 1);
        }

        extractedText = normText.substring(explicitDateMatch[0].length).trim();
        found = true;
    }

    else if (normText.startsWith('明天')) {
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
        extractedText = normText.replace(/今[晚天日]/, '').trim();
        found = true;
    } 
    else {
        const weekMap = {'日':0, '一':1, '二':2, '三':3, '四':4, '五':5, '六':6};
        const weekMatch = normText.match(/^(下下週|下週|週|星期)([日一二三四五六])/);
        
        if (weekMatch) {
            const prefix = weekMatch[1]; 
            const dayChar = weekMatch[2];
            const targetDay = weekMap[dayChar];
            const currentDay = today.getDay();
            
            let diff = targetDay - currentDay;
            if (prefix === '下週') {
                 diff += 7;
            } else if (prefix === '下下週') {
                 diff += 14;
            } else {
                if (diff <= 0) diff += 7; 
            }
            
            targetDate.setDate(today.getDate() + diff);
            extractedText = normText.substring(weekMatch[0].length).trim();
            found = true;
        }
    }

    if (found) {
        return { date: targetDate, cleanText: extractedText };
    }
    
    // Default: Return today if no keyword found, but mark as not 'strictly found' by key?
    // The previous logic returned today.
    return { date: today, cleanText: text }; 
}
