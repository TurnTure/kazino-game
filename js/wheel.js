// ===== Колесо фортуны (canvas) =====

const SECTORS = [
    { amount: 0,    weight: 40, color: '#E8D5B0' },
    { amount: 50,   weight: 25, color: '#F2C46B' },
    { amount: 100,  weight: 18, color: '#E5A72C' },
    { amount: 200,  weight: 10, color: '#D18B1E' },
    { amount: 500,  weight: 5,  color: '#B06E14' },
    { amount: 1000, weight: 2,  color: '#8A5510' }
];

const canvas        = document.getElementById('wheelCanvas');
const ctx           = canvas.getContext('2d');
const pointerCanvas = document.getElementById('wheelPointer');
const pointerCtx    = pointerCanvas.getContext('2d');

const modal    = document.getElementById('wheelModal');
const openBtn  = document.getElementById('openWheel');
const closeBtn = document.getElementById('wheelClose');
const spinBtn  = document.getElementById('spinBtn');
const claimBtn = document.getElementById('claimBtn');
const resultEl = document.getElementById('wheelResult');

let currentRotation = 0;   // текущий угол поворота
let pendingPrize = 0;      // сколько начислим после «Получить приз»
let isSpinning = false;

// ===== Отрисовка колеса =====
function drawWheel() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = canvas.width / 2 - 8;
    const anglePerSector = (Math.PI * 2) / SECTORS.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    SECTORS.forEach((sector, i) => {
        const start = i * anglePerSector;
        const end = start + anglePerSector;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = sector.color;
        ctx.fill();

        ctx.strokeStyle = '#FFFCF5';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + anglePerSector / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#2B1A0F';
        ctx.font = 'bold 18px Georgia, serif';
        ctx.fillText(sector.amount + ' ₽', radius - 20, 0);
        ctx.restore();
    });

    // центральный кружок
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFCF5';
    ctx.fill();
    ctx.strokeStyle = '#E5A72C';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// ===== Отрисовка стрелки (отдельный слой, не вращается) =====
function drawPointer() {
    const cx = pointerCanvas.width / 2;

    pointerCtx.clearRect(0, 0, pointerCanvas.width, pointerCanvas.height);

    pointerCtx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    pointerCtx.shadowBlur = 6;
    pointerCtx.shadowOffsetY = 2;

    pointerCtx.beginPath();
    pointerCtx.moveTo(cx, 10);
    pointerCtx.lineTo(cx - 14, -8);
    pointerCtx.lineTo(cx + 14, -8);
    pointerCtx.closePath();
    pointerCtx.fillStyle = '#2B1A0F';
    pointerCtx.fill();

    pointerCtx.shadowColor = 'transparent';
    pointerCtx.shadowBlur = 0;
    pointerCtx.shadowOffsetY = 0;
}

// ===== Выбор выигрышного сектора по весам =====
function pickSector() {
    const total = SECTORS.reduce((sum, s) => sum + s.weight, 0);
    let r = Math.random() * total;

    for (let i = 0; i < SECTORS.length; i++) {
        if (r < SECTORS[i].weight) return i;
        r -= SECTORS[i].weight;
    }
    return SECTORS.length - 1;
}

// ===== Вращение =====
function spinTo(index) {
    const anglePerSector = 360 / SECTORS.length;
    const targetAngle =
        360 * 5 +
        (270 - (index * anglePerSector + anglePerSector / 2));

    currentRotation += targetAngle;

    canvas.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.85, 0.15, 1)';
    canvas.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        claimBtn.disabled = false;
        spinBtn.disabled = true;
    }, 3600);
}

// ===== Открытие/закрытие =====
function openModal() {
    modal.classList.add('is-open');
    resetRound();
    drawWheel();
    drawPointer();
}

function closeModal() {
    modal.classList.remove('is-open');
}

function resetRound() {
    pendingPrize = 0;
    isSpinning = false;
    spinBtn.disabled = false;
    claimBtn.disabled = true;
    resultEl.textContent = '';
    canvas.style.transition = 'none';
    canvas.style.transform = `rotate(0deg)`;
    currentRotation = 0;
}

// ===== Кнопки =====
if (openBtn) {
    openBtn.addEventListener('click', async () => {
        const user = await window.currentUserReady;
        if (!user) {
            showMessage('Войдите, чтобы играть', '#C8552B');
            return;
        }
        openModal();
    });
}

if (closeBtn) closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

spinBtn.addEventListener('click', async () => {
    if (isSpinning) return;

    const user = await window.currentUserReady;
    if (!user) {
        showMessage('Войдите, чтобы играть', '#C8552B');
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    resultEl.textContent = '';

    const index = pickSector();
    pendingPrize = SECTORS[index].amount;

    spinTo(index);
});

claimBtn.addEventListener('click', async () => {
    const user = await window.currentUserReady;
    if (!user) {
        showMessage('Войдите, чтобы получить приз', '#C8552B');
        closeModal();
        return;
    }

    if (pendingPrize > 0) {
        addBalance(pendingPrize, 'wheel:prize');
        showMessage(`Выигрыш: +${pendingPrize} ₽`, '#2E7D32');
    } else {
        addBalance(0, 'wheel:empty');
        showMessage('В этот раз пусто', '#C8552B');
    }
    closeModal();
});