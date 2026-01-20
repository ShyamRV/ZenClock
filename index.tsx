/**
 * ZenClock - Multi-mode Minimalist Logic
 */

type AppMode = 'CLOCK' | 'STOPWATCH' | 'TIMER';

// State Management
let currentMode: AppMode = 'CLOCK';
let controlsTimeout: number | null = null;

// Stopwatch State
let swRunning = false;
let swStartTime = 0;
let swElapsedTime = 0;

// Timer State
let timerRunning = false;
let timerEndTime = 0;
let timerRemaining = 0; // ms
let timerInitialSet = 0; // ms

// DOM Elements
const timeDisplay = document.getElementById('time-display');
const modeIndicator = document.getElementById('mode-indicator');
const controls = document.getElementById('controls');
const timerConfig = document.getElementById('timer-config');

// Mode Buttons
const btnModeClock = document.getElementById('mode-clock');
const btnModeStopwatch = document.getElementById('mode-stopwatch');
const btnModeTimer = document.getElementById('mode-timer');

// Action Buttons
const btnStart = document.getElementById('action-start');
const btnReset = document.getElementById('action-reset');
const btnFullscreen = document.getElementById('toggle-fullscreen');

// Inputs
const inputH = document.getElementById('input-h') as HTMLInputElement;
const inputM = document.getElementById('input-m') as HTMLInputElement;
const inputS = document.getElementById('input-s') as HTMLInputElement;

// Helper: Format time components
const pad = (n: number) => Math.floor(n).toString().padStart(2, '0');

function updateDisplay() {
    if (!timeDisplay || !modeIndicator) return;

    if (currentMode === 'CLOCK') {
        const now = new Date();
        timeDisplay.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        modeIndicator.textContent = 'CLOCK';
    } 
    else if (currentMode === 'STOPWATCH') {
        let elapsed = swElapsedTime;
        if (swRunning) {
            elapsed = Date.now() - swStartTime;
        }
        const totalSecs = Math.floor(elapsed / 1000);
        const h = pad(totalSecs / 3600);
        const m = pad((totalSecs % 3600) / 60);
        const s = pad(totalSecs % 60);
        timeDisplay.textContent = `${h}:${m}:${s}`;
        modeIndicator.textContent = 'STOPWATCH';
    } 
    else if (currentMode === 'TIMER') {
        let remaining = timerRemaining;
        if (timerRunning) {
            remaining = Math.max(0, timerEndTime - Date.now());
            if (remaining === 0 && timerRunning) {
                timerRunning = false;
                handleTimerComplete();
            }
        }
        const totalSecs = Math.ceil(remaining / 1000);
        const h = pad(totalSecs / 3600);
        const m = pad((totalSecs % 3600) / 60);
        const s = pad(totalSecs % 60);
        timeDisplay.textContent = `${h}:${m}:${s}`;
        modeIndicator.textContent = 'TIMER';
    }
}

function handleTimerComplete() {
    if (btnStart) btnStart.textContent = 'Start';
    // Subtle alert effect
    document.body.style.backgroundColor = '#1a0000';
    setTimeout(() => {
        document.body.style.backgroundColor = '#000000';
    }, 500);
}

// Control UI Lifecycle
function showControls() {
    if (!controls) return;
    controls.classList.add('visible');
    document.body.classList.remove('cursor-none');

    if (controlsTimeout) clearTimeout(controlsTimeout);
    controlsTimeout = window.setTimeout(hideControls, 4000);
}

function hideControls() {
    // Don't hide if user is focused on an input
    if (document.activeElement?.tagName === 'INPUT') {
        if (controlsTimeout) clearTimeout(controlsTimeout);
        controlsTimeout = window.setTimeout(hideControls, 4000);
        return;
    }
    
    if (!controls) return;
    controls.classList.remove('visible');
    document.body.classList.add('cursor-none');
}

function switchMode(newMode: AppMode) {
    currentMode = newMode;
    
    // Update button states
    [btnModeClock, btnModeStopwatch, btnModeTimer].forEach(btn => btn?.classList.remove('active'));
    if (newMode === 'CLOCK') btnModeClock?.classList.add('active');
    if (newMode === 'STOPWATCH') btnModeStopwatch?.classList.add('active');
    if (newMode === 'TIMER') btnModeTimer?.classList.add('active');

    // Show/Hide relevant controls
    if (newMode === 'CLOCK') {
        btnStart?.classList.add('hidden');
        btnReset?.classList.add('hidden');
        timerConfig?.classList.add('hidden');
    } else {
        btnStart?.classList.remove('hidden');
        btnReset?.classList.remove('hidden');
        
        if (newMode === 'STOPWATCH') {
            timerConfig?.classList.add('hidden');
            btnStart!.textContent = swRunning ? 'Pause' : 'Start';
        } else {
            timerConfig?.classList.remove('hidden');
            btnStart!.textContent = timerRunning ? 'Pause' : 'Start';
        }
    }
    updateDisplay();
}

// Fullscreen Logic
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Listen for fullscreen changes to update button text
document.addEventListener('fullscreenchange', () => {
    if (btnFullscreen) {
        btnFullscreen.textContent = document.fullscreenElement ? 'Exit Full' : 'Fullscreen';
    }
});

// Interaction Listeners
window.addEventListener('mousemove', showControls);
window.addEventListener('mousedown', showControls);
window.addEventListener('touchstart', showControls);
window.addEventListener('keydown', showControls);

btnModeClock?.addEventListener('click', () => switchMode('CLOCK'));
btnModeStopwatch?.addEventListener('click', () => switchMode('STOPWATCH'));
btnModeTimer?.addEventListener('click', () => switchMode('TIMER'));

btnFullscreen?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFullscreen();
});

btnStart?.addEventListener('click', () => {
    if (currentMode === 'STOPWATCH') {
        if (!swRunning) {
            swStartTime = Date.now() - swElapsedTime;
            swRunning = true;
            btnStart.textContent = 'Pause';
        } else {
            swElapsedTime = Date.now() - swStartTime;
            swRunning = false;
            btnStart.textContent = 'Resume';
        }
    } else if (currentMode === 'TIMER') {
        if (!timerRunning) {
            // If starting fresh or from paused
            if (timerRemaining <= 0) {
                const h = parseInt(inputH.value) || 0;
                const m = parseInt(inputM.value) || 0;
                const s = parseInt(inputS.value) || 0;
                timerRemaining = (h * 3600 + m * 60 + s) * 1000;
                if (timerRemaining <= 0) return; // Don't start if 0
                timerInitialSet = timerRemaining;
            }
            timerEndTime = Date.now() + timerRemaining;
            timerRunning = true;
            btnStart.textContent = 'Pause';
        } else {
            timerRemaining = timerEndTime - Date.now();
            timerRunning = false;
            btnStart.textContent = 'Resume';
        }
    }
});

btnReset?.addEventListener('click', () => {
    if (currentMode === 'STOPWATCH') {
        swRunning = false;
        swElapsedTime = 0;
        swStartTime = 0;
        if (btnStart) btnStart.textContent = 'Start';
    } else if (currentMode === 'TIMER') {
        timerRunning = false;
        timerRemaining = 0;
        if (btnStart) btnStart.textContent = 'Start';
    }
    updateDisplay();
});

// Initial Kick-off
setInterval(updateDisplay, 100);
updateDisplay();
hideControls();
