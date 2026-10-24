// ===== FALLING PICKAXE =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');

// Размер сетки
const ROWS = 10;
const COLS = 10;

// Координаты бура (начинаем с 5-й строки, 5-го столбца — центр)
let drillRow = 5;
let drillCol = 5;

// ===== Генерация блоков =====
function generateField() {
    gameField.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const block = document.createElement('div');
            block.className = 'block';

            // Делаем случайный блок (земля или камень)
            if (Math.random() > 0.7) {
                block.classList.add('dirt');
            } else {
                block.classList.add('stone');
            }

            // Сохраняем координаты блока
            block.dataset.row = r;
            block.dataset.col = c;

            gameField.appendChild(block);
        }
    }
}

// ===== Движение бура =====
function moveDrillDown() {
    // Проверка, чтобы бур не вышел за нижнюю границу (последняя строка — 9)
    if (drillRow >= ROWS - 1) {
        console.log('Бур упал на дно!');
        return; // Останавливаем движение
    }

    drillRow++; // Увеличиваем строку (двигаемся вниз)
    updateDrillPosition(); // Обновляем визуальную позицию
}

// ===== Обновление позиции бура на экране =====
function updateDrillPosition() {
    // 100% ширины / 10 колонок = 10% на один блок
    const blockSizePercent = 100 / COLS;
    
    // Устанавливаем позицию в процентах
    drill.style.top = `${drillRow * blockSizePercent}%`;
    drill.style.left = `${drillCol * blockSizePercent}%`;
}

// ===== Модалка Бонусов =====
const bonusBtn = document.getElementById('bonusBtn');
const bonusModal = document.getElementById('bonusModal');
const closeModal = document.getElementById('closeModal');

bonusBtn.addEventListener('click', () => {
    bonusModal.classList.add('is-open');
});

closeModal.addEventListener('click', () => {
    bonusModal.classList.remove('is-open');
});

// ===== Кнопка "Крутить" =====
document.getElementById('spinBtn').addEventListener('click', () => {
    moveDrillDown();
});

// ===== Старт =====
generateField();
updateDrillPosition(); // Ставим бур на стартовую позицию