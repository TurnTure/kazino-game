document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const actionBtn = document.getElementById('actionBtn');
    const multiplierValue = document.getElementById('multiplierValue');
    const startOverlay = document.getElementById('startOverlay');
    const crashOverlay = document.getElementById('crashOverlay');
    const engineOverlay = document.getElementById('engineOverlay');
    const timerDisplay = document.getElementById('gameTimer');
    const betInput = document.getElementById('betInput');

    let isPlaying = false;
    let currentMultiplier = 0.00; // СТАРТ С 0.00
    let startTime = 0;
    let gameLoop = null;
    let speed = 5;
    let distance = 0;

    // --- НАСТРОЙКИ БАЛАНСА ---
    // +1.00 икс ровно за 10 секунд (600 кадров при 60 fps)
    const MULTIPLIER_GROWTH = 1.00 / 600; 
    const BASE_CRASH_CHANCE = 0.002; 
    let currentCrashChance = BASE_CRASH_CHANCE;

    const ROAD_WIDTH = 800;
    const CAR_WIDTH = 60;
    const CAR_HEIGHT = 100;

    // Координаты 3-х полос
    const LANES = [ROAD_WIDTH * 0.25, ROAD_WIDTH * 0.5, ROAD_WIDTH * 0.75];

    let playerCar = {
        x: LANES[1],
        y: canvas.height - CAR_HEIGHT - 20,
        targetX: LANES[1],
        laneIndex: 1
    };

    let enemyCars = [];
    let enemySpawnTimer = 0;
    let laneChangeTimer = 0;
    const ENEMY_SPAWN_RATE = 150; 

    // ===== Отрисовка =====
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#444';
        ctx.fillRect(canvas.width * 0.1, 0, 4, canvas.height);
        ctx.fillRect(canvas.width * 0.9 - 4, 0, 4, canvas.height);

        ctx.fillStyle = '#444';
        let lineOffset = (distance * speed) % 80;
        for (let i = -80; i < canvas.height; i += 80) {
            ctx.fillRect(canvas.width * 0.375, i + lineOffset, 4, 40); 
            ctx.fillRect(canvas.width * 0.625, i + lineOffset, 4, 40); 
        }

        enemyCars.forEach(car => {
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.roundRect(car.x - CAR_WIDTH/2, car.y, CAR_WIDTH, CAR_HEIGHT, 10);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.fillRect(car.x - CAR_WIDTH/2 + 5, car.y + 10, 10, 5);
            ctx.fillRect(car.x + CAR_WIDTH/2 - 15, car.y + 10, 10, 5);
        });

        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        playerCar.x += (playerCar.targetX - playerCar.x) * 0.1;
        ctx.roundRect(playerCar.x - CAR_WIDTH/2, playerCar.y, CAR_WIDTH, CAR_HEIGHT, 10);
        ctx.fill();
        
        ctx.fillStyle = '#ccc';
        ctx.fillRect(playerCar.x - CAR_WIDTH/2 + 5, playerCar.y + 40, CAR_WIDTH - 10, 2);
    }

    // ===== Логика =====
    function update() {
        if (!isPlaying) return;

        distance += 1;
        
        // Растем
        currentMultiplier += MULTIPLIER_GROWTH; 
        
        // Логика усложнения (после x2 шанс растет)
        if (currentMultiplier > 2.0) {
            currentCrashChance = BASE_CRASH_CHANCE + ((currentMultiplier - 2.0) * 0.002);
        }

        // Максимальный потолок х20
        if (currentMultiplier >= 20.0) {
            currentMultiplier = 20.0;
            cashout(); 
            return;
        }

        multiplierValue.textContent = 'x' + currentMultiplier.toFixed(2);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        timerDisplay.textContent = elapsed + ' сек';

        speed = 5 + (distance / 4000);

        // Автопилот
        laneChangeTimer++;
        if (laneChangeTimer > 90 && Math.random() < 0.2) {
            laneChangeTimer = 0;
            let newLane = Math.floor(Math.random() * LANES.length);
            if (newLane !== playerCar.laneIndex) {
                playerCar.laneIndex = newLane;
                playerCar.targetX = LANES[newLane];
            }
        }

        // Машины и столкновения
        for (let i = enemyCars.length - 1; i >= 0; i--) {
            let car = enemyCars[i];
            car.y += speed;

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

        // Спавн
        enemySpawnTimer++;
        if (enemySpawnTimer > ENEMY_SPAWN_RATE) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }

        // Поломка двигателя
        if (Math.random() < (currentCrashChance / 60)) {
            engineStall();
            return;
        }

        draw();
        gameLoop = requestAnimationFrame(update);
    }

    function spawnEnemy() {
        const lane = LANES[Math.floor(Math.random() * LANES.length)];
        enemyCars.push({ x: lane, y: -CAR_HEIGHT - 50 });
    }

    function startGame() {
        if (isPlaying) return;

        isPlaying = true;
        
        currentMultiplier = 0.00; // СТАРТ С 0.00
        currentCrashChance = BASE_CRASH_CHANCE;
        distance = 0;
        speed = 5;
        
        enemyCars = []; 
        enemySpawnTimer = 0;
        laneChangeTimer = 0;
        
        multiplierValue.textContent = 'x0.00';
        multiplierValue.style.color = '#d4ff00';
        startOverlay.style.display = 'none';
        crashOverlay.style.display = 'none';
        engineOverlay.style.display = 'none';
        
        actionBtn.textContent = 'ЗАБРАТЬ';
        actionBtn.classList.add('cashout');

        playerCar.laneIndex = 1;
        playerCar.x = LANES[1];
        playerCar.targetX = LANES[1];
        playerCar.y = canvas.height - CAR_HEIGHT - 20;

        startTime = Date.now();
        update();
    }

    function crashGame() {
        isPlaying = false;
        cancelAnimationFrame(gameLoop);
        multiplierValue.style.color = '#ff3333';
        crashOverlay.style.display = 'block';
        actionBtn.textContent = 'ЕЩЕ РАЗ';
        actionBtn.classList.remove('cashout');
        draw();
    }

    function engineStall() {
        isPlaying = false;
        cancelAnimationFrame(gameLoop);
        multiplierValue.style.color = '#999';
        engineOverlay.style.display = 'block';
        actionBtn.textContent = 'ЕЩЕ РАЗ';
        actionBtn.classList.remove('cashout');
        draw();
    }

    function cashout() {
        if (!isPlaying) return;
        
        isPlaying = false;
        cancelAnimationFrame(gameLoop);

        multiplierValue.style.color = '#fff';
        actionBtn.textContent = 'НАЧАТЬ ЗАЕЗД';
        actionBtn.classList.remove('cashout');
        
        const bet = Number(betInput.value);
        
        // Считаем выигрыш
        const win = Math.floor(bet * currentMultiplier); 
        
        // Списываем ставку и начисляем выигрыш в базу
        if (typeof addBalance === 'function') {
            addBalance(-bet, 'kalina:bet');
            if (win > 0) {
                addBalance(win, 'kalina:win');
            }
        }
        
        // Показываем оверлей по центру экрана
        const winOverlay = document.getElementById('winOverlay');
        const winAmountText = document.getElementById('winAmountText');
        
        if (win > 0) {
            winAmountText.textContent = `Вы забрали: +${win} ₽ (x${currentMultiplier.toFixed(2)})`;
            winAmountText.style.color = '#a5d6a7'; // Светло-зеленый
        } else {
            winAmountText.textContent = `Вы забрали: 0 ₽ (x${currentMultiplier.toFixed(2)})`;
            winAmountText.style.color = '#ff3333'; // Красный, если 0
        }
        
        winOverlay.style.display = 'block';

        // Убираем оверлей через 2 секунды и возвращаем стартовый экран
        setTimeout(() => {
            winOverlay.style.display = 'none';
            startOverlay.style.display = 'block';
            multiplierValue.textContent = 'x0.00';
            multiplierValue.style.color = '#d4ff00';
            draw();
        }, 2000); // 2 секунды
    }

    actionBtn.addEventListener('click', () => {
        if (!isPlaying) {
            startGame();
        } else {
            cashout();
        }
    });

    draw();
});