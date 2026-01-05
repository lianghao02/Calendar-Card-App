// 狀態變數
let currentDate = new Date();
const events = JSON.parse(localStorage.getItem('calendar_events')) || {};
let editingIndex = -1;
let currentView = 'week'; 

// 2026 台灣國定假日 (Source: Search Results)
const HOLIDAYS_2026 = {
    '2026-01-01': '元旦',
    '2026-02-14': '春節連假',
    '2026-02-15': '春節連假',
    '2026-02-16': '春節連假', // 農曆除夕前一日 (補假/調整) or actual
    '2026-02-17': '除夕', // 假設
    '2026-02-18': '春節',
    '2026-02-19': '春節',
    '2026-02-20': '春節',
    '2026-02-21': '春節',
    '2026-02-22': '春節連假',
    '2026-02-27': '228連假', 
    '2026-02-28': '和平紀念日',
    '2026-03-01': '228連假',
    '2026-04-03': '兒童節連假',
    '2026-04-04': '兒童節',
    '2026-04-05': '清明節',
    '2026-04-06': '清明連假',
    '2026-05-01': '勞動節',
    '2026-05-02': '勞動節連假',
    '2026-05-03': '勞動節連假',
    '2026-06-19': '端午節',
    '2026-06-20': '端午連假',
    '2026-06-21': '端午連假',
    '2026-09-25': '中秋節',
    '2026-09-26': '中秋連假',
    '2026-09-27': '中秋連假',
    '2026-09-28': '教師節/中秋連假',
    '2026-10-09': '國慶連假',
    '2026-10-10': '國慶日',
    '2026-10-11': '國慶連假',
    '2026-10-24': '光復節連假', 
    '2026-10-25': '台灣光復節', 
    '2026-10-26': '光復節連假',
    '2026-12-25': '行憲紀念日', 
    '2026-12-26': '行憲連假', 
    '2026-12-27': '行憲連假'
};

// Selection State
let isSelectionMode = false;
let selectedDates = new Set(); // Stores dateKey strings

// DOM 元素
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const modalOverlay = document.getElementById('event-modal');
const eventInput = document.getElementById('event-input');
const eventLinkInput = document.getElementById('event-link'); // New
const selectedDateInput = document.getElementById('selected-date');
const modalTitle = document.getElementById('modal-title');
const saveBtn = document.getElementById('save-btn');
const smartInput = document.getElementById('smart-input');
const selectModeBtn = document.getElementById('select-mode-btn'); // New

// View Toggles
const viewWeekBtn = document.getElementById('view-week');
const viewMonthBtn = document.getElementById('view-month');

// Share Modal Elements
const shareModalOverlay = document.getElementById('share-modal-overlay');
const closeShareModalBtn = document.getElementById('close-share-modal');
const shareTextPreview = document.getElementById('share-text-preview');
const btnShareLine = document.getElementById('share-line');
const btnShareMessenger = document.getElementById('share-messenger');
const btnShareCopy = document.getElementById('share-copy');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderDate();
    renderCalendar();
    setupEventListeners();
});

// 設定事件監聽器
function setupEventListeners() {
    // Navigation
    document.getElementById('prev-btn').addEventListener('click', () => changeDate(-1));
    document.getElementById('next-btn').addEventListener('click', () => changeDate(1));
    document.getElementById('today-btn').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
    
    // Share
    // Share
    document.getElementById('share-btn').addEventListener('click', () => {
        if (isSelectionMode && selectedDates.size > 0) {
            shareSelectedDates();
        } else {
            shareSchedule(); // Default: Share current view (Week/Month)
        }
    });

    // Select Mode Toggle
    selectModeBtn.addEventListener('click', toggleSelectionMode);
    
    // View Switching
    viewWeekBtn.addEventListener('click', () => switchView('week'));
    viewMonthBtn.addEventListener('click', () => switchView('month'));

    // Smart Input
    smartInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSmartInput(smartInput.value);
            smartInput.value = '';
        }
    });

    // Modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveEvent);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode;
    if (isSelectionMode) {
        selectModeBtn.classList.add('active'); // Add CSS for active state
        selectModeBtn.style.backgroundColor = '#e0e7ff';
        selectedDates.clear();
    } else {
        selectModeBtn.classList.remove('active');
        selectModeBtn.style.backgroundColor = '';
        selectedDates.clear();
    }
    renderCalendar(); // Re-render to show checkboxes or selection state
}

function switchView(view) {
    currentView = view;
    // Update active button state
    if (view === 'week') {
        viewWeekBtn.classList.add('active');
        viewMonthBtn.classList.remove('active');
    } else {
        viewMonthBtn.classList.add('active');
        viewWeekBtn.classList.remove('active');
    }
    renderCalendar();
}

function changeDate(direction) {
    if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
    } else {
        // Month view: change month
        currentDate.setMonth(currentDate.getMonth() + direction);
    }
    renderCalendar();
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    if (currentView === 'week') {
        calendarGrid.className = 'calendar-container view-week';
        renderWeekView();
    } else {
        calendarGrid.className = 'calendar-container view-month';
        renderMonthView();
    }
}

function renderWeekView() {
    // 計算該週的星期日
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay(); 
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    updateHeaderDate(startOfWeek, 'week');

    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        createDayCard(day, false);
    }
}

function renderMonthView() {
    // 計算當月第一天與最後一天
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // 計算月曆開始日 (補齊前面的空白日)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // 計算月曆結束日 (補齊後面的空白日，需填滿 6 週或 5 週)
    const endDate = new Date(lastDayOfMonth);
    if (endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    updateHeaderDate(new Date(year, month, 1), 'month');

    // 生成月曆格子
    let iterDate = new Date(startDate);
    
    // 增加週標題 (Optional, 但月檢視如果沒有標題會很怪，這裡因為原本卡片有標題，所以我們用 CSS 隱藏卡片內的標題，可以考慮在 Grid 上方加一排 Headers)
    // 簡單起見，我們在每張卡片內保持 Day Name，但 CSS 已經 hide 掉了。
    // 更好的做法是：如果 iterDate 是第一行，顯示星期幾？
    // 暫時維持原狀，依賴 CSS 樣式。

    while (iterDate <= endDate) {
        const isOtherMonth = iterDate.getMonth() !== month;
        createDayCard(iterDate, isOtherMonth);
        iterDate.setDate(iterDate.getDate() + 1);
    }
}

function createDayCard(date, isOtherMonth) {
    const dateKey = formatDateKey(date);
    
    const dayCard = document.createElement('div');
    dayCard.classList.add('day-card');
    if (isOtherMonth) dayCard.classList.add('other-month');
    
    // Selection Mode Visuals
    if (isSelectionMode) {
        if (selectedDates.has(dateKey)) {
            dayCard.classList.add('selected-day'); // Need CSS
            dayCard.style.border = '2px solid #6366f1';
            dayCard.style.backgroundColor = '#eef2ff';
        }
    }

    // 補上缺失的變數定義
    const holidayName = HOLIDAYS_2026[dateKey];
    const holidayLabel = holidayName ? `<div class="holiday-label">${holidayName}</div>` : '';
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    
    // Logic for weekend/holiday styling
    const dayOfWeek = date.getDay();
    // Pink if: Sunday(0), Saturday(6), or is a Holiday
    if (dayOfWeek === 0 || dayOfWeek === 6 || holidayName) {
        dayCard.classList.add('holiday');
    }

    // 修正: 為了讓 editEvent 正常運作，在 map 時需查找原始 index
    const dayEvents = events[dateKey] || [];
    const eventsHtml = dayEvents.map((evt) => {
        const timeHtml = evt.time === '全日' 
            ? `<span class="event-badge all-day">全日</span>` 
            : (evt.time ? `<span class="event-time">${evt.time}</span>` : '');
            
        // Show Link Icon if link exists
        const linkIcon = evt.link ? `<span style="margin-left:4px; font-size: 0.8em;" title="包含連結">🔗</span>` : '';
        const titleHtml = `<span class="event-title">${evt.title}${linkIcon}</span>`;
            
        let onClickAction = '';
        if (evt.link && !isSelectionMode) {
            // Priority: Click event to edit, but maybe link icon to open?
            // User requirement: "Can also select multi dates to share". 
            // Let's make the whole item clickable to edit, but show link in text.
            // Actually, if it has a link, maybe we want to visit it easily?
            // "Share message including link". 
            // Let's keep click = edit. Link visiting can be done via proper copy or separate button.
            // Or maybe small icon click = open link.
        }
        
        // Find index
        const realIndex = events[dateKey].indexOf(evt);
        if (!isSelectionMode) {
            onClickAction = `editEvent('${dateKey}', ${realIndex})`;
        }
            
        return `
        <div class="event-item" onclick="${onClickAction}; event && event.stopPropagation();">
            ${timeHtml}
            ${titleHtml}
        </div>
        `;
    }).join('');

    dayCard.innerHTML = `
        <div class="day-header">
            <div class="day-header-top">
                <div class="day-name">${dayNames[date.getDay()]}</div>
                <button class="btn-icon-sm share-day-btn" onclick="shareSpecificDay('${dateKey}')" title="分享此日行程">📤</button>
            </div>
            <div class="day-date">${date.getDate()}</div>
            ${holidayLabel}
        </div>
        <div class="events-container">
            ${eventsHtml}
        </div>
        <button class="add-event-btn" onclick="openAddModal('${dateKey}')">+ 新增</button>
    `;
    
    // Click Handling
    dayCard.onclick = (e) => {
        // If selection mode, toggle selection
        if (isSelectionMode) {
            if (selectedDates.has(dateKey)) {
                selectedDates.delete(dateKey);
            } else {
                selectedDates.add(dateKey);
            }
            renderCalendar(); // Re-render to update style
        } 
        // Normal mode: Month view double click -> add
        // else do nothing (handled by buttons)
    };

    if (currentView === 'month' && !isSelectionMode) {
        dayCard.ondblclick = (e) => {
            if (e.target === dayCard || e.target.classList.contains('day-header') || e.target.classList.contains('events-container')) {
                openAddModal(dateKey);
            }
        };
    }

    calendarGrid.appendChild(dayCard);
}

// Global functions for HTML access
window.shareSpecificDay = function(dateKey) {
    // 呼叫 shareSchedule 但指定單日範圍
    const targetDate = new Date(dateKey);
    shareSchedule(targetDate, targetDate);
    // 阻止事件冒泡 (如果按鈕在 header 內)
    event && event.stopPropagation();
}


function updateHeaderDate(date = currentDate, type = currentView) {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;

    if (type === 'month') {
        currentMonthYear.textContent = `${y} 年 ${m} 月`;
    } else {
        // Week view header logic
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        const startM = startOfWeek.getMonth() + 1;
        const endM = endOfWeek.getMonth() + 1;
        
        if (startM === endM) {
            currentMonthYear.textContent = `${startOfWeek.getFullYear()} 年 ${startM} 月`;
        } else {
            currentMonthYear.textContent = `${startOfWeek.getFullYear()} 年 ${startM} 月 - ${endM} 月`;
        }
    }
}

// 智慧輸入處理
function handleSmartInput(text) {
    if (!text.trim()) return;

    // 1. 解析日期
    const parseResult = parseDateKeyword(text);
    if (!parseResult) {
        alert('無法辨識日期，請試試：「明天 10:00 開會」或「1/20 生日」');
        return;
    }

    const { date, cleanText } = parseResult;
    const dateKey = formatDateKey(date);

    // 2. 解析時間 (Reuse logic)
    // 簡單解析：嘗試尋找 "http" 作為連結? 
    // 目前先只處理標題，連結建議在 Modal 內輸入完整
    
    const timeMatch = cleanText.match(/(\d{1,2}:\d{2})\s*(.*)/);
    let newEvent = {};
    
    if (timeMatch) {
         let title = timeMatch[2];
         newEvent = {
            time: timeMatch[1],
            title: title.trim() || '未命名行程',
            link: ''
        };
    } else {
        newEvent = {
            time: '全日',
            title: cleanText.trim(),
            link: ''
        };
    }

    // 3. 存入 Local
    if (!events[dateKey]) events[dateKey] = [];
    events[dateKey].push(newEvent);
    events[dateKey].sort((a, b) => {
        if (a.time === '全日') return -1;
        if (b.time === '全日') return 1;
        return (a.time || '').localeCompare(b.time || '');
    });
    
    localStorage.setItem('calendar_events', JSON.stringify(events));
    currentDate = new Date(date);
    renderCalendar();
}

function parseDateKeyword(text) {
    const today = new Date();
    let targetDate = new Date(today);
    let extractedText = text;
    let found = false;

    // 關鍵字：明天、後天
    if (text.startsWith('明天')) {
        targetDate.setDate(today.getDate() + 1);
        extractedText = text.replace('明天', '').trim();
        found = true;
    } else if (text.startsWith('後天')) {
        targetDate.setDate(today.getDate() + 2);
        extractedText = text.replace('後天', '').trim();
        found = true;
    } 
    // 關鍵字：下週X、星期X
    else {
        const weekMap = {'日':0, '一':1, '二':2, '三':3, '四':4, '五':5, '六':6};
        const weekMatch = text.match(/^(下週|星期)([日一二三四五六])/);
        
        if (weekMatch) {
            const prefix = weekMatch[1]; // 下週 or 星期
            const dayChar = weekMatch[2];
            const targetDay = weekMap[dayChar];
            const currentDay = today.getDay();
            
            let diff = targetDay - currentDay;
            if (prefix === '下週') {
                diff += 7;
            } else if (prefix === '星期') {
                if (diff <= 0) diff += 7;
            }
            
            targetDate.setDate(today.getDate() + diff);
            // remove matched string
            extractedText = text.substring(weekMatch[0].length).trim();
            found = true;
        }
        // 日期格式：MM/DD, M/D, M\D, M.D (支援 / \ . -)
        // 必須在字串開頭
        else {
            const dateMatch = text.match(/^(\d{1,2})[/\-\.\\](\d{1,2})/);
            if (dateMatch) {
                const m = parseInt(dateMatch[1]);
                const d = parseInt(dateMatch[2]);
                targetDate.setMonth(m - 1, d);
                
                extractedText = text.substring(dateMatch[0].length).trim();
                found = true;
            }
        }
    }

    if (found) {
        return { date: targetDate, cleanText: extractedText };
    }
    return null;
}

// Global functions for HTML access
window.openAddModal = function(dateKey) {
    if (isSelectionMode) return; // Disable in selection mode
    selectedDateInput.value = dateKey;
    eventInput.value = ''; 
    eventLinkInput.value = ''; // Clear link
    editingIndex = -1;
    modalTitle.textContent = `新增行程 (${dateKey})`;
    saveBtn.textContent = '儲存';
    modalOverlay.classList.add('active');
    setTimeout(() => eventInput.focus(), 100); 
}

window.editEvent = function(dateKey, index) {
    if (isSelectionMode) return;
    const evt = events[dateKey][index];
    if (!evt) return;
    selectedDateInput.value = dateKey;
    eventInput.value = evt.time ? `${evt.time} ${evt.title}` : evt.title;
    eventLinkInput.value = evt.link || ''; // Load link
    editingIndex = index;
    modalTitle.textContent = `編輯行程 (${dateKey})`;
    saveBtn.textContent = '更新';
    modalOverlay.classList.add('active');
    setTimeout(() => eventInput.focus(), 100);
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

function saveEvent() {
    const text = eventInput.value.trim();
    const link = eventLinkInput.value.trim(); // Get Link
    const dateKey = selectedDateInput.value;
    
    if (!text) {
        alert('請輸入內容');
        return;
    }

    const timeMatch = text.match(/^(\d{1,2}:\d{2})\s+(.*)/);
    let newEvent = {};
    if (timeMatch) {
         newEvent = { time: timeMatch[1], title: timeMatch[2], link: link };
    } else {
         newEvent = { time: '', title: text, link: link };
    }
    
    if (!events[dateKey]) events[dateKey] = [];
    if (editingIndex >= 0) {
        events[dateKey][editingIndex] = newEvent;
    } else {
        events[dateKey].push(newEvent);
    }
    events[dateKey].sort((a, b) => {
        if (a.time === '全日') return -1;
        if (b.time === '全日') return 1;
        return (a.time || '').localeCompare(b.time || '');
    });

    localStorage.setItem('calendar_events', JSON.stringify(events));
    renderCalendar();
    closeModal();
}

// Button references moved to top


function openShareModal(text) {
    shareTextPreview.value = text;
    shareModalOverlay.classList.add('active');
}

function closeShareModal() {
    shareModalOverlay.classList.remove('active');
}

closeShareModalBtn.addEventListener('click', closeShareModal);
shareModalOverlay.addEventListener('click', (e) => {
    if (e.target === shareModalOverlay) closeShareModal();
});

// Social Share Actions
btnShareLine.addEventListener('click', () => {
    const text = shareTextPreview.value;
    // LINE URL Scheme
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
});

btnShareMessenger.addEventListener('click', async () => {
    const text = shareTextPreview.value;
    // Messenger Process: Copy text -> Open App/Web
    try {
        await navigator.clipboard.writeText(text);
        alert('行程文字已複製！\n即將開啟 Messenger，請貼上送出。');
        window.open('https://www.messenger.com/', '_blank'); 
    } catch (err) {
        alert('複製失敗，請手動複製文字。');
    }
});

btnShareCopy.addEventListener('click', async () => {
    const text = shareTextPreview.value;
    try {
        await navigator.clipboard.writeText(text);
        alert('已複製到剪貼簿！');
        closeShareModal();
    } catch (err) {
        alert('複製失敗，請手動選取複製。');
    }
});


// 分享行程 (支援範圍：預設為目前視圖，或指定 Start/End)
async function shareSchedule(customStart = null, customEnd = null) {
    let startDate, endDate;
    let titleStr = "";

    if (customStart && customEnd) {
        // 單日或指定範圍
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        
        const m = startDate.getMonth() + 1;
        const d = startDate.getDate();
        
        if (startDate.getTime() === endDate.getTime()) {
             titleStr = `📅 ${m}/${d} 行程`;
        } else {
             titleStr = `📅 ${m}/${d} - ... 行程`;
        }
    } else {
        // Fallback
        if (currentView === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            startDate = startOfWeek;
            endDate = new Date(startOfWeek);
            endDate.setDate(endDate.getDate() + 6);
            titleStr = `📅 本週行程`;
        } else {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month + 1, 0);
            titleStr = `📅 ${year}年${month + 1}月 行程`;
        }
    }

    // 2. 收集該範圍內的行程
    let exportText = `${titleStr}\n------------------\n`;
    let hasEvents = false;
    
    let iterDate = new Date(startDate);
    iterDate.setHours(0,0,0,0);
    const endTimestamp = endDate.setHours(23,59,59,999);
    
    const dayNames = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)'];

    while (iterDate.getTime() <= endTimestamp) {
        const dateKey = formatDateKey(iterDate);
        const dayEvents = events[dateKey] || [];
        const holidayName = HOLIDAYS_2026[dateKey];
        
        if (dayEvents.length > 0 || holidayName) {
            hasEvents = true;
            const m = iterDate.getMonth() + 1;
            const d = iterDate.getDate();
            const dayName = dayNames[iterDate.getDay()];
            
            let dateLine = `${m}/${d} ${dayName}`;
            if (holidayName) dateLine += ` [${holidayName}]`;
            
            exportText += `${dateLine}\n`;
            
            if (dayEvents.length > 0) {
                dayEvents.forEach(evt => {
                    if (evt.time === '全日') {
                        exportText += `⭕ 全日: ${evt.title}\n`;
                    } else if (evt.time) {
                        exportText += `🕒 ${evt.time} ${evt.title}\n`;
                    } else {
                        exportText += `• ${evt.title}\n`;
                    }
                });
            } else if (holidayName) {
                exportText += `🎉 放假\n`;
            }
            exportText += `\n`;
        }
        
        iterDate.setDate(iterDate.getDate() + 1);
    }

    if (!hasEvents) {
        exportText += "尚無安排行程。\n";
    }
    
    exportText += "------------------\nGenerated by Calendar Card App";

    // 3. 開啟分享視窗 (取代原有的 navigator.share)
    openShareModal(exportText);
}

function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Multi-Select Share
function shareSelectedDates() {
    const datesArr = Array.from(selectedDates).sort(); // Sort by date
    if (datesArr.length === 0) return;

    let exportText = `📅 自選行程 (${datesArr.length}天)\n------------------\n`;
    
    datesArr.forEach(dateKey => {
        const dateObj = new Date(dateKey);
        const m = dateObj.getMonth() + 1;
        const d = dateObj.getDate();
        const dayNames = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)'];
        const dayName = dayNames[dateObj.getDay()];
        const holidayName = HOLIDAYS_2026[dateKey];
        
        let dateLine = `${m}/${d} ${dayName}`;
        if (holidayName) dateLine += ` [${holidayName}]`;
        
        exportText += `${dateLine}\n`;
        
        const dayEvents = events[dateKey] || [];
        if (dayEvents.length > 0) {
            dayEvents.forEach(evt => {
                if (evt.time === '全日') {
                    exportText += `⭕ 全日: ${evt.title}\n`;
                } else if (evt.time) {
                    exportText += `🕒 ${evt.time} ${evt.title}\n`;
                } else {
                    exportText += `• ${evt.title}\n`;
                }
            });
        } else if (holidayName) {
            exportText += `🎉 放假\n`;
        } else {
             exportText += `(無行程)\n`;
        }
        exportText += `\n`;
    });

    exportText += "------------------\nGenerated by Calendar Card App";
    openShareModal(exportText);
}

// --- Google Calendar API Integration REMOVED ---

