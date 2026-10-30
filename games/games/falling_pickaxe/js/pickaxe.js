// ===== FALLING PICKAXE =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');

const ROWS = 10;
const COLS = 10;

// Координаты бура
let drillRow = 0;
let drillCol = 0;
let isFalling = false; // Флаг, чтобы бур не падал дважды одновременно

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

// ===== Функция падения бура =====
function startFall() {
    if (isFalling) return; // Если уже падает — ничего не делаем
    isFalling = true;

    // Закрываем модалку, если она открыта
    const bonusModal = document.getElementById('bonusModal');
    if (bonusModal) bonusModal.classList.remove('is-open');

    // Запускаем интервал: каждые 300мс бур опускается на 1 блок
    const fallInterval = setInterval(() => {
        // 1. Ломаем блок, в котором сейчас стоит бур
        breakBlock(drillRow, drillCol);

        // 2. Двигаем бур вниз
        drillRow++;

        // 3. Если бур дошел до низа (10-я строка, считая с 0)
        if (drillRow >= ROWS) {
            clearInterval(fallInterval);
            isFalling = false;
            
            // Скрываем бур на секунду
            drill.style.opacity = '0'; 
            
            // Возвращаем бур наверх и генерируем НОВОЕ поле ТОЛЬКО когда он упал
            setTimeout(() => {
                drillRow = 0;
                drillCol = 0;
                updateDrillPosition();
                drill.style.opacity = '1';
                generateField(); // Пересоздаем поле для новой игры
            }, 1500);

            return;
        }

        // 4. Обновляем позицию на экране
        updateDrillPosition();

    }, 300); // Скорость падения (300 миллисекунд на 1 блок)
}

// ===== Функция разрушения блока =====
function breakBlock(row, col) {
    // Находим блок по его координатам
    const block = document.querySelector(`.block[data-row="${row}"][data-col="${col}"]`);
    
    if (block) {
        // Плавно скрываем блок
        block.style.transition = 'opacity 0.2s, transform 0.2s';
        block.style.opacity = '0';
        block.style.transform = 'scale(0.5)'; // Немного уменьшаем
        
        // Полностью убираем блок через 200мс
        setTimeout(() => {
            block.style.display = 'none';
        }, 200);
    }
}

// ===== Модалка Бонусов =====
const bonusBtn = document.getElementById('bonusBtn');
const closeModal = document.getElementById('closeModal');
const spinBtn = document.getElementById('spinBtn');

// Открыть по кнопке Bonus Buy
if (bonusBtn) {
    bonusBtn.addEventListener('click', () => {
        if (!isFalling) bonusModal.classList.add('is-open');
    });
}

// Открыть по центральной кнопке "Крутить" (у нас она теперь тоже запускает падение)
if (spinBtn) {
    spinBtn.addEventListener('click', () => {
        startFall();
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

// ===== Кнопки внутри модалки (Активировать) =====
document.querySelectorAll('.bonus-card__activate').forEach(btn => {
    btn.addEventListener('click', () => {
        startFall();
    });
});

// ===== Старт =====
generateField();
updateDrillPosition();