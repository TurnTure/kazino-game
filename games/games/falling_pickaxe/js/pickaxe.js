// ===== FALLING PICKAXE =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');

const ROWS = 10;
const COLS = 10;

// Координаты бура
let drillRow = 5;
let drillCol = 5;

// ===== Генерация блоков =====
function generateField() {
    gameField.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const block = document.createElement('div');
            block.className = 'block';

            // Случайно выбираем землю или камень
            if (Math.random() > 0.7) {
                block.classList.add('dirt');
            } else {
                block.classList.add('stone');
            }

            block.dataset.row = r;
            block.dataset.col = c;
            gameField.appendChild(block);
        }
    }
}

// ===== Обновление позиции бура =====
function updateDrillPosition() {
    const blockSizePercent = 100 / COLS;
    drill.style.top = `${drillRow * blockSizePercent}%`;
    drill.style.left = `${drillCol * blockSizePercent}%`;
}

// ===== Модалка Бонусов =====
const bonusBtn = document.getElementById('bonusBtn');
const bonusModal = document.getElementById('bonusModal');
const closeModal = document.getElementById('closeModal');
const spinBtn = document.getElementById('spinBtn');

// Открыть по кнопке Bonus Buy
if (bonusBtn) {
    bonusBtn.addEventListener('click', () => {
        bonusModal.classList.add('is-open');
    });
}

// Открыть по центральной кнопке "Крутить"
if (spinBtn) {
    spinBtn.addEventListener('click', () => {
        bonusModal.classList.add('is-open');
    });
}

// Закрыть по крестику
if (closeModal) {
    closeModal.addEventListener('click', () => {
        bonusModal.classList.remove('is-open');
    });
}

// Закрыть по клику на фон
if (bonusModal) {
    bonusModal.addEventListener('click', (e) => {
        if (e.target === bonusModal) {
            bonusModal.classList.remove('is-open');
        }
    });
}

// ===== Старт =====
generateField();
updateDrillPosition();