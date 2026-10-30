// ===== FALLING PICKAXE =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');

const ROWS = 10;
const COLS = 10;

// Физические параметры
const GRAVITY = 0.4;       
const BOUNCE = 0.6;        
const ROTATION_SPEED = 8;  

let blocks = []; 
let isPlaying = false;
let animationId = null;

let drillX = 0;
let drillY = 0;
let velX = 0;
let velY = 0;
let drillAngle = 0;

// Размеры (в пикселях)
let fieldWidth = 600; // Ставим жестко 600, так как сетка у нас 600х600
let fieldHeight = 600;
let blockWidth = 60;
let blockHeight = 60;
const drillSize = 40;

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

// ===== Проверка на столкновение =====
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

    if (col <= 0 || col >= COLS - 1) return; 
    
    const block = blocks[row][col];
    if (block && block.style.opacity !== '0') {
        block.style.opacity = '0';
        block.style.border = 'none';
    }
}

// ===== Игровой цикл =====
function gameLoop() {
    if (!isPlaying) return;

    velY += GRAVITY;

    let nextX = drillX + velX;
    if (checkCollision(nextX + drillSize/2, drillY + drillSize/2)) {
        breakBlock(nextX + drillSize/2, drillY + drillSize/2); 
        velX *= -BOUNCE; 
    } else {
        drillX = nextX;
    }

    let nextY = drillY + velY;
    if (checkCollision(drillX + drillSize/2, nextY + drillSize/2)) {
        breakBlock(drillX + drillSize/2, nextY + drillSize/2);
        
        if (velY > 0) {
            velY = -velY * BOUNCE;
            if (Math.abs(velY) < 3) velY = -6; 
            velX = (Math.random() - 0.5) * 10; 
        }
    } else {
        drillY = nextY;
    }

    drillAngle += ROTATION_SPEED;

    // Если бур упал на дно
    if (drillY >= fieldHeight - drillSize) {
        endGame();
        return;
    }

    drill.style.transform = `translate(${drillX}px, ${drillY}px) rotate(${drillAngle}deg)`;
    animationId = requestAnimationFrame(gameLoop);
}

// ===== Старт игры =====
function startGame() {
    if (isPlaying) return;
    
    // Закрываем модалку
    const bonusModal = document.getElementById('bonusModal');
    if (bonusModal) bonusModal.classList.remove('is-open');

    // Ставим бур в центр (используем жесткие размеры 600x600)
    drillX = (600 / 2) - (drillSize / 2);
    drillY = -60; 
    
    velX = (Math.random() - 0.5) * 4; 
    velY = 2; 
    drillAngle = 0;
    
    drill.style.opacity = '1';
    isPlaying = true;
    
    // Запускаем цикл
    animationId = requestAnimationFrame(gameLoop);

    // Останавливаем через 15 секунд
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