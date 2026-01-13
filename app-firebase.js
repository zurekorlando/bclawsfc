/**
 * AWS ARCHITECT - VERSIÓN CON FIREBASE
 * =====================================
 * Incluye sincronización en tiempo real y timer global
 */

// ==========================================
// ESTADO DEL JUEGO
// ==========================================
let currentArchitecture = 0;
let correctCount = 0;
let attemptCount = 0;
let placedComponents = {};
let autoScrollInterval = null;
let isDragging = false;
let currentPlayer = null;
let players = [];

// Timer global
let globalTimer = {
    duration: 0,
    startTime: null,
    isActive: false,
    remainingTime: 0,
    interval: null
};

// Cargar arquitecturas y componentes desde config
const architectures = CONFIG.architectures;
const awsComponents = CONFIG.awsComponents;

// ==========================================
// REFERENCIAS DEL DOM
// ==========================================
const DOM = {
    componentsGrid: document.getElementById('components-grid'),
    slotsContainer: document.getElementById('slots-container'),
    architectureSelect: document.getElementById('architecture-select'),
    architectureName: document.getElementById('architecture-name'),
    verifyBtn: document.getElementById('verify-btn'),
    resetBtn: document.getElementById('reset-btn'),
    statusLed: document.getElementById('status-led'),
    feedbackMessage: document.getElementById('feedback-message'),
    correctCountEl: document.getElementById('correct-count'),
    attemptCountEl: document.getElementById('attempt-count'),
    scoreEl: document.getElementById('score'),
    loginModal: document.getElementById('login-modal'),
    playerNicknameInput: document.getElementById('player-nickname'),
    startGameBtn: document.getElementById('start-game-btn'),
    currentPlayerDisplay: document.getElementById('current-player-display'),
    currentPlayerName: document.getElementById('current-player-name'),
    useCaseTitle: document.getElementById('use-case-title'),
    useCaseScenario: document.getElementById('use-case-scenario'),
    useCaseBenefits: document.getElementById('use-case-benefits'),
    timerDisplay: document.getElementById('timer-display'),
    timerMinutes: document.getElementById('timer-minutes'),
    timerSeconds: document.getElementById('timer-seconds')
};

// ==========================================
// FIREBASE - PLAYER MANAGEMENT
// ==========================================
function createOrUpdatePlayer(nickname) {
    const playerData = {
        nickname: nickname,
        correctCount: 0,
        attemptCount: 0,
        score: 0,
        completedArchitectures: [],
        lastPlayed: firebase.database.ServerValue.TIMESTAMP,
        isOnline: true
    };
    
    // Guardar en Firebase
    DB_REFS.players.child(nickname).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // Jugador existe, cargar sus datos
            const existingData = snapshot.val();
            correctCount = existingData.correctCount || 0;
            attemptCount = existingData.attemptCount || 0;
            
            // Actualizar estado online
            DB_REFS.players.child(nickname).update({
                isOnline: true,
                lastPlayed: firebase.database.ServerValue.TIMESTAMP
            });
        } else {
            // Nuevo jugador
            DB_REFS.players.child(nickname).set(playerData);
        }
        
        currentPlayer = { nickname, ...playerData };
        updateScore();
        
        // Configurar presencia (detectar cuando se desconecta)
        DB_REFS.players.child(nickname).child('isOnline').onDisconnect().set(false);
    });
}

function updatePlayerStats() {
    if (!currentPlayer) return;
    
    const playerData = {
        nickname: currentPlayer.nickname,
        correctCount: correctCount,
        attemptCount: attemptCount,
        score: attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0,
        completedArchitectures: currentPlayer.completedArchitectures || [],
        lastPlayed: firebase.database.ServerValue.TIMESTAMP,
        isOnline: true
    };
    
    // Actualizar en Firebase
    DB_REFS.players.child(currentPlayer.nickname).update(playerData);
}

function addCompletedArchitecture(archIndex) {
    if (!currentPlayer) return;
    
    const archName = architectures[archIndex].name;
    if (!currentPlayer.completedArchitectures) {
        currentPlayer.completedArchitectures = [];
    }
    
    if (!currentPlayer.completedArchitectures.includes(archName)) {
        currentPlayer.completedArchitectures.push(archName);
        
        // Actualizar en Firebase
        DB_REFS.players.child(currentPlayer.nickname).update({
            completedArchitectures: currentPlayer.completedArchitectures
        });
    }
}

// ==========================================
// FIREBASE - TIMER MANAGEMENT
// ==========================================
function listenToTimer() {
    DB_REFS.timer.on('value', (snapshot) => {
        const timerData = snapshot.val();
        
        if (timerData && timerData.isActive) {
            globalTimer = timerData;
            startLocalTimer();
        } else {
            stopLocalTimer();
        }
    });
}

function startLocalTimer() {
    if (globalTimer.interval) {
        clearInterval(globalTimer.interval);
    }
    
    DOM.timerDisplay.style.display = 'flex';
    
    globalTimer.interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - globalTimer.startTime) / 1000);
        const remaining = Math.max(0, (globalTimer.duration * 60) - elapsed);
        
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        
        DOM.timerMinutes.textContent = String(minutes).padStart(2, '0');
        DOM.timerSeconds.textContent = String(seconds).padStart(2, '0');
        
        if (remaining <= 0) {
            stopLocalTimer();
            showTimerExpiredMessage();
        } else if (remaining <= 60) {
            DOM.timerDisplay.classList.add('warning');
        } else if (remaining <= 300) {
            DOM.timerDisplay.classList.add('alert');
        }
    }, 1000);
}

function stopLocalTimer() {
    if (globalTimer.interval) {
        clearInterval(globalTimer.interval);
        globalTimer.interval = null;
    }
    DOM.timerDisplay.style.display = 'none';
    DOM.timerDisplay.classList.remove('warning', 'alert');
}

function showTimerExpiredMessage() {
    showFeedback('⏰ Tiempo agotado! Revisa tus resultados en el panel del admin', false);
    
    // Deshabilitar botones
    DOM.verifyBtn.disabled = true;
    DOM.architectureSelect.disabled = true;
    
    // Actualizar estado final del jugador
    updatePlayerStats();
}

// ==========================================
// GAME INITIALIZATION
// ==========================================
function initGame() {
    renderComponents();
    loadArchitecture(currentArchitecture);
    listenToTimer();
}

function renderComponents() {
    DOM.componentsGrid.innerHTML = '';
    awsComponents.forEach(component => {
        const div = document.createElement('div');
        div.className = 'component';
        div.draggable = true;
        div.dataset.component = component.name;
        div.innerHTML = `
            <span class="component-icon">${component.icon}</span>
            <div>${component.name}</div>
        `;
        
        div.addEventListener('dragstart', handleDragStart);
        DOM.componentsGrid.appendChild(div);
    });
}

function loadArchitecture(index) {
    const arch = architectures[index];
    DOM.architectureName.textContent = `${arch.icon} ${arch.name}`;
    placedComponents = {};
    
    if (arch.useCase) {
        DOM.useCaseTitle.textContent = arch.useCase.title;
        DOM.useCaseScenario.textContent = arch.useCase.scenario;
        DOM.useCaseBenefits.textContent = arch.useCase.benefits;
    }
    
    DOM.slotsContainer.innerHTML = '';
    
    arch.slots.forEach((slot, slotIndex) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';
        slotDiv.dataset.slotId = slot.id;
        slotDiv.dataset.correctComponent = slot.correct;
        
        slotDiv.innerHTML = `<div class="slot-label">${slot.label}</div>`;
        
        slotDiv.addEventListener('dragover', handleDragOver);
        slotDiv.addEventListener('drop', handleDrop);
        slotDiv.addEventListener('dragleave', handleDragLeave);
        slotDiv.title = 'Arrastra aquí un componente AWS. Click en el componente para quitarlo.';
        
        DOM.slotsContainer.appendChild(slotDiv);
        
        if (slotIndex < arch.slots.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'arrow';
            arrow.textContent = '→';
            DOM.slotsContainer.appendChild(arrow);
        }
    });
    
    resetStatus();
}

// ==========================================
// DRAG AND DROP HANDLERS
// ==========================================
let draggedComponent = null;

function handleDragStart(e) {
    draggedComponent = e.target.dataset.component;
    e.target.style.opacity = '0.5';
    isDragging = true;
    startAutoScroll();
}

function startAutoScroll() {
    document.addEventListener('dragover', autoScroll);
}

function stopAutoScroll() {
    document.removeEventListener('dragover', autoScroll);
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
}

function autoScroll(e) {
    const scrollThreshold = CONFIG.gameSettings.autoScrollThreshold;
    const scrollSpeed = CONFIG.gameSettings.autoScrollSpeed;
    const mouseY = e.clientY;
    const windowHeight = window.innerHeight;

    if (mouseY < scrollThreshold) {
        window.scrollBy(0, -scrollSpeed);
    } else if (mouseY > windowHeight - scrollThreshold) {
        window.scrollBy(0, scrollSpeed);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.remove('drag-over');
    
    const slotId = slot.dataset.slotId;
    const component = awsComponents.find(c => c.name === draggedComponent);
    
    if (component) {
        if (slot.classList.contains('filled')) {
            slot.innerHTML = '';
        }

        const componentDiv = document.createElement('div');
        componentDiv.className = 'component';
        componentDiv.innerHTML = `
            <span class="component-icon">${component.icon}</span>
            <div>${component.name}</div>
        `;
        
        componentDiv.addEventListener('click', function(e) {
            e.stopPropagation();
            removeComponentFromSlot(slot, slotId);
        });
        
        slot.innerHTML = '';
        slot.appendChild(componentDiv);
        slot.classList.add('filled');
        placedComponents[slotId] = draggedComponent;
    }
    
    document.querySelectorAll('.components-grid .component').forEach(c => {
        c.style.opacity = '1';
    });

    isDragging = false;
    stopAutoScroll();
}

function removeComponentFromSlot(slot, slotId) {
    const arch = architectures[currentArchitecture];
    const slotInfo = arch.slots.find(s => s.id === slotId);
    if (slotInfo) {
        slot.innerHTML = `<div class="slot-label">${slotInfo.label}</div>`;
    }
    
    slot.classList.remove('filled');
    delete placedComponents[slotId];
    
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 0, 64, 0.5);
        transform: translate(-50%, -50%);
        animation: rippleOut 0.6s ease-out;
        pointer-events: none;
    `;
    slot.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

document.addEventListener('dragend', function(e) {
    document.querySelectorAll('.components-grid .component').forEach(c => {
        c.style.opacity = '1';
    });
    isDragging = false;
    stopAutoScroll();
});

// ==========================================
// GAME VERIFICATION
// ==========================================
function verifyArchitecture() {
    const arch = architectures[currentArchitecture];
    let allCorrect = true;
    let filledSlots = Object.keys(placedComponents).length;
    
    if (filledSlots < arch.slots.length) {
        showFeedback(CONFIG.texts.missingComponentsMessage, false);
        updateLED(false);
        attemptCount++;
        updateScore();
        updatePlayerStats();
        return;
    }
    
    arch.slots.forEach(slot => {
        const placedComponent = placedComponents[slot.id];
        if (placedComponent !== slot.correct) {
            allCorrect = false;
        }
    });
    
    attemptCount++;
    
    if (allCorrect) {
        correctCount++;
        addCompletedArchitecture(currentArchitecture);
        showFeedback(CONFIG.texts.correctMessage, true, arch.referenceUrl, arch.description);
        updateLED(true);
        
        setTimeout(() => {
            if (currentArchitecture < architectures.length - 1) {
                currentArchitecture++;
                DOM.architectureSelect.value = currentArchitecture;
                loadArchitecture(currentArchitecture);
            } else {
                showFeedback(CONFIG.texts.allCompletedMessage, true);
            }
        }, CONFIG.gameSettings.nextArchitectureDelay);
    } else {
        showFeedback(CONFIG.texts.incorrectMessage, false);
        updateLED(false);
    }
    
    updateScore();
    updatePlayerStats();
}

function updateLED(isCorrect) {
    DOM.statusLed.className = 'status-led';
    
    setTimeout(() => {
        DOM.statusLed.classList.add(isCorrect ? 'correct' : 'incorrect');
    }, 100);
    
    setTimeout(() => {
        DOM.statusLed.className = 'status-led';
    }, 2000);
}

function showFeedback(message, isCorrect, referenceUrl = null, description = null) {
    DOM.feedbackMessage.innerHTML = `
        <div>${message}</div>
        ${referenceUrl ? `
            <div class="reference-link">
                <h4>📚 Arquitectura de Referencia AWS</h4>
                ${description ? `<p class="reference-description">${description}</p>` : ''}
                <a href="${referenceUrl}" target="_blank" rel="noopener noreferrer">
                    Ver Documentación Oficial →
                </a>
            </div>
        ` : ''}
    `;
    DOM.feedbackMessage.className = 'feedback-message';
    DOM.feedbackMessage.classList.add(isCorrect ? 'correct' : 'incorrect');
    
    setTimeout(() => {
        DOM.feedbackMessage.classList.add('show');
    }, 100);
    
    const duration = referenceUrl ? CONFIG.gameSettings.correctFeedbackDuration : CONFIG.gameSettings.incorrectFeedbackDuration;
    setTimeout(() => {
        DOM.feedbackMessage.classList.remove('show');
    }, duration);
}

function updateScore() {
    DOM.correctCountEl.textContent = correctCount;
    DOM.attemptCountEl.textContent = attemptCount;
    const score = attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0;
    DOM.scoreEl.textContent = score;
}

function resetStatus() {
    DOM.statusLed.className = 'status-led';
}

function resetArchitecture() {
    loadArchitecture(currentArchitecture);
}

// ==========================================
// LOGIN / START GAME
// ==========================================
function startGame() {
    const nickname = DOM.playerNicknameInput.value.trim();
    if (nickname.length < CONFIG.gameSettings.minNicknameLength) return;
    
    createOrUpdatePlayer(nickname);
    DOM.currentPlayerName.textContent = nickname;
    DOM.loginModal.style.display = 'none';
    
    setTimeout(() => {
        const firstComponent = document.querySelector('.component');
        if (firstComponent) firstComponent.focus();
    }, 500);
}

// ==========================================
// EVENT LISTENERS
// ==========================================
DOM.architectureSelect.addEventListener('change', (e) => {
    currentArchitecture = parseInt(e.target.value);
    loadArchitecture(currentArchitecture);
});

DOM.verifyBtn.addEventListener('click', verifyArchitecture);
DOM.resetBtn.addEventListener('click', resetArchitecture);

DOM.playerNicknameInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    DOM.startGameBtn.disabled = value.length < CONFIG.gameSettings.minNicknameLength;
});

DOM.playerNicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !DOM.startGameBtn.disabled) {
        startGame();
    }
});

DOM.startGameBtn.addEventListener('click', startGame);

// ==========================================
// INICIALIZACIÓN
// ==========================================
initGame();

setTimeout(() => {
    DOM.playerNicknameInput.focus();
}, 300);
