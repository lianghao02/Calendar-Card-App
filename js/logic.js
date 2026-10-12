import { openDialog, closeDialog, confirmAction } from './dialogs.js';
import { state } from "./state.js";
import {
  renderCalendar,
  renderSelectedDayEvents,
} from "./ui.js";
import { API } from "./api.js";
import { formatDateKey, escapeHTML } from "./utils.js";
import { cleanEvent, recurrenceDates } from './calendar-data.js';
import { HOLIDAYS_2026 } from "./config.js";

// DOM Cache for Modals (internal to logic)
let initialForm = null;
const formSignature = () => JSON.stringify(["event-date-picker", "event-input", "event-time", "event-location", "event-description", "event-link", "event-recurrence", "event-recurrence-end"].map(id => document.getElementById(id).value));
function formError(message) { const feedback = document.getElementById("form-feedback"); feedback.textContent = message; feedback.hidden = !message; if (message) feedback.scrollIntoView({ block: "nearest" }); }

const MODAL = {
  overlay: () => document.getElementById("event-modal"),
  title: () => document.getElementById("modal-title"),
  inputTitle: () => document.getElementById("event-input"),
  inputTime: () => document.getElementById("event-time"),
  inputLocation: () => document.getElementById("event-location"),
  inputDesc: () => document.getElementById("event-description"),
  inputLink: () => document.getElementById("event-link"),
  inputDate: () => document.getElementById("selected-date"), // Hidden: Original Date
  inputDatePicker: () => document.getElementById("event-date-picker"), // Visible: New Date
  saveBtn: () => document.getElementById("save-btn"),
  deleteBtn: () => document.getElementById("delete-btn"),
  recurrence: () => document.getElementById("event-recurrence"),
  recurrenceEnd: () => document.getElementById("event-recurrence-end"),
  recurrenceGroup: () => document.getElementById("recurrence-end-date-group"),
  recurrenceInfo: () => document.getElementById("recurrence-info"),
};

const LIST_MODAL = {
  overlay: () => document.getElementById("event-list-modal-overlay"),
  title: () => document.getElementById("event-list-title"),
  container: () => document.getElementById("event-list-container"),
};

const SHARE_MODAL = {
  overlay: () => document.getElementById("share-modal-overlay"),
  preview: () => document.getElementById("share-text-preview"),
};

export function openAddModal(dateKey, preFill = null) {
  if (state.isSelectionMode || state.saving || !state.canEdit) return;
  state.editingEvent = null;
  document.getElementById("event-author").textContent = "";
  const m = MODAL;
  m.inputDate().value = dateKey;
  m.inputDatePicker().value = dateKey;

  if (preFill) {
    m.inputTitle().value = preFill.title || "";
    m.inputTime().value = preFill.time || "";
    m.inputLocation().value = preFill.location || "";
    m.inputDesc().value = preFill.description || "";
    m.inputLink().value = preFill.link || "";
    m.title().textContent = `確認行程 (${dateKey})`;
    m.saveBtn().textContent = "確認新增";
  } else {
    m.inputTitle().value = "";
    m.inputTime().value = "";
    m.inputLocation().value = "";
    m.inputDesc().value = "";
    m.inputLink().value = "";
    state.editingIndex = -1;
    m.title().textContent = `新增行程 (${dateKey})`;
    m.saveBtn().textContent = "儲存";
  }

  if (m.deleteBtn()) m.deleteBtn().style.display = "none";

  if (preFill || state.editingIndex === -1) state.editingIndex = -1;

  formError("");
  openDialog("event-modal");

  if (m.recurrence()) {
    m.recurrence().value = "none";
    m.recurrence().disabled = state.editingIndex >= 0;
  }
  if (m.recurrenceGroup()) m.recurrenceGroup().hidden = true;
  if (m.recurrenceEnd()) m.recurrenceEnd().value = "";

  updateRecurrenceInfo();
  initialForm = preFill ? null : formSignature();
  setTimeout(() => m.inputTitle().focus(), 100);
}

export function editEvent(dateKey, index) {
  if (state.isSelectionMode || state.saving || !state.canEdit) return;
  const evt = state.events[dateKey][index];
  if (!evt) return;

  const m = MODAL;
  m.inputDate().value = dateKey;
  m.inputDatePicker().value = dateKey;
  m.inputTitle().value = evt.title || "";
  m.inputTime().value = evt.time || "";
  m.inputLocation().value = evt.location || "";
  m.inputDesc().value = evt.description || "";
  m.inputLink().value = evt.link || "";
  document.getElementById("event-author").textContent = evt.updatedByName ? "最近修改：" + evt.updatedByName : "";

  state.editingIndex = index;
  state.editingEvent = structuredClone({ ...evt, date: dateKey });
  if (m.recurrence()) { m.recurrence().value = "none"; m.recurrence().disabled = true; }
  m.title().textContent = `編輯行程 (${dateKey})`;
  m.saveBtn().textContent = "更新";

  if (m.deleteBtn()) m.deleteBtn().style.display = "block";

  formError("");
  openDialog("event-modal");
  if (m.recurrenceGroup()) m.recurrenceGroup().hidden = true;
  initialForm = formSignature();
  setTimeout(() => m.inputTitle().focus(), 100);
}

export async function closeModal(options = {}) {
  if (state.saving && !options.force) return;
  if (!options.force && formSignature() !== initialForm && !await confirmAction("捨棄未儲存內容？", "關閉後，這次輸入不會儲存。返回表單可繼續編輯。", "捨棄並關閉")) return;
  closeDialog("event-modal");
  initialForm = null;
}

export function updateRecurrenceInfo() {
  const m = MODAL;
  if (!m.recurrence() || !m.recurrenceInfo()) return;
  const dateKey = m.inputDate().value;
  if (!dateKey) {
    m.recurrenceInfo().style.display = "none";
    return;
  }

  const val = m.recurrence().value;
  if (val === "none") {
    m.recurrenceInfo().style.display = "none";
  } else {
    const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
    const [y, m_val, d] = dateKey.split("-").map(Number);
    const dateObj = new Date(y, m_val - 1, d);
    const dayName = dayNames[dateObj.getDay()];

    m.recurrenceInfo().textContent = `將於每週${dayName}重複此活動`;
    m.recurrenceInfo().style.display = "block";
  }
}

export async function saveEvent() {
  if (state.saving) return;
  const m = MODAL;
  try {
    const event = cleanEvent({
      title: m.inputTitle().value.trim(), time: m.inputTime().value.trim() || "全日",
      location: m.inputLocation().value.trim(), description: m.inputDesc().value.trim(), link: m.inputLink().value.trim()
    });
    const date = m.inputDatePicker().value;
    const before = state.editingEvent;
    const dates = recurrenceDates(date, before ? 'none' : m.recurrence().value, m.recurrenceEnd().value);
    const changes = before ? [{ id: before.id, before, after: { ...event, date } }]
      : dates.map(day => ({ id: crypto.randomUUID(), before: null, after: { ...event, date: day } }));
    await performChanges(changes);
  } catch (error) { formError('尚未儲存：' + error.message); }
}

async function performChanges(changes) {
  state.saving = true;
  formError("");
  const previousSaveText = MODAL.saveBtn().textContent;
  MODAL.saveBtn().textContent = "儲存中…";
  MODAL.saveBtn().disabled = true; MODAL.deleteBtn().disabled = true;
  try {
    const updated = await API.commitChanges(changes);
    if (updated) state.events = updated;
    if (changes[0].after) {
      state.activeSplitDate = changes[0].after.date;
      const [year, month, day] = state.activeSplitDate.split("-").map(Number);
      state.currentDate = new Date(year, month - 1, day, 12);
      window.dispatchEvent(new Event("calendar-view-change"));
    }
    await closeModal({ force: true }); state.editingEvent = null; state.editingIndex = -1;
  } finally {
    state.saving = false;
    MODAL.saveBtn().textContent = previousSaveText;
    MODAL.saveBtn().disabled = false; MODAL.deleteBtn().disabled = false;
    renderCalendar();
    if (!MODAL.overlay().open) document.getElementById("add-event-btn").focus();
  }
}

export async function deleteEvent() {
  if (state.saving || !state.editingEvent) return;
  const before = state.editingEvent;
  if (!await confirmAction("刪除這筆行程？", "刪除後，核准家人也會看不到這筆行程。", "確認刪除")) return;
  if (!state.canEdit || state.editingEvent?.id !== before.id) return;
  try { await performChanges([{ id: before.id, before, after: null }]); }
  catch (error) { formError('尚未刪除：' + error.message); }
}

// Event List Modal
export function openEventListModal(dateKey) {
  const lm = LIST_MODAL;
  if (!lm.overlay()) return;

  lm.overlay().dataset.dateKey = dateKey;

  const dateObj = new Date(dateKey);
  const m = dateObj.getMonth() + 1;
  const d = dateObj.getDate();
  const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
  const w = dayNames[dateObj.getDay()];
  lm.title().textContent = `${m}/${d} (${w}) 行程列表`;

  const dayEvents = state.events[dateKey] || [];

  lm.container().innerHTML = dayEvents.map((evt, index) =>
    '<button type="button" class="event-item event-list-choice requires-edit" ' + (!state.canEdit ? 'disabled' : '') + ' onclick="closeEventListModal(); editEvent(\'' + dateKey + '\', ' + index + ');">' +
    '<span class="event-time">' + escapeHTML(evt.time || '全日') + '</span><span class="event-title">' + escapeHTML(evt.title) + '</span>' +
    (evt.location ? '<span class="event-detail">地點：' + escapeHTML(evt.location) + '</span>' : '') + '</button>'
  ).join('');

  openDialog("event-list-modal-overlay");
}

export function closeEventListModal() {
  const lm = LIST_MODAL;
  if (lm.overlay()) closeDialog("event-list-modal-overlay");
}

// Share Logic
export function openShareModal(text) {
  SHARE_MODAL.preview().value = text;
  openDialog("share-modal-overlay");
}

export function closeShareModal() {
  closeDialog("share-modal-overlay");
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
    if (state.currentView === "week") {
      const startOfWeek = new Date(state.currentDate);
      startOfWeek.setDate(
        state.currentDate.getDate() - state.currentDate.getDay()
      );
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
  iterDate.setHours(0, 0, 0, 0);
  const endTimestamp = endDate.setHours(23, 59, 59, 999);

  const dayNames = ["(日)", "(一)", "(二)", "(三)", "(四)", "(五)", "(六)"];

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

      dayEvents.forEach((evt) => {
        exportText += `時間：${evt.time || "全日"}\n`;
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

  datesArr.forEach((dateKey) => {
    const dateObj = new Date(dateKey);
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    const dayNames = ["(日)", "(一)", "(二)", "(三)", "(四)", "(五)", "(六)"];
    const dayName = dayNames[dateObj.getDay()];
    const holidayName = HOLIDAYS_2026[dateKey];

    let dateLine = `${m}/${d} ${dayName}`;
    if (holidayName) dateLine += ` [${holidayName}]`;

    const dayEvents = state.events[dateKey] || [];
    if (dayEvents.length > 0) {
      exportText += `${dateLine}\n`;
      dayEvents.forEach((evt) => {
        exportText += `時間：${evt.time || "全日"}\n`;
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
