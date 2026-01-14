/**
 * AWS ARCHITECT - LÓGICA PRINCIPAL
 * ==================================
 * Toda la lógica del juego en un archivo separado y bien estructurado
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
    leaderboardToggle: document.getElementById('leaderboard-toggle'),
    leaderboardPanel: document.getElementById('leaderboard-panel'),
    closeLeaderboard: document.getElementById('close-leaderboard'),
    leaderboardContent: document.getElementById('leaderboard-content'),
    useCaseTitle: document.getElementById('use-case-title'),
    useCaseScenario: document.getElementById('use-case-scenario'),
    useCaseBenefits: document.getElementById('use-case-benefits'),
    adminToggle: document.getElementById('admin-toggle'),
    adminPanel: document.getElementById('admin-panel'),
    closeAdmin: document.getElementById('close-admin'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    importDataBtn: document.getElementById('import-data-btn'),
    clearAllBtn: document.getElementById('clear-all-btn'),
    importSection: document.getElementById('import-section'),
    importTextarea: document.getElementById('import-textarea'),
    processImportBtn: document.getElementById('process-import-btn'),
    cancelImportBtn: document.getElementById('cancel-import-btn'),
    adminTableBody: document.getElementById('admin-table-body'),
    sessionCodeEl: document.getElementById('session-code')
};

// ==========================================
// PLAYER MANAGEMENT
// ==========================================
function loadPlayers() {
    const stored = localStorage.getItem(CONFIG.storageKeys.players);
    players = stored ? JSON.parse(stored) : [];
}

function savePlayers() {
    localStorage.setItem(CONFIG.storageKeys.players, JSON.stringify(players));
}

function createOrUpdatePlayer(nickname) {
    let player = players.find(p => p.nickname.toLowerCase() === nickname.toLowerCase());
    
    if (!player) {
        player = {
            nickname: nickname,
            correctCount: 0,
            attemptCount: 0,
            score: 0,
            completedArchitectures: [],
            lastPlayed: new Date().toISOString()
        };
        players.push(player);
    } else {
        player.lastPlayed = new Date().toISOString();
    }
    
    currentPlayer = player;
    correctCount = player.correctCount;
    attemptCount = player.attemptCount;
    savePlayers();
    updateScore();
}

function updatePlayerStats() {
    if (!currentPlayer) return;
    
    currentPlayer.correctCount = correctCount;
    currentPlayer.attemptCount = attemptCount;
    currentPlayer.score = attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0;
    currentPlayer.lastPlayed = new Date().toISOString();
    
    savePlayers();
    updateLeaderboard();
}

function addCompletedArchitecture(archIndex) {
    if (!currentPlayer) return;
    
    const archName = architectures[archIndex].name;
    if (!currentPlayer.completedArchitectures.includes(archName)) {
        currentPlayer.completedArchitectures.push(archName);
        savePlayers();
    }
}

// ==========================================
// GAME INITIALIZATION
// ==========================================
function initGame() {
    renderComponents();
    loadArchitecture(currentArchitecture);
}

function renderComponents() {
    DOM.componentsGrid.innerHTML = '';
    awsComponents.forEach(component => {
        const div = document.createElement('div');
        div.className = 'component';
        div.draggable = true;
        div.dataset.component = component.name;
        
        // Detectar si es imagen o emoji
        const isImage = component.icon.includes('.png') || component.icon.includes('.jpg');
        const iconHtml = isImage 
            ? `<img src="${component.icon}" alt="${component.name}" onerror="this.style.display='none'">` 
            : component.icon;
        
        div.innerHTML = `
            <span class="component-icon">${iconHtml}</span>
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
    
    // Cargar caso de uso
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

// Detectar si es imagen o emoji
const isImage = component.icon.includes('.png') || component.icon.includes('.jpg');
const iconHtml = isImage 
    ? `<img src="${component.icon}" alt="${component.name}" onerror="this.style.display='none'">` 
    : component.icon;

componentDiv.innerHTML = `
    <span class="component-icon">${iconHtml}</span>
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

// Continúa en archivo app2.js...

// ==========================================
// LEADERBOARD
// ==========================================
function updateLeaderboard() {
    const sortedPlayers = [...players].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.correctCount - a.correctCount;
    });

    DOM.leaderboardContent.innerHTML = '';
    
    sortedPlayers.forEach((player, index) => {
        const rank = index + 1;
        const isCurrentPlayer = currentPlayer && player.nickname === currentPlayer.nickname;
        
        const card = document.createElement('div');
        card.className = `player-card ${isCurrentPlayer ? 'current-player' : ''}`;
        
        let rankClass = '';
        if (rank === 1) rankClass = 'first';
        else if (rank === 2) rankClass = 'second';
        else if (rank === 3) rankClass = 'third';
        
        card.innerHTML = `
            <div class="player-rank ${rankClass}">#${rank}</div>
            <div class="player-info">
                <div class="player-name">${player.nickname} ${isCurrentPlayer ? '(Tú)' : ''}</div>
                <div class="player-stats">
                    ✓ ${player.correctCount} | ✗ ${player.attemptCount - player.correctCount} | 
                    🏗️ ${player.completedArchitectures.length}/5
                </div>
            </div>
            <div class="player-score">${player.score}%</div>
        `;
        
        DOM.leaderboardContent.appendChild(card);
    });
}

// ==========================================
// ADMIN FUNCTIONS
// ==========================================
function generateSessionCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `AWS-${timestamp}-${random}`.toUpperCase();
}

function updateAdminStats() {
    const totalPlayers = players.length;
    const totalAttempts = players.reduce((sum, p) => sum + p.attemptCount, 0);
    const avgScore = totalPlayers > 0 
        ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / totalPlayers)
        : 0;
    const totalCompletions = players.reduce((sum, p) => sum + p.completedArchitectures.length, 0);

    document.getElementById('stat-total-players').textContent = totalPlayers;
    document.getElementById('stat-total-attempts').textContent = totalAttempts;
    document.getElementById('stat-avg-score').textContent = avgScore + '%';
    document.getElementById('stat-completion').textContent = totalCompletions;

    let sessionCode = localStorage.getItem(CONFIG.storageKeys.sessionCode);
    if (!sessionCode) {
        sessionCode = generateSessionCode();
        localStorage.setItem(CONFIG.storageKeys.sessionCode, sessionCode);
    }
    DOM.sessionCodeEl.textContent = sessionCode;

    updateAdminTable();
}

function updateAdminTable() {
    const sortedPlayers = [...players].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.correctCount - a.correctCount;
    });

    DOM.adminTableBody.innerHTML = '';
    
    sortedPlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        const lastPlayed = new Date(player.lastPlayed).toLocaleString('es-CO', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
        
        row.innerHTML = `
            <td class="rank-cell">#${index + 1}</td>
            <td>${player.nickname}</td>
            <td style="color: var(--neon-green); font-weight: bold;">${player.score}%</td>
            <td>${player.correctCount}</td>
            <td>${player.attemptCount}</td>
            <td>${player.completedArchitectures.join(', ') || 'Ninguna'}</td>
            <td style="font-size: 0.8rem;">${lastPlayed}</td>
        `;
        
        DOM.adminTableBody.appendChild(row);
    });
}

function exportToJSON() {
    const data = {
        sessionCode: localStorage.getItem(CONFIG.storageKeys.sessionCode),
        exportDate: new Date().toISOString(),
        players: players
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aws-architect-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showFeedback('✅ Datos exportados a JSON', true);
}

function exportToCSV() {
    const headers = ['Rank', 'Nickname', 'Score', 'Correct', 'Attempts', 'Architectures', 'Last Played'];
    const sortedPlayers = [...players].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.correctCount - a.correctCount;
    });
    
    const rows = sortedPlayers.map((player, index) => [
        index + 1,
        player.nickname,
        player.score + '%',
        player.correctCount,
        player.attemptCount,
        player.completedArchitectures.join(';') || 'None',
        new Date(player.lastPlayed).toLocaleString()
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aws-architect-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showFeedback('✅ Datos exportados a CSV', true);
}

function showImportSection() {
    DOM.importSection.style.display = 'block';
    DOM.importTextarea.value = '';
    DOM.importTextarea.focus();
}

function hideImportSection() {
    DOM.importSection.style.display = 'none';
    DOM.importTextarea.value = '';
}

function processImport() {
    try {
        const importedData = JSON.parse(DOM.importTextarea.value);
        let importedPlayers = [];
        
        if (Array.isArray(importedData)) {
            importedPlayers = importedData;
        } else if (importedData.players && Array.isArray(importedData.players)) {
            importedPlayers = importedData.players;
        } else {
            throw new Error('Formato inválido');
        }
        
        let mergedCount = 0;
        let newCount = 0;
        
        importedPlayers.forEach(importedPlayer => {
            const existingIndex = players.findIndex(
                p => p.nickname.toLowerCase() === importedPlayer.nickname.toLowerCase()
            );
            
            if (existingIndex >= 0) {
                const existing = players[existingIndex];
                existing.correctCount = Math.max(existing.correctCount, importedPlayer.correctCount);
                existing.attemptCount = Math.max(existing.attemptCount, importedPlayer.attemptCount);
                existing.score = Math.max(existing.score, importedPlayer.score);
                
                const allArchs = new Set([
                    ...existing.completedArchitectures,
                    ...(importedPlayer.completedArchitectures || [])
                ]);
                existing.completedArchitectures = Array.from(allArchs);
                
                if (new Date(importedPlayer.lastPlayed) > new Date(existing.lastPlayed)) {
                    existing.lastPlayed = importedPlayer.lastPlayed;
                }
                
                mergedCount++;
            } else {
                players.push(importedPlayer);
                newCount++;
            }
        });
        
        savePlayers();
        updateLeaderboard();
        updateAdminStats();
        hideImportSection();
        
        showFeedback(
            `✅ Importación completada: ${newCount} nuevos, ${mergedCount} actualizados`,
            true
        );
    } catch (error) {
        showFeedback('❌ Error al importar: ' + error.message, false);
    }
}

function clearAllData() {
    if (confirm('⚠️ ¿Estás seguro de eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
        if (confirm('🔴 ÚLTIMA CONFIRMACIÓN: ¿Eliminar todos los jugadores y resultados?')) {
            players = [];
            currentPlayer = null;
            correctCount = 0;
            attemptCount = 0;
            localStorage.removeItem(CONFIG.storageKeys.players);
            localStorage.removeItem(CONFIG.storageKeys.sessionCode);
            savePlayers();
            updateLeaderboard();
            updateAdminStats();
            showFeedback('🗑️ Todos los datos han sido eliminados', true);
        }
    }
}

function copySessionCode() {
    const code = DOM.sessionCodeEl.textContent;
    navigator.clipboard.writeText(code).then(() => {
        showFeedback('📋 Código copiado al portapapeles', true);
    }).catch(() => {
        showFeedback('❌ Error al copiar código', false);
    });
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
    DOM.leaderboardToggle.style.display = 'flex';
    updateLeaderboard();
    
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

DOM.leaderboardToggle.addEventListener('click', () => {
    DOM.leaderboardPanel.classList.add('open');
    updateLeaderboard();
});

DOM.closeLeaderboard.addEventListener('click', () => {
    DOM.leaderboardPanel.classList.remove('open');
});

document.addEventListener('click', (e) => {
    if (DOM.leaderboardPanel.classList.contains('open') && 
        !DOM.leaderboardPanel.contains(e.target) && 
        !DOM.leaderboardToggle.contains(e.target)) {
        DOM.leaderboardPanel.classList.remove('open');
    }
});

DOM.adminToggle.addEventListener('click', () => {
    DOM.adminPanel.classList.add('open');
    updateAdminStats();
});

DOM.closeAdmin.addEventListener('click', () => {
    DOM.adminPanel.classList.remove('open');
    hideImportSection();
});

DOM.exportJsonBtn.addEventListener('click', exportToJSON);
DOM.exportCsvBtn.addEventListener('click', exportToCSV);
DOM.importDataBtn.addEventListener('click', showImportSection);
DOM.processImportBtn.addEventListener('click', processImport);
DOM.cancelImportBtn.addEventListener('click', hideImportSection);
DOM.clearAllBtn.addEventListener('click', clearAllData);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (DOM.adminPanel.classList.contains('open')) {
            DOM.adminPanel.classList.remove('open');
            hideImportSection();
        }
        if (DOM.leaderboardPanel.classList.contains('open')) {
            DOM.leaderboardPanel.classList.remove('open');
        }
    }
});

// ==========================================
// INICIALIZACIÓN
// ==========================================
loadPlayers();
initGame();

setTimeout(() => {
    DOM.playerNicknameInput.focus();
}, 300);

setTimeout(() => {
    DOM.adminToggle.style.display = 'flex';
}, 1000);

// Exportar funciones globales necesarias para HTML inline
window.copySessionCode = copySessionCode;
