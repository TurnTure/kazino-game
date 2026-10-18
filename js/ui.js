// ===== UI: всплывающие сообщения =====

const messageEl = document.createElement('p');
messageEl.className = 'promo-message';
document.body.appendChild(messageEl);

let messageTimer = null;

function showMessage(text, color) {
    messageEl.textContent = text;
    messageEl.style.color = color;
    messageEl.style.borderLeftColor = color;

    requestAnimationFrame(() => {
        messageEl.classList.add('is-visible');
    });

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        messageEl.classList.remove('is-visible');
    }, 2500);
}