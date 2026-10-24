// ===== Звуковые эффекты (Web Audio API) =====

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

// Инициализация контекста (нужно делать после первого клика пользователя)
function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Вспомогательная функция для создания ноты
function playTone(frequency, type, duration, vol, delay = 0) {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + delay);

    // Плавное затухание
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + delay + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
}

// 1. Звук открытия ящика (щелчок)
window.soundBoxOpen = function() {
    initAudio();
    if (!audioCtx) return;
    playTone(400, 'square', 0.1, 0.05);
    playTone(600, 'square', 0.1, 0.05, 0.05);
};

// 2. Звук хорошего приза (монетки)
window.soundWinItem = function() {
    initAudio();
    if (!audioCtx) return;
    // Восходящее арпеджио
    playTone(523.25, 'sine', 0.3, 0.1); // C5
    playTone(659.25, 'sine', 0.3, 0.1, 0.1); // E5
    playTone(783.99, 'sine', 0.4, 0.1, 0.2); // G5
};

// 3. Звук повестки (проигрыш)
window.soundLose = function() {
    initAudio();
    if (!audioCtx) return;
    // Нисходящий глухой звук
    playTone(150, 'sawtooth', 0.6, 0.1);
    playTone(100, 'sawtooth', 0.8, 0.1, 0.1);
};

// 4. Звук победы в раунде (фанфары)
window.soundRoundWin = function() {
    initAudio();
    if (!audioCtx) return;
    // Быстрая мелодия
    playTone(523.25, 'square', 0.15, 0.08);      // C5
    playTone(523.25, 'square', 0.15, 0.08, 0.15);
    playTone(523.25, 'square', 0.15, 0.08, 0.3);
    playTone(659.25, 'square', 0.4, 0.08, 0.45); // E5 (длинная)
    playTone(783.99, 'square', 0.6, 0.08, 0.6);  // G5 (длинная)
};