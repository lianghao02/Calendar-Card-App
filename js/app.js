import { state } from './state.js';
import { API } from './api.js';
import { normalizeEventKeys, formatDateKey } from './utils.js';
import { 
    renderCalendar, showLoading, hideLoading, updateHeaderDate, switchView, 
    toggleSelectionMode, selectDay, DOM 
} from './ui.js';
import { 
    openAddModal, editEvent, closeModal, saveEvent, deleteEvent, 
    updateRecurrenceInfo, openEventListModal, closeEventListModal, 
    shareSchedule, shareSelectedDates, shareSpecificDay, openShareModal, closeShareModal 
} from './logic.js';
import { parseSmartInput } from './smart-input.js';

// --- Expose Globals for HTML onclick attributes ---
window.editEvent = editEvent;
window.openAddModal = openAddModal;
window.openEventListModal = openEventListModal;
window.closeEventListModal = closeEventListModal;
window.shareSpecificDay = shareSpecificDay;
// Note: selectDay is used internally or via JS, not HTML string? 
// Check ui.js createDayCard: dayCard.onclick calls selectDay(dateKey) directly if logic matches. 
// Since ui.js imports selectDay (from itself), it's fine.

document.addEventListener('DOMContentLoaded', () => {
    updateHeaderDate();
    initApp();
    setupEventListeners();
});

async function initApp() {
    showLoading();
    try {
        const response = await API.fetchAllEvents();
        if (response && response.data && response.data.events) {
            state.events = normalizeEventKeys(response.data.events);
        }
        
        if (response && response.quota) {
            checkQuotaLimit(response.quota);
        }
    } catch (err) {
        console.error(err);
        alert('無法讀取雲端資料，將暫時顯示空白日曆。\n錯誤：' + err.message);
    } finally {
        hideLoading();
        renderCalendar();
    }
}

function checkQuotaLimit(quota) {
    if (quota.isBlocked) {
        alert('⚠️ 警告：每日 API 使用量已達 90%，為了保護資料庫，暫時無法新增/修改行程。');
    } else if (quota.isWarning) {
        console.warn('⚠️ 注意：API 使用量已達 80%');
    }
}

function setupEventListeners() {
    // Navigation
    document.getElementById('prev-btn').addEventListener('click', () => changeDate(-1));
    document.getElementById('next-btn').addEventListener('click', () => changeDate(1));
    document.getElementById('today-btn').addEventListener('click', () => {
        state.currentDate = new Date();
        renderCalendar();
    });
    
    // Share
    document.getElementById('share-btn').addEventListener('click', () => {
        if (state.isSelectionMode && state.selectedDates.size > 0) {
            shareSelectedDates();
        } else {
            shareSchedule(); 
        }
    });

    // View Toggles
    DOM.viewWeekBtn().addEventListener('click', () => switchView('week'));
    DOM.viewMonthBtn().addEventListener('click', () => switchView('month'));
    DOM.selectModeBtn().addEventListener('click', toggleSelectionMode);

    // Smart Input
    const smartInput = document.getElementById('smart-input');
    const smartSubmitBtn = document.getElementById('smart-submit-btn');
    
    if (smartSubmitBtn) {
        smartSubmitBtn.addEventListener('click', () => processSmartInput(smartInput));
    }
    smartInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault(); 
            processSmartInput(smartInput);
        }
    });

    // Modals
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('save-btn').addEventListener('click', saveEvent);
    const delBtn = document.getElementById('delete-btn');
    if (delBtn) delBtn.addEventListener('click', deleteEvent);

    // Recurrence
    const recInput = document.getElementById('event-recurrence');
    if (recInput) {
        recInput.addEventListener('change', () => {
             updateRecurrenceInfo();          
             const group = document.getElementById('recurrence-end-date-group');
             if (recInput.value === 'custom') {
                 group.style.display = 'block';
             } else {
                 group.style.display = 'none';
             }
        });
    }

    // Link Button
    const openLinkBtn = document.getElementById('open-link-btn');
    if (openLinkBtn) {
        openLinkBtn.addEventListener('click', () => {
             const url = document.getElementById('event-link').value.trim();
             if (url) window.open(url, '_blank');
             else alert('請先輸入網址');
        });
    }

    // Share Modal Actions
    document.getElementById('close-share-modal').addEventListener('click', closeShareModal);
    document.getElementById('share-modal-overlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('share-modal-overlay')) closeShareModal();
    });

    document.getElementById('share-line').addEventListener('click', () => {
        const text = document.getElementById('share-text-preview').value;
        window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
    });

    document.getElementById('share-messenger').addEventListener('click', async () => {
        const text = document.getElementById('share-text-preview').value;
        try {
            await navigator.clipboard.writeText(text);
            alert('行程文字已複製！\n即將開啟 Messenger，請貼上送出。');
            window.open('https://www.messenger.com/', '_blank'); 
        } catch (err) {
            alert('複製失敗，請手動複製文字。');
        }
    });

    document.getElementById('share-copy').addEventListener('click', async () => {
        const text = document.getElementById('share-text-preview').value;
        try {
            await navigator.clipboard.writeText(text);
            alert('已複製到剪貼簿！');
            closeShareModal();
        } catch (err) {
            alert('複製失敗，請手動選取複製。');
        }
    });
    
    // Event List Modal
    const closeListBtn = document.getElementById('close-event-list-modal');
    if (closeListBtn) closeListBtn.addEventListener('click', closeEventListModal);
    
    const listOverlay = document.getElementById('event-list-modal-overlay');
    if (listOverlay) {
        listOverlay.addEventListener('click', (e) => {
            if (e.target === listOverlay) closeEventListModal();
        });
    }
    
    const addFromListBtn = document.getElementById('add-from-list-btn');
    if (addFromListBtn) {
        addFromListBtn.addEventListener('click', () => {
             const dateKey = listOverlay.dataset.dateKey;
             closeEventListModal();
             openAddModal(dateKey);
        });
    }
}

function processSmartInput(inputEl) {
    const result = parseSmartInput(inputEl.value);
    if (!result) return;
    
    if (result.error) {
        alert(result.error);
        return;
    }

    const dateKey = formatDateKey(result.date);
    state.currentDate = new Date(result.date); 
    renderCalendar(); 
    
    openAddModal(dateKey, result.data);
    inputEl.value = '';
}

function changeDate(direction) {
    if (state.currentView === 'week') {
        state.currentDate.setDate(state.currentDate.getDate() + (direction * 7));
    } else {
        state.currentDate.setMonth(state.currentDate.getMonth() + direction);
    }
    renderCalendar();
}


