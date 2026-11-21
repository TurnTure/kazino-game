// ===== Kalina Rush =====
const actionBtn = document.getElementById('actionBtn');
const multiplierValue = document.getElementById('multiplierValue');
const startOverlay = document.getElementById('startOverlay');
const crashOverlay = document.getElementById('crashOverlay');
const road = document.getElementById('road');
const timerDisplay = document.getElementById('gameTimer');
const betInput = document.getElementById('betInput');

let isPlaying = false;
let currentMultiplier = 1.00;
let gameInterval = null;
let startTime = 0;
let currentCar = null;

// Настройки сложности (шанс краша)
const CRASH_CHANCE = 0.02; // 2% шанс аварии каждые 100мс

// Функция запуска
function startGame() {
    if (isPlaying) return;

    // Сброс
    isPlaying = true;
    currentMultiplier = 1.00;
    multiplierValue.textContent = 'x1.00';
    multiplierValue.style.color = '#d4ff00';
    startOverlay.style.display = 'none';
    crashOverlay.style.display = 'none';
    actionBtn.textContent = 'ЗАБРАТЬ';
    actionBtn.classList.add('cashout');

    // Создаем машинку
    currentCar = document.createElement('div');
    currentCar.className = 'kalina-car';
    currentCar.style.bottom = '20px';
    road.appendChild(currentCar);

    startTime = Date.now();

    // Запускаем игровой цикл
    gameInterval = setInterval(() => {
        // Увеличиваем множитель
        currentMultiplier += 0.01;
        multiplierValue.textContent = 'x' + currentMultiplier.toFixed(2);

        // Двигаем машинку вверх
        let currentBottom = parseFloat(currentCar.style.bottom) || 20;
        currentCar.style.bottom = (currentBottom + 1) + 'px';

        // Обновляем таймер
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        timerDisplay.textContent = elapsed + ' сек';

        // Проверка на краш (рандом)
        if (Math.random() < CRASH_CHANCE) {
            crashGame();
        }
    }, 100);
}

// Функция аварии
function crashGame() {
    clearInterval(gameInterval);
    isPlaying = false;
    
    // Визуал краша
    multiplierValue.style.color = '#ff3333';
    crashOverlay.style.display = 'block';
    if (currentCar) {
        currentCar.style.background = '#ff3333';
        currentCar.style.transform = 'translateX(-50%) rotate(15deg)'; // Перевернулась
    }
    
    actionBtn.textContent = 'ЕЩЕ РАЗ';
    actionBtn.classList.remove('cashout');
}

// Функция забора выигрыша
function cashout() {
    clearInterval(gameInterval);
    isPlaying = false;

    // Визуал победы
    multiplierValue.style.color = '#fff';
    actionBtn.textContent = 'НАЧАТЬ ЗАЕЗД';
    actionBtn.classList.remove('cashout');
    
    // Тут мы потом добавим начисление баланса через addBalance()
    const bet = Number(betInput.value);
    const win = Math.floor(bet * currentMultiplier);
    showMessage(`Вы забрали: +${win} ₽ (x${currentMultiplier.toFixed(2)})`, '#2E7D32');

    // Удаляем машинку через секунду
    setTimeout(() => {
        if (currentCar) currentCar.remove();
        startOverlay.style.display = 'block';
        multiplierValue.textContent = 'x0.00';
    }, 1000);
}

// Клик по главной кнопке
actionBtn.addEventListener('click', () => {
    if (!isPlaying) {
        startGame();
    } else {
        cashout();
    }
});

// Быстрые ставки
document.querySelectorAll('.quick-bets button').forEach(btn => {
    btn.addEventListener('click', () => {
        if (isPlaying) return;
        document.querySelectorAll('.quick-bets button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        betInput.value = btn.dataset.bet;
    });
});