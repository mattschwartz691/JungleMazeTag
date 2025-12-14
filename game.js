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
let currentMusicTrack = 2; // 1 = Jungle Chase, 2 = Bear Buddies (default)

function setMusicTrack(track) {
    currentMusicTrack = track;
    // Update button states
    document.getElementById('music1Btn').classList.toggle('active', track === 1);
    document.getElementById('music2Btn').classList.toggle('active', track === 2);
}

function startBackgroundMusic() {
    if (!audioCtx || musicPlaying) return;

    musicPlaying = true;
    musicGain = audioCtx.createGain();
    musicGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    musicGain.connect(audioCtx.destination);

    let beatIndex = 0;

    function playBeat() {
        if (!musicPlaying) return;

        if (currentMusicTrack === 1) {
            playMusic1Beat(beatIndex);
        } else {
            playMusic2Beat(beatIndex);
        }

        beatIndex++;
        setTimeout(playBeat, currentMusicTempo);
    }

    playBeat();
}

// Music 1: Chase theme (original)
function playMusic1Beat(beatIndex) {
    const melodyPattern = [
        392.00, 440.00, 523.25, 0, 587.33, 0, 659.25, 0,
        587.33, 523.25, 440.00, 0, 392.00, 0, 349.23, 0,
        440.00, 0, 523.25, 0, 587.33, 659.25, 698.46, 0,
        783.99, 698.46, 659.25, 587.33, 659.25, 0, 0, 0,
        523.25, 0, 587.33, 523.25, 440.00, 0, 392.00, 0,
        349.23, 392.00, 440.00, 0, 523.25, 0, 587.33, 0,
        392.00, 440.00, 523.25, 587.33, 659.25, 698.46, 783.99, 0,
        659.25, 587.33, 523.25, 440.00, 392.00, 0, 0, 0
    ];

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

    const bassPattern = [
        130.81, 0, 130.81, 130.81, 146.83, 0, 146.83, 0,
        174.61, 0, 174.61, 174.61, 164.81, 0, 146.83, 0,
        146.83, 0, 146.83, 0, 174.61, 0, 174.61, 0,
        196.00, 0, 196.00, 196.00, 174.61, 0, 0, 0,
        164.81, 0, 164.81, 0, 146.83, 0, 130.81, 0,
        123.47, 0, 130.81, 0, 146.83, 0, 164.81, 0,
        130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 0,
        174.61, 164.81, 146.83, 130.81, 130.81, 0, 0, 0
    ];

    const kickPattern =  [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0];
    const snarePattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1];
    const hihatPattern = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    const patternIndex = beatIndex % 64;
    const drumIndex = beatIndex % 16;

    // Drums
    if (kickPattern[drumIndex]) playKick();
    if (snarePattern[drumIndex]) playSnare();
    if (hihatPattern[drumIndex]) playHihat();

    // Melody
    const melodyNote = melodyPattern[patternIndex];
    if (melodyNote > 0) playSquareLead(melodyNote);

    // Harmony
    const harmonyNote = harmonyPattern[patternIndex];
    if (harmonyNote > 0) playSinePad(harmonyNote);

    // Bass
    const bassNote = bassPattern[patternIndex];
    if (bassNote > 0) playBass(bassNote);
}

// Music 2: Bear Buddies - cheerful, bouncy ukulele-style with extended sections
function playMusic2Beat(beatIndex) {
    // Extended melody with Verse (A), Catchy Refrain (B), and Bridge (C)
    // Key of G major, upbeat feel - 128 beats total (4 sections of 32)
    const melodyPattern = [
        // === VERSE A (32 beats) - Playful intro ===
        392.00, 0, 493.88, 392.00, 587.33, 0, 493.88, 0,  // G B G D B
        392.00, 0, 440.00, 493.88, 523.25, 0, 0, 0,       // G A B C
        587.33, 0, 523.25, 493.88, 440.00, 0, 392.00, 0,  // D C B A G
        440.00, 493.88, 523.25, 0, 493.88, 0, 0, 0,       // A B C B

        // === CATCHY REFRAIN B (32 beats) - The hook! ===
        // Higher energy, memorable "we're best friends" vibe
        783.99, 0, 783.99, 698.46, 659.25, 0, 587.33, 0,  // G5 G5 F5 E5 D5
        659.25, 0, 698.46, 0, 783.99, 0, 0, 0,            // E5 F5 G5 (ascending)
        783.99, 783.99, 698.46, 0, 659.25, 587.33, 523.25, 0,  // Descending hook
        587.33, 0, 659.25, 0, 587.33, 0, 0, 0,            // D5 E5 D5 (resolve)

        // === VERSE A2 (32 beats) - Variation with more bounce ===
        392.00, 440.00, 493.88, 0, 587.33, 659.25, 587.33, 0,  // G A B D E D
        523.25, 0, 493.88, 0, 440.00, 0, 392.00, 0,       // C B A G
        493.88, 523.25, 587.33, 0, 659.25, 0, 587.33, 523.25,  // B C D E D C
        493.88, 0, 392.00, 0, 0, 0, 0, 0,                 // B G

        // === BRIDGE C (32 beats) - Dreamy, then builds back ===
        523.25, 0, 0, 523.25, 587.33, 0, 0, 587.33,       // Syncopated C D
        659.25, 0, 0, 0, 587.33, 523.25, 493.88, 0,       // E... D C B
        440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 0,  // Ascending run!
        783.99, 0, 659.25, 0, 587.33, 0, 0, 0             // G5 E5 D5 (big finish)
    ];

    // Extended ukulele patterns for each section
    const ukePattern = [
        // === VERSE A - Standard sunny chords ===
        196.00, 293.66, 392.00, 493.88, 196.00, 392.00, 293.66, 493.88,  // G
        261.63, 329.63, 392.00, 523.25, 261.63, 392.00, 329.63, 523.25,  // C
        293.66, 369.99, 440.00, 587.33, 293.66, 440.00, 369.99, 587.33,  // D
        196.00, 293.66, 392.00, 493.88, 196.00, 392.00, 293.66, 493.88,  // G

        // === REFRAIN B - More energetic strumming ===
        261.63, 329.63, 392.00, 261.63, 329.63, 392.00, 329.63, 261.63,  // C (busy)
        293.66, 369.99, 440.00, 293.66, 369.99, 440.00, 369.99, 293.66,  // D (busy)
        196.00, 293.66, 392.00, 196.00, 293.66, 392.00, 293.66, 196.00,  // G (busy)
        293.66, 369.99, 440.00, 587.33, 392.00, 0, 0, 0,                 // D resolve

        // === VERSE A2 - Gentle again ===
        164.81, 246.94, 329.63, 493.88, 164.81, 329.63, 246.94, 493.88,  // Em
        261.63, 329.63, 392.00, 523.25, 261.63, 392.00, 329.63, 523.25,  // C
        293.66, 369.99, 440.00, 587.33, 293.66, 440.00, 369.99, 587.33,  // D
        196.00, 293.66, 392.00, 493.88, 196.00, 392.00, 293.66, 493.88,  // G

        // === BRIDGE C - Sparse then full ===
        220.00, 0, 277.18, 0, 329.63, 0, 277.18, 0,       // Am (sparse)
        261.63, 0, 329.63, 0, 392.00, 0, 329.63, 0,       // C (sparse)
        293.66, 369.99, 440.00, 587.33, 293.66, 440.00, 369.99, 587.33,  // D (full)
        196.00, 293.66, 392.00, 493.88, 587.33, 0, 0, 0   // G (big resolve)
    ];

    // Extended walking bass with section changes
    const bassPattern = [
        // === VERSE A ===
        98.00, 0, 123.47, 0, 98.00, 0, 110.00, 0,     // G
        130.81, 0, 146.83, 0, 130.81, 0, 123.47, 0,   // C
        146.83, 0, 164.81, 0, 146.83, 0, 130.81, 0,   // D
        98.00, 0, 110.00, 0, 123.47, 0, 98.00, 0,     // G

        // === REFRAIN B - More driving ===
        130.81, 130.81, 146.83, 0, 130.81, 130.81, 123.47, 0,  // C (driving)
        146.83, 146.83, 164.81, 0, 146.83, 146.83, 130.81, 0,  // D (driving)
        98.00, 98.00, 110.00, 0, 123.47, 123.47, 98.00, 0,     // G (driving)
        146.83, 0, 130.81, 0, 98.00, 0, 0, 0,                  // D G resolve

        // === VERSE A2 ===
        82.41, 0, 98.00, 0, 110.00, 0, 123.47, 0,     // Em
        130.81, 0, 146.83, 0, 164.81, 0, 146.83, 0,   // C
        146.83, 0, 130.81, 0, 123.47, 0, 110.00, 0,   // D
        98.00, 0, 98.00, 0, 0, 0, 0, 0,               // G

        // === BRIDGE C - Sparse then powerful ===
        110.00, 0, 0, 0, 110.00, 0, 0, 0,             // Am (sparse)
        130.81, 0, 0, 0, 130.81, 0, 0, 0,             // C (sparse)
        146.83, 146.83, 164.81, 146.83, 130.81, 130.81, 123.47, 110.00,  // D walk down
        98.00, 110.00, 123.47, 146.83, 98.00, 0, 0, 0  // G big finish
    ];

    // Light, bouncy percussion - varies by section
    const kickPattern =  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    const slapPattern =  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
    const shakePattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

    // Extra percussion for refrain (beats 32-63)
    const refrainKick = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

    const patternIndex = beatIndex % 128;  // Extended to 128 beats
    const drumIndex = beatIndex % 16;
    const isRefrain = patternIndex >= 32 && patternIndex < 64;

    // Light percussion - more energy during refrain
    if (isRefrain) {
        if (refrainKick[drumIndex]) playKick();
    } else {
        if (kickPattern[drumIndex]) playKick();
    }
    if (slapPattern[drumIndex]) playWoodBlock();
    if (shakePattern[drumIndex]) playShaker();

    // Ukulele strumming
    const ukeNote = ukePattern[patternIndex];
    if (ukeNote > 0) playUkulele(ukeNote);

    // Main melody (whistling/xylophone style)
    const melodyNote = melodyPattern[patternIndex];
    if (melodyNote > 0) playXylophone(melodyNote);

    // Bass
    const bassNote = bassPattern[patternIndex];
    if (bassNote > 0) playBouncyBass(bassNote);
}

// === Instrument functions ===

function playKick() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
}

function playSnare() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(250, audioCtx.currentTime);
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
}

function playHihat() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(8000 + Math.random() * 2000, audioCtx.currentTime);
    osc.type = 'square';
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.03);
}

function playSquareLead(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
}

function playSinePad(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.12);
}

function playBass(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.12);
}

function playWoodBlock() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
}

function playShaker() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(6000 + Math.random() * 3000, audioCtx.currentTime);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.04);
}

function playUkulele(freq) {
    // Ukulele-like plucky sound
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(freq * 2.01, audioCtx.currentTime); // Slight detune for richness
    osc.type = 'triangle';
    osc2.type = 'sine';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
    osc2.stop(audioCtx.currentTime + 0.15);
}

function playXylophone(freq) {
    // Bright, bell-like xylophone tone
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(freq * 3, audioCtx.currentTime); // Overtone
    osc.type = 'sine';
    osc2.type = 'sine';
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
    osc2.stop(audioCtx.currentTime + 0.2);
}

function playBouncyBass(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(musicGain);
    osc.frequency.setValueAtTime(freq * 1.02, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq, audioCtx.currentTime + 0.05);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
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

// Wall types: 0 = empty, 1 = normal wall, 2+ = animal-specific walls
const WALL_NORMAL = 1;
const WALL_FOX = 2;      // Orange - only fox can pass
const WALL_BEAR = 3;     // Brown - only bear can pass
const WALL_PENGUIN = 4;  // Dark blue/black - only penguin can pass
const WALL_WALRUS = 5;   // Tan - only walrus can pass

const COLORED_WALLS_PER_TYPE = 2; // Number of colored walls per animal type to spawn each shift

// Map animal types to their passable wall type
const animalWallTypes = {
    fox: WALL_FOX,
    bear: WALL_BEAR,
    penguin: WALL_PENGUIN,
    walrus: WALL_WALRUS
};

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

// Vents - teleporters in corners
const vents = [
    { row: 2, col: 2, color: '#FF6B6B' },           // Top-left (red)
    { row: 2, col: COLS - 3, color: '#4ECDC4' },    // Top-right (teal)
    { row: ROWS - 3, col: 2, color: '#FFE66D' },    // Bottom-left (yellow)
    { row: ROWS - 3, col: COLS - 3, color: '#95E1D3' } // Bottom-right (mint)
];
let ventCooldown = [0, 0]; // Cooldown for each player to prevent instant re-teleport

function checkVentCollision(player, playerIndex) {
    if (ventCooldown[playerIndex] > 0) return;

    const playerCol = Math.floor((player.x + player.size / 2) / CELL_SIZE);
    const playerRow = Math.floor((player.y + player.size / 2) / CELL_SIZE);

    for (let i = 0; i < vents.length; i++) {
        const vent = vents[i];
        if (vent.row === playerRow && vent.col === playerCol) {
            // Found a vent! Teleport to a random different vent
            const otherVents = vents.filter((v, idx) => idx !== i);
            const targetVent = otherVents[Math.floor(Math.random() * otherVents.length)];

            player.x = targetVent.col * CELL_SIZE + (CELL_SIZE - player.size) / 2;
            player.y = targetVent.row * CELL_SIZE + (CELL_SIZE - player.size) / 2;

            ventCooldown[playerIndex] = 1000; // 1 second cooldown
            playVentSound();
            break;
        }
    }
}

function playVentSound() {
    if (!audioCtx) return;

    // Whoosh teleport sound
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);
    osc.type = 'sine';

    osc2.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
    osc2.type = 'triangle';

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

    osc.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.25);
    osc2.stop(audioCtx.currentTime + 0.25);
}

function drawVents() {
    const time = Date.now();

    for (const vent of vents) {
        const x = vent.col * CELL_SIZE;
        const y = vent.row * CELL_SIZE;
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;

        // Vent base (dark metal)
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

        // Vent grate pattern
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const offset = 6 + i * 6;
            ctx.beginPath();
            ctx.moveTo(x + offset, y + 4);
            ctx.lineTo(x + offset, y + CELL_SIZE - 4);
            ctx.stroke();
        }

        // Glowing effect (pulsing)
        const pulse = 0.5 + Math.sin(time / 200) * 0.3;
        const glowRadius = 15 + Math.sin(time / 150) * 5;

        // Outer glow
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        gradient.addColorStop(0, vent.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Inner spinning effect
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time / 500);

        ctx.strokeStyle = vent.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(8, 8);
            ctx.stroke();
        }
        ctx.restore();

        // Center dot
        ctx.fillStyle = vent.color;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
let mazziEnabled = false; // Mazzi toggle - off by default

function toggleMazzi() {
    mazziEnabled = !mazziEnabled;
    const btn = document.getElementById('toggleMazzi');
    if (btn) {
        btn.classList.toggle('active', mazziEnabled);
    }
    // Create or remove cat based on toggle
    if (mazziEnabled && !cat) {
        cat = new Cat();
    } else if (!mazziEnabled) {
        cat = null;
    }
}

// Animal selection for players
const animalEmojis = {
    walrus: '🦭',
    penguin: '🐧',
    bear: '🐻',
    fox: '🦊'
};

const animalNames = {
    walrus: 'Walrus',
    penguin: 'Penguin',
    bear: 'Bear',
    fox: 'Fox'
};

function getPlayerAnimalName(playerIndex) {
    if (players[playerIndex]) {
        return animalNames[players[playerIndex].animal] || 'Player ' + (playerIndex + 1);
    }
    return playerIndex === 0 ? 'Walrus' : 'Penguin';
}

function toggleAnimalSelect(playerNum) {
    const selectEl = document.getElementById(`p${playerNum}AnimalSelect`);
    const otherSelectEl = document.getElementById(`p${playerNum === 1 ? 2 : 1}AnimalSelect`);

    // Close other player's menu if open
    if (otherSelectEl) {
        otherSelectEl.classList.remove('show');
    }

    // Toggle this player's menu
    if (selectEl) {
        selectEl.classList.toggle('show');
    }
}

function selectAnimal(playerNum, animal) {
    const playerIndex = playerNum - 1;
    if (players[playerIndex]) {
        players[playerIndex].setAnimal(animal);
    }

    // Update the icon in the header
    const iconEl = document.getElementById(`p${playerNum}Icon`);
    if (iconEl) {
        iconEl.textContent = animalEmojis[animal];
    }

    // Update the header text with animal name
    const playerInfo = document.getElementById(`player${playerNum}Info`);
    if (playerInfo) {
        const h3 = playerInfo.querySelector('h3');
        if (h3) {
            const controls = playerNum === 1 ? '(WASD)' : '(Arrows)';
            h3.innerHTML = `<span class="player-icon" id="p${playerNum}Icon" onclick="toggleAnimalSelect(${playerNum})">${animalEmojis[animal]}</span> ${animalNames[animal]} ${controls}`;
        }
    }

    // Update button selected states
    const selectEl = document.getElementById(`p${playerNum}AnimalSelect`);
    if (selectEl) {
        const buttons = selectEl.querySelectorAll('.animal-btn');
        buttons.forEach(btn => {
            const btnAnimal = btn.textContent === '🦭' ? 'walrus' :
                             btn.textContent === '🐧' ? 'penguin' :
                             btn.textContent === '🐻' ? 'bear' : 'fox';
            btn.classList.toggle('selected', btnAnimal === animal);
        });

        // Hide the selection menu
        selectEl.classList.remove('show');
    }
}

// Close animal select when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.player-info')) {
        document.querySelectorAll('.animal-select').forEach(el => el.classList.remove('show'));
    }
});

// Tornado system
let tornado = null;
const TORNADO_SPAWN_INTERVAL = 15000; // Tornado every 15 seconds
let lastTornadoSpawn = 0;

// Earthquake system
let earthquakeActive = false;
let earthquakeShakeTime = 0;
const EARTHQUAKE_CHANCE = 0.15; // 15% chance on each wall shift

// Tsunami system
let tsunamiActive = false;
let tsunamiStartTime = 0;
let tsunamiSafeSpots = []; // Array of {row, col} safe spots
const TSUNAMI_DURATION = 10000; // 10 seconds to reach safety
const TSUNAMI_SAFE_SPOT_COUNT = 3; // Number of safe spots

// Disaster cycle system - every 3rd wall shift is a disaster
let wallShiftCount = 0; // Count wall shifts
let currentDisasterIndex = 0; // 0 = earthquake, 1 = tsunami, 2 = tornado

function triggerNextDisaster() {
    // Don't trigger if another disaster is active
    if (earthquakeActive || tsunamiActive || tornado) return;

    switch (currentDisasterIndex) {
        case 0:
            triggerEarthquake();
            break;
        case 1:
            triggerTsunami();
            break;
        case 2:
            tornado = new Tornado();
            break;
    }

    // Cycle to next disaster
    currentDisasterIndex = (currentDisasterIndex + 1) % 3;
}

function triggerTsunami() {
    tsunamiActive = true;
    tsunamiStartTime = Date.now();
    tsunamiSafeSpots = [];

    // Pick random safe spots (must be open path spaces)
    const openSpaces = [];
    for (let row = 2; row < ROWS - 2; row++) {
        for (let col = 2; col < COLS - 2; col++) {
            if (maze[row][col] === 0) {
                // Avoid spawn areas
                if (!(col < 5 && row < 5) && !(col > COLS - 6 && row > ROWS - 6)) {
                    openSpaces.push({row, col});
                }
            }
        }
    }

    // Shuffle and pick safe spots
    for (let i = openSpaces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [openSpaces[i], openSpaces[j]] = [openSpaces[j], openSpaces[i]];
    }

    tsunamiSafeSpots = openSpaces.slice(0, TSUNAMI_SAFE_SPOT_COUNT);

    playTsunamiWarningSound();
}

function updateTsunami() {
    if (!tsunamiActive) return;

    const elapsed = Date.now() - tsunamiStartTime;

    if (elapsed >= TSUNAMI_DURATION) {
        // Time's up! Check if players are safe
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const playerCol = Math.floor((player.x + player.size / 2) / CELL_SIZE);
            const playerRow = Math.floor((player.y + player.size / 2) / CELL_SIZE);

            let isSafe = false;
            for (const spot of tsunamiSafeSpots) {
                if (spot.row === playerRow && spot.col === playerCol) {
                    isSafe = true;
                    break;
                }
            }

            if (!isSafe) {
                // Player hit by tsunami - lose a point and respawn
                scores[i] = Math.max(0, scores[i] - 1);
                player.teleportToSpawn();
                playSound('tag');
                updateScoreDisplay();
            }
        }

        // End tsunami
        tsunamiActive = false;
        tsunamiSafeSpots = [];
        playTsunamiHitSound();
    }
}

function playTsunamiWarningSound() {
    if (!audioCtx) return;

    // Rising alarm sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 1);
    osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 1.5);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 2);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 2);
}

function playTsunamiHitSound() {
    if (!audioCtx) return;

    // Crash/wave sound
    const bufferSize = audioCtx.sampleRate * 1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.5);
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    filter.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 1);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    source.start();
}

class Tornado {
    constructor() {
        this.height = CELL_SIZE * 5; // 5 cells tall - bigger!
        this.width = CELL_SIZE * 3;  // Wider base
        this.speed = 3;
        this.rotation = 0;
        this.debris = []; // Flying debris particles
        // Create random debris
        for (let i = 0; i < 25; i++) {
            this.debris.push({
                angle: Math.random() * Math.PI * 2,
                dist: Math.random() * this.width * 0.6,
                y: Math.random() * this.height,
                size: 3 + Math.random() * 5,
                speed: 0.05 + Math.random() * 0.1,
                type: Math.floor(Math.random() * 3) // 0=leaf, 1=dirt, 2=twig
            });
        }

        // Start from left or right side, go horizontally through center
        const centerRow = Math.floor(ROWS / 2);
        this.y = centerRow * CELL_SIZE - this.height / 2 + CELL_SIZE / 2;

        // Random direction: left to right or right to left
        if (Math.random() > 0.5) {
            this.x = -this.width;
            this.direction = 1; // Moving right
        } else {
            this.x = CANVAS_WIDTH + this.width;
            this.direction = -1; // Moving left
        }

        playTornadoSound();
    }

    update() {
        // Move horizontally
        this.x += this.speed * this.direction;
        this.rotation += 0.3;

        // Check collision with players
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const playerCenterX = player.x + player.size / 2;
            const playerCenterY = player.y + player.size / 2;

            // Check if player is within tornado bounds
            if (playerCenterX > this.x - this.width / 2 &&
                playerCenterX < this.x + this.width / 2 &&
                playerCenterY > this.y &&
                playerCenterY < this.y + this.height) {
                // Player hit by tornado - lose a point and respawn
                scores[i] = Math.max(0, scores[i] - 1);
                player.teleportToSpawn();
                playSound('tag');
                updateScoreDisplay();
            }
        }

        // Destroy walls in path
        const startRow = Math.floor(this.y / CELL_SIZE);
        const endRow = Math.floor((this.y + this.height) / CELL_SIZE);
        const col = Math.floor(this.x / CELL_SIZE);

        for (let row = startRow; row <= endRow; row++) {
            if (row > 0 && row < ROWS - 1 && col > 0 && col < COLS - 1) {
                if (maze[row][col] >= 1) {
                    maze[row][col] = 0; // Destroy wall (any type)
                }
            }
        }

        // Check if off screen
        if (this.direction === 1 && this.x > CANVAS_WIDTH + this.width) {
            return false; // Remove tornado
        }
        if (this.direction === -1 && this.x < -this.width) {
            return false; // Remove tornado
        }
        return true;
    }

    draw() {
        const cx = this.x;
        const baseY = this.y + this.height; // Bottom of tornado
        const topY = this.y; // Top of tornado

        ctx.save();

        // Draw the main funnel shape - wide at top, narrow at bottom
        const funnelLayers = 20;
        for (let i = 0; i < funnelLayers; i++) {
            const t = i / funnelLayers;
            const layerY = topY + t * this.height;
            // Funnel gets narrower toward the bottom (inverted cone)
            const layerWidth = this.width * (1 - t * 0.7);
            const wobble = Math.sin(this.rotation * 2 + t * 10) * 5;

            // Create gradient from dark gray at edges to lighter in middle
            const gradient = ctx.createRadialGradient(
                cx + wobble, layerY, 0,
                cx + wobble, layerY, layerWidth / 2
            );

            // Darker, stormier colors
            const alpha = 0.6 + t * 0.2;
            gradient.addColorStop(0, `rgba(60, 65, 75, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(80, 85, 95, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(50, 55, 65, ${alpha * 0.4})`);

            ctx.beginPath();
            ctx.ellipse(cx + wobble, layerY, layerWidth / 2, 6 + (1-t) * 4, 0, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Draw swirling wind lines
        ctx.strokeStyle = 'rgba(100, 105, 115, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const startAngle = this.rotation * 3 + i * Math.PI / 4;
            ctx.beginPath();
            for (let t = 0; t <= 1; t += 0.05) {
                const angle = startAngle + t * Math.PI * 2;
                const y = topY + t * this.height;
                const radius = (this.width / 2) * (1 - t * 0.7);
                const x = cx + Math.cos(angle) * radius;
                if (t === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        // Draw spinning debris
        for (const d of this.debris) {
            d.angle += d.speed;
            const t = d.y / this.height;
            const radius = (this.width / 2) * (1 - t * 0.7) * (d.dist / (this.width * 0.6));
            const dx = cx + Math.cos(d.angle) * radius;
            const dy = topY + d.y + Math.sin(this.rotation * 2) * 3;

            ctx.save();
            ctx.translate(dx, dy);
            ctx.rotate(d.angle * 2);

            if (d.type === 0) {
                // Leaf - green/brown
                ctx.fillStyle = `rgba(${80 + Math.random() * 40}, ${100 + Math.random() * 50}, 60, 0.8)`;
                ctx.beginPath();
                ctx.ellipse(0, 0, d.size, d.size / 2, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 1) {
                // Dirt chunk - brown
                ctx.fillStyle = `rgba(${100 + Math.random() * 30}, ${70 + Math.random() * 20}, 50, 0.9)`;
                ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
            } else {
                // Twig - dark brown line
                ctx.strokeStyle = 'rgba(80, 50, 30, 0.9)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-d.size, 0);
                ctx.lineTo(d.size, 0);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Draw dust cloud at base
        for (let i = 0; i < 5; i++) {
            const angle = this.rotation + i * Math.PI / 2.5;
            const dist = 15 + Math.sin(this.rotation * 2 + i) * 10;
            const dustX = cx + Math.cos(angle) * dist;
            const dustY = baseY + Math.sin(angle) * 5;
            const dustSize = 10 + Math.sin(this.rotation + i) * 5;

            ctx.beginPath();
            ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 119, 101, 0.4)';
            ctx.fill();
        }

        ctx.restore();

        // Warning label with bigger text
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🌪️ TORNADO! 🌪️', cx, this.y - 15);
        ctx.textAlign = 'left';
    }
}

function playTornadoSound() {
    if (!audioCtx) return;

    // Whooshing wind sound
    const duration = 2;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    // Create wind noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(i / bufferSize * Math.PI);
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    // Low pass filter for wind effect
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + duration);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    source.start();
}

function playEarthquakeSound() {
    if (!audioCtx) return;

    // Deep rumbling sound
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    // Low frequency rumble
    osc.frequency.setValueAtTime(40, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(25, audioCtx.currentTime + 1.5);
    osc.type = 'sawtooth';

    osc2.frequency.setValueAtTime(60, audioCtx.currentTime);
    osc2.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 1.5);
    osc2.type = 'triangle';

    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

    osc.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 1.5);
    osc2.stop(audioCtx.currentTime + 1.5);
}

function triggerEarthquake() {
    earthquakeActive = true;
    earthquakeShakeTime = Date.now();
    playEarthquakeSound();

    // Destroy ALL walls (except borders)
    for (let row = 1; row < ROWS - 1; row++) {
        for (let col = 1; col < COLS - 1; col++) {
            maze[row][col] = 0;
        }
    }

    // Keep spawn area corners clear
    // Player 1 spawn (top-left)
    for (let r = 1; r < 4; r++) {
        for (let c = 1; c < 4; c++) {
            maze[r][c] = 0;
        }
    }
    // Player 2 spawn (bottom-right)
    for (let r = ROWS - 4; r < ROWS - 1; r++) {
        for (let c = COLS - 4; c < COLS - 1; c++) {
            maze[r][c] = 0;
        }
    }
}

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

        // Simple direction toward player (no BFS - too slow)
        const dx = (closestPlayer.x + closestPlayer.size / 2) - (this.x + this.size / 2);
        const dy = (closestPlayer.y + closestPlayer.size / 2) - (this.y + this.size / 2);

        // Try to move toward player, prefer the axis with greater distance
        if (Math.abs(dx) > Math.abs(dy)) {
            const newDir = { dx: dx > 0 ? 1 : -1, dy: 0 };
            // Check if we can move that way
            if (this.canMoveTo(this.x + newDir.dx * this.speed * 2, this.y)) {
                this.direction = newDir;
            } else {
                // Try vertical instead
                this.direction = { dx: 0, dy: dy > 0 ? 1 : -1 };
            }
        } else {
            const newDir = { dx: 0, dy: dy > 0 ? 1 : -1 };
            if (this.canMoveTo(this.x, this.y + newDir.dy * this.speed * 2)) {
                this.direction = newDir;
            } else {
                // Try horizontal instead
                this.direction = { dx: dx > 0 ? 1 : -1, dy: 0 };
            }
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
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS || maze[row][col] >= 1) {
                return false; // Cat is blocked by all wall types
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

// Animal stats - each animal has unique abilities
const animalStats = {
    penguin: { size: CELL_SIZE - 16, speed: 4 },  // Smaller
    bear: { size: CELL_SIZE - 2, speed: 3.5 },     // Bigger but slightly slower
    fox: { size: CELL_SIZE - 10, speed: 5 },       // Faster
    walrus: { size: CELL_SIZE - 10, speed: 4 }     // Normal with tusks
};

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
        this.baseSize = CELL_SIZE - 10;
        this.size = this.baseSize;
        this.baseSpeed = 4;
        this.speed = this.baseSpeed;
        this.invisible = false;
        this.invisibleTimer = 0;
        this.wallPasses = 0;
        this.wallPassTimer = 0; // Timer for monkey powerup
        this.frozen = false;
        this.frozenTimer = 0;
        this.animal = name === 'Player 1' ? 'walrus' : 'penguin';
        this.updateAnimalStats();
    }

    updateAnimalStats() {
        const stats = animalStats[this.animal];
        if (stats) {
            this.size = stats.size;
            this.baseSpeed = stats.speed;
            this.speed = stats.speed;
        }
    }

    setAnimal(animal) {
        this.animal = animal;
        this.updateAnimalStats();
    }

    // Get walrus tusk hitboxes (two tusks pointing down from face)
    getTuskHitboxes() {
        if (this.animal !== 'walrus') return [];

        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        // Tusks extend below the walrus face
        const tuskLength = 12;
        const tuskWidth = 4;
        const tuskSpacing = 8;

        return [
            // Left tusk
            {
                x: cx - tuskSpacing - tuskWidth / 2,
                y: cy + 6,
                width: tuskWidth,
                height: tuskLength
            },
            // Right tusk
            {
                x: cx + tuskSpacing - tuskWidth / 2,
                y: cy + 6,
                width: tuskWidth,
                height: tuskLength
            }
        ];
    }

    // Check if a point collides with this player's tusks
    tuskCollidesWithPlayer(otherPlayer) {
        if (this.animal !== 'walrus') return false;

        const tusks = this.getTuskHitboxes();
        for (const tusk of tusks) {
            // Check if tusk rectangle overlaps with other player
            if (tusk.x < otherPlayer.x + otherPlayer.size &&
                tusk.x + tusk.width > otherPlayer.x &&
                tusk.y < otherPlayer.y + otherPlayer.size &&
                tusk.y + tusk.height > otherPlayer.y) {
                return true;
            }
        }
        return false;
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

        // IT player is faster than the runner (gets +1 speed boost)
        const playerIndex = this.name === 'Player 1' ? 0 : 1;
        const currentSpeed = itPlayerIndex === playerIndex ? this.baseSpeed + 1 : this.baseSpeed;

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
        // Find nearest free space with simple expanding search
        const startCol = Math.floor((this.x + this.size / 2) / CELL_SIZE);
        const startRow = Math.floor((this.y + this.size / 2) / CELL_SIZE);

        // Search in expanding radius
        for (let radius = 0; radius <= 5; radius++) {
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    const row = startRow + dr;
                    const col = startCol + dc;
                    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
                        const testX = col * CELL_SIZE + (CELL_SIZE - this.size) / 2;
                        const testY = row * CELL_SIZE + (CELL_SIZE - this.size) / 2;
                        if (this.canMoveTo(testX, testY)) {
                            this.x = testX;
                            this.y = testY;
                            playSound('teleport');
                            return;
                        }
                    }
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
                const wallType = maze[row][col];
                if (wallType >= 1) {
                    // Check if this is an animal-specific wall the player can pass through
                    const myWallType = animalWallTypes[this.animal];
                    if (wallType !== myWallType) {
                        return true; // Can't pass through this wall
                    }
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
                const wallType = maze[row][col];
                if (wallType >= 1) {
                    // Check if this is an animal-specific wall the player can pass through
                    const myWallType = animalWallTypes[this.animal];
                    if (wallType !== myWallType) {
                        return false; // Can't pass through this wall
                    }
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
        } else if (this.animal === 'penguin') {
            this.drawPenguin();
        } else if (this.animal === 'bear') {
            this.drawBear();
        } else if (this.animal === 'fox') {
            this.drawFox();
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

        // Tusks - bigger and more prominent (these can tag!)
        const tuskY = cy + 6;
        const tuskLength = 12;

        // Left tusk with glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#FFFFF0';
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 8, tuskY);
        ctx.lineTo(cx - 10, tuskY + tuskLength);
        ctx.lineTo(cx - 6, tuskY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right tusk with glow effect
        ctx.beginPath();
        ctx.moveTo(cx + 8, tuskY);
        ctx.lineTo(cx + 10, tuskY + tuskLength);
        ctx.lineTo(cx + 6, tuskY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

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

    drawBear() {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        // Body (brown)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, this.size / 2, this.size / 2.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lighter belly
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, this.size / 3, this.size / 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(cx, this.y + 10, 11, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(cx - 9, this.y + 4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 9, this.y + 4, 5, 0, Math.PI * 2);
        ctx.fill();

        // Inner ears
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.arc(cx - 9, this.y + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 9, this.y + 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Muzzle
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 14, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#2F1810';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 12, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 5, this.y + 9, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5, this.y + 9, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 4, this.y + 8, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 6, this.y + 8, 1, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#2F1810';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, this.y + 15, 3, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Paws
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(cx - 8, this.y + this.size - 4, 5, 4, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 8, this.y + this.size - 4, 5, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFox() {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        // Body (orange)
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, this.size / 2.2, this.size / 2.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // White belly/chest
        ctx.fillStyle = '#FFFEF0';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6, this.size / 3.5, this.size / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail (fluffy, behind body)
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.ellipse(cx + 12, cy + 5, 8, 5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        // White tail tip
        ctx.fillStyle = '#FFFEF0';
        ctx.beginPath();
        ctx.ellipse(cx + 17, cy + 3, 4, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();

        // Ears (pointy triangles)
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.moveTo(cx - 10, this.y + 6);
        ctx.lineTo(cx - 6, this.y - 3);
        ctx.lineTo(cx - 2, this.y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 10, this.y + 6);
        ctx.lineTo(cx + 6, this.y - 3);
        ctx.lineTo(cx + 2, this.y + 8);
        ctx.closePath();
        ctx.fill();

        // Inner ears (black)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(cx - 9, this.y + 5);
        ctx.lineTo(cx - 6, this.y);
        ctx.lineTo(cx - 3, this.y + 6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 9, this.y + 5);
        ctx.lineTo(cx + 6, this.y);
        ctx.lineTo(cx + 3, this.y + 6);
        ctx.closePath();
        ctx.fill();

        // White face markings
        ctx.fillStyle = '#FFFEF0';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 14, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose (black)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 12, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (almond shaped, sly look)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(cx - 5, this.y + 9, 2.5, 2, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 5, this.y + 9, 2.5, 2, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 4, this.y + 8, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 6, this.y + 8, 1, 0, Math.PI * 2);
        ctx.fill();

        // Paws (black)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(cx - 6, this.y + this.size - 3, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 6, this.y + this.size - 3, 4, 3, 0, 0, Math.PI * 2);
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

    // Add colored walls at game start
    spawnColoredWalls(3); // Spawn 3 of each type at start
}

// Spawn colored walls throughout the maze
function spawnColoredWalls(countPerType) {
    const coloredWallTypes = [WALL_FOX, WALL_BEAR, WALL_PENGUIN, WALL_WALRUS];
    for (const wallType of coloredWallTypes) {
        let spawned = 0;
        for (let attempt = 0; attempt < 50 && spawned < countPerType; attempt++) {
            const row = Math.floor(Math.random() * (ROWS - 6)) + 3;
            const col = Math.floor(Math.random() * (COLS - 6)) + 3;

            // Don't modify spawn areas
            if (col < 5 && row < 5) continue;
            if (col > COLS - 6 && row > ROWS - 6) continue;

            // Only place on existing normal walls
            if (maze[row][col] === WALL_NORMAL) {
                maze[row][col] = wallType;
                spawned++;
            }
        }
    }
}

// Simple path carving to ensure connectivity - always carve a path
function ensureConnectivity() {
    const startRow = 2, startCol = 2;
    const endRow = ROWS - 3, endCol = COLS - 3;

    // Always carve a simple path to guarantee connectivity (faster than BFS check)
    let row = startRow, col = startCol;
    while (row !== endRow || col !== endCol) {
        maze[row][col] = 0;

        // Move toward end
        if (row < endRow) row++;
        else if (row > endRow) row--;

        if (col < endCol) col++;
        else if (col > endCol) col--;
    }
    maze[endRow][endCol] = 0;
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

    // Check for earthquake - if one happened, regenerate the maze
    if (earthquakeActive) {
        earthquakeActive = false;
        // Regenerate a full maze after earthquake
        generateMaze();
        playSound('wallShift');
        return; // Skip normal wall shift
    }

    // Simple wall shift - just toggle some random walls
    for (let i = 0; i < 15; i++) {
        const row = Math.floor(Math.random() * (ROWS - 6)) + 3;
        const col = Math.floor(Math.random() * (COLS - 6)) + 3;

        // Don't modify spawn areas
        if (col < 5 && row < 5) continue;
        if (col > COLS - 6 && row > ROWS - 6) continue;

        // Toggle: any wall becomes path, path becomes normal wall
        maze[row][col] = maze[row][col] >= 1 ? 0 : 1;
    }

    // Spawn some colored walls for each animal type
    spawnColoredWalls(COLORED_WALLS_PER_TYPE);

    // Always ensure a path exists
    ensureConnectivity();

    // Make sure players aren't stuck in walls
    for (const player of players) {
        if (!player.canMoveTo(player.x, player.y)) {
            let found = false;
            // Search in expanding radius
            for (let radius = 1; radius <= 10 && !found; radius++) {
                for (let dx = -radius; dx <= radius && !found; dx++) {
                    for (let dy = -radius; dy <= radius && !found; dy++) {
                        const newX = player.x + dx * CELL_SIZE;
                        const newY = player.y + dy * CELL_SIZE;
                        if (player.canMoveTo(newX, newY)) {
                            player.x = newX;
                            player.y = newY;
                            found = true;
                        }
                    }
                }
            }
            // If still stuck, teleport to spawn
            if (!found) {
                player.teleportToSpawn();
            }
        }
    }

    // Also make sure cat isn't stuck in walls
    if (cat) {
        const catCol = Math.floor((cat.x + cat.size / 2) / CELL_SIZE);
        const catRow = Math.floor((cat.y + cat.size / 2) / CELL_SIZE);
        if (catRow >= 0 && catRow < ROWS && catCol >= 0 && catCol < COLS && maze[catRow][catCol] >= 1) {
            cat.respawn();
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
            const wallType = maze[row][col];

            if (wallType >= 1) {
                // Get colors based on wall type
                let baseColor, innerColor, detailColor, centerColor, emoji;

                switch (wallType) {
                    case WALL_FOX: // Orange for fox
                        baseColor = '#D35400';
                        innerColor = '#E67E22';
                        detailColor = '#F39C12';
                        centerColor = '#A04000';
                        emoji = '🦊';
                        break;
                    case WALL_BEAR: // Brown for bear
                        baseColor = '#5D4037';
                        innerColor = '#795548';
                        detailColor = '#8D6E63';
                        centerColor = '#3E2723';
                        emoji = '🐻';
                        break;
                    case WALL_PENGUIN: // Dark blue/black for penguin
                        baseColor = '#1a1a2e';
                        innerColor = '#2d2d44';
                        detailColor = '#3d3d5c';
                        centerColor = '#0d0d1a';
                        emoji = '🐧';
                        break;
                    case WALL_WALRUS: // Tan for walrus
                        baseColor = '#8B7355';
                        innerColor = '#A89078';
                        detailColor = '#C4A484';
                        centerColor = '#6B5344';
                        emoji = '🦭';
                        break;
                    default: // Normal green jungle wall
                        baseColor = '#2d5a27';
                        innerColor = '#1a4d1a';
                        detailColor = '#228B22';
                        centerColor = '#0d3d0d';
                        emoji = null;
                }

                // Draw wall base
                ctx.fillStyle = baseColor;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

                // Draw inner area
                ctx.fillStyle = innerColor;
                ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

                // Add corner details
                ctx.fillStyle = detailColor;
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
                ctx.fillStyle = centerColor;
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 6, 0, Math.PI * 2);
                ctx.fill();

                // Draw animal emoji for colored walls
                if (emoji) {
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(emoji, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'alphabetic';
                }
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

// Simple check - just verify the cell is an open path
function isReachableFromSpawn(targetRow, targetCol) {
    // Since we ensure connectivity, any open path should be reachable
    return maze[targetRow][targetCol] === 0;
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
        maze[row][col] >= 1 || // Any wall type
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

    let tagHappened = false;
    let taggerIndex = itPlayerIndex;
    let taggedIndex = 1 - itPlayerIndex;

    // Normal body collision tag (IT player tags the other)
    if (distance < (p1.size + p2.size) / 2.5) {
        tagHappened = true;
    }

    // Walrus tusk collision - tusks can tag regardless of who is IT!
    // If walrus is IT: tusks extend the tag range
    // If walrus is NOT IT: touching tusks tags the other player (walrus "pokes" them)
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const otherIdx = 1 - i;
        const other = players[otherIdx];

        // Skip if either is invisible
        if (player.invisible || other.invisible) continue;

        if (player.animal === 'walrus' && player.tuskCollidesWithPlayer(other)) {
            tagHappened = true;
            // Walrus is the tagger when tusks hit
            taggerIndex = i;
            taggedIndex = otherIdx;
            break;
        }
    }

    if (tagHappened) {
        // Tag happened! The tagged player loses their survival streak
        survivedSinceLastTag[taggedIndex] = false;

        // Play tag sound
        playSound('tag');

        // The tagger teleports back to spawn
        players[taggerIndex].teleportToSpawn();

        // The tagged person becomes "it"
        itPlayerIndex = taggedIndex;

        // Set cooldown to prevent instant re-tagging
        tagCooldown = 1000; // 1 second cooldown

        // Update UI
        updateScoreDisplay();
        updatePowerupStatus();

        // Show tag notification
        showTagNotification(getPlayerAnimalName(itPlayerIndex));
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
        endGame(getPlayerAnimalName(0));
    } else if (scores[1] >= WINNING_SCORE) {
        endGame(getPlayerAnimalName(1));
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
    cat = mazziEnabled ? new Cat() : null; // Create the cat enemy if enabled
    tornado = null;
    tsunamiActive = false;
    tsunamiSafeSpots = [];
    earthquakeActive = false;
    wallShiftCount = 0;
    currentDisasterIndex = 0;
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
    try {
    if (!gameOver) {
        // Update
        for (const player of players) {
            if (player) player.update();
        }

        for (const powerup of powerups) {
            if (powerup) powerup.update();
        }

        // Update cat enemy
        if (cat) {
            cat.update();
        }

        // Update tornado
        if (tornado) {
            if (!tornado.update()) {
                tornado = null; // Remove tornado when done
            }
        }

        // Check powerup collisions
        for (let i = powerups.length - 1; i >= 0; i--) {
            if (!powerups[i]) continue;
            for (const player of players) {
                if (powerups[i] && powerups[i].collidesWith(player)) {
                    applyPowerup(player, powerups[i].type);
                    powerups.splice(i, 1);
                    break;
                }
            }
        }

        // Check tag collision
        checkTagCollision();

        // Check vent collisions
        for (let i = 0; i < players.length; i++) {
            checkVentCollision(players[i], i);
        }

        // Update vent cooldowns
        for (let i = 0; i < ventCooldown.length; i++) {
            if (ventCooldown[i] > 0) ventCooldown[i] -= 16;
        }

        // Wall shift timer - every 3rd shift is a disaster
        if (Date.now() - wallShiftTimer > WALL_SHIFT_INTERVAL) {
            wallShiftCount++;
            if (wallShiftCount >= 3) {
                // Every 3rd shift is a disaster instead
                triggerNextDisaster();
                wallShiftCount = 0;
            } else {
                // Regular wall shift
                shiftWalls();
            }
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

        // Update tsunami
        updateTsunami();

        // Update music tempo based on player distance (only for Jungle Chase track)
        if (currentMusicTrack === 1) {
            const p1 = players[0];
            const p2 = players[1];
            const dx = (p1.x + p1.size / 2) - (p2.x + p2.size / 2);
            const dy = (p1.y + p1.size / 2) - (p2.y + p2.size / 2);
            const playerDistance = Math.sqrt(dx * dx + dy * dy);
            updateMusicTempo(playerDistance);
        } else {
            // Bear Buddies plays at constant tempo
            currentMusicTempo = 220;
        }
    }

    // Draw
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Earthquake screen shake effect
    const earthquakeElapsed = Date.now() - earthquakeShakeTime;
    if (earthquakeActive && earthquakeElapsed < 1500) {
        const shakeIntensity = 8 * (1 - earthquakeElapsed / 1500);
        const shakeX = (Math.random() - 0.5) * shakeIntensity * 2;
        const shakeY = (Math.random() - 0.5) * shakeIntensity * 2;
        ctx.save();
        ctx.translate(shakeX, shakeY);
    }

    drawMaze();

    // Draw vents
    drawVents();

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

    // Draw tornado
    if (tornado) {
        tornado.draw();
    }

    // Draw explosions on top
    drawExplosions();

    // End earthquake shake transform
    if (earthquakeActive && earthquakeElapsed < 1500) {
        ctx.restore();
    }

    // Draw earthquake warning
    if (earthquakeActive) {
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🌋 EARTHQUAKE! 🌋', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.font = 'bold 18px Arial';
        ctx.fillText('All walls destroyed!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
        ctx.textAlign = 'left';
    }

    // Draw tsunami warning and safe zones
    if (tsunamiActive) {
        const elapsed = Date.now() - tsunamiStartTime;
        const timeLeft = Math.ceil((TSUNAMI_DURATION - elapsed) / 1000);
        const progress = elapsed / TSUNAMI_DURATION; // 0 to 1

        // Animated wave coming from left side
        const waveX = -CANVAS_WIDTH + (progress * CANVAS_WIDTH * 2);

        // Draw the approaching wave
        ctx.save();

        // Wave gradient - dark blue water
        const waveGradient = ctx.createLinearGradient(waveX - 100, 0, waveX + 50, 0);
        waveGradient.addColorStop(0, 'rgba(0, 50, 150, 0.9)');
        waveGradient.addColorStop(0.5, 'rgba(0, 100, 200, 0.8)');
        waveGradient.addColorStop(1, 'rgba(100, 200, 255, 0.6)');

        // Draw main wave body
        ctx.fillStyle = waveGradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(waveX - 50, 0);

        // Wavy top edge
        for (let y = 0; y < CANVAS_HEIGHT; y += 20) {
            const waveOffset = Math.sin(y / 30 + Date.now() / 200) * 30;
            ctx.lineTo(waveX + waveOffset, y);
        }
        ctx.lineTo(waveX, CANVAS_HEIGHT);
        ctx.lineTo(0, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();

        // Draw foam/white caps on wave edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        for (let y = 0; y < CANVAS_HEIGHT; y += 20) {
            const waveOffset = Math.sin(y / 30 + Date.now() / 200) * 30;
            if (y === 0) {
                ctx.moveTo(waveX + waveOffset, y);
            } else {
                ctx.lineTo(waveX + waveOffset, y);
            }
        }
        ctx.stroke();

        // Draw small bubbles/spray
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 20; i++) {
            const bubbleY = (Date.now() / 10 + i * 50) % CANVAS_HEIGHT;
            const bubbleX = waveX + Math.sin(bubbleY / 20 + i) * 40 + 20;
            const size = 3 + Math.sin(Date.now() / 100 + i) * 2;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Highlight safe zones with pulsing green (on top of wave)
        for (const spot of tsunamiSafeSpots) {
            const pulse = 0.6 + Math.sin(Date.now() / 100) * 0.4;
            ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`;
            ctx.fillRect(spot.col * CELL_SIZE, spot.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            // Draw safe icon
            ctx.fillStyle = '#000';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⛰️', spot.col * CELL_SIZE + CELL_SIZE / 2, spot.row * CELL_SIZE + CELL_SIZE / 2 + 6);
        }

        // Big countdown timer
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(CANVAS_WIDTH / 2 - 110, 35, 220, 115);
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(CANVAS_WIDTH / 2 - 110, 35, 220, 115);

        ctx.fillStyle = timeLeft <= 3 ? '#FF0000' : '#FFFFFF';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeLeft.toString(), CANVAS_WIDTH / 2, 110);

        ctx.fillStyle = '#00BFFF';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('🌊 TSUNAMI INCOMING! 🌊', CANVAS_WIDTH / 2, 135);

        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#00FF00';
        ctx.fillText('Get to HIGH GROUND! ⛰️', CANVAS_WIDTH / 2, 150);

        ctx.textAlign = 'left';
    }

    // Draw wall shift warning
    const timeToShift = WALL_SHIFT_INTERVAL - (Date.now() - wallShiftTimer);
    if (timeToShift < 2000 && !earthquakeActive && !tsunamiActive) {
        ctx.fillStyle = `rgba(255, 0, 0, ${(2000 - timeToShift) / 4000})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ WALLS SHIFTING! ⚠️', CANVAS_WIDTH / 2, 30);
        ctx.textAlign = 'left';
    }

    requestAnimationFrame(gameLoop);
    } catch (e) {
        console.error('Game loop error:', e);
        requestAnimationFrame(gameLoop); // Keep running even if error
    }
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
