// ===== Промокоды =====

const promoForm  = document.querySelector('.promo-card__form');
const promoInput = document.querySelector('.promo-input');

if (promoForm) {
    promoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // проверяем, залогинен ли пользователь
        const user = await window.currentUserReady;
        if (!user) {
            showMessage('Войдите, чтобы использовать промокод', '#C8552B');
            return;
        }

        const code = promoInput.value.trim().toLowerCase();

        if (!code) {
            showMessage('Введите промокод', '#C8552B');
            return;
        }

        try {
            // Отправляем код на сервер для проверки
            const res = await fetch('/api/promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();

            if (!res.ok) {
                // Если сервер вернул ошибку (уже активирован или неверный код)
                showMessage(data.error, '#C8552B');
                return;
            }

            // Если всё ок, обновляем баланс на сайте (чтобы цифра в шапке изменилась)
            if (window.balanceReady) {
                const balanceRes = await fetch('/api/balance');
                const balanceData = await balanceRes.json();
                if (balanceData.balance !== undefined) {
                    document.getElementById('balance').textContent = Number(balanceData.balance).toFixed(2);
                }
            }

            // Показываем сообщение об успехе
            if (data.delta > 0) {
                showMessage(`Промокод активирован! +${data.delta} ₽`, '#2E7D32');
            } else {
                showMessage(`Промокод активирован! ${data.delta} ₽`, '#C8552B');
            }

            promoInput.value = '';

        } catch (err) {
            console.error(err);
            showMessage('Ошибка соединения с сервером', '#C8552B');
        }
    });
}