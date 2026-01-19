// ===== Pizza Rhythm Game JavaScript - Refined =====

// Game State
let currentBeats = 0;
const targetBeats = 4;
let filledAngles = []; // Array of {startAngle, endAngle, noteType}

// Note/Rest definitions with beats and symbols
const noteDefinitions = [
    // Notes
    { id: 'whole', name: '온음표', symbol: '𝅝', beats: 4, isRest: false },
    { id: 'dotted-half', name: '점2분', symbol: '𝅗𝅥.', beats: 3, isRest: false },
    { id: 'half', name: '2분', symbol: '𝅗𝅥', beats: 2, isRest: false },
    { id: 'dotted-quarter', name: '점4분', symbol: '♩.', beats: 1.5, isRest: false },
    { id: 'quarter', name: '4분', symbol: '♩', beats: 1, isRest: false },
    { id: 'eighth', name: '8분', symbol: '♪', beats: 0.5, isRest: false },
    { id: 'sixteenth', name: '16분', symbol: '𝅘𝅥𝅯', beats: 0.25, isRest: false },
    // Rests
    { id: 'whole-rest', name: '온쉼표', symbol: '𝄻', beats: 4, isRest: true },
    { id: 'dotted-half-rest', name: '점2분쉼', symbol: '𝄼.', beats: 3, isRest: true },
    { id: 'half-rest', name: '2분쉼', symbol: '𝄼', beats: 2, isRest: true },
    { id: 'dotted-quarter-rest', name: '점4분쉼', symbol: '𝄽.', beats: 1.5, isRest: true },
    { id: 'quarter-rest', name: '4분쉼', symbol: '𝄽', beats: 1, isRest: true },
    { id: 'eighth-rest', name: '8분쉼', symbol: '𝄾', beats: 0.5, isRest: true },
    { id: 'sixteenth-rest', name: '16분쉼', symbol: '𝄿', beats: 0.25, isRest: true }
];

// Note frequencies for audio feedback
const noteFrequencies = {
    'whole': [262, 330, 392],
    'dotted-half': [294, 370, 440],
    'half': [330, 392],
    'dotted-quarter': [349, 440],
    'quarter': [392],
    'eighth': [440],
    'sixteenth': [494]
};

// Audio Context
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play a note with the given frequency
function playNote(frequency, duration = 0.3) {
    if (!audioContext) initAudio();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// Fisher-Yates Shuffle
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Generate selection grid with shuffled items
function generateSelectionGrid() {
    const grid = document.getElementById('selectionGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const shuffledNotes = shuffleArray(noteDefinitions);

    shuffledNotes.forEach(note => {
        const item = document.createElement('div');
        item.className = `note-item ${note.isRest ? 'rest' : ''}`;
        item.setAttribute('data-note', note.id);
        item.setAttribute('data-beats', note.beats);
        item.onclick = () => addNoteToPizza(note.beats, note.id, note.isRest, item);

        item.innerHTML = `
            <span class="symbol">${note.symbol}</span>
            <span class="name">${note.name}</span>
        `;

        grid.appendChild(item);
    });
}

// Draw pizza slice using SVG path
function drawPizzaSlice(startAngle, endAngle, noteType) {
    const svg = document.getElementById('pizzaSlices');
    if (!svg) return;

    const cx = 150;
    const cy = 150;
    const outerRadius = 135;
    const innerRadius = 30;

    // Convert angles to radians (start from top, go clockwise)
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    // Calculate arc points
    const x1 = cx + outerRadius * Math.cos(startRad);
    const y1 = cy + outerRadius * Math.sin(startRad);
    const x2 = cx + outerRadius * Math.cos(endRad);
    const y2 = cy + outerRadius * Math.sin(endRad);
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    // Determine if arc is large (> 180 degrees)
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

    // Create SVG path for the slice
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `
        M ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
        Z
    `;

    path.setAttribute('d', d);
    path.setAttribute('fill', noteType.includes('rest') ? '#b0bec5' : 'url(#sliceGradient)');
    path.setAttribute('stroke', 'rgba(255,255,255,0.5)');
    path.setAttribute('stroke-width', '2');
    path.style.opacity = '0';
    path.style.transition = 'opacity 0.4s, transform 0.4s';

    svg.appendChild(path);

    // Animate in
    requestAnimationFrame(() => {
        path.style.opacity = '1';
        path.style.transformOrigin = `${cx}px ${cy}px`;
    });

    // Add note symbol in the middle of the slice
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle - 90) * Math.PI / 180;
    const symbolRadius = (outerRadius + innerRadius) / 2;
    const symbolX = cx + symbolRadius * Math.cos(midRad);
    const symbolY = cy + symbolRadius * Math.sin(midRad);

    const noteInfo = noteDefinitions.find(n => n.id === noteType);
    if (noteInfo && (endAngle - startAngle) > 30) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', symbolX);
        text.setAttribute('y', symbolY + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', Math.min(20, (endAngle - startAngle) / 5));
        text.setAttribute('fill', 'white');
        text.setAttribute('style', 'text-shadow: 0 1px 3px rgba(0,0,0,0.3); pointer-events: none;');
        text.textContent = noteInfo.symbol;
        svg.appendChild(text);
    }
}

// Add a note to the pizza
function addNoteToPizza(beats, noteType, isRest, element) {
    initAudio();

    // Check if pizza is already full
    if (currentBeats >= targetBeats) {
        showFeedback('피자가 이미 완성되었어요! 🍕', 'warning');
        return;
    }

    // Check if adding this note would exceed the target
    if (currentBeats + beats > targetBeats) {
        showFeedback(`${beats}박은 너무 커요! 남은 공간: ${targetBeats - currentBeats}박`, 'error');
        shakeElement(element);
        return;
    }

    // Calculate angles based on beats
    const degreesPerBeat = 360 / targetBeats;
    const startAngle = currentBeats * degreesPerBeat;
    const endAngle = (currentBeats + beats) * degreesPerBeat;

    // Draw the slice
    drawPizzaSlice(startAngle, endAngle, noteType);

    // Update state
    filledAngles.push({ startAngle, endAngle, noteType, beats, isRest });
    currentBeats += beats;

    // Play sound feedback (not for rests)
    if (!isRest) {
        const freqs = noteFrequencies[noteType];
        if (freqs) {
            freqs.forEach((freq, i) => {
                setTimeout(() => playNote(freq, 0.3), i * 80);
            });
        }
    }

    // Update beat counter
    updateBeatCounter();

    // Visual feedback on card
    pulseElement(element);

    // Check if pizza is complete
    if (currentBeats === targetBeats) {
        setTimeout(() => {
            celebrateCompletion();
        }, 300);
    }
}

// Update the beat counter display
function updateBeatCounter() {
    const beatCount = document.getElementById('beatCount');
    if (beatCount) {
        beatCount.textContent = currentBeats;
        beatCount.style.transform = 'scale(1.3)';
        setTimeout(() => {
            beatCount.style.transform = 'scale(1)';
        }, 200);
    }

    // Update play button state
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.disabled = currentBeats !== targetBeats;
    }
}

// Show feedback message
function showFeedback(message, type = 'success') {
    const feedback = document.getElementById('feedbackMessage');
    if (feedback) {
        feedback.textContent = message;
        feedback.className = `feedback-message font-jua ${type} show`;

        setTimeout(() => {
            feedback.classList.remove('show');
        }, 2500);
    }
}

// Shake animation for invalid action
function shakeElement(element) {
    if (!element) return;
    element.style.animation = 'shake 0.5s';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Pulse animation for valid action
function pulseElement(element) {
    if (!element) return;
    element.style.transform = 'scale(1.15)';
    element.style.boxShadow = '0 0 20px rgba(149, 117, 205, 0.6)';
    setTimeout(() => {
        element.style.transform = '';
        element.style.boxShadow = '';
    }, 300);
}

// Celebrate when pizza is complete
function celebrateCompletion() {
    showFeedback('🎉 완벽한 4/4박자 피자 완성! 🍕', 'success');
    createParticles();

    // Update mission text
    const missionText = document.getElementById('missionText');
    if (missionText) {
        missionText.textContent = '🎵 완성! 재생해보세요!';
    }
}

// Create celebration particles
function createParticles() {
    const container = document.getElementById('particle-container');
    const pizzaPan = document.getElementById('pizzaPan');

    if (!container || !pizzaPan) return;

    const rect = pizzaPan.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const particleSymbols = ['♪', '♫', '♬', '🎵', '🎶', '⭐', '✨', '🍕'];
    const colors = ['#ff6b6b', '#ffd54f', '#64b5f6', '#81c784', '#ba68c8', '#ff8a50'];

    for (let i = 0; i < 25; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = particleSymbols[Math.floor(Math.random() * particleSymbols.length)];
            particle.style.left = (centerX + (Math.random() - 0.5) * 150) + 'px';
            particle.style.top = (centerY + (Math.random() - 0.5) * 80) + 'px';
            particle.style.color = colors[Math.floor(Math.random() * colors.length)];

            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 120;
            particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            particle.style.setProperty('--ty', -Math.abs(Math.sin(angle) * distance) - 40 + 'px');

            container.appendChild(particle);

            setTimeout(() => particle.remove(), 1500);
        }, i * 40);
    }
}

// Play the completed pizza
function playPizza() {
    if (currentBeats !== targetBeats) {
        showFeedback('먼저 4박자를 완성해주세요!', 'warning');
        return;
    }

    initAudio();

    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 재생중';
        playBtn.disabled = true;
    }

    // Play each slice's notes in sequence
    let delay = 0;
    const beatDuration = 400;

    filledAngles.forEach((slice, index) => {
        setTimeout(() => {
            // Highlight current slice in SVG
            const paths = document.querySelectorAll('#pizzaSlices path');
            if (paths[index]) {
                paths[index].style.filter = 'brightness(1.4)';
                setTimeout(() => {
                    paths[index].style.filter = '';
                }, slice.beats * beatDuration - 50);
            }

            // Play sound
            if (!slice.isRest) {
                const freqs = noteFrequencies[slice.noteType];
                if (freqs) {
                    freqs.forEach(freq => playNote(freq, slice.beats * 0.35));
                }
            }
        }, delay);

        delay += slice.beats * beatDuration;
    });

    // Reset button after playback
    setTimeout(() => {
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-play"></i> 재생';
            playBtn.disabled = false;
        }
    }, delay + 200);
}

// Reset the pizza
function resetPizza() {
    currentBeats = 0;
    filledAngles = [];

    // Clear SVG slices
    const slicesGroup = document.getElementById('pizzaSlices');
    if (slicesGroup) {
        slicesGroup.innerHTML = '';
    }

    // Reset beat counter
    updateBeatCounter();

    // Reset mission text
    const missionText = document.getElementById('missionText');
    if (missionText) {
        missionText.textContent = '4/4박자를 완성하세요!';
    }

    // Shuffle and regenerate the selection grid
    generateSelectionGrid();

    showFeedback('🎲 새로운 배열로 시작! 🍕', 'success');
}

// Add shake animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        75% { transform: translateX(8px); }
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    generateSelectionGrid();
    updateBeatCounter();

    // Add click sound initialization
    document.body.addEventListener('click', () => {
        initAudio();
    }, { once: true });
});
