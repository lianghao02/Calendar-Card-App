// 狀態變數
let currentDate = new Date();
const events = JSON.parse(localStorage.getItem('calendar_events')) || {};
let editingIndex = -1; // -1 代表新增模式，>=0 代表編輯模式的索引

// DOM 元素
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const modalOverlay = document.getElementById('event-modal');
const eventInput = document.getElementById('event-input');
const selectedDateInput = document.getElementById('selected-date');
const modalTitle = document.getElementById('modal-title');
const saveBtn = document.getElementById('save-btn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    setupEventListeners();
});

// 設定事件監聽器
function setupEventListeners() {
    document.getElementById('prev-week').addEventListener('click', () => changeWeek(-7));
    document.getElementById('next-week').addEventListener('click', () => changeWeek(7));
    document.getElementById('today-btn').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });

    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveEvent);
    
    // 點擊 Modal 外部關閉
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

// 變更週次
function changeWeek(days) {
    currentDate.setDate(currentDate.getDate() + days);
    renderCalendar();
}

// 渲染日曆
function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    // 計算該週的星期日 (Start of Week)
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay(); // 0 is Sunday
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    // 更新標題
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const startMonth = startOfWeek.getMonth() + 1;
    const startYear = startOfWeek.getFullYear();
    const endMonth = endOfWeek.getMonth() + 1;
    
    if (startMonth === endMonth) {
        currentMonthYear.textContent = `${startYear} 年 ${startMonth} 月`;
    } else {
        currentMonthYear.textContent = `${startYear} 年 ${startMonth} 月 - ${endMonth} 月`;
    }

    // 產生 7 天卡片
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        
        const dateKey = formatDateKey(day);
        const dayEvents = events[dateKey] || [];
        const isToday = isSameDay(day, new Date());

        const dayCard = document.createElement('div');
        dayCard.className = `day-card ${isToday ? 'current-day' : ''}`;
        
        const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        
        // 生成事件 HTML，注意這裡加入 stopPropagation 避免觸發卡片點擊 (如果有卡片點擊邏輯的話)
        const eventsHtml = dayEvents.map((evt, index) => `
            <div class="event-item" onclick="editEvent('${dateKey}', ${index})">
                ${evt.time ? `<span class="event-time">${evt.time}</span>` : ''}
                <span class="event-title">${evt.title}</span>
            </div>
        `).join('');

        dayCard.innerHTML = `
            <div class="day-header">
                <div class="day-name">${dayNames[i]}</div>
                <div class="day-date">${day.getDate()}</div>
            </div>
            <div class="events-container">
                ${eventsHtml}
            </div>
            <button class="add-event-btn" onclick="openAddModal('${dateKey}')">+ 新增行程</button>
        `;

        calendarGrid.appendChild(dayCard);
    }
}

// 開啟新增 Modal
window.openAddModal = function(dateKey) {
    selectedDateInput.value = dateKey;
    eventInput.value = ''; 
    editingIndex = -1; // Reset to new mode
    
    modalTitle.textContent = `新增行程 (${dateKey})`;
    saveBtn.textContent = '儲存';
    
    modalOverlay.classList.add('active');
    setTimeout(() => eventInput.focus(), 100); 
}

// 開啟編輯 Modal
window.editEvent = function(dateKey, index) {
    // 阻止事件冒泡在 HTML onclick 中較難處理，這裡直接執行邏輯
    const evt = events[dateKey][index];
    if (!evt) return;
    
    selectedDateInput.value = dateKey;
    // 組合時間與標題回顯
    eventInput.value = evt.time ? `${evt.time} ${evt.title}` : evt.title;
    editingIndex = index;
    
    modalTitle.textContent = `編輯行程 (${dateKey})`;
    saveBtn.textContent = '更新';
    
    modalOverlay.classList.add('active');
    setTimeout(() => eventInput.focus(), 100);
}

// 關閉 Modal
function closeModal() {
    modalOverlay.classList.remove('active');
}

// 儲存事件
function saveEvent() {
    const text = eventInput.value.trim();
    const dateKey = selectedDateInput.value;
    
    if (!text) {
        alert('請輸入內容');
        return;
    }

    // 解析簡單格式 (例如: "14:00 專案會議")
    const timeMatch = text.match(/^(\d{1,2}:\d{2})\s+(.*)/);
    let newEvent = {};
    
    if (timeMatch) {
         newEvent = {
            time: timeMatch[1],
            title: timeMatch[2]
        };
    } else {
         newEvent = {
            time: '',
            title: text
        };
    }

    if (!events[dateKey]) {
        events[dateKey] = [];
    }
    
    if (editingIndex >= 0) {
        // 編輯模式：更新現有事件
        events[dateKey][editingIndex] = newEvent;
    } else {
        // 新增模式
        events[dateKey].push(newEvent);
    }
    
    // 排序事件 (有時間的排前面)
    events[dateKey].sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
    });

    localStorage.setItem('calendar_events', JSON.stringify(events));
    renderCalendar();
    closeModal();
}

// 輔助函式
function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}
