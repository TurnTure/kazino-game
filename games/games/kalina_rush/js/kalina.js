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
    let currentMultiplier = 1.00;
    let startTime = 0;
    let gameLoop = null;
    let speed = 5;
    let distance = 0;

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

    const CRASH_CHANCE_PER_SEC = 0.01;
    const ENEMY_SPAWN_RATE = 120; // Чуть реже спавним врагов, чтобы легче было

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
        
        // МНОЖИТЕЛЬ РАСТЕТ МЕДЛЕННЕЕ (было 0.005)
        currentMultiplier += 0.002; 
        multiplierValue.textContent = 'x' + currentMultiplier.toFixed(2);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        timerDisplay.textContent = elapsed + ' сек';

        // Скорость тоже немного замедлим, чтобы не было дёргано
        speed = 5 + (distance / 4000);

        laneChangeTimer++;
        if (laneChangeTimer > 90 && Math.random() < 0.2) {
            laneChangeTimer = 0;
            let newLane = Math.floor(Math.random() * LANES.length);
            if (newLane !== playerCar.laneIndex) {
                playerCar.laneIndex = newLane;
                playerCar.targetX = LANES[newLane];
            }
        }

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

        enemySpawnTimer++;
        if (enemySpawnTimer > ENEMY_SPAWN_RATE) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }

        if (Math.random() < (CRASH_CHANCE_PER_SEC / 60)) {
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
        
        // СТАРТ С 0.00
        currentMultiplier = 0.00; 
        distance = 0;
        speed = 5;
        
        // ОЧИЩАЕМ ВРАГОВ ОТ ПРОШЛОЙ ИГРЫ
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
        multiplierValue.style.color = '#ff3333';
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
        // Если множитель 0, то выигрыш будет 0. Защита от дурака:
        const win = Math.floor(bet * Math.max(1, currentMultiplier)); 
        showMessage(`Вы забрали: +${win} ₽ (x${currentMultiplier.toFixed(2)})`, '#2E7D32');

        setTimeout(() => {
            startOverlay.style.display = 'block';
            multiplierValue.textContent = 'x0.00';
            multiplierValue.style.color = '#d4ff00';
            draw();
        }, 1000);
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