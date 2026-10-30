// ===== FALLING PICKAXE (Клеточная физика) =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const spinBtn = document.getElementById('spinBtn');

const ROWS = 10;
const COLS = 10;
const BLOCK_SIZE = 60; // Размер одной клетки

let isPlaying = false;
let blocks = []; 

// Позиция бура в клетках (строка и колонка)
let row = 0;
let col = 5; // Стартуем в центре (5-я колонка)
let timer = null;

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

// ===== Обновление позиции на экране =====
function updateDrillVisual() {
    // Ставим бур ровно в центр клетки
    const pixelX = (col * BLOCK_SIZE) + (BLOCK_SIZE / 2) - 20; // 20 - половина ширины бура
    const pixelY = (row * BLOCK_SIZE) + (BLOCK_SIZE / 2) - 20;
    
    drill.style.transform = `translate(${pixelX}px, ${pixelY}px) rotate(45deg)`;
}

// ===== Шаг игры (вызывается каждые 500мс) =====
function step() {
    if (!isPlaying) return;

    // 1. Смотрим, есть ли блок под нами
    let nextRow = row + 1;

    if (nextRow < ROWS) {
        // Если под нами есть блок (он не прозрачный) - ломаем его
        const blockBelow = blocks[nextRow][col];
        
        if (blockBelow.style.opacity !== '0') {
            blockBelow.style.opacity = '0'; // Ломаем
        }
        
        // Падаем вниз
        row = nextRow;
    } else {
        // Если дошли до низа - останавливаемся
        stopGame();
        return;
    }

    // 2. Двигаем вбок (чтобы было интереснее)
    // Чередуем влево-вправо, но не заходя в стены (0 и 9 колонка)
    if (col > 1 && col < COLS - 2) {
        // Если можем двигаться, двигаемся случайно
        col += Math.random() > 0.5 ? 1 : -1;
    }

    // 3. Отрисовываем
    updateDrillVisual();
}

// ===== Старт =====
function startGame() {
    if (isPlaying) return;
    
    const modal = document.getElementById('bonusModal');
    if (modal) modal.classList.remove('is-open');

    // Сбрасываем позицию
    row = 0;
    col = 5;
    
    drill.style.opacity = '1';
    updateDrillVisual();
    
    isPlaying = true;
    
    // Запускаем цикл (каждые 400 миллисекунд)
    timer = setInterval(step, 400);
}

// ===== Стоп =====
function stopGame() {
    isPlaying = false;
    clearInterval(timer);
    
    // Скрываем бур
    drill.style.opacity = '0';

    // Пересоздаем поле через секунду
    setTimeout(() => {
        generateField();
    }, 1000);
}

// ===== Кнопки =====
if (spinBtn) spinBtn.addEventListener('click', startGame);
document.querySelectorAll('.bonus-card__activate').forEach(btn => btn.addEventListener('click', startGame));

// ===== Старт =====
generateField();
drill.style.opacity = '0';