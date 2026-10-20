import { refreshSyncSummary } from './family-controls.js';
import { state } from './state.js';
import { HOLIDAYS_2026 } from './config.js';
import { formatDateKey, escapeHTML, sanitizeLink } from './utils.js';
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
    window.dispatchEvent(new Event("calendar-view-change"));
    if (view === 'week') {
        DOM.viewWeekBtn().classList.add('active');
        DOM.viewMonthBtn().classList.remove('active');
    } else {
        DOM.viewMonthBtn().classList.add('active');
        DOM.viewWeekBtn().classList.remove('active');
    }
    updateMobileBottomBar();
    renderCalendar();
}

export function updateMobileBottomBar() {
    const mobileViewText = document.getElementById('mobile-view-text');
    const mobileViewIcon = document.getElementById('mobile-view-icon');
    if (mobileViewText && mobileViewIcon) {
        if (state.currentView === 'month') {
            mobileViewText.textContent = '週檢視';
            mobileViewIcon.textContent = '📆';
        } else {
            mobileViewText.textContent = '月檢視';
            mobileViewIcon.textContent = '📅';
        }
    }
    const mobileAddBtn = document.getElementById('mobile-add-btn');
    if (mobileAddBtn) {
        mobileAddBtn.disabled = !state.canEdit || state.saving || state.isSelectionMode;
    }
    const mobileSmartBtn = document.getElementById('mobile-smart-btn');
    if (mobileSmartBtn) {
        mobileSmartBtn.disabled = !state.canEdit || state.saving;
    }
    const mobileShareBtn = document.getElementById('mobile-share-btn');
    if (mobileShareBtn) {
        mobileShareBtn.disabled = !state.canEdit || (state.isSelectionMode && !state.selectedDates.size);
    }
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
    if (!state.activeSplitDate) state.activeSplitDate = formatDateKey(state.currentDate);
    DOM.viewWeekBtn().setAttribute('aria-pressed', String(state.currentView === 'week'));
    DOM.viewMonthBtn().setAttribute('aria-pressed', String(state.currentView === 'month'));
    DOM.selectModeBtn().setAttribute('aria-pressed', String(state.isSelectionMode));
    document.getElementById('selected-date-label').textContent = state.isSelectionMode ? '已選 ' + state.selectedDates.size + ' 天，選好後按分享' : '新增日期：' + state.activeSplitDate.replaceAll('-', '/');
    document.getElementById('add-event-btn').disabled = !state.canEdit || state.saving || state.isSelectionMode;
    document.getElementById('share-btn').disabled = !state.canEdit || (state.isSelectionMode && !state.selectedDates.size);
    document.getElementById('select-mode-btn').disabled = !state.canEdit;
    refreshSyncSummary();
    updateMobileBottomBar();
    
    if (state.currentView === 'week') {
        grid.className = 'calendar-container view-week';
        renderWeekView(grid);
        const splitContainer = DOM.selectedDayEvents();
        if (splitContainer) splitContainer.hidden = true;
    } else {
        grid.className = 'calendar-container view-month';
        renderMonthView(grid);
        
        if (window.innerWidth <= 640 && !state.isSelectionMode) {
            if (!state.activeSplitDate) {
                state.activeSplitDate = formatDateKey(state.currentDate);
            }
            renderSelectedDayEvents(state.activeSplitDate);
        } else { DOM.selectedDayEvents().hidden = true; }
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
    if (dateKey === formatDateKey(new Date())) dayCard.classList.add('current-day');
    
    if (state.isSelectionMode) {
        if (state.selectedDates.has(dateKey)) {
            dayCard.classList.add('selected-day');
            dayCard.style.border = '2px solid var(--primary-color)';
            dayCard.style.backgroundColor = 'var(--primary-bg)';
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
    const eventsHtml = dayEvents.map((evt, idx) => {
        const safeTitle = escapeHTML(evt.title);
        const safeTime = escapeHTML(evt.time);
        const safeLink = sanitizeLink(evt.link);

        const timeHtml = safeTime === '全日' 
            ? `<span class="event-badge all-day">全日</span>` 
            : (safeTime ? `<span class="event-time">${safeTime}</span>` : '');
            
        const linkIcon = safeLink ? `<a href="${safeLink}" target="_blank" class="event-link-icon" onclick="event.stopPropagation()" rel="noopener noreferrer" title="開啟連結">🔗</a>` : '';
        const titleHtml = `<span class="event-title">${safeTitle}</span>`;
            
        let onClickAction = '';
        if (!state.isSelectionMode) {
            onClickAction = `editEvent('${dateKey}', ${idx})`;
        }
            
        return `
        <div class="event-item"><button type="button" class="event-edit-btn" ${!state.canEdit ? 'disabled' : ''} onclick="${onClickAction}; event.stopPropagation();">${timeHtml}${titleHtml}</button>${linkIcon}</div>
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
                <button class="btn-icon-sm share-day-btn" onclick="shareSpecificDay('${dateKey}'); event.stopPropagation();" title="分享此日行程">📤</button>
            </div>
            <button type="button" class="day-date date-select-btn" id="day-${dateKey}" aria-label="${date.getMonth() + 1}月${date.getDate()}日，${dayEvents.length}筆行程" aria-pressed="${state.isSelectionMode ? state.selectedDates.has(dateKey) : state.activeSplitDate === dateKey}">${date.getDate()}</button>
            ${holidayLabel}
            ${dotsHtml}
        </div>
        <div class="events-container">
            ${eventsHtml}
        </div>
        <button type="button" class="add-event-btn" ${!state.canEdit ? 'disabled' : ''} onclick="openAddModal('${dateKey}')">+ 新增</button>
    `;
    
    dayCard.onclick = (e) => {
        if (e.target.closest('button, a') && !e.target.closest('.date-select-btn')) return;
        if (!state.isSelectionMode && (state.currentView === 'month' || e.target.closest('.date-select-btn'))) {
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
    
    if (state.activeSplitDate === dateKey && !state.isSelectionMode) {
        dayCard.classList.add('selected-day');
    }

    container.appendChild(dayCard);
}

export function selectDay(dateKey) {
    state.activeSplitDate = dateKey;
    renderCalendar();
    document.getElementById('day-' + dateKey)?.focus({ preventScroll: true });
}

export function renderSelectedDayEvents(dateKey) {
    const container = DOM.selectedDayEvents();
    const dayEvents = state.events[dateKey] || [];
    
    if (!container) return;
    
    const [y, m_val, d_val] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, m_val - 1, d_val);
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const w = dayNames[dateObj.getDay()];
    
    let html = `<h3>${m}/${d} (${w}) 行程</h3>`;
    
    if (dayEvents.length === 0) {
        html += `<div class="empty-day-state"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="13" y="16" width="38" height="35" rx="7"/><path d="M21 11v10m22-10v10M21 30h22m-15 9h8"/></svg><p>無行程</p><small>可使用「智慧輸入」快速新增安排</small></div>`;
    } else {
        html += dayEvents.map((evt, index) => {
            const link = sanitizeLink(evt.link);
            const linkButton = link ? '<a href="' + link + '" target="_blank" rel="noopener noreferrer" class="event-link-icon" title="開啟行程連結">🔗</a>' : '';
            return '<div class="event-item"><button type="button" class="event-edit-btn" ' + (!state.canEdit ? 'disabled' : '') + ' onclick="editEvent(\'' + dateKey + '\', ' + index + ')">' +
                '<span class="event-time">' + escapeHTML(evt.time || '全日') + '</span><span class="event-title">' + escapeHTML(evt.title) +
                (evt.location ? '<span class="event-detail">地點：' + escapeHTML(evt.location) + '</span>' : '') +
                (evt.description ? '<span class="event-detail">備註：' + escapeHTML(evt.description) + '</span>' : '') + '</span></button>' + linkButton + '</div>';
        }).join('');
    }
    
    html += `<button type="button" class="add-event-btn" ${!state.canEdit ? 'disabled' : ''} onclick="openAddModal('${dateKey}')" style="margin-top:1rem;">+ 新增此日行程</button>`;
    
    container.innerHTML = html;
    container.hidden = false;
    container.style.removeProperty('display');
    container.classList.add('active');
}

export function toggleSelectionMode() {
    if (!state.canEdit) return;
    state.isSelectionMode = !state.isSelectionMode;
    const btn = DOM.selectModeBtn();
    if (state.isSelectionMode) {
        btn.classList.add('active');
        btn.style.backgroundColor = 'var(--primary-bg)';
        state.selectedDates.clear();
    } else {
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
        state.selectedDates.clear();
    }
    renderCalendar();
}
