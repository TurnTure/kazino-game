// ===== Кнопка сброса данных (для разработки) =====

const resetBtn = document.getElementById('resetBtn');

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        const ok = confirm(
            'Сбросить все данные?\n\n' +
            '• Баланс вернётся к значению по умолчанию\n' +
            '• История операций (history.txt) будет очищена\n\n' +
            'Это действие нельзя отменить.'
        );

        if (!ok) return;

        fetch('/api/reset', { method: 'POST' })
            .catch(err => console.error('Не удалось очистить history.txt:', err))
            .finally(() => {
                localStorage.clear();
                location.reload();
            });
    });
}