// ===== js/profile.js =====

async function loadProfileStats() {
    try {
        const res = await fetch('/api/profile/stats');
        if (!res.ok) {
            console.error('Не авторизован');
            return;
        }
        const data = await res.json();

        const formatMoney = (num) => {
            return Math.round(num).toLocaleString('ru-RU') + ' ШР';
        };

        // 1. Имя пользователя
        const nameEl = document.getElementById('profileName');
        if (nameEl) nameEl.textContent = data.userName;

        // 2. Заполняем верхние карточки (общие)
        const wonEl = document.getElementById('statWon');
        if (wonEl) wonEl.textContent = formatMoney(data.totalWon);

        const betEl = document.getElementById('statBet');
        if (betEl) betEl.textContent = formatMoney(data.totalBet);

        const netEl = document.getElementById('statNet');
        if (netEl) {
            netEl.textContent = (data.netResult > 0 ? '+' : '') + formatMoney(data.netResult);
            if (data.netResult >= 0) {
                netEl.parentElement.classList.remove('stat-card--negative');
                netEl.parentElement.classList.add('stat-card--positive');
            }
        }

        const sessionsEl = document.getElementById('statSessions');
        if (sessionsEl) sessionsEl.textContent = data.sessionsCount;

        // 3. Заполняем таблицу по играм
        const tableBody = document.querySelector('.stats-table tbody');
        if (tableBody) {
            tableBody.innerHTML = '';

            if (!data.games || data.games.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Вы ещё не играли в игры</td></tr>';
            } else {
                data.games.forEach(game => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><img src="./img/Знак.png" width="24" style="vertical-align: middle; margin-right: 8px;"> ${game.name}</td>
                        <td>${Math.round(game.bet)}</td>
                        <td>${Math.round(game.won)}</td>
                        <td class="${game.net >= 0 ? 'text-green' : 'text-red'}">${Math.round(game.net)}</td>
                        <td>-</td>
                        <td>${game.sessions}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        }

        // 4. Обновляем блок "Сессии и привычки" (общее количество)
        const sessionsCountEl = document.getElementById('sessionsCount');
        if (sessionsCountEl) sessionsCountEl.textContent = data.sessionsCount;

    } catch (e) {
        console.error('Не удалось загрузить статистику:', e);
    }
}

// Ждем загрузки страницы и проверяем, что мы на странице профиля
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.profile-layout')) {
        loadProfileStats();
    }
});