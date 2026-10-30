// ===== FALLING PICKAXE (Физика) =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');

const ROWS = 10;
const COLS = 10;

// Физические параметры
const GRAVITY = 0.5;        // Сила притяжения
const BOUNCE_FORCE = -8;    // Сила отскока (отрицательная, т.к. летим вверх)
const MOVE_SPEED = 4;       // Скорость движения по горизонтали

// Состояние игры
let blocks = []; // Массив со ссылками на DOM-элементы блоков
let isPlaying = false;

// Позиция и скорость бура
let drillX = 0;
let drillY = 0;
let velX = 0;
let velY = 0;

// Размеры (в процентах)
const blockW = 100 / COLS;
const blockH = 100 / ROWS;

// ===== Генерация поля =====
function generateField() {
    gameField.innerHTML = '';
    blocks = []; // Очищаем массив

    for (let r = 0; r < ROWS; r++) {
        const rowBlocks = [];
        for (let c = 0; c < COLS; c++) {
            const block = document.createElement('div');
            block.className = 'block';

            // Делаем боковые стенки неразрушаемыми
            if (c === 0 || c === COLS - 1) {
                block.classList.add('indestructible');
            } else {
                // Рандомно заполняем центр
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

// ===== Проверка, есть ли блок в координатах =====
// col, row - индексы сетки
function isSolid(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true; // За пределами — стена
    const block = blocks[row][col];
    return block && block.style.opacity !== '0'; // Блок существует и не сломан
}

// ===== Разрушение блока =====
function breakBlock(col, row) {
    if (col <= 0 || col >= COLS - 1) return; // Боковые не ломаем
    
    const block = blocks[row][col];
    if (block && block.style.opacity !== '0') {
        block.style.opacity = '0';
        block.style.border = 'none';
        
        // Эффект: бур отскакивает вверх от сломанного блока
        velY = BOUNCE_FORCE; 
        
        // Немного отлетает в сторону
        velX = (Math.random() > 0.5 ? 1 : -1) * MOVE_SPEED;
    }
}

// ===== Игровой цикл =====
function gameLoop() {
    if (!isPlaying) return;

    // 1. Применяем гравитацию
    velY += GRAVITY;

    // 2. Двигаем бур
    drillX += velX;
    drillY += velY;

    // 3. Проверяем столкновение с полом
    // Если бур опустился ниже 10-й строки
    if (drillY > ROWS - 1) {
        drillY = ROWS - 1;
        velY = BOUNCE_FORCE; // Отскок от пола
        
        // Ломаем блок под нами
        const col = Math.round(drillX);
        breakBlock(col, ROWS - 1);
    }

    // 4. Проверяем столкновение со стенами (левая и правая колонки)
    if (drillX < 1) {
        drillX = 1;
        velX *= -1; // Отскок от стены
    }
    if (drillX > COLS - 2) {
        drillX = COLS - 2;
        velX *= -1;
    }

    // 5. Проверяем столкновение с блоками по бокам
    // Если движемся вправо и справа блок
    if (velX > 0 && isSolid(Math.ceil(drillX) + 1, Math.round(drillY))) {
        velX *= -1; // Отскок
        drillX = Math.ceil(drillX) - 0.1;
    }
    // Если движемся влево и слева блок
    if (velX < 0 && isSolid(Math.floor(drillX) - 1, Math.round(drillY))) {
        velX *= -1;
        drillX = Math.floor(drillX) + 0.1;
    }

    // 6. Обновляем визуал на экране
    drill.style.top = `${drillY * blockH}%`;
    drill.style.left = `${drillX * blockW}%`;

    // 7. Продолжаем цикл
    requestAnimationFrame(gameLoop);
}

// ===== Запуск игры =====
function startGame() {
    if (isPlaying) return;
    isPlaying = true;

    // Закрываем модалку, если открыта
    const bonusModal = document.getElementById('bonusModal');
    if (bonusModal) bonusModal.classList.remove('is-open');

    // Стартуем с левого верхнего угла
    drillX = 1;
    drillY = 0;
    velX = MOVE_SPEED; // Начинаем двигаться вправо
    velY = 2;

    drill.style.opacity = '1';
    
    // Запускаем игровой цикл
    requestAnimationFrame(gameLoop);

    // Останавливаем игру через 10 секунд (для теста)
    setTimeout(() => {
        isPlaying = false;
        drill.style.opacity = '0';
        setTimeout(() => {
            generateField();
            drillX = 1;
            drillY = 0;
            drill.style.top = `${drillY * blockH}%`;
            drill.style.left = `${drillX * blockW}%`;
        }, 1000);
    }, 8000);
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
drill.style.opacity = '0'; // Изначально бур скрыт