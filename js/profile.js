// ===== js/profile.js =====

async function loadProfileStats() {
    try {
        const res = await fetch('/api/profile/stats');
        if (!res.ok) {
            console.error('Не авторизован');
            return;
        }
        const data = await res.json();

        // Форматирование чисел (например, 12500 -> 12 500)
        const formatMoney = (num) => {
            return Math.round(num).toLocaleString('ru-RU') + ' ШР';
        };

        // 1. Имя пользователя
        const nameEl = document.getElementById('profileName');
        if (nameEl) nameEl.textContent = data.userName;

        // 2. Заполняем карточки
        // В твоем HTML нужно добавить id к значениям: id="statWon", id="statBet", id="statNet"
        const wonEl = document.getElementById('statWon');
        if (wonEl) wonEl.textContent = formatMoney(data.totalWon);

        const betEl = document.getElementById('statBet');
        if (betEl) betEl.textContent = formatMoney(data.totalBet);

        const netEl = document.getElementById('statNet');
        if (netEl) {
            netEl.textContent = (data.netResult > 0 ? '+' : '') + formatMoney(data.netResult);
            // Меняем цвет в зависимости от результата
            if (data.netResult >= 0) {
                netEl.parentElement.classList.remove('stat-card--negative');
                netEl.parentElement.classList.add('stat-card--positive'); // нужно будет добавить этот класс в CSS
            }
        }

        // 3. Заполняем таблицу (пример для одной строки)
        // В HTML мы можем поменять заглушки на эти данные
        const tableBody = document.querySelector('.stats-table tbody');
        if (tableBody) {
            // Пока выводим общую статистику, так как у нас нет разделения по играм в этой таблице
            tableBody.innerHTML = `
                <tr>
                    <td><img src="./img/Знак.png" width="24" style="vertical-align: middle; margin-right: 8px;"> Все игры</td>
                    <td>${Math.round(data.totalBet)}</td>
                    <td>${Math.round(data.totalWon)}</td>
                    <td class="${data.netResult >= 0 ? 'text-green' : 'text-red'}">${Math.round(data.netResult)}</td>
                    <td>-</td>
                    <td>${data.sessionsCount}</td>
                </tr>
            `;
        }

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