// ===== FALLING PICKAXE (Бесконечная шахта) =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');
const bonusBtn = document.getElementById('bonusBtn');
const bonusModal = document.getElementById('bonusModal');
const closeModal = document.getElementById('closeModal');

// Физические параметры
const GRAVITY = 0.6;        
const ROTATION_SPEED = 10; 
const SIZE = 40;           

const BLOCK_W = 60;
const BLOCK_H = 60;
const ROWS = 10; // Сколько строк помещается на экране
const COLS = 10;

let isPlaying = false;
let reqId = null;
let blocks = []; // Двумерный массив (строки)

let x = 0, y = 0, vx = 0, vy = 0, angle = 0;

// ===== Генерация одной строки блоков =====
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

    // Создаем 10 строк (заполняем экран)
    for (let r = 0; r < ROWS; r++) {
        blocks.push(createRow());
    }
}

// ===== Проверка коллизий =====
function isSolid(px, py) {
    if (px < 0 || px >= 600) return true;
    if (py < 0) return false; // Над сеткой пусто
    
    // Если бур ушел ниже наших строк, значит там ничего нет (пока)
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    
    if (!blocks[row] || !blocks[row][col]) return false;
    
    const block = blocks[row][col];
    return block.style.opacity !== '0';
}

// ===== Ломаем блок =====
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

// ===== Функция: добавить новую строку снизу =====
function appendNewRow() {
    // Создаем новую строку
    const newRow = createRow();
    blocks.push(newRow);

    // Удаляем самую верхнюю строку (чтобы не было бесконечного DOM-дерева)
    const topRow = blocks.shift();
    topRow.forEach(block => block.remove());

    // Сдвигаем бур и все координаты вверх на высоту одного блока (60px)
    y -= BLOCK_H;
}

// ===== Игровой цикл =====
function loop() {
    if (!isPlaying) return;

    vy += GRAVITY;

    // Движение по X
    let nextX = x + vx;
    if (isSolid(nextX + SIZE/2, y + SIZE/2)) {
        vx = -vx * 0.5; 
    } else {
        x = nextX;
    }

    // Движение по Y
    let nextY = y + vy;
    if (isSolid(x + SIZE/2, nextY + SIZE/2)) {
        // Ломаем блок
        breakBlock(x + SIZE/2, nextY + SIZE/2);
        
        // Слабый отскок
        vy = -Math.abs(vy) * 0.1; 
        vx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
    } else {
        y = nextY;
    }

    // Вращение
    angle += ROTATION_SPEED;

    // Если бур опустился слишком низко (например, ниже 8-й строки)
    // Мы сдвигаем камеру (все поле) наверх
    if (y > (ROWS - 3) * BLOCK_H) {
        appendNewRow();
    }

    // Отрисовка
    drill.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    
    reqId = requestAnimationFrame(loop);
}

// ===== Старт =====
function startGame() {
    if (isPlaying) return;
    
    if (bonusModal) bonusModal.classList.remove('is-open');

    // Сбрасываем координаты
    x = 250; 
    y = -40; 
    vx = 2; 
    vy = 8; 
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

// ===== Модалка =====
if (spinBtn) {
    spinBtn.addEventListener('click', () => {
        if (!isPlaying) bonusModal.classList.add('is-open');
    });
}

if (bonusBtn) {
    bonusBtn.addEventListener('click', () => {
        if (!isPlaying) bonusModal.classList.add('is-open');
    });
}

document.querySelectorAll('.bonus-card__activate').forEach(btn => {
    btn.addEventListener('click', () => {
        startGame();
    });
});

if (closeModal) {
    closeModal.addEventListener('click', () => {
        bonusModal.classList.remove('is-open');
    });
}

if (bonusModal) {
    bonusModal.addEventListener('click', (e) => {
        if (e.target === bonusModal) {
            bonusModal.classList.remove('is-open');
        }
    });
}

// ===== Старт =====
generateField();
drill.style.opacity = '0';