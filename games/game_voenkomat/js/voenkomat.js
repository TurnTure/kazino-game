// ===== Почтовые ящики: игровая логика =====

// ===== НАСТРОЙКИ ИГРЫ =====
const CONFIG = {
    boxesCount: 30,
    minOpens: 3,        // Обязательных открытий
    maxOpens: 30,       // Максимум (все ящики)
    minBet: 300,
    betStep: 50,

    // Шансы исходов (сумма весов = 100)
    outcomes: [
        { type: 'mult',   value: 2,   weight: 10, title: '×2',   sub: 'Множитель' },
        { type: 'mult',   value: 3,   weight: 5,  title: '×3',   sub: 'Множитель' },
        { type: 'mult',   value: 5,   weight: 2,  title: '×5',   sub: 'Множитель' },
        { type: 'coupon', value: 100, weight: 10, title: '+100', sub: 'Купон' },
        { type: 'coupon', value: 200, weight: 6,  title: '+200', sub: 'Купон' },
        { type: 'coupon', value: 500, weight: 2,  title: '+500', sub: 'Купон' },
        { type: 'spam',   value: 0,   weight: 40, title: '📰',   sub: 'Спам' },
        { type: 'lose',   value: 0,   weight: 25, title: '📨',   sub: 'Повестка' }
    ]
};

// ===== СОСТОЯНИЕ =====
const state = {
    bet: 300,
    opensMade: 0,       // Сколько уже открыто в этом раунде
    multsSum: 0,        // Сумма выпавших множителей (для складывания)
    couponsSum: 0,      // Сумма выпавших купонов
    roundSum: 0,        // Итоговая сумма (пересчитывается)
    isPlaying: false,   // Идёт ли сейчас процесс открытия
    isFinished: false,  // Завершен ли раунд (успешно или проигрыш)
    isLost: false,
    consecutiveSpam: 0  // Защита от 3-х спамов подряд
};

// ===== ЭЛЕМЕНТЫ =====
const grid        = document.getElementById('mailGrid');
const statusEl    = document.getElementById('mailStatus');
const leftEl      = document.getElementById('mailLeft');
const betInput    = document.getElementById('betInput');
const totalEl     = document.getElementById('totalValue');
const roundEl     = document.getElementById('roundValue');
const playBtn     = document.getElementById('playBtn');
const heroImg     = document.getElementById('heroImage');
const heroSpeech  = document.getElementById('heroSpeech');

// ===== ГЕНЕРАЦИЯ СЕТКИ =====
function buildGrid() {
    grid.innerHTML = '';

    for (let i = 1; i <= CONFIG.boxesCount; i++) {
        const box = document.createElement('div');
        box.className = 'mail-box';
        box.dataset.index = i;

        box.innerHTML = `
            <span class="mail-box__number">${String(i).padStart(2, '0')}</span>
            <span class="mail-box__keyhole"></span>
            <span class="mail-box__result"></span>
        `;

        box.addEventListener('click', () => handleBoxClick(box));
        grid.appendChild(box);
    }
}

// ===== ВЫБОР ИСХОДА ПО ВЕСАМ =====
function pickOutcome() {
    // Защита от 3-х спамов подряд
    let availableOutcomes = CONFIG.outcomes;
    if (state.consecutiveSpam >= 2) {
        availableOutcomes = CONFIG.outcomes.filter(o => o.type !== 'spam');
    }

    const total = availableOutcomes.reduce((sum, o) => sum + o.weight, 0);
    let r = Math.random() * total;

    for (const o of availableOutcomes) {
        if (r < o.weight) return o;
        r -= o.weight;
    }
    return availableOutcomes[0];
}

// ===== КЛИК ПО ЯЩИКУ =====
function handleBoxClick(box) {
    if (!state.isPlaying) return;
    if (state.isFinished) return;
    if (box.classList.contains('is-open')) return;
    if (state.opensMade >= CONFIG.maxOpens) return;

    const outcome = pickOutcome();
    box.classList.add('is-open');
    
    // Звук открытия ящика
    if (typeof soundBoxOpen === 'function') soundBoxOpen();

    const resultEl = box.querySelector('.mail-box__result');

    // ПОВЕСТКА — мгновенный проигрыш
    if (outcome.type === 'lose') {
        box.classList.add('is-lose');
        resultEl.innerHTML = `${outcome.title}<small>${outcome.sub}</small>`;

        state.isLost = true;
        state.isFinished = true;
        state.opensMade = CONFIG.maxOpens;

        updateUI();
        finishRound(true);
        return;
    }

    // Множитель
    if (outcome.type === 'mult') {
        box.classList.add('is-win');
        state.multsSum += outcome.value; // Складываем множители
        resultEl.innerHTML = `${outcome.title}<small>${outcome.sub}</small>`;
        if (typeof soundWinItem === 'function') soundWinItem();
        state.consecutiveSpam = 0;
    }
    // Купон
    else if (outcome.type === 'coupon') {
        box.classList.add('is-win');
        state.couponsSum += outcome.value; // Складываем купоны
        resultEl.innerHTML = `${outcome.title}<small>${outcome.sub}</small>`;
        if (typeof soundWinItem === 'function') soundWinItem();
        state.consecutiveSpam = 0;
    }
    // Спам — пустышка
    else if (outcome.type === 'spam') {
        resultEl.innerHTML = `${outcome.title}<small>${outcome.sub}</small>`;
        state.consecutiveSpam++;
    }

    state.opensMade++;
    
    // Пересчитываем итоговую сумму раунда
    calculateRoundSum();
    updateUI();

    // Если открыли ВСЕ ящики — раунд завершается принудительно
    if (state.opensMade >= CONFIG.maxOpens) {
        state.isFinished = true;
        finishRound(false);
    }
}

// ===== ПОДСЧЕТ ИТОГОВОЙ СУММЫ =====
function calculateRoundSum() {
    // Если есть множители, умножаем ставку на их сумму. Иначе множитель = 1 (просто ставка)
    const currentMult = state.multsSum > 0 ? state.multsSum : 1;
    state.roundSum = (state.bet * currentMult) + state.couponsSum;
}

// ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =====
function updateUI() {
    // Проверка корректности ввода ставки
    const currentBet = parseInt(betInput.value, 10);
    if (isNaN(currentBet) || currentBet < CONFIG.minBet || currentBet > getBalance()) {
        if (betInput.value !== '') {
            betInput.classList.add('is-invalid');
        }
    } else {
        betInput.classList.remove('is-invalid');
    }

    totalEl.textContent = state.bet;
    roundEl.textContent = state.roundSum;

    // Управление кнопкой и её цветом
    if (state.isPlaying) {
        if (state.opensMade < CONFIG.minOpens) {
            playBtn.textContent = `Откройте ещё ${CONFIG.minOpens - state.opensMade} ящ.`;
            playBtn.disabled = true;
            playBtn.style.backgroundColor = '#B5A28C'; // Серый
            playBtn.style.cursor = 'not-allowed';
        } else {
            playBtn.textContent = `Забрать ${state.roundSum} огоньков →`;
            playBtn.disabled = false;
            playBtn.style.backgroundColor = '#E5652C'; // Оранжевый
            playBtn.style.cursor = 'pointer';
        }
    } else if (state.isFinished && state.isLost) {
        playBtn.textContent = `Новая игра за ${state.bet} →`;
        playBtn.disabled = false;
        playBtn.style.backgroundColor = '#2B1A0F'; // Коричневый
        playBtn.style.cursor = 'pointer';
    } else {
        playBtn.textContent = `Играть за ${state.bet} →`;
        playBtn.disabled = false;
        playBtn.style.backgroundColor = '#E5652C'; // Оранжевый
        playBtn.style.cursor = 'pointer';
    }

    leftEl.textContent = `${state.opensMade} / ${CONFIG.maxOpens}`;

    updatePlayButtonState();
}

// ===== ПРОВЕРКА, ХВАТАЕТ ЛИ ДЕНЕГ / БЛОКИРОВКА =====
function updatePlayButtonState() {
    if (state.isPlaying && state.opensMade < CONFIG.minOpens) {
        playBtn.disabled = true;
        return;
    }

    if (state.isPlaying && state.opensMade >= CONFIG.minOpens) {
        playBtn.disabled = false;
        return;
    }

    const currentBet = parseInt(betInput.value, 10);
    if (isNaN(currentBet) || currentBet < CONFIG.minBet) {
        playBtn.disabled = true;
        playBtn.textContent = 'Неверная ставка';
        return;
    }

    if (!canAfford(state.bet)) {
        playBtn.disabled = true;
        playBtn.textContent = 'Недостаточно средств';
    } else {
        playBtn.disabled = false;
    }
}

// ===== ПОПЫТКА СТАРТА РАУНДА =====
function tryStartRound() {
    if (!canAfford(state.bet)) {
        showMessage('Недостаточно средств', '#C8552B');
        return;
    }

    addBalance(-state.bet, 'voenkomat:bet');
    startRound();
}

// ===== СТАРТ РАУНДА =====
function startRound() {
    // Сбрасываем визуал ящиков
    document.querySelectorAll('.mail-box').forEach(box => {
        box.classList.remove('is-open', 'is-win', 'is-lose');
        box.querySelector('.mail-box__result').innerHTML = '';
    });

    state.opensMade = 0;
    state.multsSum = 0;
    state.couponsSum = 0;
    state.roundSum = state.bet;
    state.isPlaying = true;
    state.isFinished = false;
    state.isLost = false;
    state.consecutiveSpam = 0;

    heroImg.src = './img/start.png';
    heroSpeech.textContent = '«Ну, посмотрим, что там…»';
    statusEl.textContent = `Открой первые ${CONFIG.minOpens} ящика.`;

    updateUI();
    playBtn.disabled = true;
}

// ===== ЗАВЕРШЕНИЕ РАУНДА =====
function finishRound(lost) {
    state.isPlaying = false;

    if (lost) {
        heroImg.src = './img/lose.png';
        heroSpeech.textContent = '«Я только за газетой вышел…»';
        statusEl.textContent = 'Повестка! Сумма этого раунда сгорела.';
        state.roundSum = 0;
        if (typeof soundLose === 'function') soundLose();
    } else {
        heroImg.src = './img/win.png';
        heroSpeech.textContent = '«Вот это я удачно за почтой!»';
        statusEl.textContent = `Итог раунда: ${state.roundSum} огоньков.`;
        if (typeof soundRoundWin === 'function') soundRoundWin();
    }

    playBtn.disabled = false;
    updateUI();
}

// ===== КЛИК ПО КНОПКЕ =====
playBtn.addEventListener('click', async () => {
    const user = await window.currentUserReady;
    if (!user) {
        showMessage('Войдите, чтобы играть', '#C8552B');
        return;
    }

    // Забираем выигрыш
    if (state.isPlaying) {
        if (state.opensMade >= CONFIG.minOpens) {
            addBalance(state.roundSum, 'voenkomat:win');
            showMessage(`+${state.roundSum} огоньков`, '#2E7D32');
            finishRound(false); 
        }
        return;
    }

    // Сброс и старт новой игры
    if (state.isFinished) {
        state.isFinished = false;
        state.isLost = false;
        state.roundSum = 0;
        state.multsSum = 0;
        state.couponsSum = 0;

        document.querySelectorAll('.mail-box').forEach(box => {
            box.classList.remove('is-open', 'is-win', 'is-lose');
            box.querySelector('.mail-box__result').innerHTML = '';
        });

        heroImg.src = './img/start.png';
        heroSpeech.textContent = '«Мне бы что-нибудь, кроме ЖКХ…»';
        statusEl.textContent = 'Выбери любой ящик — почта уже разложена.';

        updateUI();
        return;
    }

    if (!state.isPlaying) {
        tryStartRound();
    }
});

// ===== КНОПКИ СТАВКИ =====
document.querySelectorAll('.bet-counter__btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (state.isPlaying) return;

        const action = btn.dataset.action;
        let currentBet = parseInt(betInput.value, 10) || state.bet;

        if (action === 'minus') {
            state.bet = Math.max(CONFIG.minBet, currentBet - CONFIG.betStep);
        } else if (action === 'plus') {
            const maxBet = getBalance();
            state.bet = Math.min(maxBet, currentBet + CONFIG.betStep);
        }

        betInput.value = state.bet;
        betInput.classList.remove('is-invalid');
        updateUI();
    });
});

// ===== ВВОД СТАВКИ ВРУЧНУЮ =====
if (betInput) {
    betInput.addEventListener('input', () => {
        if (state.isPlaying) {
            betInput.value = state.bet; 
            return;
        }

        const value = parseInt(betInput.value, 10);
        
        if (isNaN(value) || value < CONFIG.minBet) {
            betInput.classList.add('is-invalid');
            playBtn.disabled = true;
            playBtn.textContent = 'Неверная ставка';
            totalEl.textContent = '0';
            return; 
        }

        if (value > getBalance()) {
            betInput.classList.add('is-invalid');
            playBtn.disabled = true;
            playBtn.textContent = 'Недостаточно средств';
            totalEl.textContent = value;
            return; 
        }

        betInput.classList.remove('is-invalid');
        state.bet = value;
        totalEl.textContent = value;
        
        playBtn.disabled = false; 
        playBtn.textContent = `Играть за ${state.bet} →`;
    });

    betInput.addEventListener('blur', () => {
        let value = parseInt(betInput.value, 10);

        if (isNaN(value) || value < CONFIG.minBet) {
            value = CONFIG.minBet;
        }

        if (value > getBalance()) {
            value = Math.max(CONFIG.minBet, getBalance());
        }

        betInput.value = value;
        betInput.classList.remove('is-invalid');
        state.bet = value;
        updateUI();
    });

    betInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            betInput.blur();
        }
    });
}

// ===== СТАРТ =====
buildGrid();

(async () => {
    const user = await window.currentUserReady;

    if (window.balanceReady) {
        await window.balanceReady;
    }

    updateUI();

    if (!user) {
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
        playBtn.style.cursor = 'not-allowed';
        playBtn.title = 'Войдите, чтобы играть';
        playBtn.textContent = 'Войдите, чтобы играть';

        statusEl.textContent = 'Для игры нужно войти в аккаунт.';
        heroSpeech.textContent = '«Пустите поиграть…»';
    }
})();