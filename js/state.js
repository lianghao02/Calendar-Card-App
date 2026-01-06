export const state = {
    currentDate: new Date(),
    events: {},
    isSelectionMode: false,
    selectedDates: new Set(),
    currentView: 'month',
    editingIndex: -1,
    activeSplitDate: null
};
