// ===== FALLING PICKAXE (Бесконечная шахта) =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');
const bonusBtn = document.getElementById('bonusBtn');
const bonusModal = document.getElementById('bonusModal');
const closeModal = document.getElementById('closeModal');

// Физические параметры
const GRAVITY = 0.15;        
const MAX_FALL_SPEED = 6;    
const ROTATION_SPEED = 5;    
const SIZE = 40;           

const BLOCK_W = 60;
const BLOCK_H = 60;
const ROWS = 10; 
const COLS = 10;

let isPlaying = false;
let reqId = null;
let blocks = []; 

let x = 0, y = 0, vx = 0, vy = 0, angle = 0;

// Переменные для логики модалки
let currentBet = 300;
let currentPickaxe = null; // Храним выбранную кирку (например, 'stone', 'iron' или 'diamond')

// ===== Генерация одной строки =====
function createRow() {
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
    return rowBlocks;
}

// ===== Инициализация поля =====
function generateField() {
    gameField.innerHTML = '';
    blocks = [];

    for (let r = 0; r < ROWS; r++) {
        blocks.push(createRow());
    }
}

// ===== Проверка коллизий =====
function isSolid(px, py) {
    if (px < 0 || px >= 600) return true; 
    if (py < 0) return false; 
    
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    
    if (!blocks[row] || !blocks[row][col]) return false;
    
    const block = blocks[row][col];
    return block.style.opacity !== '0';
}

function checkCollision(px, py) {
    return isSolid(px, py) || 
           isSolid(px + SIZE, py) || 
           isSolid(px, py + SIZE) || 
           isSolid(px + SIZE, py + SIZE);
}

// ===== Ломаем конкретный блок =====
function breakBlock(px, py) {
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    
    if (col <= 0 || col >= COLS - 1) return; 
    if (!blocks[row] || !blocks[row][col]) return;
    
    const block = blocks[row][col];
    if (block.style.opacity !== '0') {
        block.style.opacity = '0';
        block.style.border = 'none';
    }
}

// ===== Сдвиг камеры =====
function shiftCamera() {
    const newRow = createRow();
    const topRow = blocks.shift(); 
    topRow.forEach(block => block.remove());
    blocks.push(newRow);
    y -= BLOCK_H;
}

// ===== Игровой цикл =====
function loop() {
    if (!isPlaying) return;

    vy += GRAVITY;
    if (vy > MAX_FALL_SPEED) vy = MAX_FALL_SPEED;

    let nextX = x + vx;
    if (checkCollision(nextX, y)) {
        breakBlock(nextX, y); 
        breakBlock(nextX + SIZE, y); 
        breakBlock(nextX, y + SIZE); 
        breakBlock(nextX + SIZE, y + SIZE); 
        vx = -vx * 0.5; 
    } else {
        x = nextX;
    }

    let nextY = y + vy;
    if (checkCollision(x, nextY)) {
        breakBlock(x, nextY);
        breakBlock(x + SIZE, nextY);
        breakBlock(x, nextY + SIZE);
        breakBlock(x + SIZE, nextY + SIZE);
        
        vy = -Math.abs(vy) * 0.1; 
        vx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
    } else {
        y = nextY;
    }

    angle += ROTATION_SPEED;

    if (y > (ROWS - 3) * BLOCK_H) shiftCamera();
    if (y >= 600 - SIZE) y = 600 - SIZE;

    drill.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    
    reqId = requestAnimationFrame(loop);
}

// ===== Старт =====
function startGame() {
    if (isPlaying) return;
    if (bonusModal) bonusModal.classList.remove('is-open');

    x = 250; 
    y = -40; 
    vx = 2; 
    vy = 4; 
    angle = 0;

    drill.style.opacity = '1';
    isPlaying = true;
    
    reqId = requestAnimationFrame(loop);
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

// ===== Логика ползунка и ввода ставки =====
const betInput = document.getElementById('modalBetInput');
const slider = document.querySelector('.modal__slider input[type="range"]');

function updateBet(value) {
    currentBet = Math.max(10, Math.min(10000, value));
    if (betInput) betInput.value = currentBet;
    if (slider) slider.value = currentBet;

    // Обновляем надписи на карточках
    const cardPrices = document.querySelectorAll('.bonus-card__price');
    if (cardPrices.length === 3) {
        cardPrices[0].textContent = `bet will be ${(currentBet * 1.1).toFixed(2)}`;
        cardPrices[1].textContent = `bet will be ${(currentBet * 1.7).toFixed(2)}`;
        cardPrices[2].textContent = `bet will be ${(currentBet * 2.1).toFixed(2)}`;
    }
}

if (slider) {
    slider.addEventListener('input', (e) => updateBet(parseInt(e.target.value)));
}
if (betInput) {
    betInput.addEventListener('input', (e) => updateBet(parseInt(e.target.value) || 10));
}

// ===== Кнопки (Логика казино) =====
// 1. Правая кнопка — быстрый запуск
if (spinBtn) {
    spinBtn.addEventListener('click', () => {
        if (isPlaying) return;

        if (currentPickaxe === null) {
            // Если кирка не выбрана — открываем меню
            bonusModal.classList.add('is-open');
        } else {
            // Если кирка есть — запускаем игру
            startGame();
        }
    });
}

// 2. Левая кнопка — открыть меню покупки
if (bonusBtn) {
    bonusBtn.addEventListener('click', () => {
        if (!isPlaying) bonusModal.classList.add('is-open');
    });
}

// 3. Кнопки активации внутри модалки
document.querySelectorAll('.bonus-card__activate').forEach(btn => {
    btn.addEventListener('click', () => {
        // Запоминаем выбранную кирку (в HTML должно быть data-type="stone" и т.д.)
        currentPickaxe = btn.dataset.type; 
        startGame();
    });
});

// Закрытие модалки
if (closeModal) {
    closeModal.addEventListener('click', () => bonusModal.classList.remove('is-open'));
}
if (bonusModal) {
    bonusModal.addEventListener('click', (e) => {
        if (e.target === bonusModal) bonusModal.classList.remove('is-open');
    });
}

// ===== Старт =====
generateField();
drill.style.opacity = '0';
updateBet(currentBet);