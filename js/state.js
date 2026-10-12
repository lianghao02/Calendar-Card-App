export const state = {
    currentDate: new Date(),
    events: {},
    isSelectionMode: false,
    selectedDates: new Set(),
    currentView: 'month',
    editingIndex: -1,
    editingEvent: null,
    saving: false,
    canEdit: false,
    activeSplitDate: null
};
