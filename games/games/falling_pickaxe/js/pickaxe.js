// ===== FALLING PICKAXE (Пиксельная физика) =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');

const ROWS = 10;
const COLS = 10;

// Физические параметры
const GRAVITY = 0.4;       
const BOUNCE = 0.6;        
const ROTATION_SPEED = 8;  

// Состояние игры
let blocks = []; 
let isPlaying = false;
let animationId = null;

// Позиция и скорость бура
let drillX = 0;
let drillY = 0;
let velX = 0;
let velY = 0;
let drillAngle = 0; 

// Размеры поля
let fieldWidth = 0;
let fieldHeight = 0;
let blockWidth = 0;
let blockHeight = 0;
const drillSize = 40; 

// ===== Инициализация размеров =====
function updateSizes() {
    const rect = gameField.getBoundingClientRect();
    fieldWidth = rect.width;
    fieldHeight = rect.height;
    blockWidth = fieldWidth / COLS;
    blockHeight = fieldHeight / ROWS;
}
window.addEventListener('resize', updateSizes);

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
    updateSizes();
}

// ===== Проверка на столкновение (по центру бура) =====
function checkCollision(x, y) {
    const col = Math.floor(x / blockWidth);
    const row = Math.floor(y / blockHeight);

    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true; 

    const block = blocks[row][col];
    return block && block.style.opacity !== '0';
}

// ===== Ломаем блок =====
function breakBlock(x, y) {
    const col = Math.floor(x / blockWidth);
    const row = Math.floor(y / blockHeight);

    if (col <= 0 || col >= COLS - 1) return; // Стены не ломаем
    
    const block = blocks[row][col];
    if (block && block.style.opacity !== '0') {
        block.style.opacity = '0';
        block.style.border = 'none';
    }
}

// ===== Игровой цикл =====
function gameLoop() {
    if (!isPlaying) return;

    // 1. Притяжение
    velY += GRAVITY;

    // 2. Движение по X
    let nextX = drillX + velX;
    // Проверяем центр и края бура (учитывая его размер)
    if (checkCollision(nextX + drillSize/2, drillY + drillSize/2)) {
        breakBlock(nextX + drillSize/2, drillY + drillSize/2); 
        velX *= -BOUNCE; 
        // Небольшой случайный импульс, чтобы не застревал
        velX += (Math.random() - 0.5) * 2;
    } else {
        drillX = nextX;
    }

    // 3. Движение по Y
    let nextY = drillY + velY;
    if (checkCollision(drillX + drillSize/2, nextY + drillSize/2)) {
        breakBlock(drillX + drillSize/2, nextY + drillSize/2);
        
        if (velY > 0) { // Если падаем вниз
            velY = -velY * BOUNCE;
            if (Math.abs(velY) < 3) velY = -6; // Гарантированный отскок
            velX = (Math.random() - 0.5) * 10; // Отлетаем в сторону
        }
    } else {
        drillY = nextY;
    }

    // 4. Вращение
    drillAngle += ROTATION_SPEED;

    // 5. Ограничение, чтобы бур не улетал за верх экрана
    if (drillY < -100) {
        drillY = -100;
        if (velY < 0) velY = 0;
    }

    // 6. Условие окончания игры (если бур упал на дно)
    if (drillY >= fieldHeight - drillSize - 10) {
        endGame();
        return;
    }

    // 7. Отрисовка
    drill.style.transform = `translate(${drillX}px, ${drillY}px) rotate(${drillAngle}deg)`;
    
    // 8. Следующий кадр
    animationId = requestAnimationFrame(gameLoop);
}

// ===== Старт игры =====
function startGame() {
    if (isPlaying) return;
    
    const bonusModal = document.getElementById('bonusModal');
    if (bonusModal) bonusModal.classList.remove('is-open');

    // Получаем размеры прямо перед стартом
    updateSizes();

    // Ставим бур в центр, строго НАД сеткой
    drillX = fieldWidth / 2 - drillSize / 2;
    drillY = -50; // Чуть выше 0, чтобы красиво залетел
    velX = (Math.random() - 0.5) * 6; 
    velY = 2; 
    drillAngle = 0;
    
    drill.style.opacity = '1';
    isPlaying = true;
    
    animationId = requestAnimationFrame(gameLoop);

    // Ограничение по времени
    setTimeout(() => {
        if (isPlaying) endGame();
    }, 15000);
}

// ===== Конец игры =====
function endGame() {
    isPlaying = false;
    cancelAnimationFrame(animationId);
    drill.style.opacity = '0';

    setTimeout(() => {
        generateField();
    }, 1500);
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
drill.style.opacity = '0'; 