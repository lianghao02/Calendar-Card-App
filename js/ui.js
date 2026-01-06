import { state } from './state.js';
import { HOLIDAYS_2026 } from './config.js';
import { formatDateKey } from './utils.js';
// Note: Circular reference avoidance. Functions like openAddModal/editEvent are globally attached in app.js, 
// so we can use them in HTML strings, or call them if we assume they are on window.
// For direct calls inside JS (like selectDay -> openAddModal?), we might need to import or dispatch events.
// Let's use window.openAddModal etc for consistency if we attach them.

export const DOM = {
    calendarGrid: () => document.getElementById('calendar-grid'),
    currentMonthYear: () => document.getElementById('current-month-year'),
    selectedDayEvents: () => document.getElementById('selected-day-events'),
    viewWeekBtn: () => document.getElementById('view-week'),
    viewMonthBtn: () => document.getElementById('view-month'),
    loadingOverlay: () => document.getElementById('loading-overlay'),
    selectModeBtn: () => document.getElementById('select-mode-btn')
};

export function showLoading() {
    const overlay = DOM.loadingOverlay();
    if(overlay) overlay.classList.remove('u-hidden');
}

export function hideLoading() {
    const overlay = DOM.loadingOverlay();
    if(overlay) overlay.classList.add('u-hidden');
}

export function switchView(view) {
    state.currentView = view;
    if (view === 'week') {
        DOM.viewWeekBtn().classList.add('active');
        DOM.viewMonthBtn().classList.remove('active');
    } else {
        DOM.viewMonthBtn().classList.add('active');
        DOM.viewWeekBtn().classList.remove('active');
    }
    renderCalendar();
}

export function updateHeaderDate(date = state.currentDate, type = state.currentView) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const el = DOM.currentMonthYear();

    if (type === 'month') {
        el.textContent = `${y} 年 ${m} 月`;
    } else {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        const startM = startOfWeek.getMonth() + 1;
        const endM = endOfWeek.getMonth() + 1;
        
        if (startM === endM) {
             el.textContent = `${startOfWeek.getFullYear()} 年 ${startM} 月`;
        } else {
             el.textContent = `${startOfWeek.getFullYear()} 年 ${startM} 月 - ${endM} 月`;
        }
    }
}

export function renderCalendar() {
    const grid = DOM.calendarGrid();
    grid.innerHTML = '';
    
    if (state.currentView === 'week') {
        grid.className = 'calendar-container view-week';
        renderWeekView(grid);
        const splitContainer = DOM.selectedDayEvents();
        if (splitContainer) splitContainer.style.display = 'none';
    } else {
        grid.className = 'calendar-container view-month';
        renderMonthView(grid);
        
        if (window.innerWidth <= 640) {
            if (!state.activeSplitDate) {
                state.activeSplitDate = formatDateKey(state.currentDate);
            }
            renderSelectedDayEvents(state.activeSplitDate);
        }
    }
}

function renderWeekView(container) {
    const startOfWeek = new Date(state.currentDate);
    const dayOfWeek = startOfWeek.getDay(); 
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    updateHeaderDate(startOfWeek, 'week');

    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        createDayCard(container, day, false);
    }
}

function renderMonthView(container) {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDayOfMonth);
    if (endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    updateHeaderDate(new Date(year, month, 1), 'month');

    // Add Weekday Headers
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.classList.add('weekday-header');
        header.textContent = day;
        container.appendChild(header);
    });

    let iterDate = new Date(startDate);
    while (iterDate <= endDate) {
        const isOtherMonth = iterDate.getMonth() !== month;
        createDayCard(container, iterDate, isOtherMonth);
        iterDate.setDate(iterDate.getDate() + 1);
    }
}

function createDayCard(container, date, isOtherMonth) {
    const dateKey = formatDateKey(date);
    const dayCard = document.createElement('div');
    dayCard.classList.add('day-card');
    if (isOtherMonth) dayCard.classList.add('other-month');
    
    if (state.isSelectionMode) {
        if (state.selectedDates.has(dateKey)) {
            dayCard.classList.add('selected-day');
            dayCard.style.border = '2px solid #6366f1';
            dayCard.style.backgroundColor = '#eef2ff';
        }
    }

    const holidayName = HOLIDAYS_2026[dateKey];
    const holidayLabel = holidayName ? `<div class="holiday-label">${holidayName}</div>` : '';
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6 || holidayName) {
        dayCard.classList.add('holiday');
    }

    const dayEvents = state.events[dateKey] || [];
    const eventsHtml = dayEvents.map((evt) => {
        const timeHtml = evt.time === '全日' 
            ? `<span class="event-badge all-day">全日</span>` 
            : (evt.time ? `<span class="event-time">${evt.time}</span>` : '');
            
        const linkIcon = evt.link ? `<a href="${evt.link}" target="_blank" class="event-link-icon" onclick="event.stopPropagation()" title="開啟連結">🔗</a>` : '';
        const titleHtml = `<span class="event-title">${evt.title}</span>${linkIcon}`;
            
        let onClickAction = '';
        const realIndex = state.events[dateKey].indexOf(evt);
        if (!state.isSelectionMode) {
            onClickAction = `editEvent('${dateKey}', ${realIndex})`;
        }
            
        return `
        <div class="event-item" onclick="${onClickAction}; event && event.stopPropagation();">
            ${timeHtml}
            ${titleHtml}
        </div>
        `;
    }).join('');

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
            ${dotsHtml}
        </div>
        <div class="events-container">
            ${eventsHtml}
        </div>
        <button class="add-event-btn" onclick="openAddModal('${dateKey}')">+ 新增</button>
    `;
    
    dayCard.onclick = (e) => {
        if (window.innerWidth <= 640 && state.currentView === 'month' && !state.isSelectionMode) {
             selectDay(dateKey); 
             // Mobile Split View: Just select, don't open modal immediately.
             return;
        }

        if (state.isSelectionMode) {
            if (state.selectedDates.has(dateKey)) {
                state.selectedDates.delete(dateKey);
            } else {
                state.selectedDates.add(dateKey);
            }
            renderCalendar();
        } 
    };

    if (state.currentView === 'month' && !state.isSelectionMode) {
        dayCard.ondblclick = (e) => {
            if (e.target === dayCard || e.target.classList.contains('day-header') || e.target.classList.contains('events-container')) {
                window.openAddModal(dateKey);
            }
        };
    }
    
    if (state.activeSplitDate === dateKey && window.innerWidth <= 640 && state.currentView === 'month') {
        dayCard.classList.add('selected-day');
    }

    container.appendChild(dayCard);
}

export function selectDay(dateKey) {
    state.activeSplitDate = dateKey;
    renderCalendar();
    renderSelectedDayEvents(dateKey);
}

export function renderSelectedDayEvents(dateKey) {
    const container = DOM.selectedDayEvents();
    const dayEvents = state.events[dateKey] || [];
    
    if (!container) return;
    
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
             const linkBtn = evt.link ? `<a href="${evt.link}" target="_blank" class="event-link-icon" onclick="event.stopPropagation()" title="開啟連結" style="margin-left:8px; text-decoration:none;">🔗</a>` : '';
             
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
    
    html += `<button class="add-event-btn" onclick="openAddModal('${dateKey}')" style="margin-top:1rem;">+ 新增此日行程</button>`;
    
    container.innerHTML = html;
    container.classList.add('active');
}

export function toggleSelectionMode() {
    state.isSelectionMode = !state.isSelectionMode;
    const btn = DOM.selectModeBtn();
    if (state.isSelectionMode) {
        btn.classList.add('active');
        btn.style.backgroundColor = '#e0e7ff';
        state.selectedDates.clear();
    } else {
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
        state.selectedDates.clear();
    }
    renderCalendar();
}
