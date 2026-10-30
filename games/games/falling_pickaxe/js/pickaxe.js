// ===== FALLING PICKAXE (Плавная физика) =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');

// Физические параметры
const GRAVITY = 0.4;       
const BOUNCE = -0.5;       
const ROTATION_SPEED = 10; 
const SIZE = 40;           

const BLOCK_W = 60;
const BLOCK_H = 60;
const ROWS = 10;
const COLS = 10;

let isPlaying = false;
let reqId = null;
let blocks = [];

let x = 0, y = 0, vx = 0, vy = 0, angle = 0;

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

// ===== Проверка коллизий =====
function isSolid(px, py) {
    // Убрали проверку py < 0, чтобы бур мог лететь сверху вниз
    if (px < 0 || px >= 600 || py >= 600) return true;
    // Если мы над сеткой, там нет блоков
    if (py < 0) return false;
    
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    
    if (!blocks[row] || !blocks[row][col]) return true;
    
    const block = blocks[row][col];
    return block.style.opacity !== '0';
}

// ===== Ломаем блок с эффектом "кратера" =====
function breakBlocksAround(centerX, centerY) {
    for (let dx = -SIZE; dx <= SIZE; dx += BLOCK_W / 2) {
        for (let dy = -SIZE; dy <= SIZE; dy += BLOCK_H / 2) {
            const px = centerX + dx;
            const py = centerY + dy;
            
            // Ломаем только внутри сетки (не задевая стены)
            if (px > 60 && px < 540 && py > 0 && py < 600) {
                const col = Math.floor(px / BLOCK_W);
                const row = Math.floor(py / BLOCK_H);
                
                if (blocks[row] && blocks[row][col]) {
                    const block = blocks[row][col];
                    if (block.style.opacity !== '0') {
                         block.style.opacity = '0';
                         block.style.border = 'none';
                         block.style.transform = 'scale(0.8)'; 
                    }
                }
            }
        }
    }
}

// ===== Игровой цикл =====
function loop() {
    if (!isPlaying) return;

    // 1. Гравитация
    vy += GRAVITY;

    // 2. Плавное движение по X
    let nextX = x + vx;
    if (isSolid(nextX + SIZE/2, y + SIZE/2)) {
        vx = -vx * 0.8; 
    } else {
        x = nextX;
    }

    // 3. Плавное движение по Y
    let nextY = y + vy;
    if (isSolid(x + SIZE/2, nextY + SIZE/2)) {
        breakBlocksAround(x + SIZE/2, nextY + SIZE/2);
        
        // Отскок вверх
        vy = -Math.abs(vy) * 0.6; 
        if (Math.abs(vy) < 2) vy = -6; 
        
        // Слегка отлетаем в сторону
        vx += (Math.random() - 0.5) * 4;
    } else {
        y = nextY;
    }

    // 4. Вращение
    angle += ROTATION_SPEED;

    // 5. Ограничение по низу (если упал на дно)
    if (y >= 600 - SIZE) {
        stopGame();
        return;
    }

    // 6. Отрисовка
    drill.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    
    reqId = requestAnimationFrame(loop);
}

// ===== Старт =====
function startGame() {
    if (isPlaying) return;
    
    const modal = document.getElementById('bonusModal');
    if (modal) modal.classList.remove('is-open');

    // Ставим по центру (5-я колонка)
    x = 250; 
    y = -40; // Чуть ближе к сетке
    vx = 2; 
    vy = 8;  // ДАЕМ СИЛЬНЫЙ ИМПУЛЬС ВНИЗ, чтобы пробить первый блок
    angle = 0;

    drill.style.opacity = '1';
    isPlaying = true;
    
    reqId = requestAnimationFrame(loop);

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