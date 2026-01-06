import { state } from './state.js';
import { renderCalendar, showLoading, hideLoading, renderSelectedDayEvents } from './ui.js';
import { API } from './api.js';
import { formatDateKey } from './utils.js';
import { HOLIDAYS_2026 } from './config.js';

// DOM Cache for Modals (internal to logic)
const MODAL = {
    overlay: () => document.getElementById('event-modal'),
    title: () => document.getElementById('modal-title'),
    inputTitle: () => document.getElementById('event-input'),
    inputTime: () => document.getElementById('event-time'),
    inputLocation: () => document.getElementById('event-location'),
    inputDesc: () => document.getElementById('event-description'),
    inputLink: () => document.getElementById('event-link'),
    inputDate: () => document.getElementById('selected-date'),
    saveBtn: () => document.getElementById('save-btn'),
    deleteBtn: () => document.getElementById('delete-btn'),
    recurrence: () => document.getElementById('event-recurrence'),
    recurrenceEnd: () => document.getElementById('event-recurrence-end'),
    recurrenceGroup: () => document.getElementById('recurrence-end-date-group'),
    recurrenceInfo: () => document.getElementById('recurrence-info')
};

const LIST_MODAL = {
    overlay: () => document.getElementById('event-list-modal-overlay'),
    title: () => document.getElementById('event-list-title'),
    container: () => document.getElementById('event-list-container')
};

const SHARE_MODAL = {
    overlay: () => document.getElementById('share-modal-overlay'),
    preview: () => document.getElementById('share-text-preview')
};

export function openAddModal(dateKey, preFill = null) {
    if (state.isSelectionMode) return; 
    const m = MODAL;
    m.inputDate().value = dateKey;
    
    if (preFill) {
        m.inputTitle().value = preFill.title || '';
        m.inputTime().value = preFill.time || '';
        m.inputLocation().value = preFill.location || '';
        m.inputDesc().value = preFill.description || '';
        m.inputLink().value = preFill.link || '';
        m.title().textContent = `確認行程 (${dateKey})`; 
        m.saveBtn().textContent = '確認新增';
    } else {
        m.inputTitle().value = ''; 
        m.inputTime().value = '';
        m.inputLocation().value = '';
        m.inputDesc().value = '';
        m.inputLink().value = '';
        state.editingIndex = -1;
        m.title().textContent = `新增行程 (${dateKey})`;
        m.saveBtn().textContent = '儲存';
    }
    
    if (m.deleteBtn()) m.deleteBtn().style.display = 'none';

    if (preFill || state.editingIndex === -1) state.editingIndex = -1;

    m.overlay().classList.add('active');
    
    if (m.recurrence()) {
        m.recurrence().value = 'none';
        m.recurrence().disabled = (state.editingIndex >= 0); 
    }
    if (m.recurrenceGroup()) m.recurrenceGroup().style.display = 'none';
    if (m.recurrenceEnd()) m.recurrenceEnd().value = '';
    
    updateRecurrenceInfo();
    setTimeout(() => m.inputTitle().focus(), 100); 
}

export function editEvent(dateKey, index) {
    if (state.isSelectionMode) return;
    const evt = state.events[dateKey][index];
    if (!evt) return;
    
    const m = MODAL;
    m.inputDate().value = dateKey;
    m.inputTitle().value = evt.title || '';
    m.inputTime().value = evt.time || '';
    m.inputLocation().value = evt.location || '';
    m.inputDesc().value = evt.description || '';
    m.inputLink().value = evt.link || '';
    
    state.editingIndex = index;
    m.title().textContent = `編輯行程 (${dateKey})`;
    m.saveBtn().textContent = '更新';
    
    if (m.deleteBtn()) m.deleteBtn().style.display = 'block';

    m.overlay().classList.add('active');
    setTimeout(() => m.inputTitle().focus(), 100);
}

export function closeModal() {
    MODAL.overlay().classList.remove('active');
}

export function updateRecurrenceInfo() {
    const m = MODAL;
    if (!m.recurrence() || !m.recurrenceInfo()) return;
    const dateKey = m.inputDate().value;
    if (!dateKey) {
        m.recurrenceInfo().style.display = 'none';
        return;
    }
    
    const val = m.recurrence().value;
    if (val === 'none') {
        m.recurrenceInfo().style.display = 'none';
    } else {
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
        const [y, m_val, d] = dateKey.split('-').map(Number);
        const dateObj = new Date(y, m_val - 1, d);
        const dayName = dayNames[dateObj.getDay()];
        
        m.recurrenceInfo().textContent = `將於每週${dayName}重複此活動`;
        m.recurrenceInfo().style.display = 'block';
    }
}

export async function saveEvent() {
    const m = MODAL;
    const title = m.inputTitle().value.trim();
    const time = m.inputTime().value.trim();
    const location = m.inputLocation().value.trim();
    const description = m.inputDesc().value.trim();
    const link = m.inputLink().value.trim();
    const dateKey = m.inputDate().value;
    
    if (!title) {
        alert('請輸入標題');
        return;
    }
    
    let finalTime = time;
    if (!finalTime) finalTime = '全日';

    const newEvent = {
        title,
        time: finalTime,
        location,
        description,
        link
    };
    
    if (!state.events[dateKey]) state.events[dateKey] = [];
    
    const editingIndex = state.editingIndex;

    if (editingIndex >= 0) {
        state.events[dateKey][editingIndex] = newEvent;
    } else {
        const recurrence = m.recurrence() ? m.recurrence().value : 'none';
        
        if (recurrence === 'none') {
             state.events[dateKey].push(newEvent);
        } else {
            const [y, m, d] = dateKey.split('-').map(Number);
            let startDate = new Date(y, m - 1, d);
            let endDate = new Date(startDate);
            
            if (recurrence === 'weekly_current_month') {
                endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            } else if (recurrence === 'weekly_3_month') {
                endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate());
            } else if (recurrence === 'custom') {
                 const customEnd = m.recurrenceEnd().value;
                 if (customEnd) endDate = new Date(customEnd);
                 else endDate = startDate; 
            }

            let loopDate = new Date(startDate);
            while (loopDate <= endDate) {
                const loopKey = formatDateKey(loopDate);
                if (!state.events[loopKey]) state.events[loopKey] = [];
                const clonedEvent = { ...newEvent };
                state.events[loopKey].push(clonedEvent);
                state.events[loopKey].sort((a, b) => { 
                    if (a.time === '全日') return -1;
                    if (b.time === '全日') return 1;
                    return (a.time || '').localeCompare(b.time || '');
                });
                loopDate.setDate(loopDate.getDate() + 7);
            }
        }
    }
    
    if (editingIndex >= 0 || (m.recurrence() && m.recurrence().value === 'none')) {
         state.events[dateKey].sort((a, b) => {
            if (a.time === '全日') return -1;
            if (b.time === '全日') return 1;
            return (a.time || '').localeCompare(b.time || '');
        });
    }

    closeModal();
    renderCalendar(); 
    showLoading();

    const recurrence = m.recurrence() ? m.recurrence().value : 'none';
    const promises = [];
    
    if (editingIndex === -1 && recurrence !== 'none') {
         const [y, m_val, d] = dateKey.split('-').map(Number);
         let startDate = new Date(y, m_val - 1, d);
         let endDate = new Date(startDate);
         
         if (recurrence === 'weekly_current_month') {
             endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
         } else if (recurrence === 'weekly_3_month') {
             endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate());
         } else if (recurrence === 'custom') {
              const customEnd = m.recurrenceEnd().value;
              if (customEnd) endDate = new Date(customEnd);
              else endDate = startDate; 
         }
        
        let loopDate = new Date(startDate);
        while (loopDate <= endDate) {
             const loopKey = formatDateKey(loopDate);
             promises.push(API.saveDayEvents(loopKey, state.events[loopKey]));
             loopDate.setDate(loopDate.getDate() + 7);
        }
    } else {
        promises.push(API.saveDayEvents(dateKey, state.events[dateKey]));
    }

    try {
        await Promise.all(promises);
    } catch (err) {
        alert('儲存失敗，請檢查網路或是 API 配額。\n' + err.message);
    } finally {
        hideLoading();
    }
}

export async function deleteEvent() {
    const dateKey = MODAL.inputDate().value;
    if (state.editingIndex === -1) return;
    
    if (!confirm('確定要刪除這個行程嗎？')) return;
    
    if (state.events[dateKey]) {
        state.events[dateKey].splice(state.editingIndex, 1);
        if (state.events[dateKey].length === 0) {
            delete state.events[dateKey]; 
        }
    }
    
    closeModal();
    renderCalendar();
    showLoading();

    try {
        const eventsToSave = state.events[dateKey] || [];
        await API.saveDayEvents(dateKey, eventsToSave);
    } catch (err) {
        alert('刪除失敗：' + err.message);
        // Reload recommended
    } finally {
        hideLoading();
    }
}

// Event List Modal
export function openEventListModal(dateKey) {
    const lm = LIST_MODAL;
    if (!lm.overlay()) return;
    
    lm.overlay().dataset.dateKey = dateKey;
    
    const dateObj = new Date(dateKey);
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const w = dayNames[dateObj.getDay()];
    lm.title().textContent = `${m}/${d} (${w}) 行程列表`;

    const dayEvents = state.events[dateKey] || [];
    
    lm.container().innerHTML = dayEvents.map((evt, index) => {
         const timeDisplay = evt.time === '全日' ? '全日' : (evt.time || '');
         return `
         <div class="event-item" onclick="closeEventListModal(); editEvent('${dateKey}', ${index});" style="cursor:pointer; border:1px solid #e0e7ff; margin-bottom:0.5rem; padding:0.75rem; border-radius:0.5rem; background:white;">
             <div style="font-weight:bold; color:#4f46e5; margin-bottom:0.25rem;">${timeDisplay}</div>
             <div class="event-title" style="font-size:1rem; font-weight:500;">
                ${evt.title}
             </div>
             ${evt.location ? `<div style="font-size:0.85rem; color:#6b7280; margin-top:0.25rem;">📍 ${evt.location}</div>` : ''}
         </div>
         `;
    }).join('');

    lm.overlay().classList.add('active');
}

export function closeEventListModal() {
    const lm = LIST_MODAL;
    if (lm.overlay()) lm.overlay().classList.remove('active');
}

// Share Logic
export function openShareModal(text) {
    SHARE_MODAL.preview().value = text;
    SHARE_MODAL.overlay().classList.add('active');
}

export function closeShareModal() {
    SHARE_MODAL.overlay().classList.remove('active');
}

export function shareSchedule(customStart = null, customEnd = null) {
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
        if (state.currentView === 'week') {
            const startOfWeek = new Date(state.currentDate);
            startOfWeek.setDate(state.currentDate.getDate() - state.currentDate.getDay());
            startDate = startOfWeek;
            endDate = new Date(startOfWeek);
            endDate.setDate(endDate.getDate() + 6);
            titleStr = `📅 本週行程`;
        } else {
            const year = state.currentDate.getFullYear();
            const month = state.currentDate.getMonth();
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
        const dayEvents = state.events[dateKey] || [];
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
                exportText += `時間：${evt.time || '全日'}\n`;
                exportText += `事項：${evt.title}\n`; 
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

export function shareSelectedDates() {
    const datesArr = Array.from(state.selectedDates).sort();
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
        
        const dayEvents = state.events[dateKey] || [];
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

export function shareSpecificDay(dateKey) {
    const targetDate = new Date(dateKey);
    shareSchedule(targetDate, targetDate);
}
