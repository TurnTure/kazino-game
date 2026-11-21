// ===== Kalina Rush (Автопилот) =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const actionBtn = document.getElementById('actionBtn');
const multiplierValue = document.getElementById('multiplierValue');
const startOverlay = document.getElementById('startOverlay');
const crashOverlay = document.getElementById('crashOverlay');
const engineOverlay = document.getElementById('engineOverlay');
const timerDisplay = document.getElementById('gameTimer');
const betInput = document.getElementById('betInput');

// Игровые переменные
let isPlaying = false;
let currentMultiplier = 1.00;
let startTime = 0;
let gameLoop = null;
let speed = 5; // Начальная скорость прокрутки
let distance = 0;

// Координаты и размеры
const LANES = [100, 300, 500]; // 3 полосы
const CAR_WIDTH = 50;
const CAR_HEIGHT = 90;

// Наша машина
let playerCar = {
    x: LANES[1], // Текущая позиция
    y: canvas.height - CAR_HEIGHT - 20,
    targetX: LANES[1],
    laneIndex: 1 // 0, 1 или 2 (левая, центр, правая)
};

// Массив вражеских машин
let enemyCars = [];
let enemySpawnTimer = 0;
let laneChangeTimer = 0; // Таймер для смены полосы

// Настройки
const CRASH_CHANCE_PER_SEC = 0.01; // Шанс заглохнуть (1% в секунду)
const ENEMY_SPAWN_RATE = 100; // Как часто спавнятся враги (кадры)

// ===== Отрисовка =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Асфальт
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Обочины
    ctx.fillStyle = '#444';
    ctx.fillRect(40, 0, 4, canvas.height); // Левая
    ctx.fillRect(canvas.width - 44, 0, 4, canvas.height); // Правая

    // 3. Пунктиры (движутся)
    ctx.fillStyle = '#444';
    let lineOffset = (distance * speed) % 80;
    for (let i = -80; i < canvas.height; i += 80) {
        ctx.fillRect(280, i + lineOffset, 4, 40);
        ctx.fillRect(520, i + lineOffset, 4, 40);
    }

    // 4. Враги
    enemyCars.forEach(car => {
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.roundRect(car.x - CAR_WIDTH/2, car.y, CAR_WIDTH, CAR_HEIGHT, 10);
        ctx.fill();
        
        // Фары
        ctx.fillStyle = '#fff';
        ctx.fillRect(car.x - CAR_WIDTH/2 + 5, car.y + 10, 10, 5);
        ctx.fillRect(car.x + CAR_WIDTH/2 - 15, car.y + 10, 10, 5);
    });

    // 5. Наша машина
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    // Плавное скольжение в нужную полосу
    playerCar.x += (playerCar.targetX - playerCar.x) * 0.1;
    ctx.roundRect(playerCar.x - CAR_WIDTH/2, playerCar.y, CAR_WIDTH, CAR_HEIGHT, 10);
    ctx.fill();
    
    // Детали (полоски)
    ctx.fillStyle = '#ccc';
    ctx.fillRect(playerCar.x - CAR_WIDTH/2 + 5, playerCar.y + 40, CAR_WIDTH - 10, 2);
}

// ===== Логика =====
function update() {
    if (!isPlaying) return;

    distance += 1;
    currentMultiplier += 0.005;
    multiplierValue.textContent = 'x' + currentMultiplier.toFixed(2);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    timerDisplay.textContent = elapsed + ' сек';

    speed = 5 + (distance / 2000);

    // --- 1. Логика автопилота (случайная смена полос) ---
    laneChangeTimer++;
    // Примерно раз в 1.5 секунды (90 кадров) машина решает перестроиться
    if (laneChangeTimer > 90 && Math.random() < 0.2) {
        laneChangeTimer = 0;
        
        // Выбираем новую полосу (не текущую)
        let newLane = Math.floor(Math.random() * LANES.length);
        if (newLane !== playerCar.laneIndex) {
            playerCar.laneIndex = newLane;
            playerCar.targetX = LANES[newLane];
        }
    }

    // --- 2. Движение врагов и проверка на столкновение ---
    for (let i = enemyCars.length - 1; i >= 0; i--) {
        let car = enemyCars[i];
        car.y += speed;

        // Проверяем, не столкнулись ли мы (с учетом того, что мы плавно двигаемся)
        // Используем targetX для проверки, так как машина уже "решила" туда ехать
        let playerLaneX = LANES[playerCar.laneIndex];
        
        if (
            playerLaneX - CAR_WIDTH/2 < car.x + CAR_WIDTH/2 &&
            playerLaneX + CAR_WIDTH/2 > car.x - CAR_WIDTH/2 &&
            playerCar.y < car.y + CAR_HEIGHT &&
            playerCar.y + CAR_HEIGHT > car.y
        ) {
            crashGame();
            return;
        }

        if (car.y > canvas.height) {
            enemyCars.splice(i, 1);
        }
    }

    // --- 3. Спавн врагов ---
    enemySpawnTimer++;
    if (enemySpawnTimer > ENEMY_SPAWN_RATE) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    // --- 4. Шанс заглохнуть ---
    if (Math.random() < (CRASH_CHANCE_PER_SEC / 60)) {
        engineStall();
        return;
    }

    draw();
    gameLoop = requestAnimationFrame(update);
}

// Спавн врага
function spawnEnemy() {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    
    // Проверяем, чтобы враг не спавнился слишком близко, если мы уже там
    enemyCars.push({
        x: lane,
        y: -CAR_HEIGHT - 50
    });
}

// ===== Старт =====
function startGame() {
    if (isPlaying) return;

    isPlaying = true;
    currentMultiplier = 1.00;
    distance = 0;
    speed = 5;
    enemyCars = [];
    enemySpawnTimer = 0;
    laneChangeTimer = 0;
    
    multiplierValue.textContent = 'x1.00';
    multiplierValue.style.color = '#d4ff00';
    startOverlay.style.display = 'none';
    crashOverlay.style.display = 'none';
    engineOverlay.style.display = 'none';
    
    actionBtn.textContent = 'ЗАБРАТЬ';
    actionBtn.classList.add('cashout');

    // Старт по центру
    playerCar.laneIndex = 1;
    playerCar.x = LANES[1];
    playerCar.targetX = LANES[1];
    playerCar.y = canvas.height - CAR_HEIGHT - 20;

    startTime = Date.now();
    update();
}

// ===== Авария =====
function crashGame() {
    isPlaying = false;
    cancelAnimationFrame(gameLoop);
    
    multiplierValue.style.color = '#ff3333';
    crashOverlay.style.display = 'block';
    actionBtn.textContent = 'ЕЩЕ РАЗ';
    actionBtn.classList.remove('cashout');
    
    draw();
}

// ===== Двигатель заглох =====
function engineStall() {
    isPlaying = false;
    cancelAnimationFrame(gameLoop);
    
    multiplierValue.style.color = '#ff3333';
    engineOverlay.style.display = 'block';
    actionBtn.textContent = 'ЕЩЕ РАЗ';
    actionBtn.classList.remove('cashout');
    
    draw();
}

// ===== Забрать =====
function cashout() {
    if (!isPlaying) return;
    
    isPlaying = false;
    cancelAnimationFrame(gameLoop);

    multiplierValue.style.color = '#fff';
    actionBtn.textContent = 'НАЧАТЬ ЗАЕЗД';
    actionBtn.classList.remove('cashout');
    
    const bet = Number(betInput.value);
    const win = Math.floor(bet * currentMultiplier);
    showMessage(`Вы забрали: +${win} ₽ (x${currentMultiplier.toFixed(2)})`, '#2E7D32');

    setTimeout(() => {
        startOverlay.style.display = 'block';
        multiplierValue.textContent = 'x0.00';
        multiplierValue.style.color = '#d4ff00';
        draw();
    }, 1000);
}

// ===== Кнопки =====
actionBtn.addEventListener('click', () => {
    if (!isPlaying) {
        startGame();
    } else {
        cashout();
    }
});

// Первичная отрисовка
draw();