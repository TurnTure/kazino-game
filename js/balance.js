// ===== Баланс =====

const balanceEl = document.getElementById('balance');

let balance = 0;

// ===== Получить баланс с сервера =====
async function loadBalance() {
    try {
        const res = await fetch('/api/balance');
        if (!res.ok) {
            balance = 0;
            balanceEl.textContent = '0';
            return;
        }
        const data = await res.json();
        balance = data.balance;
        balanceEl.textContent = balance;
    } catch (e) {
        console.error('Не удалось получить баланс:', e);
    }
}

function getBalance() {
    return balance;
}

function canAfford(amount) {
    return balance >= amount;
}

// ===== Изменение баланса через сервер =====
async function addBalance(delta, reason = '') {
    // показываем сразу, чтобы UI не тормозил
    balance = Math.max(0, balance + delta);
    balanceEl.textContent = balance;

    if (typeof window.showBalanceDiff === 'function') {
        window.showBalanceDiff(delta);
    }

    try {
        const res = await fetch('/api/balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta, reason })
        });
        const data = await res.json();

        // синхронизация с сервером — он источник истины
        if (typeof data.balance === 'number') {
            balance = data.balance;
            balanceEl.textContent = balance;
        }
    } catch (e) {
        console.error('Не удалось сохранить баланс:', e);
    }
}

// ===== Загружаем баланс, когда узнаём, кто мы =====
window.balanceReady = (async () => {
    await window.currentUserReady;
    if (window.currentUser) {
        await loadBalance();
    } else {
        balanceEl.textContent = '0';
    }
})();