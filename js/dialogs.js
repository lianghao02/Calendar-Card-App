// 原生對話框負責焦點限制、背景鎖定與關閉後的焦點還原。
export function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog.open) dialog.showModal();
    dialog.classList.add('active');
}
export function closeDialog(id) {
    const dialog = document.getElementById(id);
    dialog.classList.remove('active');
    if (dialog.open) dialog.close();
}
export function setupDialogs(handlers) {
    for (const [id, requestClose] of Object.entries(handlers)) {
        document.getElementById(id).addEventListener('cancel', event => {
            event.preventDefault();
            requestClose();
        });
    }
}

let confirmationResolve = null;
function finishConfirmation(accepted) {
    closeDialog('confirm-dialog');
    const resolve = confirmationResolve; confirmationResolve = null;
    resolve?.(accepted);
}
export function cancelConfirmation() { if (confirmationResolve) finishConfirmation(false); }
export function confirmAction(title, message, confirmLabel = '確認') {
    cancelConfirmation();
    const dialog = document.getElementById('confirm-dialog');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-yes').textContent = confirmLabel;
    if (!dialog.dataset.bound) {
        dialog.dataset.bound = 'true';
        dialog.addEventListener('cancel', event => { event.preventDefault(); finishConfirmation(false); });
        document.getElementById('confirm-no').addEventListener('click', () => finishConfirmation(false));
        document.getElementById('confirm-yes').addEventListener('click', () => finishConfirmation(true));
    }
    return new Promise(resolve => { confirmationResolve = resolve; openDialog('confirm-dialog'); document.getElementById('confirm-no').focus(); });
}
