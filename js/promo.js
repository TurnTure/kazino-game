// ===== Промокоды =====
// положительное число — прибавляет, отрицательное — отнимает

const PROMOCODES = {
    'лето2006': 2006,
    'аллоэ2000': 2000,
    'ceo': -1000
};

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

        if (PROMOCODES[code] !== undefined) {
            const delta = PROMOCODES[code];
            addBalance(delta, `promo:${code}`);

            if (delta > 0) {
                showMessage(`Промокод активирован! +${delta} ₽`, '#2E7D32');
            } else {
                showMessage(`Промокод активирован! ${delta} ₽`, '#C8552B');
            }

            promoInput.value = '';
        } else {
            showMessage('Неверный промокод', '#C8552B');
        }
    });
}