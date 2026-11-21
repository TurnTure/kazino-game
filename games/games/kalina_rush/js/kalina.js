document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const actionBtn = document.getElementById('actionBtn');
    const multiplierValue = document.getElementById('multiplierValue');
    const startOverlay = document.getElementById('startOverlay');
    const crashOverlay = document.getElementById('crashOverlay');
    const engineOverlay = document.getElementById('engineOverlay');
    const winOverlay = document.getElementById('winOverlay');
    const timerDisplay = document.getElementById('gameTimer');
    const betInput = document.getElementById('betInput');

    let isPlaying = false;
    let currentMultiplier = 0.00;
    let startTime = 0;
    let gameLoop = null;
    let speed = 5;
    let distance = 0;

    // --- НАСТРОЙКИ БАЛАНСА ---
    const MULTIPLIER_GROWTH = 1.00 / 600; 
    const BASE_CRASH_CHANCE = 0.002; 
    let currentCrashChance = BASE_CRASH_CHANCE;

    const ROAD_WIDTH = 800;
    const CAR_WIDTH = 70;  
    const CAR_HEIGHT = 120; 

    // Загружаем картинку
    const carImage = new Image();
    carImage.src = '/games/games/kalina_rush/img/Kalina.webp'; 
    
    // Создаем временный холст для обработки (удаления белого фона)
    const processedCarImage = document.createElement('canvas');
    const procCtx = processedCarImage.getContext('2d');
    let isImageProcessed = false;

    carImage.onload = () => {
        console.log("Картинка загружена, удаляем белый фон...");
        
        processedCarImage.width = carImage.width;
        processedCarImage.height = carImage.height;
        
        // Рисуем картинку на временном холсте
        procCtx.drawImage(carImage, 0, 0);
        
        // Получаем данные пикселей
        const imageData = procCtx.getImageData(0, 0, processedCarImage.width, processedCarImage.height);
        const data = imageData.data;
        
        // Проходимся по каждому пикселю
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Если пиксель белый или очень светлый (r, g, b > 240), делаем его прозрачным
            // Порог 240 означает, что мы удаляем только чисто белый цвет, не трогая блики
            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; // Alpha = 0 (прозрачный)
            }
        }
        
        // Возвращаем обработанные пиксели
        procCtx.putImageData(imageData, 0, 0);
        isImageProcessed = true;
        
        if (!isPlaying) draw();
    };
    carImage.onerror = () => {
        console.error("ОШИБКА: Не удалось загрузить картинку.");
    };

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

        // Дорога
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

        // Враги (используем обработанную картинку)
        enemyCars.forEach(car => {
            if (isImageProcessed) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 5;
                ctx.drawImage(processedCarImage, car.x - CAR_WIDTH/2, car.y, CAR_WIDTH, CAR_HEIGHT);
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;
            } else {
                ctx.fillStyle = '#ff3333';
                ctx.beginPath();
                ctx.roundRect(car.x - CAR_WIDTH/2, car.y, CAR_WIDTH, CAR_HEIGHT, 10);
                ctx.fill();
            }
        });

        // Наша машина (используем обработанную картинку)
        ctx.beginPath();
        playerCar.x += (playerCar.targetX - playerCar.x) * 0.1;
        
        if (isImageProcessed) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 8;
            ctx.drawImage(processedCarImage, playerCar.x - CAR_WIDTH/2, playerCar.y, CAR_WIDTH, CAR_HEIGHT);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
        } else {
            ctx.fillStyle = '#e0e0e0';
            ctx.roundRect(playerCar.x - CAR_WIDTH/2, playerCar.y, CAR_WIDTH, CAR_HEIGHT, 10);
            ctx.fill();
        }
    }

    // ===== Логика =====
    function update() {
        if (!isPlaying) return;

        distance += 1;
        
        currentMultiplier += MULTIPLIER_GROWTH; 
        
        if (currentMultiplier > 2.0) {
            currentCrashChance = BASE_CRASH_CHANCE + ((currentMultiplier - 2.0) * 0.002);
        }

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

            if (
                playerCar.x - CAR_WIDTH/2 < car.x + CAR_WIDTH/2 &&
                playerCar.x + CAR_WIDTH/2 > car.x - CAR_WIDTH/2 &&
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

    // ===== СТАРТ ИГРЫ =====
    function startGame() {
        if (isPlaying) return;

        const bet = Number(betInput.value);
        
        if (typeof canAfford === 'function' && !canAfford(bet)) {
            showMessage('Недостаточно средств', '#C8552B');
            return;
        }
        if (bet < 10) {
            showMessage('Минимальная ставка 10 ₽', '#C8552B');
            return;
        }

        if (typeof addBalance === 'function') {
            addBalance(-bet, 'kalina:bet');
        }

        isPlaying = true;
        
        currentMultiplier = 0.00;
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
        winOverlay.style.display = 'none';
        
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

    // ===== ЗАБРАТЬ ВЫИГРЫШ =====
    function cashout() {
        if (!isPlaying) return;
        
        isPlaying = false;
        cancelAnimationFrame(gameLoop);

        multiplierValue.style.color = '#fff';
        actionBtn.textContent = 'НАЧАТЬ ЗАЕЗД';
        actionBtn.classList.remove('cashout');
        
        const bet = Number(betInput.value);
        const win = Math.floor(bet * currentMultiplier); 
        
        if (typeof addBalance === 'function') {
            if (win > 0) {
                addBalance(win, 'kalina:win');
            }
        }
        
        const winAmountText = document.getElementById('winAmountText');
        
        if (win > 0) {
            winAmountText.textContent = `Вы забрали: +${win} ₽ (x${currentMultiplier.toFixed(2)})`;
            winAmountText.style.color = '#a5d6a7';
        } else {
            winAmountText.textContent = `Вы забрали: 0 ₽ (x${currentMultiplier.toFixed(2)})`;
            winAmountText.style.color = '#ff3333';
        }
        
        winOverlay.style.display = 'block';

        setTimeout(() => {
            winOverlay.style.display = 'none';
            startOverlay.style.display = 'block';
            multiplierValue.textContent = 'x0.00';
            multiplierValue.style.color = '#d4ff00';
            draw();
        }, 2000);
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