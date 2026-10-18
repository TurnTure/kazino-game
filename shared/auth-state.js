// ===== Текущий пользователь (общий для всех скриптов) =====

window.currentUser = null;

// промис, который завершится, когда пользователь загружен
window.currentUserReady = (async () => {
    try {
        const res = await fetch('/api/me');
        const data = await res.json();
        window.currentUser = data.user;
    } catch (e) {
        console.error('Не удалось получить пользователя:', e);
        window.currentUser = null;
    }
    return window.currentUser;
})();