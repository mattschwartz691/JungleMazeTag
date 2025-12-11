// Jungle Maze Tag Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio context for sound generation
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Sound effects using Web Audio API
function playSound(type) {
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    switch (type) {
        case 'tag':
            // Tag sound - quick descending tone
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
            break;

        case 'powerup':
            // Powerup sound - ascending sparkle
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.2);
            break;

        case 'wallShift':
            // Wall shift - rumble/earthquake effect
            oscillator.frequency.setValueAtTime(80, audioCtx.currentTime);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
            break;

        case 'teleport':
            // Teleport - whoosh sound
            oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.25);
            break;

        case 'invisible':
            // Ghost/invisible - ethereal sound
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            oscillator.type = 'triangle';
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.4);
            // Add second tone for spooky effect
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc2.type = 'triangle';
            gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc2.start(audioCtx.currentTime);
            osc2.stop(audioCtx.currentTime + 0.4);
            break;
    }
}

// Bomb explosion sound
function playBombSound() {
    if (!audioCtx) return;

    // Create noise for explosion
    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    // White noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    // Low pass filter for rumble
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.4);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noise.start(audioCtx.currentTime);
    noise.stop(audioCtx.currentTime + 0.5);

    // Add low boom
    const boom = audioCtx.createOscillator();
    const boomGain = audioCtx.createGain();
    boom.frequency.setValueAtTime(80, audioCtx.currentTime);
    boom.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.3);
    boom.type = 'sine';
    boomGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    boomGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    boom.connect(boomGain);
    boomGain.connect(audioCtx.destination);
    boom.start(audioCtx.currentTime);
    boom.stop(audioCtx.currentTime + 0.3);
}

// Explosion particles
let explosionParticles = [];

function createExplosion(x, y) {
    const colors = ['#FF4500', '#FF6600', '#FFD700', '#FF0000', '#FFA500'];
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
        const speed = 3 + Math.random() * 5;
        explosionParticles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 6
        });
    }
}

function updateExplosions() {
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const p = explosionParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= 0.03;
        p.size *= 0.97;
        if (p.life <= 0) {
            explosionParticles.splice(i, 1);
        }
    }
}

function drawExplosions() {
    for (const p of explosionParticles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Background music using Web Audio API
let musicPlaying = false;
let musicGain = null;
let currentMusicTempo = 300; // Base tempo in ms between beats

function startBackgroundMusic() {
    if (!audioCtx || musicPlaying) return;

    musicPlaying = true;
    musicGain = audioCtx.createGain();
    musicGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    musicGain.connect(audioCtx.destination);

    // Extended chase music - 64 notes (8 bars) for longer before repeating
    let beatIndex = 0;

    // Main melody - 8 bar phrase with more development
    const melodyPattern = [
        // Bar 1: Opening theme - rising
        392.00, 440.00, 523.25, 0, 587.33, 0, 659.25, 0,
        // Bar 2: Answer phrase - falling
        587.33, 523.25, 440.00, 0, 392.00, 0, 349.23, 0,
        // Bar 3: Development - variation
        440.00, 0, 523.25, 0, 587.33, 659.25, 698.46, 0,
        // Bar 4: Climax phrase
        783.99, 698.46, 659.25, 587.33, 659.25, 0, 0, 0,
        // Bar 5: B section - new theme
        523.25, 0, 587.33, 523.25, 440.00, 0, 392.00, 0,
        // Bar 6: B continuation
        349.23, 392.00, 440.00, 0, 523.25, 0, 587.33, 0,
        // Bar 7: Return to A - building
        392.00, 440.00, 523.25, 587.33, 659.25, 698.46, 783.99, 0,
        // Bar 8: Resolution
        659.25, 587.33, 523.25, 440.00, 392.00, 0, 0, 0
    ];

    // Harmony - thirds and sixths for rich sound
    const harmonyPattern = [
        261.63, 293.66, 329.63, 0, 349.23, 0, 392.00, 0,
        349.23, 329.63, 293.66, 0, 261.63, 0, 246.94, 0,
        293.66, 0, 329.63, 0, 349.23, 392.00, 440.00, 0,
        523.25, 440.00, 392.00, 349.23, 392.00, 0, 0, 0,
        329.63, 0, 349.23, 329.63, 293.66, 0, 261.63, 0,
        246.94, 261.63, 293.66, 0, 329.63, 0, 349.23, 0,
        261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 0,
        392.00, 349.23, 329.63, 293.66, 261.63, 0, 0, 0
    ];

    // Counter melody - plays between main melody notes for call and response
    const counterPattern = [
        0, 0, 0, 329.63, 0, 392.00, 0, 440.00,
        0, 0, 0, 329.63, 0, 293.66, 0, 261.63,
        0, 349.23, 0, 392.00, 0, 0, 0, 523.25,
        0, 0, 0, 0, 0, 440.00, 392.00, 349.23,
        0, 392.00, 0, 0, 0, 349.23, 0, 329.63,
        0, 0, 0, 329.63, 0, 392.00, 0, 440.00,
        0, 0, 0, 0, 0, 0, 0, 659.25,
        0, 0, 0, 0, 0, 329.63, 293.66, 261.63
    ];

    // Bass line - 8 bars with chord progression
    const bassPattern = [
        130.81, 0, 130.81, 130.81, 146.83, 0, 146.83, 0,  // C
        174.61, 0, 174.61, 174.61, 164.81, 0, 146.83, 0,  // F, E, D
        146.83, 0, 146.83, 0, 174.61, 0, 174.61, 0,       // D, F
        196.00, 0, 196.00, 196.00, 174.61, 0, 0, 0,       // G, F
        164.81, 0, 164.81, 0, 146.83, 0, 130.81, 0,       // E, D, C
        123.47, 0, 130.81, 0, 146.83, 0, 164.81, 0,       // B, C, D, E
        130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 0,  // Rising
        174.61, 164.81, 146.83, 130.81, 130.81, 0, 0, 0   // Resolution to C
    ];

    // Arpeggiated pad - new instrument! Plays chord tones in sequence
    const arpPattern = [
        // Each group of 4 is one chord arpeggiated
        261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25,  // C major
        293.66, 349.23, 440.00, 587.33, 293.66, 349.23, 440.00, 587.33,  // D minor
        329.63, 392.00, 493.88, 659.25, 329.63, 392.00, 493.88, 659.25,  // E minor
        349.23, 440.00, 523.25, 698.46, 349.23, 440.00, 523.25, 698.46,  // F major
        392.00, 493.88, 587.33, 783.99, 392.00, 493.88, 587.33, 783.99,  // G major
        329.63, 392.00, 493.88, 659.25, 329.63, 392.00, 493.88, 659.25,  // E minor
        349.23, 440.00, 523.25, 698.46, 196.00, 246.94, 293.66, 392.00,  // F, G
        261.63, 329.63, 392.00, 523.25, 261.63, 0, 0, 0                  // C resolve
    ];

    // Drum patterns - 16 steps
    const kickPattern =  [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0];
    const snarePattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1];
    const hihatPattern = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    function playBeat() {
        if (!musicPlaying) return;

        const patternIndex = beatIndex % 64;
        const drumIndex = beatIndex % 16;

        // === DRUMS ===

        // Kick drum
        if (kickPattern[drumIndex]) {
            const kickOsc = audioCtx.createOscillator();
            const kickGain = audioCtx.createGain();
            kickOsc.connect(kickGain);
            kickGain.connect(musicGain);
            kickOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
            kickOsc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
            kickOsc.type = 'sine';
            kickGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            kickGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            kickOsc.start(audioCtx.currentTime);
            kickOsc.stop(audioCtx.currentTime + 0.15);
        }

        // Snare drum
        if (snarePattern[drumIndex]) {
            const snareOsc = audioCtx.createOscillator();
            const snareGain = audioCtx.createGain();
            snareOsc.connect(snareGain);
            snareGain.connect(musicGain);
            snareOsc.frequency.setValueAtTime(250, audioCtx.currentTime);
            snareOsc.type = 'triangle';
            snareGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            snareGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            snareOsc.start(audioCtx.currentTime);
            snareOsc.stop(audioCtx.currentTime + 0.1);

            // Noise component
            const noiseOsc = audioCtx.createOscillator();
            const noiseGain = audioCtx.createGain();
            noiseOsc.connect(noiseGain);
            noiseGain.connect(musicGain);
            noiseOsc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            noiseOsc.type = 'sawtooth';
            noiseGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            noiseOsc.start(audioCtx.currentTime);
            noiseOsc.stop(audioCtx.currentTime + 0.08);
        }

        // Hi-hat
        if (hihatPattern[drumIndex]) {
            const hihatOsc = audioCtx.createOscillator();
            const hihatGain = audioCtx.createGain();
            hihatOsc.connect(hihatGain);
            hihatGain.connect(musicGain);
            hihatOsc.frequency.setValueAtTime(8000 + Math.random() * 2000, audioCtx.currentTime);
            hihatOsc.type = 'square';
            hihatGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            hihatGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
            hihatOsc.start(audioCtx.currentTime);
            hihatOsc.stop(audioCtx.currentTime + 0.03);
        }

        // === MAIN MELODY (square wave - beepy lead) ===
        const melodyNote = melodyPattern[patternIndex];
        if (melodyNote > 0) {
            const melodyOsc = audioCtx.createOscillator();
            const melodyGainNode = audioCtx.createGain();
            melodyOsc.connect(melodyGainNode);
            melodyGainNode.connect(musicGain);
            melodyOsc.frequency.setValueAtTime(melodyNote, audioCtx.currentTime);
            melodyOsc.type = 'square';
            melodyGainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            melodyGainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            melodyOsc.start(audioCtx.currentTime);
            melodyOsc.stop(audioCtx.currentTime + 0.15);

            // Detuned layer for thickness
            const melodyOsc2 = audioCtx.createOscillator();
            const melodyGain2 = audioCtx.createGain();
            melodyOsc2.connect(melodyGain2);
            melodyGain2.connect(musicGain);
            melodyOsc2.frequency.setValueAtTime(melodyNote * 1.003, audioCtx.currentTime);
            melodyOsc2.type = 'square';
            melodyGain2.gain.setValueAtTime(0.05, audioCtx.currentTime);
            melodyGain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            melodyOsc2.start(audioCtx.currentTime);
            melodyOsc2.stop(audioCtx.currentTime + 0.15);
        }

        // === COUNTER MELODY (sawtooth - fills gaps) ===
        const counterNote = counterPattern[patternIndex];
        if (counterNote > 0) {
            const counterOsc = audioCtx.createOscillator();
            const counterGain = audioCtx.createGain();
            counterOsc.connect(counterGain);
            counterGain.connect(musicGain);
            counterOsc.frequency.setValueAtTime(counterNote, audioCtx.currentTime);
            counterOsc.type = 'sawtooth';
            counterGain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            counterGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            counterOsc.start(audioCtx.currentTime);
            counterOsc.stop(audioCtx.currentTime + 0.1);
        }

        // === HARMONY (sine wave - soft pad) ===
        const harmonyNote = harmonyPattern[patternIndex];
        if (harmonyNote > 0) {
            const harmonyOsc = audioCtx.createOscillator();
            const harmonyGainNode = audioCtx.createGain();
            harmonyOsc.connect(harmonyGainNode);
            harmonyGainNode.connect(musicGain);
            harmonyOsc.frequency.setValueAtTime(harmonyNote, audioCtx.currentTime);
            harmonyOsc.type = 'sine';
            harmonyGainNode.gain.setValueAtTime(0.07, audioCtx.currentTime);
            harmonyGainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
            harmonyOsc.start(audioCtx.currentTime);
            harmonyOsc.stop(audioCtx.currentTime + 0.12);
        }

        // === ARPEGGIO PAD (triangle wave - shimmery texture) ===
        const arpNote = arpPattern[patternIndex];
        if (arpNote > 0) {
            const arpOsc = audioCtx.createOscillator();
            const arpGain = audioCtx.createGain();
            arpOsc.connect(arpGain);
            arpGain.connect(musicGain);
            arpOsc.frequency.setValueAtTime(arpNote, audioCtx.currentTime);
            arpOsc.type = 'triangle';
            arpGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            arpGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
            arpOsc.start(audioCtx.currentTime);
            arpOsc.stop(audioCtx.currentTime + 0.08);
        }

        // === BASS (triangle wave - warm and punchy) ===
        const bassNote = bassPattern[patternIndex];
        if (bassNote > 0) {
            const bassOsc = audioCtx.createOscillator();
            const bassGainNode = audioCtx.createGain();
            bassOsc.connect(bassGainNode);
            bassGainNode.connect(musicGain);
            bassOsc.frequency.setValueAtTime(bassNote, audioCtx.currentTime);
            bassOsc.type = 'triangle';
            bassGainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
            bassGainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
            bassOsc.start(audioCtx.currentTime);
            bassOsc.stop(audioCtx.currentTime + 0.12);
        }

        beatIndex++;

        // Schedule next beat - tempo changes based on player distance
        setTimeout(playBeat, currentMusicTempo);
    }

    playBeat();
}

function updateMusicTempo(playerDistance) {
    // Distance ranges from ~0 (touching) to ~1400 (opposite corners)
    // Tempo ranges from 150ms (very fast) to 400ms (normal)
    const maxDistance = 800;
    const normalizedDistance = Math.min(playerDistance, maxDistance) / maxDistance;
    currentMusicTempo = 150 + (normalizedDistance * 250);
}

function stopBackgroundMusic() {
    musicPlaying = false;
}

let musicMuted = false;

function toggleMusic() {
    const muteBtn = document.getElementById('muteBtn');
    if (musicMuted) {
        // Unmute
        musicMuted = false;
        if (musicGain) {
            musicGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        }
        muteBtn.textContent = 'Mute Music';
        muteBtn.classList.remove('muted');
    } else {
        // Mute
        musicMuted = true;
        if (musicGain) {
            musicGain.gain.setValueAtTime(0, audioCtx.currentTime);
        }
        muteBtn.textContent = 'Unmute Music';
        muteBtn.classList.add('muted');
    }
}

// Powerup enabled states
const enabledPowerups = {
    rat: true,
    ghost: true,
    monkey: true,
    polarbear: true,
    bomb: true
};

function togglePowerup(type) {
    enabledPowerups[type] = !enabledPowerups[type];
    const btn = document.getElementById('toggle' + type.charAt(0).toUpperCase() + type.slice(1));
    if (enabledPowerups[type]) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

// Game constants
const CELL_SIZE = 35;
const COLS = 28;
const ROWS = 16;
const CANVAS_WIDTH = COLS * CELL_SIZE;
const CANVAS_HEIGHT = ROWS * CELL_SIZE;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game state
let maze = [];
let players = [];
let powerups = [];
let gameOver = false;
let wallShiftTimer = 0;
const WALL_SHIFT_INTERVAL = 8000; // 8 seconds
const POWERUP_SPAWN_INTERVAL = 5000; // 5 seconds
let lastPowerupSpawn = 0;
let itPlayerIndex = 0; // Who is "it" (0 = Player 1, 1 = Player 2)
let scores = [0, 0]; // Points for surviving wall shifts without being tagged
let tagCooldown = 0; // Brief cooldown after a tag to prevent instant re-tags
let survivedSinceLastTag = [true, true]; // Track if player survived since last being tagged

// Cat enemy
let cat = null;

// Cat class - Mazzi the cat chases players
class Cat {
    constructor() {
        this.size = CELL_SIZE - 12;
        this.speed = 2.5; // Slower speed
        this.direction = { dx: 1, dy: 0 }; // Start moving right
        this.name = 'Mazzi';
        this.respawn();
    }

    respawn() {
        // Spawn in center of map
        const centerCol = Math.floor(COLS / 2);
        const centerRow = Math.floor(ROWS / 2);
        this.x = centerCol * CELL_SIZE + (CELL_SIZE - this.size) / 2;
        this.y = centerRow * CELL_SIZE + (CELL_SIZE - this.size) / 2;
        // Pick random initial direction
        this.chooseNewDirection();
    }

    update() {
        if (gameOver) return;

        // Can always turn - chase the nearest player
        this.chooseNewDirection();

        // Move in current direction
        const newX = this.x + this.direction.dx * this.speed;
        const newY = this.y + this.direction.dy * this.speed;

        // Check if we can move there
        if (this.canMoveTo(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Try moving in just one axis
            if (this.direction.dx !== 0 && this.canMoveTo(this.x + this.direction.dx * this.speed, this.y)) {
                this.x += this.direction.dx * this.speed;
            } else if (this.direction.dy !== 0 && this.canMoveTo(this.x, this.y + this.direction.dy * this.speed)) {
                this.y += this.direction.dy * this.speed;
            }
        }

        // Check collision with players
        for (const player of players) {
            if (this.collidesWithPlayer(player)) {
                // Send player back to spawn
                player.teleportToSpawn();
                playSound('tag');
                // Cat respawns in center
                this.respawn();
            }
        }
    }

    chooseNewDirection() {
        // Find closest player
        let closestPlayer = null;
        let closestDist = Infinity;
        for (const player of players) {
            if (!player.invisible) {
                const dx = (player.x + player.size / 2) - (this.x + this.size / 2);
                const dy = (player.y + player.size / 2) - (this.y + this.size / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPlayer = player;
                }
            }
        }

        if (!closestPlayer) {
            // No visible players, wander randomly
            if (Math.random() < 0.02) {
                const dirs = [{dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}];
                this.direction = dirs[Math.floor(Math.random() * dirs.length)];
            }
            return;
        }

        // Use BFS pathfinding to find the best direction toward the player
        const catCol = Math.floor((this.x + this.size / 2) / CELL_SIZE);
        const catRow = Math.floor((this.y + this.size / 2) / CELL_SIZE);
        const playerCol = Math.floor((closestPlayer.x + closestPlayer.size / 2) / CELL_SIZE);
        const playerRow = Math.floor((closestPlayer.y + closestPlayer.size / 2) / CELL_SIZE);

        // BFS to find path
        const queue = [[playerRow, playerCol, null]]; // Start from player, work backwards
        const visited = new Set();
        visited.add(`${playerRow},${playerCol}`);
        const cameFrom = {}; // Track where we came from

        while (queue.length > 0) {
            const [row, col, firstMove] = queue.shift();

            // If we reached the cat's position, use the first move
            if (row === catRow && col === catCol) {
                if (firstMove) {
                    this.direction = firstMove;
                }
                return;
            }

            // Check all 4 directions
            const dirs = [
                {dr: -1, dc: 0, move: {dx: 0, dy: 1}},   // Up (player came from below)
                {dr: 1, dc: 0, move: {dx: 0, dy: -1}},   // Down (player came from above)
                {dr: 0, dc: -1, move: {dx: 1, dy: 0}},   // Left (player came from right)
                {dr: 0, dc: 1, move: {dx: -1, dy: 0}}    // Right (player came from left)
            ];

            for (const {dr, dc, move} of dirs) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;

                if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS &&
                    maze[newRow][newCol] === 0 && !visited.has(key)) {
                    visited.add(key);
                    // The first move is what direction the cat should go
                    // Since we're going backwards from player, the move is inverted
                    const nextFirstMove = firstMove || move;
                    queue.push([newRow, newCol, nextFirstMove]);
                }
            }
        }

        // No path found, try direct approach as fallback
        const dx = (closestPlayer.x + closestPlayer.size / 2) - (this.x + this.size / 2);
        const dy = (closestPlayer.y + closestPlayer.size / 2) - (this.y + this.size / 2);
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = { dx: dx > 0 ? 1 : -1, dy: 0 };
        } else {
            this.direction = { dx: 0, dy: dy > 0 ? 1 : -1 };
        }
    }

    canMoveTo(x, y) {
        const corners = [
            {x: x, y: y},
            {x: x + this.size, y: y},
            {x: x, y: y + this.size},
            {x: x + this.size, y: y + this.size}
        ];

        for (const corner of corners) {
            const col = Math.floor(corner.x / CELL_SIZE);
            const row = Math.floor(corner.y / CELL_SIZE);
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS || maze[row][col] === 1) {
                return false;
            }
        }
        return true;
    }

    collidesWithPlayer(player) {
        return (
            this.x < player.x + player.size &&
            this.x + this.size > player.x &&
            this.y < player.y + player.size &&
            this.y + this.size > player.y
        );
    }

    draw() {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        // Cat body (brown base)
        ctx.fillStyle = '#8B4513'; // Saddle brown
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, this.size / 2.2, this.size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Black patches on body
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy + 4, 4, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 5, cy + 1, 3, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Cat head (brown)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(cx, cy - 4, this.size / 3, 0, Math.PI * 2);
        ctx.fill();

        // Ears (triangles - brown)
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 12);
        ctx.lineTo(cx - 4, cy - 4);
        ctx.lineTo(cx - 12, cy - 4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 8, cy - 12);
        ctx.lineTo(cx + 4, cy - 4);
        ctx.lineTo(cx + 12, cy - 4);
        ctx.closePath();
        ctx.fill();

        // Black patch on one ear
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(cx + 7, cy - 11);
        ctx.lineTo(cx + 5, cy - 5);
        ctx.lineTo(cx + 10, cy - 5);
        ctx.closePath();
        ctx.fill();

        // Inner ears (pink)
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - 10);
        ctx.lineTo(cx - 5, cy - 5);
        ctx.lineTo(cx - 9, cy - 5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 7, cy - 10);
        ctx.lineTo(cx + 5, cy - 5);
        ctx.lineTo(cx + 9, cy - 5);
        ctx.closePath();
        ctx.fill();

        // Eyes (golden/amber, looking in direction of movement)
        ctx.fillStyle = '#DAA520';
        const eyeOffsetX = this.direction.dx * 2;
        const eyeOffsetY = this.direction.dy * 2;
        ctx.beginPath();
        ctx.ellipse(cx - 4 + eyeOffsetX, cy - 5 + eyeOffsetY, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 4 + eyeOffsetX, cy - 5 + eyeOffsetY, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (black slits)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(cx - 4 + eyeOffsetX, cy - 5 + eyeOffsetY, 1, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 4 + eyeOffsetX, cy - 5 + eyeOffsetY, 1, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose splotch (black patch around nose area)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(cx + 2, cy - 1, 5, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Nose (pink triangle on top of splotch)
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 2);
        ctx.lineTo(cx - 2, cy);
        ctx.lineTo(cx + 2, cy);
        ctx.closePath();
        ctx.fill();

        // Whiskers
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        // Left whiskers
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 1);
        ctx.lineTo(cx - 14, cy - 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy);
        ctx.lineTo(cx - 14, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + 1);
        ctx.lineTo(cx - 14, cy + 3);
        ctx.stroke();
        // Right whiskers
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy - 1);
        ctx.lineTo(cx + 14, cy - 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy);
        ctx.lineTo(cx + 14, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy + 1);
        ctx.lineTo(cx + 14, cy + 3);
        ctx.stroke();

        // Tail (curved - brown with black tip)
        const tailDir = -this.direction.dx || (this.direction.dy === 0 ? 1 : 0);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + tailDir * 8, cy + 8);
        ctx.quadraticCurveTo(cx + tailDir * 16, cy + 4, cx + tailDir * 12, cy - 4);
        ctx.stroke();
        // Black tip
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + tailDir * 13, cy - 2);
        ctx.lineTo(cx + tailDir * 12, cy - 4);
        ctx.stroke();

        // Name tag "Mazzi" above the cat
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, cx, this.y - 8);
        ctx.textAlign = 'left';
    }
}

// Key states
const keys = {};

// Player class
class Player {
    constructor(x, y, color, name, controls, spawnX, spawnY) {
        this.x = x;
        this.y = y;
        this.spawnX = spawnX;
        this.spawnY = spawnY;
        this.color = color;
        this.name = name;
        this.controls = controls;
        this.size = CELL_SIZE - 10;
        this.speed = 4;
        this.invisible = false;
        this.invisibleTimer = 0;
        this.wallPasses = 0;
        this.wallPassTimer = 0; // Timer for monkey powerup
        this.frozen = false;
        this.frozenTimer = 0;
        this.animal = name === 'Player 1' ? 'walrus' : 'penguin';
    }

    teleportToSpawn() {
        this.x = this.spawnX;
        this.y = this.spawnY;
    }

    update() {
        // Update frozen timer
        if (this.frozen) {
            this.frozenTimer -= 16;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
                this.frozenTimer = 0;
                updatePowerupStatus();
            }
            return; // Can't move while frozen
        }

        let dx = 0;
        let dy = 0;

        // IT player is faster than the runner
        const playerIndex = this.name === 'Player 1' ? 0 : 1;
        const currentSpeed = itPlayerIndex === playerIndex ? 5 : this.speed;

        if (keys[this.controls.up]) dy = -currentSpeed;
        if (keys[this.controls.down]) dy = currentSpeed;
        if (keys[this.controls.left]) dx = -currentSpeed;
        if (keys[this.controls.right]) dx = currentSpeed;

        // Try to move
        const newX = this.x + dx;
        const newY = this.y + dy;

        // Check wall collisions - with wall pass ability
        if (dx !== 0) {
            if (this.canMoveTo(newX, this.y)) {
                this.x = newX;
            } else if (this.wallPasses > 0) {
                // Check if we're entering a wall (not already in one)
                const wasInWall = this.isInWall(this.x, this.y);
                this.x = newX;
                const nowInWall = this.isInWall(this.x, this.y);
                // Only consume wall pass when entering a new wall
                if (!wasInWall && nowInWall) {
                    this.wallPasses--;
                    updatePowerupStatus();
                }
            }
        }
        if (dy !== 0) {
            if (this.canMoveTo(this.x, newY)) {
                this.y = newY;
            } else if (this.wallPasses > 0) {
                const wasInWall = this.isInWall(this.x, this.y);
                this.y = newY;
                const nowInWall = this.isInWall(this.x, this.y);
                if (!wasInWall && nowInWall) {
                    this.wallPasses--;
                    updatePowerupStatus();
                }
            }
        }

        // Update monkey wall pass timer
        if (this.wallPassTimer > 0) {
            this.wallPassTimer -= 16;
            if (this.wallPassTimer <= 0) {
                this.wallPasses = 0;
                this.wallPassTimer = 0;
                updatePowerupStatus();
            }
        }

        // If player is inside a wall with no wall passes left (or timer expired), push them out
        if ((this.wallPasses <= 0 || this.wallPassTimer <= 0) && this.isInWall(this.x, this.y)) {
            this.ejectFromWall();
        }

        // Keep player in bounds
        this.x = Math.max(5, Math.min(CANVAS_WIDTH - this.size - 5, this.x));
        this.y = Math.max(5, Math.min(CANVAS_HEIGHT - this.size - 5, this.y));

        // Update invisibility timer
        if (this.invisible) {
            this.invisibleTimer -= 16;
            if (this.invisibleTimer <= 0) {
                this.invisible = false;
                updatePowerupStatus();
            }
        }
    }

    ejectFromWall() {
        // Find nearest free space using BFS for more reliable ejection
        const startCol = Math.floor((this.x + this.size / 2) / CELL_SIZE);
        const startRow = Math.floor((this.y + this.size / 2) / CELL_SIZE);

        const queue = [[startRow, startCol]];
        const visited = new Set();
        visited.add(`${startRow},${startCol}`);

        while (queue.length > 0) {
            const [row, col] = queue.shift();

            // Check if this cell is free
            const testX = col * CELL_SIZE + (CELL_SIZE - this.size) / 2;
            const testY = row * CELL_SIZE + (CELL_SIZE - this.size) / 2;

            if (this.canMoveTo(testX, testY)) {
                this.x = testX;
                this.y = testY;
                playSound('teleport'); // Sound effect for ejection
                return;
            }

            // Add neighbors to queue
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of dirs) {
                const nr = row + dr;
                const nc = col + dc;
                const key = `${nr},${nc}`;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited.has(key)) {
                    visited.add(key);
                    queue.push([nr, nc]);
                }
            }
        }
    }

    isInWall(x, y) {
        const corners = [
            { x: x, y: y },
            { x: x + this.size, y: y },
            { x: x, y: y + this.size },
            { x: x + this.size, y: y + this.size }
        ];

        for (const corner of corners) {
            const col = Math.floor(corner.x / CELL_SIZE);
            const row = Math.floor(corner.y / CELL_SIZE);
            if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
                if (maze[row][col] === 1) {
                    return true;
                }
            }
        }
        return false;
    }

    canMoveTo(x, y) {
        const corners = [
            { x: x, y: y },
            { x: x + this.size, y: y },
            { x: x, y: y + this.size },
            { x: x + this.size, y: y + this.size }
        ];

        for (const corner of corners) {
            const col = Math.floor(corner.x / CELL_SIZE);
            const row = Math.floor(corner.y / CELL_SIZE);
            if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
                if (maze[row][col] === 1) {
                    return false;
                }
            }
        }
        return true;
    }

    draw() {
        // If invisible, don't draw at all (completely invisible to other player)
        // Only show a very faint outline to the player themselves
        if (this.invisible) {
            // Draw a tiny ghost indicator only where the player is
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x + this.size / 2, this.y + this.size / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Draw ghost timer indicator above
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`👻 ${Math.ceil(this.invisibleTimer / 1000)}s`, this.x + this.size / 2, this.y - 5);
            ctx.textAlign = 'left';
            return; // Don't draw the rest of the player
        }

        // Apply frozen visual effect
        if (this.frozen) {
            ctx.globalAlpha = 0.7;
            ctx.filter = 'hue-rotate(180deg) saturate(0.5)';
        }

        if (this.animal === 'walrus') {
            this.drawWalrus();
        } else {
            this.drawPenguin();
        }

        // Reset filter
        if (this.frozen) {
            ctx.filter = 'none';
            ctx.globalAlpha = 1;

            // Draw ice crystals around frozen player
            ctx.fillStyle = '#00BFFF';
            const cx = this.x + this.size / 2;
            const cy = this.y + this.size / 2;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.002;
                const radius = this.size / 2 + 8;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw frozen timer
            ctx.fillStyle = '#00BFFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`❄️ ${Math.ceil(this.frozenTimer / 1000)}s`, cx, this.y - 8);
            ctx.textAlign = 'left';
        }

        // Draw IT indicator and powerup indicators
        this.drawIndicators();
    }

    drawWalrus() {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        // Body (brown/gray)
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, this.size / 2, this.size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lighter belly
        ctx.fillStyle = '#A89078';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, this.size / 3, this.size / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.arc(cx, this.y + 8, 10, 0, Math.PI * 2);
        ctx.fill();

        // Snout/muzzle (big and round)
        ctx.fillStyle = '#A89078';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 14, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Whisker dots
        ctx.fillStyle = '#5a4a3a';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(cx - 6 + i * 3, this.y + 13, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 4 + i * 3, this.y + 13, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tusks
        ctx.fillStyle = '#FFFFF0';
        ctx.beginPath();
        ctx.moveTo(cx - 5, this.y + 16);
        ctx.lineTo(cx - 7, this.y + 26);
        ctx.lineTo(cx - 3, this.y + 16);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 5, this.y + 16);
        ctx.lineTo(cx + 7, this.y + 26);
        ctx.lineTo(cx + 3, this.y + 16);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 5, this.y + 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5, this.y + 6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 4, this.y + 5, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 6, this.y + 5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 10, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flippers
        ctx.fillStyle = '#7a6355';
        ctx.beginPath();
        ctx.ellipse(this.x + 3, cy + 5, 5, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + this.size - 3, cy + 5, 5, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPenguin() {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        // Body (black back)
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.size / 2.2, this.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // White belly
        ctx.fillStyle = '#FFFEF0';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 3, this.size / 3.5, this.size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(cx, this.y + 8, 9, 0, Math.PI * 2);
        ctx.fill();

        // White face patches
        ctx.fillStyle = '#FFFEF0';
        ctx.beginPath();
        ctx.ellipse(cx - 5, this.y + 8, 4, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 5, this.y + 8, 4, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 4, this.y + 7, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 4, this.y + 7, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 3, this.y + 6, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5, this.y + 6, 1, 0, Math.PI * 2);
        ctx.fill();

        // Beak (orange)
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(cx, this.y + 10);
        ctx.lineTo(cx - 4, this.y + 14);
        ctx.lineTo(cx + 4, this.y + 14);
        ctx.closePath();
        ctx.fill();

        // Wings/flippers
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(this.x + 2, cy, 4, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + this.size - 2, cy, 4, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Feet (orange)
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(cx - 5, this.y + this.size - 3, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 5, this.y + this.size - 3, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawIndicators() {
        // Draw "IT" indicator if this player is it
        const playerIndex = this.name === 'Player 1' ? 0 : 1;
        if (itPlayerIndex === playerIndex) {
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('IT!', this.x + this.size / 2, this.y - 8);
            ctx.textAlign = 'left';

            // Draw red glow around player who is it
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.size / 2,
                this.y + this.size / 2,
                this.size / 2 + 5,
                this.size / 2.5 + 5,
                0, 0, Math.PI * 2
            );
            ctx.stroke();
        }

        // Draw powerup indicators
        if (this.wallPasses > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px Arial';
            ctx.fillText(`🐒${this.wallPasses}`, this.x, this.y - 20);
        }
    }

    teleportToOpposite() {
        this.x = CANVAS_WIDTH - this.x - this.size;
        this.y = CANVAS_HEIGHT - this.y - this.size;

        // Make sure we don't end up in a wall
        let attempts = 0;
        while (!this.canMoveTo(this.x, this.y) && attempts < 50) {
            this.x = Math.random() * (CANVAS_WIDTH - this.size - 100) + 50;
            this.y = Math.random() * (CANVAS_HEIGHT - this.size - 100) + 50;
            attempts++;
        }
    }
}

// Powerup class
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        this.bobOffset = 0;
        this.bobSpeed = 0.1;
    }

    update() {
        this.bobOffset = Math.sin(Date.now() * 0.005) * 3;
    }

    draw() {
        const drawY = this.y + this.bobOffset;

        if (this.type === 'rat') {
            // Draw small rat
            ctx.fillStyle = '#8B7355';
            // Body
            ctx.beginPath();
            ctx.ellipse(this.x + 10, drawY + 12, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.beginPath();
            ctx.ellipse(this.x + 18, drawY + 10, 5, 4, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Ears
            ctx.fillStyle = '#DEB887';
            ctx.beginPath();
            ctx.arc(this.x + 16, drawY + 6, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 20, drawY + 6, 3, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + 19, drawY + 9, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Tail
            ctx.strokeStyle = '#A0522D';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 2, drawY + 12);
            ctx.quadraticCurveTo(this.x - 3, drawY + 8, this.x - 2, drawY + 15);
            ctx.stroke();
            // Nose
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(this.x + 22, drawY + 10, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'ghost') {
            // Draw ghost
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, drawY + 20);
            ctx.lineTo(this.x, drawY + 20);
            ctx.lineTo(this.x, drawY + 8);
            ctx.quadraticCurveTo(this.x, drawY, this.x + 10, drawY);
            ctx.quadraticCurveTo(this.x + 20, drawY, this.x + 20, drawY + 8);
            ctx.lineTo(this.x + 20, drawY + 20);
            ctx.lineTo(this.x + 15, drawY + 15);
            ctx.lineTo(this.x + 10, drawY + 20);
            ctx.lineTo(this.x + 5, drawY + 15);
            ctx.closePath();
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + 6, drawY + 8, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 14, drawY + 8, 3, 0, Math.PI * 2);
            ctx.fill();
            // Mouth
            ctx.beginPath();
            ctx.arc(this.x + 10, drawY + 14, 3, 0, Math.PI);
            ctx.stroke();
        } else if (this.type === 'monkey') {
            // Draw monkey face
            ctx.fillStyle = '#8B4513';
            // Face
            ctx.beginPath();
            ctx.arc(this.x + 10, drawY + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            // Ears
            ctx.beginPath();
            ctx.arc(this.x, drawY + 10, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 20, drawY + 10, 5, 0, Math.PI * 2);
            ctx.fill();
            // Inner ears
            ctx.fillStyle = '#DEB887';
            ctx.beginPath();
            ctx.arc(this.x, drawY + 10, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 20, drawY + 10, 3, 0, Math.PI * 2);
            ctx.fill();
            // Face area
            ctx.fillStyle = '#DEB887';
            ctx.beginPath();
            ctx.ellipse(this.x + 10, drawY + 12, 6, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + 6, drawY + 8, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 14, drawY + 8, 2, 0, Math.PI * 2);
            ctx.fill();
            // Nose
            ctx.beginPath();
            ctx.arc(this.x + 8, drawY + 13, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 12, drawY + 13, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Smile
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x + 10, drawY + 14, 3, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else if (this.type === 'polarbear') {
            // Draw polar bear face
            ctx.fillStyle = '#F5F5F5';
            // Face
            ctx.beginPath();
            ctx.arc(this.x + 10, drawY + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            // Ears
            ctx.beginPath();
            ctx.arc(this.x + 2, drawY + 3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 18, drawY + 3, 4, 0, Math.PI * 2);
            ctx.fill();
            // Inner ears
            ctx.fillStyle = '#DDD';
            ctx.beginPath();
            ctx.arc(this.x + 2, drawY + 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 18, drawY + 3, 2, 0, Math.PI * 2);
            ctx.fill();
            // Snout
            ctx.fillStyle = '#E8E8E8';
            ctx.beginPath();
            ctx.ellipse(this.x + 10, drawY + 13, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + 6, drawY + 8, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 14, drawY + 8, 2, 0, Math.PI * 2);
            ctx.fill();
            // Nose
            ctx.beginPath();
            ctx.arc(this.x + 10, drawY + 11, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Ice sparkle effect
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(this.x + 16, drawY + 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 4, drawY + 18, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'bomb') {
            // Draw bomb
            ctx.fillStyle = '#222';
            // Body
            ctx.beginPath();
            ctx.arc(this.x + 10, drawY + 12, 8, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(this.x + 7, drawY + 9, 3, 0, Math.PI * 2);
            ctx.fill();
            // Fuse
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 10, drawY + 4);
            ctx.quadraticCurveTo(this.x + 14, drawY - 2, this.x + 16, drawY);
            ctx.stroke();
            // Spark/flame on fuse
            const sparkle = Math.sin(Date.now() * 0.02) > 0;
            ctx.fillStyle = sparkle ? '#FF4500' : '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + 16, drawY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.arc(this.x + 16, drawY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Glow effect
        ctx.shadowColor = this.type === 'rat' ? '#FFD700' : this.type === 'ghost' ? '#00FFFF' : this.type === 'polarbear' ? '#00BFFF' : this.type === 'bomb' ? '#FF4500' : '#FF6600';
        ctx.shadowBlur = 10;
        ctx.shadowBlur = 0;
    }

    collidesWith(player) {
        return (
            this.x < player.x + player.size &&
            this.x + this.size > player.x &&
            this.y < player.y + player.size &&
            this.y + this.size > player.y
        );
    }
}

// Generate maze using recursive backtracking for guaranteed connectivity
function generateMaze() {
    // Initialize - border walls only, interior starts as paths
    maze = [];
    for (let row = 0; row < ROWS; row++) {
        maze[row] = [];
        for (let col = 0; col < COLS; col++) {
            // Only outer edge is wall
            if (row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1) {
                maze[row][col] = 1;
            } else {
                maze[row][col] = 0; // Interior starts as open
            }
        }
    }

    // Create maze structure using a grid-based approach
    // Place walls at regular intervals, then carve passages
    const cellSize = 2; // Distance between potential wall positions

    // Place wall grid
    for (let row = 2; row < ROWS - 2; row += cellSize) {
        for (let col = 2; col < COLS - 2; col += cellSize) {
            maze[row][col] = 1;
        }
    }

    // Add horizontal wall segments
    for (let row = 2; row < ROWS - 2; row += cellSize) {
        for (let col = 2; col < COLS - 2; col++) {
            if (col % cellSize !== 0 && Math.random() < 0.6) {
                maze[row][col] = 1;
            }
        }
    }

    // Add vertical wall segments
    for (let col = 2; col < COLS - 2; col += cellSize) {
        for (let row = 2; row < ROWS - 2; row++) {
            if (row % cellSize !== 0 && Math.random() < 0.5) {
                maze[row][col] = 1;
            }
        }
    }

    // Carve passages through walls to ensure connectivity
    // Use randomized Prim's-like algorithm to create paths
    for (let row = 1; row < ROWS - 1; row += 2) {
        for (let col = 1; col < COLS - 1; col += 2) {
            maze[row][col] = 0; // Ensure odd positions are paths
        }
    }

    // Add some L-shaped and T-shaped wall structures for maze feel
    for (let i = 0; i < 15; i++) {
        const row = Math.floor(Math.random() * (ROWS - 6)) + 3;
        const col = Math.floor(Math.random() * (COLS - 6)) + 3;

        // Don't place near spawn areas
        if ((col < 6 && row < 6) || (col > COLS - 7 && row > ROWS - 7)) continue;

        // Create an L or T shape
        const shape = Math.floor(Math.random() * 4);
        const len = 2 + Math.floor(Math.random() * 2);

        for (let j = 0; j < len; j++) {
            if (shape === 0 && col + j < COLS - 1) maze[row][col + j] = 1;
            if (shape === 1 && row + j < ROWS - 1) maze[row + j][col] = 1;
            if (shape === 2 && col - j > 0) maze[row][col - j] = 1;
            if (shape === 3 && row - j > 0) maze[row - j][col] = 1;
        }
    }

    // Add some open areas (rooms) for gameplay variety
    // Room 1: Center area
    const centerR = Math.floor(ROWS / 2);
    const centerC = Math.floor(COLS / 2);
    for (let r = centerR - 2; r <= centerR + 2; r++) {
        for (let c = centerC - 3; c <= centerC + 3; c++) {
            if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1) {
                maze[r][c] = 0;
            }
        }
    }

    // Clear spawn areas for players
    clearArea(1, 1, 4, 4);
    clearArea(COLS - 5, ROWS - 5, 4, 4);

    // Ensure connectivity between spawn points
    ensureConnectivity();
}

// BFS to check and ensure path exists between spawn points
function ensureConnectivity() {
    const startRow = 2, startCol = 2;
    const endRow = ROWS - 3, endCol = COLS - 3;

    // BFS to find if path exists
    function hasPath() {
        const queue = [[startRow, startCol]];
        const visited = new Set();
        visited.add(`${startRow},${startCol}`);

        while (queue.length > 0) {
            const [row, col] = queue.shift();

            if (row === endRow && col === endCol) return true;

            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;

                if (newRow > 0 && newRow < ROWS - 1 &&
                    newCol > 0 && newCol < COLS - 1 &&
                    maze[newRow][newCol] === 0 &&
                    !visited.has(key)) {
                    visited.add(key);
                    queue.push([newRow, newCol]);
                }
            }
        }
        return false;
    }

    // If no path, carve one
    if (!hasPath()) {
        // Carve a diagonal-ish path
        let row = startRow, col = startCol;
        while (row !== endRow || col !== endCol) {
            maze[row][col] = 0;
            // Also clear adjacent cells for wider path
            if (row > 1) maze[row - 1][col] = 0;
            if (col > 1) maze[row][col - 1] = 0;

            if (row < endRow) row++;
            else if (row > endRow) row--;

            if (col < endCol) col++;
            else if (col > endCol) col--;
        }
        maze[endRow][endCol] = 0;
    }
}

function clearArea(startCol, startRow, width, height) {
    for (let row = startRow; row < startRow + height && row < ROWS - 1; row++) {
        for (let col = startCol; col < startCol + width && col < COLS - 1; col++) {
            if (row > 0 && col > 0) {
                maze[row][col] = 0;
            }
        }
    }
}

function shiftWalls() {
    // Award points to players who survived since last tag
    // The non-IT player gets a point for surviving
    const nonItPlayer = 1 - itPlayerIndex;
    if (survivedSinceLastTag[nonItPlayer]) {
        scores[nonItPlayer]++;
        updateScoreDisplay();
    }
    // Reset survival tracking (IT player doesn't score for surviving)
    survivedSinceLastTag[0] = true;
    survivedSinceLastTag[1] = true;

    // Shift walls by opening some and closing others (maintaining maze structure)
    // Much more dramatic shifts - change a significant portion of the maze

    // Open many walls (create new passages) - more dramatic!
    for (let i = 0; i < 40; i++) {
        const row = Math.floor(Math.random() * (ROWS - 4)) + 2;
        const col = Math.floor(Math.random() * (COLS - 4)) + 2;

        // Don't modify spawn areas
        if (col < 5 && row < 5) continue;
        if (col > COLS - 6 && row > ROWS - 6) continue;

        // Only open walls adjacent to existing paths
        if (maze[row][col] === 1) {
            const adjacentPaths =
                (row > 1 && maze[row-1][col] === 0 ? 1 : 0) +
                (row < ROWS - 2 && maze[row+1][col] === 0 ? 1 : 0) +
                (col > 1 && maze[row][col-1] === 0 ? 1 : 0) +
                (col < COLS - 2 && maze[row][col+1] === 0 ? 1 : 0);
            if (adjacentPaths >= 1) {
                maze[row][col] = 0;
            }
        }
    }

    // Close many paths (but not if it would block the route) - more dramatic!
    for (let i = 0; i < 35; i++) {
        const row = Math.floor(Math.random() * (ROWS - 4)) + 2;
        const col = Math.floor(Math.random() * (COLS - 4)) + 2;

        // Don't modify spawn areas or center room
        if (col < 5 && row < 5) continue;
        if (col > COLS - 6 && row > ROWS - 6) continue;
        const centerR = Math.floor(ROWS / 2);
        const centerC = Math.floor(COLS / 2);
        if (Math.abs(row - centerR) <= 2 && Math.abs(col - centerC) <= 2) continue;

        // Close paths that have multiple adjacent paths (won't create dead ends)
        // Lower threshold to allow more closing
        if (maze[row][col] === 0) {
            const adjacentPaths =
                (row > 1 && maze[row-1][col] === 0 ? 1 : 0) +
                (row < ROWS - 2 && maze[row+1][col] === 0 ? 1 : 0) +
                (col > 1 && maze[row][col-1] === 0 ? 1 : 0) +
                (col < COLS - 2 && maze[row][col+1] === 0 ? 1 : 0);
            if (adjacentPaths >= 2) {
                maze[row][col] = 1;
            }
        }
    }

    // Add some random corridor carving for dramatic effect
    for (let i = 0; i < 3; i++) {
        let row = Math.floor(Math.random() * (ROWS - 6)) + 3;
        let col = Math.floor(Math.random() * (COLS - 6)) + 3;
        const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const length = Math.floor(Math.random() * 5) + 3;

        for (let j = 0; j < length; j++) {
            if (row > 1 && row < ROWS - 2 && col > 1 && col < COLS - 2) {
                // Don't modify spawn areas
                if (!(col < 5 && row < 5) && !(col > COLS - 6 && row > ROWS - 6)) {
                    maze[row][col] = 0;
                }
            }
            if (direction === 'horizontal') col++;
            else row++;
        }
    }

    // Ensure connectivity after wall shift
    ensureConnectivity();

    // Make sure players aren't stuck in walls
    for (const player of players) {
        let attempts = 0;
        while (!player.canMoveTo(player.x, player.y) && attempts < 100) {
            // Find nearby free space
            for (let dx = -CELL_SIZE; dx <= CELL_SIZE; dx += CELL_SIZE) {
                for (let dy = -CELL_SIZE; dy <= CELL_SIZE; dy += CELL_SIZE) {
                    if (player.canMoveTo(player.x + dx, player.y + dy)) {
                        player.x += dx;
                        player.y += dy;
                        break;
                    }
                }
            }
            attempts++;
        }
    }

    // Play wall shift sound
    playSound('wallShift');
}

// Draw maze
function drawMaze() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;

            if (maze[row][col] === 1) {
                // Draw jungle wall (tree/bush)
                ctx.fillStyle = '#2d5a27';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

                // Draw leaves/foliage
                ctx.fillStyle = '#1a4d1a';
                ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

                // Add leaf details
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(x + 10, y + 10, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE - 10, y + 10, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + 10, y + CELL_SIZE - 10, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE - 10, y + CELL_SIZE - 10, 8, 0, Math.PI * 2);
                ctx.fill();

                // Add darker center
                ctx.fillStyle = '#0d3d0d';
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 6, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Draw ground
                ctx.fillStyle = '#4a7c3f';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

                // Add grass texture
                ctx.strokeStyle = '#3d6b34';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const gx = x + 5 + i * 12;
                    const gy = y + CELL_SIZE - 5;
                    ctx.beginPath();
                    ctx.moveTo(gx, gy);
                    ctx.lineTo(gx - 3, gy - 8);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(gx, gy);
                    ctx.lineTo(gx + 3, gy - 6);
                    ctx.stroke();
                }
            }
        }
    }
}

// Check if a cell is reachable from player spawn areas using BFS
function isReachableFromSpawn(targetRow, targetCol) {
    // Check reachability from player 1's spawn area
    const startRow = 2, startCol = 2;

    const queue = [[startRow, startCol]];
    const visited = new Set();
    visited.add(`${startRow},${startCol}`);

    while (queue.length > 0) {
        const [row, col] = queue.shift();

        if (row === targetRow && col === targetCol) return true;

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            const key = `${newRow},${newCol}`;

            if (newRow >= 0 && newRow < ROWS &&
                newCol >= 0 && newCol < COLS &&
                maze[newRow][newCol] === 0 &&
                !visited.has(key)) {
                visited.add(key);
                queue.push([newRow, newCol]);
            }
        }
    }
    return false;
}

function spawnPowerup() {
    // Only include enabled powerups
    const allTypes = ['rat', 'ghost', 'monkey', 'polarbear', 'bomb'];
    const types = allTypes.filter(t => enabledPowerups[t]);

    // Don't spawn if no powerups are enabled
    if (types.length === 0) return;

    const type = types[Math.floor(Math.random() * types.length)];

    let x, y, attempts = 0;
    let col, row;
    do {
        col = Math.floor(Math.random() * (COLS - 4)) + 2;
        row = Math.floor(Math.random() * (ROWS - 4)) + 2;
        x = col * CELL_SIZE + CELL_SIZE / 2 - 10;
        y = row * CELL_SIZE + CELL_SIZE / 2 - 10;
        attempts++;
    } while (attempts < 100 && (
        maze[row][col] === 1 ||
        (col < 5 && row < 5) ||
        (col > COLS - 6 && row > ROWS - 6) ||
        !isReachableFromSpawn(row, col)
    ));

    if (attempts < 100 && powerups.length < 5) {
        powerups.push(new Powerup(x, y, type));
    }
}

function applyPowerup(player, type) {
    if (type === 'rat') {
        player.teleportToOpposite();
        playSound('teleport');
    } else if (type === 'ghost') {
        player.invisible = true;
        player.invisibleTimer = 10000; // 10 seconds
        playSound('invisible');
    } else if (type === 'monkey') {
        player.wallPasses = 5;
        player.wallPassTimer = 8000; // 8 seconds to use wall passes
        playSound('powerup');
    } else if (type === 'polarbear') {
        // Freeze the opponent for 3 seconds
        const playerIndex = players.indexOf(player);
        const opponent = players[1 - playerIndex];
        opponent.frozen = true;
        opponent.frozenTimer = 3000;
        playSound('tag'); // Use tag sound for freeze
    } else if (type === 'bomb') {
        // Blow up 5x5 area around player, destroying walls
        const centerCol = Math.floor((player.x + player.size / 2) / CELL_SIZE);
        const centerRow = Math.floor((player.y + player.size / 2) / CELL_SIZE);

        // Destroy walls in 5x5 area
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const row = centerRow + dr;
                const col = centerCol + dc;
                // Don't destroy outer walls
                if (row > 0 && row < ROWS - 1 && col > 0 && col < COLS - 1) {
                    maze[row][col] = 0;
                }
            }
        }

        // Visual explosion effect
        createExplosion(player.x + player.size / 2, player.y + player.size / 2);
        playBombSound();
    }
    updatePowerupStatus();
}

function updatePowerupStatus() {
    const p1 = players[0];
    const p2 = players[1];

    let p1Status = [];
    if (p1.frozen) p1Status.push(`🐻‍❄️ FROZEN: ${Math.ceil(p1.frozenTimer / 1000)}s`);
    if (p1.invisible) p1Status.push(`👻 Invisible: ${Math.ceil(p1.invisibleTimer / 1000)}s`);
    if (p1.wallPasses > 0) p1Status.push(`🐒 Wall passes: ${p1.wallPasses} (${Math.ceil(p1.wallPassTimer / 1000)}s)`);
    document.getElementById('p1Status').textContent = p1Status.length ? p1Status.join(' | ') : 'No active powerups';

    let p2Status = [];
    if (p2.frozen) p2Status.push(`🐻‍❄️ FROZEN: ${Math.ceil(p2.frozenTimer / 1000)}s`);
    if (p2.invisible) p2Status.push(`👻 Invisible: ${Math.ceil(p2.invisibleTimer / 1000)}s`);
    if (p2.wallPasses > 0) p2Status.push(`🐒 Wall passes: ${p2.wallPasses} (${Math.ceil(p2.wallPassTimer / 1000)}s)`);
    document.getElementById('p2Status').textContent = p2Status.length ? p2Status.join(' | ') : 'No active powerups';
}

function checkTagCollision() {
    // Skip if on cooldown
    if (tagCooldown > 0) {
        tagCooldown -= 16;
        return;
    }

    const p1 = players[0];
    const p2 = players[1];
    const itPlayer = players[itPlayerIndex];
    const otherPlayer = players[1 - itPlayerIndex];

    // If the player who is "it" is invisible, they can't tag
    if (itPlayer.invisible) return;

    // If the other player is invisible, they can't be tagged
    if (otherPlayer.invisible) return;

    const dx = (p1.x + p1.size / 2) - (p2.x + p2.size / 2);
    const dy = (p1.y + p1.size / 2) - (p2.y + p2.size / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < (p1.size + p2.size) / 2.5) {
        // Tag happened! The tagged player loses their survival streak
        const taggedPlayerIndex = 1 - itPlayerIndex;
        survivedSinceLastTag[taggedPlayerIndex] = false;

        // Play tag sound
        playSound('tag');

        // The tagger teleports back to spawn
        itPlayer.teleportToSpawn();

        // The tagged person becomes "it"
        itPlayerIndex = 1 - itPlayerIndex;

        // Set cooldown to prevent instant re-tagging
        tagCooldown = 1000; // 1 second cooldown

        // Update UI
        updateScoreDisplay();
        updatePowerupStatus();

        // Show tag notification
        showTagNotification(itPlayerIndex === 0 ? 'Walrus' : 'Penguin');
    }
}

function showTagNotification(newItPlayer) {
    const notification = document.getElementById('tagNotification');
    notification.textContent = `${newItPlayer} is now IT!`;
    notification.style.display = 'block';
    notification.style.opacity = '1';

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }, 1500);
}

const WINNING_SCORE = 10;

function updateScoreDisplay() {
    document.getElementById('p1Score').textContent = `Survives: ${scores[0]}`;
    document.getElementById('p2Score').textContent = `Survives: ${scores[1]}`;

    // Check for winner
    if (scores[0] >= WINNING_SCORE) {
        endGame('Walrus');
    } else if (scores[1] >= WINNING_SCORE) {
        endGame('Penguin');
    }
}

function endGame(winner) {
    gameOver = true;
    document.getElementById('winText').textContent = `${winner} wins!`;
    document.getElementById('message').style.display = 'block';
    document.getElementById('restartBtn').style.display = 'block';
}

function initGame() {
    generateMaze();

    const p1SpawnX = CELL_SIZE * 2;
    const p1SpawnY = CELL_SIZE * 2;
    const p2SpawnX = CANVAS_WIDTH - CELL_SIZE * 4;
    const p2SpawnY = CANVAS_HEIGHT - CELL_SIZE * 4;

    players = [
        new Player(p1SpawnX, p1SpawnY, '#FFB347', 'Player 1', {
            up: 'KeyW',
            down: 'KeyS',
            left: 'KeyA',
            right: 'KeyD'
        }, p1SpawnX, p1SpawnY),
        new Player(p2SpawnX, p2SpawnY, '#FF8C00', 'Player 2', {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight'
        }, p2SpawnX, p2SpawnY)
    ];

    powerups = [];
    cat = new Cat(); // Create the cat enemy
    gameOver = false;
    wallShiftTimer = Date.now();
    lastPowerupSpawn = Date.now();
    itPlayerIndex = Math.random() > 0.5 ? 0 : 1; // Random starting "it"
    scores = [0, 0];
    tagCooldown = 0;
    survivedSinceLastTag = [true, true];

    document.getElementById('message').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'none';
    updatePowerupStatus();
    updateScoreDisplay();
}

function gameLoop() {
    if (!gameOver) {
        // Update
        for (const player of players) {
            player.update();
        }

        for (const powerup of powerups) {
            powerup.update();
        }

        // Update cat enemy
        if (cat) {
            cat.update();
        }

        // Check powerup collisions
        for (let i = powerups.length - 1; i >= 0; i--) {
            for (const player of players) {
                if (powerups[i].collidesWith(player)) {
                    applyPowerup(player, powerups[i].type);
                    powerups.splice(i, 1);
                    break;
                }
            }
        }

        // Check tag collision
        checkTagCollision();

        // Wall shift timer
        if (Date.now() - wallShiftTimer > WALL_SHIFT_INTERVAL) {
            shiftWalls();
            wallShiftTimer = Date.now();
        }

        // Powerup spawn timer
        if (Date.now() - lastPowerupSpawn > POWERUP_SPAWN_INTERVAL) {
            spawnPowerup();
            lastPowerupSpawn = Date.now();
        }

        // Update powerup status display periodically
        if (Math.random() < 0.1) {
            updatePowerupStatus();
        }

        // Update explosion particles
        updateExplosions();

        // Update music tempo based on player distance
        const p1 = players[0];
        const p2 = players[1];
        const dx = (p1.x + p1.size / 2) - (p2.x + p2.size / 2);
        const dy = (p1.y + p1.size / 2) - (p2.y + p2.size / 2);
        const playerDistance = Math.sqrt(dx * dx + dy * dy);
        updateMusicTempo(playerDistance);
    }

    // Draw
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawMaze();

    for (const powerup of powerups) {
        powerup.draw();
    }

    for (const player of players) {
        player.draw();
    }

    // Draw cat enemy
    if (cat) {
        cat.draw();
    }

    // Draw explosions on top
    drawExplosions();

    // Draw wall shift warning
    const timeToShift = WALL_SHIFT_INTERVAL - (Date.now() - wallShiftTimer);
    if (timeToShift < 2000) {
        ctx.fillStyle = `rgba(255, 0, 0, ${(2000 - timeToShift) / 4000})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ WALLS SHIFTING! ⚠️', CANVAS_WIDTH / 2, 30);
        ctx.textAlign = 'left';
    }

    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    // Initialize audio on first keypress (browser requirement)
    if (!audioCtx) {
        initAudio();
        startBackgroundMusic();
    }

    keys[e.code] = true;
    // Prevent arrow keys from scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Also init audio on click (for mobile/touch)
document.addEventListener('click', () => {
    if (!audioCtx) {
        initAudio();
        startBackgroundMusic();
    }
});

function restartGame() {
    initGame();
}

// Start the game
initGame();
gameLoop();
