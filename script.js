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
// DOM 元素
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const modalOverlay = document.getElementById('event-modal');
const eventInput = document.getElementById('event-input'); // Now Title
const eventTimeInput = document.getElementById('event-time'); // New Time
const eventLocationInput = document.getElementById('event-location'); // New Location
const eventDescriptionInput = document.getElementById('event-description'); // New Note
const eventLinkInput = document.getElementById('event-link'); 
const selectedDateInput = document.getElementById('selected-date');
const modalTitle = document.getElementById('modal-title');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const smartInput = document.getElementById('smart-input');
const selectModeBtn = document.getElementById('select-mode-btn');
const eventRecurrenceInput = document.getElementById('event-recurrence');
const eventRecurrenceEndInput = document.getElementById('event-recurrence-end');
const recurrenceEndGroup = document.getElementById('recurrence-end-date-group');
const recurrenceInfo = document.getElementById('recurrence-info');

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
    // 1. Submit Button Click
    const smartSubmitBtn = document.getElementById('smart-submit-btn');
    if (smartSubmitBtn) {
        smartSubmitBtn.addEventListener('click', () => {
            handleSmartInput(smartInput.value);
        });
    }

    // 2. Keyboard: Enter = Newline (default), Ctrl+Enter = Submit
    smartInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault(); 
            handleSmartInput(smartInput.value);
        }
    });

    // Modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveEvent);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteEvent);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Recurrence Toggle
    if (eventRecurrenceInput) {
        eventRecurrenceInput.addEventListener('change', () => {
             updateRecurrenceInfo();          
             if (eventRecurrenceInput.value === 'custom') {
                 recurrenceEndGroup.style.display = 'block';
             } else {
                 recurrenceEndGroup.style.display = 'none';
             }
        });
    }
}

function updateRecurrenceInfo() {
    if (!eventRecurrenceInput || !recurrenceInfo) return;
    const dateKey = selectedDateInput.value;
    if (!dateKey) {
        recurrenceInfo.style.display = 'none';
        return;
    }
    
    const val = eventRecurrenceInput.value;
    if (val === 'none') {
        recurrenceInfo.style.display = 'none';
    } else {
        // Calculate Day of Week
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
        // Parse Local YMD
        const [y, m, d] = dateKey.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dayName = dayNames[dateObj.getDay()];
        
        recurrenceInfo.textContent = `將於每週${dayName}重複此活動`;
        recurrenceInfo.style.display = 'block';
    }
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
        // Hide split view container in week mode
        const splitContainer = document.getElementById('selected-day-events');
        if (splitContainer) splitContainer.style.display = 'none';
        
    } else {
        calendarGrid.className = 'calendar-container view-month';
        renderMonthView();
        
        // Mobile Split View Initialization
        if (window.innerWidth <= 640) {
            if (!activeSplitDate) {
                activeSplitDate = formatDateKey(currentDate);
            }
            renderSelectedDayEvents(activeSplitDate);
        }
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
            
        // Show Link Icon if link exists (Direct Click)
        const linkIcon = evt.link ? `<a href="${evt.link}" target="_blank" class="event-link-icon" onclick="event.stopPropagation()" title="開啟連結">🔗</a>` : '';
        const titleHtml = `<span class="event-title">${evt.title}</span>${linkIcon}`;
            
        let onClickAction = '';
        
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

    // Generate Event Dots
    const dotsHtml = `<div class="event-dots">
        ${dayEvents.slice(0, 5).map(evt => `<div class="event-dot"></div>`).join('')}
        ${dayEvents.length > 5 ? `<div class="event-dot more"></div>` : ''}
    </div>`;

    dayCard.innerHTML = `
        <div class="day-header">
            <div class="day-header-top">
                <div class="day-name">${dayNames[date.getDay()]}</div>
                <button class="btn-icon-sm share-day-btn" onclick="shareSpecificDay('${dateKey}')" title="分享此日行程">📤</button>
            </div>
            <div class="day-date">${date.getDate()}</div>
            ${holidayLabel}
            ${dotsHtml} <!-- Add Dots Here -->
        </div>
        <div class="events-container">
            ${eventsHtml}
        </div>
        <button class="add-event-btn" onclick="openAddModal('${dateKey}')">+ 新增</button>
    `;
    
    // Click Handling
    dayCard.onclick = (e) => {
        // Handle Mobile Split View Selection
        if (window.innerWidth <= 640 && currentView === 'month' && !isSelectionMode) {
             selectDay(dateKey);
             return;
        }

        // If selection mode, toggle selection
        if (isSelectionMode) {
            if (selectedDates.has(dateKey)) {
                selectedDates.delete(dateKey);
            } else {
                selectedDates.add(dateKey);
            }
            renderCalendar(); // Re-render to update style
        } 
    };

    if (currentView === 'month' && !isSelectionMode) {
        dayCard.ondblclick = (e) => {
            if (e.target === dayCard || e.target.classList.contains('day-header') || e.target.classList.contains('events-container')) {
                openAddModal(dateKey);
            }
        };
    }
    
    // Auto-select active date for split view if matches
    if (activeSplitDate === dateKey && window.innerWidth <= 640 && currentView === 'month') {
        dayCard.classList.add('selected-day');
    }

    calendarGrid.appendChild(dayCard);
}

// Mobile Split View Logic
let activeSplitDate = null; // Store currently selected date for split view

function selectDay(dateKey) {
    activeSplitDate = dateKey;
    
    // 1. Highlight in Grid
    document.querySelectorAll('.day-card').forEach(card => card.classList.remove('selected-day'));
    // Find the card (inefficient but simple for now, or re-render)
    // Re-render is safest to apply class, but maybe heavy. 
    // Let's try to just update class if possible, or re-render. Re-render is robust.
    renderCalendar();

    // 2. Render Bottom List
    renderSelectedDayEvents(dateKey);
}

function renderSelectedDayEvents(dateKey) {
    const container = document.getElementById('selected-day-events');
    const dayEvents = events[dateKey] || [];
    
    if (!container) return;
    
    // Format Date Header
    const dateObj = new Date(dateKey);
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const w = dayNames[dateObj.getDay()];
    
    let html = `<h3>${m}/${d} (${w}) 行程</h3>`;
    
    if (dayEvents.length === 0) {
        html += `<p style="color: var(--text-secondary); padding: 0.5rem;">無行程</p>`;
    } else {
        html += dayEvents.map((evt, index) => {
             const timeDisplay = evt.time === '全日' ? '全日' : (evt.time || '');
             const linkBtn = evt.link ? `<a href="${evt.link}" target="_blank" style="margin-left:8px; text-decoration:none;">🔗</a>` : '';
             
             return `
             <div class="event-item" onclick="editEvent('${dateKey}', ${index})">
                 <div class="event-time">${timeDisplay}</div>
                 <div class="event-title">
                    ${evt.title} ${linkBtn}
                    ${evt.location ? `<div style="font-size:0.8em; color:gray;">📍 ${evt.location}</div>` : ''}
                    ${evt.description ? `<div style="font-size:0.8em; color:gray; white-space:pre-wrap;">📝 ${evt.description}</div>` : ''}
                 </div>
             </div>
             `;
        }).join('');
    }
    
    // Add "Add Event" button at bottom
    html += `<button class="add-event-btn" onclick="openAddModal('${dateKey}')" style="margin-top:1rem;">+ 新增此日行程</button>`;
    
    container.innerHTML = html;
    container.classList.add('active');
}

// Global functions for HTML access
window.shareSpecificDay = function(dateKey) {
    const targetDate = new Date(dateKey);
    shareSchedule(targetDate, targetDate);
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

    // 2. 解析內容 (嘗試拆解 Time, Title, Link, Location, Note)
    const lines = cleanText.split('\n');
    let title = '';
    let link = '';
    let description = '';
    let time = '';
    let location = '';

    // Strategy: Process the first line for Metadata (Time, Location)
    // Then everything else goes to description/link
    
    let firstLine = lines[0] || '';

    // --- Parse Link from First Line ---
    // Extract URL to prevent it from remaining in the Title
    const urlMatch = firstLine.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
        link = urlMatch[0];
        firstLine = firstLine.replace(urlMatch[0], '').trim();
    }
    
    // --- Parse Time ---
    // Patterns: "10:00", "10點", "下午2點", "晚上8點30"
    // Regex: (\d{1,2})[:：點](\d{1,2})?
    const timeMatch = firstLine.match(/(\d{1,2})[:：點](\d{1,2})?/);
    if (timeMatch) {
         let h = parseInt(timeMatch[1]);
         let m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
         
         // Basic cleanup for Time string
         // Ensure 2 digits
         const hStr = String(h).padStart(2, '0');
         const mStr = String(m).padStart(2, '0');
         time = `${hStr}:${mStr}`;
         
         // Remove time from title (firstLine)
         // We remove the match string
         firstLine = firstLine.replace(timeMatch[0], '').trim();
         
         // Remove optional "分" or "半" if immediately following? 
         // Advanced: "10點半" -> "10:30"
         // Current: simple check. User said "10點".
    } else {
        // Handle "10點半" specific case?
        if (firstLine.includes('點半')) {
             const halfMatch = firstLine.match(/(\d{1,2})點半/);
             if (halfMatch) {
                 let h = parseInt(halfMatch[1]);
                 time = `${String(h).padStart(2, '0')}:30`;
                 firstLine = firstLine.replace(halfMatch[0], '').trim();
             }
        }
    }

    // --- Parse Location ---
    // Pattern: "在[地點]"
    // Ends with space, comma, newline, or end of string
    const locMatch = firstLine.match(/在(.+?)(?=[，,。 ]|$)/);
    if (locMatch) {
        location = locMatch[1];
        // Remove location pattern from title
        // Re-construct the match string to remove it?
        // Note: locMatch[0] is everything including "在"
        firstLine = firstLine.replace(locMatch[0], '').trim();
    }

    // Cleanup Title punctuation at start/end (commas left over from removal)
    firstLine = firstLine.replace(/^[，,]+|[，,]+$/g, '').trim();

    title = firstLine;

    // Process remaining lines for Link and Description
    let descLines = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^https?:\/\//)) {
            // Only overwrite if link strictly empty? Or maybe prioritize line-based link?
            // User requirement: "If found in smart field (implicit first line title context), cut to link".
            // If we already found one in Title, maybe keep it? Or overwrite? 
            // Let's assume if Title had it, that's the one. If not, check body.
            if (!link) link = line; 
            else descLines.push(line); // If we already have a link, treat this as desc? OR just ignore. Treating as desc seems safer.
        } else {
            descLines.push(line);
        }
    }
    description = descLines.join('\n');

    // 3. Confirm via Modal (不直接儲存，而是開啟 Modal 讓使用者確認)
    currentDate = new Date(date); // Move view to that date
    renderCalendar(); // Update view
    
    // Open Modal with pre-filled data
    openAddModal(dateKey, {
        title: title,
        time: time,
        location: location,
        description: description,
        link: link
    });

    smartInput.value = ''; // Clear input after successful parse
}

function parseDateKeyword(text) {
    const today = new Date();
    let targetDate = new Date(today);
    let extractedText = text;
    let found = false;

    // Normalized: replace common variants
    let normText = text.replace(/周/g, '週').replace(/禮拜/g, '週');

    if (normText.startsWith('明天')) {
        targetDate.setDate(today.getDate() + 1);
        extractedText = normText.replace('明天', '').trim();
        found = true;
    } else if (normText.startsWith('後天')) {
        targetDate.setDate(today.getDate() + 2);
        extractedText = normText.replace('後天', '').trim();
        found = true;
    } else if (normText.startsWith('今晚') || normText.startsWith('今天') || normText.startsWith('今日')) {
        extractedText = normText.replace(/今[晚天日]/, '').trim();
        found = true;
    } 
    // 關鍵字：下週X、星期X、週X
    else {
        const weekMap = {'日':0, '一':1, '二':2, '三':3, '四':4, '五':5, '六':6};
        
        // Regex: (下週|週|星期)([日一二三四五六])
        // Note: We normalized "周" -> "週", "禮拜" -> "週"
        const weekMatch = normText.match(/^(下週|週|星期)([日一二三四五六])/);
        
        if (weekMatch) {
            const prefix = weekMatch[1]; 
            const dayChar = weekMatch[2];
            const targetDay = weekMap[dayChar];
            const currentDay = today.getDay();
            
            let diff = targetDay - currentDay;
            
            if (prefix === '下週') {
                 diff += 7;
            } else {
                // "週二" - Look forward
                if (diff <= 0) diff += 7; 
            }
            
            targetDate.setDate(today.getDate() + diff);
            extractedText = normText.substring(weekMatch[0].length).trim();
            found = true;
        }
        else {
            const dateMatch = normText.match(/^(\d{1,2})[/\-\.\\](\d{1,2})/);
            if (dateMatch) {
                const m = parseInt(dateMatch[1]);
                const d = parseInt(dateMatch[2]);
                targetDate.setMonth(m - 1, d);
                
                extractedText = normText.substring(dateMatch[0].length).trim();
                found = true;
            }
        }
    }

    if (found) {
        return { date: targetDate, cleanText: extractedText };
    }
    // Default fallback: assume text IS content, date is Today? 
    // User requirement: "如果是今晚，就是預設本日... 沒有時間，就跳出訊息要使用者填... 不然就是預設全日"
    // So if no date found, default to Today
    return { date: today, cleanText: text }; 
}


// Global functions for HTML access
window.openAddModal = function(dateKey, preFill = null) {
    if (isSelectionMode) return; 
    selectedDateInput.value = dateKey;
    
    if (preFill) {
        // Smart Input Pre-fill
        eventInput.value = preFill.title || '';
        eventTimeInput.value = preFill.time || '';
        eventLocationInput.value = preFill.location || '';
        eventDescriptionInput.value = preFill.description || '';
        eventLinkInput.value = preFill.link || '';
        modalTitle.textContent = `確認行程 (${dateKey})`; // Change title for confirmation
        saveBtn.textContent = '確認新增';
    } else {
        // Manual Add
        eventInput.value = ''; 
        eventTimeInput.value = '';
        eventLocationInput.value = '';
        eventDescriptionInput.value = '';
        eventLinkInput.value = '';
        editingIndex = -1;
        modalTitle.textContent = `新增行程 (${dateKey})`;
        saveBtn.textContent = '儲存';
    }
    
    // Hide Delete Button for New Events
    if (deleteBtn) deleteBtn.style.display = 'none';

    // Clear editing index if adding new
    if (preFill || editingIndex === -1) editingIndex = -1;

    modalOverlay.classList.add('active');
    
    // Reset Recurrence (Available only for new events)
    if (eventRecurrenceInput) {
        eventRecurrenceInput.value = 'none';
        eventRecurrenceInput.disabled = (editingIndex >= 0); // Disable recurrence when editing existing
    }
    if (recurrenceEndGroup) recurrenceEndGroup.style.display = 'none';
    if (eventRecurrenceEndInput) eventRecurrenceEndInput.value = '';
    
    // Update Info Text
    updateRecurrenceInfo();

    setTimeout(() => eventInput.focus(), 100); 
}

window.editEvent = function(dateKey, index) {
    if (isSelectionMode) return;
    const evt = events[dateKey][index];
    if (!evt) return;
    selectedDateInput.value = dateKey;
    
    eventInput.value = evt.title || '';
    eventTimeInput.value = evt.time || '';
    eventLocationInput.value = evt.location || '';
    eventDescriptionInput.value = evt.description || '';
    eventLinkInput.value = evt.link || '';
    
    editingIndex = index;
    modalTitle.textContent = `編輯行程 (${dateKey})`;
    saveBtn.textContent = '更新';
    
    // Show Delete Button for Existing Events
    if (deleteBtn) deleteBtn.style.display = 'block';

    modalOverlay.classList.add('active');
    setTimeout(() => eventInput.focus(), 100);
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

function saveEvent() {
    const title = eventInput.value.trim();
    const time = eventTimeInput.value.trim();
    const location = eventLocationInput.value.trim();
    const description = eventDescriptionInput.value.trim();
    const link = eventLinkInput.value.trim();
    const dateKey = selectedDateInput.value;
    
    if (!title) {
        alert('請輸入標題');
        return;
    }
    
    // User rule: "沒有時間... 不然就是預設全日"
    // If user leaves time blank, we can default to '全日' OR keep it blank?
    // Let's default to '全日' if blank, as per implied requirement or just let it be blank.
    // The requirement said "No time -> pop message OR default all day".
    // Since we are in Modal, user can see it is blank. If they save blank -> All Day?
    
    let finalTime = time;
    if (!finalTime) finalTime = '全日';

    const newEvent = {
        title: title,
        time: finalTime,
        location: location,
        description: description,
        link: link
    };
    
    if (!events[dateKey]) events[dateKey] = [];
    if (editingIndex >= 0) {
        events[dateKey][editingIndex] = newEvent;
    } else {
        // Handle Recurrence (Only for new events)
        const recurrence = eventRecurrenceInput ? eventRecurrenceInput.value : 'none';
        
        if (recurrence === 'none' || editingIndex >= 0) {
            events[dateKey].push(newEvent);
        } else {
            // Recurrence Logic
            // Parse Local Date robustly
            const [y, m, d] = dateKey.split('-').map(Number);
            let startDate = new Date(y, m - 1, d);
            let endDate = new Date(startDate);
            
            if (recurrence === 'weekly_current_month') {
                // End of current month
                endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            } else if (recurrence === 'weekly_3_month') {
                // 3 months later
                endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate());
            } else if (recurrence === 'custom') {
                const customEnd = eventRecurrenceEndInput.value;
                if (customEnd) {
                    endDate = new Date(customEnd);
                } else {
                    // Fallback if no date selected
                     events[dateKey].push(newEvent);
                     alert('未選擇結束日期，僅新增單一事件');
                     // reset logic to avoid loop???
                     // actually just return/break
                     endDate = startDate; 
                }
            }

            // Loop and add events
            // Start from valid start date
            let loopDate = new Date(startDate);
            while (loopDate <= endDate) {
                const loopKey = formatDateKey(loopDate);
                
                // Clone event object to ensure independence
                const clonedEvent = { ...newEvent };
                
                if (!events[loopKey]) events[loopKey] = [];
                events[loopKey].push(clonedEvent);
                
                // Sort immediately for this day
                events[loopKey].sort((a, b) => {
                    if (a.time === '全日') return -1;
                    if (b.time === '全日') return 1;
                    return (a.time || '').localeCompare(b.time || '');
                });

                // Next week
                loopDate.setDate(loopDate.getDate() + 7);
            }
        }
    }
    
    // Sort logic
    events[dateKey].sort((a, b) => {
        if (a.time === '全日') return -1;
        if (b.time === '全日') return 1;
        return (a.time || '').localeCompare(b.time || '');
    });

    localStorage.setItem('calendar_events', JSON.stringify(events));
    renderCalendar();
    closeModal();
}

function deleteEvent() {
    const dateKey = selectedDateInput.value;
    if (editingIndex === -1) return; // Should not happen
    
    if (!confirm('確定要刪除這個行程嗎？')) return;
    
    if (events[dateKey]) {
        events[dateKey].splice(editingIndex, 1);
        if (events[dateKey].length === 0) {
            delete events[dateKey];
        }
    }
    
    localStorage.setItem('calendar_events', JSON.stringify(events));
    renderCalendar();
    closeModal();
}

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
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
});

btnShareMessenger.addEventListener('click', async () => {
    const text = shareTextPreview.value;
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
        
        if (dayEvents.length > 0) {
            hasEvents = true;
            const m = iterDate.getMonth() + 1;
            const d = iterDate.getDate();
            const dayName = dayNames[iterDate.getDay()];
            
            let dateLine = `${m}/${d} ${dayName}`;
            if (holidayName) dateLine += ` [${holidayName}]`;
            
            exportText += `${dateLine}\n`;
            
            dayEvents.forEach(evt => {
                // Requested Format:
                // 時間
                // 地點
                // 附註
                // 網址
                exportText += `時間：${evt.time || '全日'}\n`;
                exportText += `事項：${evt.title}\n`; // Include title obviously
                if (evt.location) exportText += `地點：${evt.location}\n`;
                if (evt.description) exportText += `附註：${evt.description}\n`;
                if (evt.link) exportText += `網址：${evt.link}\n`;
                exportText += `\n`; 
            });
            exportText += `------------------\n`;
        }
        
        iterDate.setDate(iterDate.getDate() + 1);
    }

    if (!hasEvents) {
        exportText += "尚無安排行程。\n";
    }
    
    exportText += "Generated by Calendar Card App";
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
    const datesArr = Array.from(selectedDates).sort();
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
        
        const dayEvents = events[dateKey] || [];
        if (dayEvents.length > 0) {
            exportText += `${dateLine}\n`;
            dayEvents.forEach(evt => {
                exportText += `時間：${evt.time || '全日'}\n`;
                exportText += `事項：${evt.title}\n`;
                if (evt.location) exportText += `地點：${evt.location}\n`;
                if (evt.description) exportText += `附註：${evt.description}\n`;
                if (evt.link) exportText += `網址：${evt.link}\n`;
                exportText += `\n`;
            });
             exportText += `------------------\n`;
        }
    });

    exportText += "Generated by Calendar Card App";
    openShareModal(exportText);
}

// --- Google Calendar API Integration REMOVED ---

