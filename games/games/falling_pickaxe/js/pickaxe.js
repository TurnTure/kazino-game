// ===== FALLING PICKAXE =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');

// Настройки
const GRAVITY = 0.3;       // Скорость падения
const BOUNCE = -0.6;       // Сила отскока (отрицательная, т.к. летим вверх)
const SPEED = 5;           // Скорость движения вбок
const SIZE = 40;           // Размер бура

// Размеры сетки (жестко 600х600)
const BLOCK_W = 60;
const BLOCK_H = 60;
const COLS = 10;
const ROWS = 10;

// Переменные
let isPlaying = false;
let reqId = null;
let blocks = [];

// Физика бура
let x = 0;
let y = 0;
let vx = 0;
let vy = 0;
let angle = 0;

// ===== Генерация поля =====
function generateField() {
    gameField.innerHTML = '';
    blocks = [];

    for (let r = 0; r < ROWS; r++) {
        const rowBlocks = [];
        for (let c = 0; c < COLS; c++) {
            const block = document.createElement('div');
            block.className = 'block';

            if (c === 0 || c === COLS - 1) {
                block.classList.add('indestructible');
            } else {
                if (Math.random() > 0.7) block.classList.add('dirt');
                else block.classList.add('stone');
            }

            gameField.appendChild(block);
            rowBlocks.push(block);
        }
        blocks.push(rowBlocks);
    }
}

// ===== Проверка: есть ли блок в координатах (x, y) =====
function isSolid(px, py) {
    // Если вылетели за границы сетки — это стена
    if (px < 0 || px >= 600 || py < 0 || py >= 600) return true;
    
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    
    const block = blocks[row][col];
    return block && block.style.opacity !== '0';
}

// ===== Ломаем блок =====
function breakBlock(px, py) {
    if (px < 60 || px >= 540) return; // Боковые стены не ломаем
    
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    
    const block = blocks[row][col];
    if (block && block.style.opacity !== '0') {
        block.style.opacity = '0';
        block.style.border = 'none';
    }
}

// ===== Игровой цикл =====
function loop() {
    if (!isPlaying) return;

    // Гравитация
    vy += GRAVITY;

    // 1. Проверяем движение по X (влево/вправо)
    let nextX = x + vx;
    // Проверяем центр бура
    if (isSolid(nextX + SIZE/2, y + SIZE/2)) {
        // Если врезались — ломаем и отскакиваем
        breakBlock(nextX + SIZE/2, y + SIZE/2);
        vx = -vx * BOUNCE;
    } else {
        x = nextX;
    }

    // 2. Проверяем движение по Y (вниз/вверх)
    let nextY = y + vy;
    if (isSolid(x + SIZE/2, nextY + SIZE/2)) {
        // Если врезались — ломаем
        breakBlock(x + SIZE/2, nextY + SIZE/2);
        // Отскок вверх
        vy = vy * BOUNCE;
        if (Math.abs(vy) < 2) vy = -8; // Если слишком слабо отскочил — подкидываем
    } else {
        y = nextY;
    }

    // Вращение
    angle += SPEED;

    // Если бур упал на дно
    if (y >= 600 - SIZE) {
        stopGame();
        return;
    }

    // Применяем координаты
    drill.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    
    reqId = requestAnimationFrame(loop);
}

// ===== Старт =====
function startGame() {
    if (isPlaying) return;
    
    const modal = document.getElementById('bonusModal');
    if (modal) modal.classList.remove('is-open');

    // Ставим бур ровно в центр по X, чуть выше сетки по Y
    x = 300 - (SIZE / 2); 
    y = -60; 
    vx = (Math.random() - 0.5) * 4; 
    vy = 5; // Начальная скорость падения
    angle = 0;

    drill.style.opacity = '1';
    isPlaying = true;
    
    reqId = requestAnimationFrame(loop);

    // Останавливаем через 15 секунд, чтобы не залипал
    setTimeout(() => {
        if (isPlaying) stopGame();
    }, 15000);
}

// ===== Стоп =====
function stopGame() {
    isPlaying = false;
    cancelAnimationFrame(reqId);
    drill.style.opacity = '0';

    setTimeout(() => {
        generateField();
    }, 1500);
}

// ===== Кнопки =====
if (spinBtn) spinBtn.addEventListener('click', startGame);
document.querySelectorAll('.bonus-card__activate').forEach(btn => btn.addEventListener('click', startGame));

// ===== Старт =====
generateField();
drill.style.opacity = '0';