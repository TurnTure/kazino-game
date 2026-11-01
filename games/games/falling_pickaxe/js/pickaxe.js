// ===== FALLING PICKAXE (Финальная версия) =====

const gameField = document.getElementById('gameField');
const drill = document.getElementById('drill');
const drillHp = document.getElementById('drillHp');
const drillHpText = document.getElementById('drillHpText');
const gameCashText = document.getElementById('gameCash');

const spinBtn = document.getElementById('spinBtn');
const bonusBtn = document.getElementById('bonusBtn');
const bonusModal = document.getElementById('bonusModal');
const closeModal = document.getElementById('closeModal');

// Физические параметры
const GRAVITY = 0.15;        
const MAX_FALL_SPEED = 6;    
const ROTATION_SPEED = 5;    
const SIZE = 40;           
const DAMAGE = 1; 

const BLOCK_W = 60;
const BLOCK_H = 60;
const ROWS = 10; 
const COLS = 10;

let isPlaying = false;
let reqId = null;
let blocks = []; 

let x = 0, y = 0, vx = 0, vy = 0, angle = 0;

// Логика
let currentBet = 300;
let currentPickaxe = null; 
let currentPickaxeHp = 150; 
let currentDepth = 0;
let veinData = { type: null, remaining: 0 };
let maxHp = 150;
let currentHp = 150;
let currentCash = 0;

// Цены за блоки
// Цены за блоки (сильно уменьшены)
const BLOCK_VALUES = {
    'dirt': 0,       // Земля - почти ничего
    'stone': 0,      // Камень - копейки
    'cobblestone': 0,  // Булыжник - 1 рубль
    'iron': 0.7,        // Железо - 10 рублей
    'diamond': 30,     // Алмаз - 30 рублей
    'emerald': 100,    // Изумруд - 100 рублей
    'dynamite': 0,
    'workbench': 0
};

// ===== Создание одного блока =====
function createBlock(depth, col) {
    const block = document.createElement('div');
    block.className = 'block';

    if (col === 0 || col === 9) {
        block.classList.add('indestructible');
        return block;
    }

    let type = 'stone';
    let hp = 0;

    // Специальные блоки (теперь 1 на каждые 15 слоев)
    if (depth >= 10 && depth % 15 === 0 && Math.random() < 0.3) {
        if (Math.random() > 0.5) {
            type = 'dynamite';
            hp = 1;
        } else {
            type = 'workbench';
            hp = 3;
        }
        block.dataset.type = type;
        block.dataset.hp = hp;
        block.classList.add(type);
        return block;
    }

    // Обычные блоки
    if (depth < 10) {
        if (Math.random() > 0.5) { type = 'dirt'; hp = 0; }
        else { type = 'stone'; hp = 0; }
    } else {
        if (veinData.remaining > 0) {
            type = veinData.type;
            hp = veinData.type === 'iron' ? 2 : (veinData.type === 'diamond' ? 3 : 4);
            veinData.remaining--;
        } else {
            const rand = Math.random() * 100;
            if (rand < 15) {
                const oreRand = Math.random() * 100;
                if (oreRand < 60) {
                    type = 'iron';     
                    hp = 2; 
                    veinData = { type: 'iron', remaining: 2 + Math.floor(Math.random() * 3) }; 
                } else if (oreRand < 90) {
                    type = 'diamond';  
                    hp = 3; 
                    veinData = { type: 'diamond', remaining: 1 + Math.floor(Math.random() * 2) }; 
                } else {
                    type = 'emerald';  
                    hp = 4; 
                    veinData = { type: 'emerald', remaining: 1 }; 
                }
            } else {
                type = 'cobblestone';
                hp = 2;
            }
        }
    }

    block.dataset.type = type;
    block.dataset.hp = hp;
    block.classList.add(type);
    return block;
}

// ===== Генерация одной строки =====
function createRow(depth) {
    const rowBlocks = [];
    if (Math.random() > 0.5) veinData.remaining = 0; 
    for (let c = 0; c < COLS; c++) {
        const block = createBlock(depth, c);
        gameField.appendChild(block);
        rowBlocks.push(block);
    }
    return rowBlocks;
}

// ===== Инициализация поля =====
function generateField() {
    if (!gameField) return; 
    gameField.innerHTML = '';
    blocks = [];
    currentDepth = 0;
    for (let r = 0; r < ROWS; r++) {
        blocks.push(createRow(currentDepth));
        currentDepth++;
    }
}

// ===== Проверка коллизий =====
function isSolid(px, py) {
    if (px < 0 || px >= 600) return true; 
    if (py < 0) return false; 
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    if (!blocks[row] || !blocks[row][col]) return false;
    return blocks[row][col].style.opacity !== '0';
}

function checkCollision(px, py) {
    return isSolid(px, py) || isSolid(px + SIZE, py) || 
           isSolid(px, py + SIZE) || isSolid(px + SIZE, py + SIZE);
}

// ===== Взрыв динамита =====
function explode(centerX, centerY) {
    for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
            const px = centerX + (c * BLOCK_W);
            const py = centerY + (r * BLOCK_H);
            const col = Math.floor(px / BLOCK_W);
            const row = Math.floor(py / BLOCK_H);

            if (col > 0 && col < COLS - 1 && row >= 0 && row < ROWS) {
                if (blocks[row] && blocks[row][col]) {
                    const b = blocks[row][col];
                    if (b.style.opacity !== '0' && b.dataset.type !== 'indestructible') {
                        b.style.opacity = '0';
                        b.style.border = 'none';
                        
                        // НАЧИСЛЯЕМ ДЕНЬГИ ЗА ВЗОРВАННЫЙ БЛОК
                        const bType = b.dataset.type;
                        currentCash += (BLOCK_VALUES[bType] || 0);
                        updateCash();
                    }
                }
            }
        }
    }
}

// ===== Апгрейд кирки =====
function upgradePickaxe() {
    if (currentPickaxe === 'stone') {
        currentPickaxe = 'iron';
        currentPickaxeHp = 200;
    } else if (currentPickaxe === 'iron') {
        currentPickaxe = 'diamond';
        currentPickaxeHp = 400;
    }
    maxHp = currentPickaxeHp;
    currentHp = maxHp;
    updateHp();
}

// ===== Обновление счета =====
function updateCash() {
    if (gameCashText) gameCashText.textContent = currentCash.toFixed(2);
}

// ===== Нанесение урона блоку =====
function hitBlock(px, py) {
    const col = Math.floor(px / BLOCK_W);
    const row = Math.floor(py / BLOCK_H);
    
    if (col <= 0 || col >= COLS - 1) return; 
    if (!blocks[row] || !blocks[row][col]) return;
    
    const block = blocks[row][col];
    if (block.style.opacity === '0') return;

    const blockType = block.dataset.type;
    let damageToDrill = (blockType === 'dirt' || blockType === 'stone') ? 1 : 5;

    currentHp -= damageToDrill;
    updateHp();

    if (currentHp <= 0) {
        stopGame();
        return;
    }

    let hp = parseInt(block.dataset.hp) || 0;
    
    if (hp === 0) {
        block.style.opacity = '0';
        block.style.border = 'none';
        currentCash += (BLOCK_VALUES[blockType] || 0);
        updateCash();
        if (blockType === 'dynamite') explode(px, py);
        if (blockType === 'workbench') upgradePickaxe();
    } else {
        hp -= DAMAGE;
        block.dataset.hp = hp;

        if (hp <= 0) {
            block.style.opacity = '0';
            block.style.border = 'none';
            currentCash += (BLOCK_VALUES[blockType] || 0);
            updateCash();
            if (blockType === 'dynamite') explode(px, py);
            if (blockType === 'workbench') upgradePickaxe();
        } else {
            block.style.opacity = 0.5 + (hp * 0.1); 
            vy = -Math.abs(vy) * 0.1 - 0.5; 
            vx = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5);
        }
    }
}

// ===== Сдвиг камеры =====
function shiftCamera() {
    const newRow = createRow(currentDepth);
    currentDepth++;
    const topRow = blocks.shift(); 
    topRow.forEach(block => block.remove());
    blocks.push(newRow);
    y -= BLOCK_H;
}

// ===== Обновление HP =====
function updateHp() {
    if (drillHpText) drillHpText.textContent = `${currentHp}/${maxHp}`;
}

// ===== Игровой цикл =====
function loop() {
    if (!isPlaying) return;

    vy += GRAVITY;
    if (vy > MAX_FALL_SPEED) vy = MAX_FALL_SPEED;

    let nextX = x + vx;
    if (checkCollision(nextX, y)) {
        hitBlock(nextX, y); hitBlock(nextX + SIZE, y); 
        hitBlock(nextX, y + SIZE); hitBlock(nextX + SIZE, y + SIZE); 
        vx = -vx * 0.3; 
    } else {
        x = nextX;
    }

    let nextY = y + vy;
    if (checkCollision(x, nextY)) {
        hitBlock(x, nextY); hitBlock(x + SIZE, nextY);
        hitBlock(x, nextY + SIZE); hitBlock(x + SIZE, nextY + SIZE);
        vy = -Math.abs(vy) * 0.2 - 1; 
        vx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1);
    } else {
        y = nextY;
    }

    angle += ROTATION_SPEED;

    if (y > (ROWS - 3) * BLOCK_H) shiftCamera();
    if (y >= 600 - SIZE) y = 600 - SIZE;

    drill.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    
    if (drillHp) {
        drillHp.style.left = `${x + SIZE/2}px`;
        drillHp.style.top = `${y - 10}px`;
    }
    reqId = requestAnimationFrame(loop);
}

// ===== Старт =====
async function startGame() {
    if (isPlaying) return;

    // 1. Проверяем, хватает ли денег на ставку
    if (typeof canAfford === 'function' && !canAfford(currentBet)) {
        showMessage('Недостаточно средств', '#C8552B');
        return;
    }

    // 2. Списываем ставку с баланса
    if (typeof addBalance === 'function') {
        addBalance(-currentBet, 'pickaxe:bet');
    }

    if (bonusModal) bonusModal.classList.remove('is-open');

    x = 250; y = -40; vx = 2; vy = 4; angle = 0;
    currentCash = 0; updateCash();
    maxHp = currentPickaxeHp; currentHp = maxHp; updateHp();

    drill.style.opacity = '1';
    if (drillHp) drillHp.style.opacity = '1'; 
    isPlaying = true;
    reqId = requestAnimationFrame(loop);
}

// ===== Стоп =====
function stopGame() {
    isPlaying = false;
    cancelAnimationFrame(reqId);
    drill.style.opacity = '0';
    if (drillHp) drillHp.style.opacity = '0'; 

    // Начисление выигрыша
    if (currentCash > 0 && typeof addBalance === 'function') {
        addBalance(currentCash, 'pickaxe:win');
    }

    setTimeout(() => { generateField(); }, 1500);
}

// ===== Ползунок =====
const betInput = document.getElementById('modalBetInput');
const slider = document.querySelector('.modal__slider input[type="range"]');

function updateBet(value) {
    currentBet = Math.max(10, Math.min(10000, value));
    if (betInput) betInput.value = currentBet;
    if (slider) slider.value = currentBet;

    // Обновляем цены на карточках
    const cardPrices = document.querySelectorAll('.bonus-card__price');
    if (cardPrices.length === 3) {
        // Каменная - дороже ставки (x1.1), Железная (x1.7), Алмазная (x2.1)
        cardPrices[0].textContent = `bet will be ${(currentBet * 1.1).toFixed(2)}`;
        cardPrices[1].textContent = `bet will be ${(currentBet * 1.7).toFixed(2)}`;
        cardPrices[2].textContent = `bet will be ${(currentBet * 2.1).toFixed(2)}`;
    }
}

if (slider) slider.addEventListener('input', (e) => updateBet(parseInt(e.target.value)));
if (betInput) betInput.addEventListener('input', (e) => updateBet(parseInt(e.target.value) || 10));

// ===== Кнопки =====
if (spinBtn) {
    spinBtn.addEventListener('click', () => {
        if (!isPlaying) {
            if (currentPickaxe === null) bonusModal.classList.add('is-open');
            else startGame();
        }
    });
}

if (bonusBtn) {
    bonusBtn.addEventListener('click', () => {
        if (!isPlaying) bonusModal.classList.add('is-open');
    });
}

document.querySelectorAll('.bonus-card__activate').forEach(btn => {
    btn.addEventListener('click', () => {
        currentPickaxe = btn.dataset.type; 
        currentPickaxeHp = parseInt(btn.dataset.hp) || 150; 
        startGame();
    });
});

if (closeModal) closeModal.addEventListener('click', () => bonusModal.classList.remove('is-open'));
if (bonusModal) bonusModal.addEventListener('click', (e) => {
    if (e.target === bonusModal) bonusModal.classList.remove('is-open');
});

// ===== Старт =====
generateField();
drill.style.opacity = '0';
if (drillHp) drillHp.style.opacity = '0';
updateBet(currentBet);