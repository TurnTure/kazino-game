// ===== FALLING PICKAXE =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');

const ROWS = 10;
const COLS = 10;

// Координаты бура
let drillRow = 0;
let drillCol = 0;
let isFalling = false;

// ===== Генерация блоков =====
function generateField() {
    gameField.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const block = document.createElement('div');
            block.className = 'block';

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
// Мы будем ставить бур ровно поверх конкретного блока
function updateDrillPosition() {
    const blockSizePercent = 100 / COLS;
    drill.style.top = `${drillRow * blockSizePercent}%`;
    drill.style.left = `${drillCol * blockSizePercent}%`;
    
    // Делаем бур видимым, когда он на поле
    drill.style.opacity = '1';
}

// ===== Функция падения бура =====
function startFall() {
    if (isFalling) return; 
    isFalling = true;

    const bonusModal = document.getElementById('bonusModal');
    if (bonusModal) bonusModal.classList.remove('is-open');

    // Сначала ставим бур на стартовую позицию и ломаем блок под ним
    drillRow = 0;
    drillCol = 0;
    updateDrillPosition();
    
    // Начинаем падение
    const fallInterval = setInterval(() => {
        
        // 1. Ломаем блок, в котором сейчас стоит бур
        breakBlock(drillRow, drillCol);

        // 2. Двигаем бур вниз
        drillRow++;

        // 3. Если бур дошел до низа
        if (drillRow >= ROWS) {
            clearInterval(fallInterval);
            isFalling = false;
            
            // Скрываем бур, чтобы он не висел в пустоте
            drill.style.opacity = '0'; 
            
            // Через 1.5 секунды генерируем новое поле и возвращаем бур
            setTimeout(() => {
                generateField();
                drillRow = 0;
                drillCol = 0;
                updateDrillPosition(); // Это сделает бур видимым
            }, 1500);

            return;
        }

        // 4. Обновляем позицию на экране
        updateDrillPosition();

    }, 300); 
}

// ===== Функция разрушения блока =====
function breakBlock(row, col) {
    // Находим конкретный блок в DOM по его координатам
    const block = document.querySelector(`.block[data-row="${row}"][data-col="${col}"]`);
    
    if (block) {
        // Делаем его невидимым, чтобы образовался тоннель
        block.style.opacity = '0';
        // Убираем рамку, чтобы не было видно сетки
        block.style.border = 'none'; 
    }
}

// ===== Модалка Бонусов =====
const bonusBtn = document.getElementById('bonusBtn');
const closeModal = document.getElementById('closeModal');
const spinBtn = document.getElementById('spinBtn');

if (bonusBtn) {
    bonusBtn.addEventListener('click', () => {
        if (!isFalling) bonusModal.classList.add('is-open');
    });
}

if (spinBtn) {
    spinBtn.addEventListener('click', () => {
        startFall();
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        bonusModal.classList.remove('is-open');
    });
}

if (bonusModal) {
    bonusModal.addEventListener('click', (e) => {
        if (e.target === bonusModal) {
            bonusModal.classList.remove('is-open');
        }
    });
}

document.querySelectorAll('.bonus-card__activate').forEach(btn => {
    btn.addEventListener('click', () => {
        startFall();
    });
});

// ===== Старт =====
generateField();
updateDrillPosition();