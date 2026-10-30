// ===== FALLING PICKAXE =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');

// Настройки
const GRAVITY = 0.4;       
const BOUNCE = -0.6;       
const SPEED = 8;           
const SIZE = 40;           

// Размеры сетки
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

            // Стены по краям
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

// ===== Проверка коллизий (учитываем углы бура) =====
function isSolid(px, py) {
    if (px < 0 || px >= 600 || py < 0 || py >= 600) return true;
    
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    
    const block = blocks[row][col];
    return block && block.style.opacity !== '0';
}

// ===== Проверка, врезались ли мы во что-то =====
function checkHit(px, py) {
    // Проверяем 4 угла бура
    return isSolid(px, py) || 
           isSolid(px + SIZE, py) || 
           isSolid(px, py + SIZE) || 
           isSolid(px + SIZE, py + SIZE);
}

// ===== Ломаем блок =====
function breakBlock(px, py) {
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    
    if (col <= 0 || col >= COLS - 1) return; // Стены не трогаем
    
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

    // 1. Движение по X
    let nextX = x + vx;
    if (checkHit(nextX, y)) {
        breakBlock(nextX + SIZE/2, y + SIZE/2);
        vx = -vx * 0.8; // Меняем направление
    } else {
        x = nextX;
    }

    // 2. Движение по Y
    let nextY = y + vy;
    if (checkHit(x, nextY)) {
        breakBlock(x + SIZE/2, nextY + SIZE/2);
        
        // Если летели вниз — отскакиваем вверх
        if (vy > 0) {
            vy = -Math.abs(vy) * 0.7; 
            if (Math.abs(vy) < 3) vy = -8; // Гарантированный подскок
        } else {
            vy = 0; // Если бились головой об потолок — просто гасим скорость
        }
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

    // Ставим бур ровно по центру 5-й колонки
    // 5-я колонка начинается с 4 * 60 = 240px. Центр блока = 240 + 30 = 270px.
    // Чтобы бур (40px) был по центру, его X = 270 - 20 = 250px.
    x = 250; 
    y = -60; // Чуть выше сетки
    vx = 3; // Даем начальный импульс вправо
    vy = 2; 
    angle = 0;

    drill.style.opacity = '1';
    isPlaying = true;
    
    reqId = requestAnimationFrame(loop);

    // Останавливаем через 15 секунд
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