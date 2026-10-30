// ===== FALLING PICKAXE (Простая физика по клеткам) =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');

const ROWS = 10;
const COLS = 10;

// Размеры (в процентах, для отрисовки)
const blockW = 100 / COLS;
const blockH = 100 / ROWS;

// Состояние игры
let blocks = []; 
let isPlaying = false;

// Позиция бура (в клетках)
let drillRow = 0;
let drillCol = 1;

// Направление (1 = вправо, -1 = влево)
let direction = 1; 

// Таймер игры
let gameTimer = null;
let fallTimer = null;

// ===== Генерация поля =====
function generateField() {
    gameField.innerHTML = '';
    blocks = [];

    for (let r = 0; r < ROWS; r++) {
        const rowBlocks = [];
        for (let c = 0; c < COLS; c++) {
            const block = document.createElement('div');
            block.className = 'block';

            // Боковые стены неразрушаемые
            if (c === 0 || c === COLS - 1) {
                block.classList.add('indestructible');
            } else {
                // Внутри — земля и камень
                if (Math.random() > 0.7) {
                    block.classList.add('dirt');
                } else {
                    block.classList.add('stone');
                }
            }

            gameField.appendChild(block);
            rowBlocks.push(block);
        }
        blocks.push(rowBlocks);
    }
}

// ===== Отрисовка бура =====
function updateDrillVisual() {
    drill.style.top = `${drillRow * blockH}%`;
    drill.style.left = `${drillCol * blockW}%`;
}

// ===== Ломаем блок =====
function breakBlock(row, col) {
    if (col <= 0 || col >= COLS - 1) return; // Стены не ломаем
    
    const block = blocks[row][col];
    if (block && block.style.opacity !== '0') {
        block.style.opacity = '0';
        block.style.border = 'none';
    }
}

// ===== Шаг падения (вызывается по таймеру) =====
function stepFall() {
    if (!isPlaying) return;

    // 1. Проверяем, есть ли блок прямо под нами
    let nextRow = drillRow + 1;
    
    if (nextRow >= ROWS) {
        // Достигли дна
        endGame();
        return;
    }

    // 2. Если под нами есть блок (не сломан), мы его ломаем и отскакиваем
    // (В нашей сетке все блоки изначально есть, кроме сломанных)
    if (blocks[nextRow][drillCol] && blocks[nextRow][drillCol].style.opacity !== '0') {
        // Ломаем блок под нами
        breakBlock(nextRow, drillCol);

        // Бур "отскакивает" — сначала летит вбок
        // Двигаем вбок на 1 клетку в текущем направлении
        let nextCol = drillCol + direction;

        // Проверяем, не врезались ли мы в стену или боковой блок
        if (nextCol <= 0 || nextCol >= COLS - 1 || (blocks[drillRow][nextCol] && blocks[drillRow][nextCol].style.opacity !== '0')) {
            // Если врезались — меняем направление
            direction *= -1;
            nextCol = drillCol + direction;
        }

        // Если и в другую сторону нельзя (зажаты), просто стоим на месте
        if (nextCol > 0 && nextCol < COLS - 1) {
            drillCol = nextCol;
        }
        
        // Сдвигаем бур вниз (он падает в образовавшуюся дырку)
        drillRow = nextRow;

    } else {
        // Под нами пусто — просто падаем вниз
        drillRow = nextRow;
    }

    // Обновляем картинку
    updateDrillVisual();
}

// ===== Конец игры =====
function endGame() {
    isPlaying = false;
    clearInterval(fallTimer);
    clearInterval(gameTimer);
    
    // Скрываем бур
    drill.style.opacity = '0';

    // Перезапускаем игру через 2 секунды
    setTimeout(() => {
        generateField();
        drillRow = 0;
        drillCol = 1;
        direction = 1;
        updateDrillVisual();
    }, 2000);
}

// ===== Старт игры =====
function startGame() {
    if (isPlaying) return;
    
    // Закрываем модалку
    const bonusModal = document.getElementById('bonusModal');
    if (bonusModal) bonusModal.classList.remove('is-open');

    // Сбрасываем позицию
    drillRow = 0;
    drillCol = 1;
    direction = 1;
    isPlaying = true;
    
    drill.style.opacity = '1';
    updateDrillVisual();

    // Запускаем цикл падения (каждые 400мс бур делает шаг)
    fallTimer = setInterval(stepFall, 400);

    // Максимальное время игры — 15 секунд (чтобы не залипал навсегда)
    gameTimer = setTimeout(() => {
        if (isPlaying) endGame();
    }, 15000);
}

// ===== Привязка кнопок =====
if (spinBtn) {
    spinBtn.addEventListener('click', startGame);
}

document.querySelectorAll('.bonus-card__activate').forEach(btn => {
    btn.addEventListener('click', startGame);
});

// ===== Старт =====
generateField();
drill.style.opacity = '0'; // Прячем бур до начала игры
updateDrillVisual();