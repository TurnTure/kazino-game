// ===== FALLING PICKAXE (Пиксельная физика) =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');

const ROWS = 10;
const COLS = 10;

// Физические параметры (подбери под свой вкус)
const GRAVITY = 0.35;       // Сила притяжения
const BOUNCE = 0.7;         // Упругость (потеря скорости при отскоке)
const ROTATION_SPEED = 5;   // Скорость вращения бура

// Состояние игры
let blocks = []; 
let isPlaying = false;
let animationId = null;

// Позиция и скорость бура (в пикселях относительно поля)
let drillX = 0;
let drillY = 0;
let velX = 0;
let velY = 0;
let drillAngle = 0; // Угол вращения

// Размеры поля (в пикселях)
let fieldWidth = 0;
let fieldHeight = 0;
let blockWidth = 0;
let blockHeight = 0;
let drillSize = 40; // Размер бура в пикселях

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

// ===== Проверка на столкновение с блоком (по координатам пикселей) =====
// Возвращает true, если в этой точке есть целый блок
function checkCollision(x, y) {
    // Переводим пиксели в индексы сетки
    const col = Math.floor(x / blockWidth);
    const row = Math.floor(y / blockHeight);

    // Если вышли за пределы поля — считаем, что там стена
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
        return true; 
    }

    // Если блок не сломан (его прозрачность не 0) — есть коллизия
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
        
        // Даем буру случайный импульс при разрушении
        velX += (Math.random() - 0.5) * 3;
    }
}

// ===== Игровой цикл =====
function gameLoop() {
    if (!isPlaying) return;

    // 1. Применяем гравитацию к скорости падения
    velY += GRAVITY;

    // 2. Пробуем двигаться по X
    let nextX = drillX + velX;
    if (checkCollision(nextX, drillY) || checkCollision(nextX + drillSize, drillY) || 
        checkCollision(nextX, drillY + drillSize) || checkCollision(nextX + drillSize, drillY + drillSize)) {
        // Если врезались в стену или блок по бокам — отскакиваем и ломаем
        breakBlock(nextX, drillY); 
        velX *= -BOUNCE; // Отскок
    } else {
        drillX = nextX; // Двигаемся дальше
    }

    // 3. Пробуем двигаться по Y (падение)
    let nextY = drillY + velY;
    if (checkCollision(drillX, nextY + drillSize) || checkCollision(drillX + drillSize, nextY + drillSize)) {
        // Если врезались в блок снизу — ломаем его и подпрыгиваем
        breakBlock(drillX, nextY + drillSize);
        
        velY = -Math.abs(velY) * BOUNCE; // Отскок вверх
        if (Math.abs(velY) < 2) velY = -5; // Чтобы не залипал, если скорость маленькая
        
        // Подкидываем вбок для хаоса
        velX = (Math.random() - 0.5) * 8; 
    } else {
        drillY = nextY; // Падаем дальше
    }

    // 4. Вращение
    drillAngle += ROTATION_SPEED;

    // 5. Если бур упал на самое дно — конец игры
    if (drillY >= fieldHeight - drillSize) {
        endGame();
        return;
    }

    // 6. Отрисовка
    drill.style.transform = `translate(${drillX}px, ${drillY}px) rotate(${drillAngle}deg)`;
    
    // Продолжаем цикл
    animationId = requestAnimationFrame(gameLoop);
}

// ===== Старт игры =====
function startGame() {
    if (isPlaying) return;
    
    // Закрываем модалку, если открыта
    const bonusModal = document.getElementById('bonusModal');
    if (bonusModal) bonusModal.classList.remove('is-open');

    // Ставим бур в центр верхней части
    drillX = fieldWidth / 2 - drillSize / 2;
    drillY = -drillSize - 10; // Чуть выше поля
    velX = (Math.random() - 0.5) * 4; // Случайный начальный наклон
    velY = 2; // Начальная скорость падения
    drillAngle = 0;
    
    drill.style.opacity = '1';
    isPlaying = true;
    
    // Запускаем игру
    animationId = requestAnimationFrame(gameLoop);

    // Чтобы не летал вечно, ставим ограничение по времени (15 секунд)
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