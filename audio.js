// ============================================================
// Block Blaster - Web Audio API Sound System
// ============================================================
var AudioManager = (function () {
    'use strict';

    var ctx = null;
    var sfxEnabled = true;
    var musicEnabled = true;
    var musicGain = null;
    var musicPlaying = false;
    var musicInterval = null;

    function getCtx() {
        if (!ctx) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { return null; }
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function playTone(freq, type, duration, startTime, gainVal, rampTo) {
        var c = getCtx(); if (!c) return;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, startTime || c.currentTime);
        if (rampTo) osc.frequency.linearRampToValueAtTime(rampTo, (startTime || c.currentTime) + duration);
        gain.gain.setValueAtTime(gainVal || 0.15, startTime || c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, (startTime || c.currentTime) + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(startTime || c.currentTime);
        osc.stop((startTime || c.currentTime) + duration);
    }

    function playNoise(duration, startTime, gainVal) {
        var c = getCtx(); if (!c) return;
        var bufferSize = c.sampleRate * duration;
        var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        var src = c.createBufferSource();
        src.buffer = buffer;
        var gain = c.createGain();
        gain.gain.setValueAtTime(gainVal || 0.08, startTime || c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, (startTime || c.currentTime) + duration);
        src.connect(gain); gain.connect(c.destination);
        src.start(startTime || c.currentTime);
    }

    var sfx = {
        click: function () {
            if (!sfxEnabled) return;
            playTone(1200, 'square', 0.05, null, 0.06);
        },
        pickup: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            playTone(600, 'sine', 0.08, c.currentTime, 0.12, 900);
        },
        place: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            playTone(180, 'sine', 0.12, c.currentTime, 0.15);
            playNoise(0.06, c.currentTime, 0.1);
        },
        clear: function (lineCount) {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            // Ascending pentatonic arpeggio
            var notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
            var count = Math.min(lineCount || 1, 4);
            for (var i = 0; i < count + 1; i++) {
                playTone(notes[Math.min(i, notes.length - 1)], 'sine', 0.25, c.currentTime + i * 0.08, 0.12);
                playTone(notes[Math.min(i, notes.length - 1)] * 1.5, 'triangle', 0.2, c.currentTime + i * 0.08, 0.05);
            }
        },
        combo: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            var notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6
            for (var i = 0; i < 5; i++) {
                playTone(notes[i], 'square', 0.15, c.currentTime + i * 0.05, 0.08);
            }
        },
        gameOver: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            playTone(440, 'sawtooth', 0.3, c.currentTime, 0.1, 220);
            playTone(330, 'sawtooth', 0.4, c.currentTime + 0.2, 0.08, 165);
            playTone(220, 'sawtooth', 0.5, c.currentTime + 0.5, 0.06, 110);
        },
        levelComplete: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            var notes = [523, 659, 784, 1047, 784, 1047, 1319];
            for (var i = 0; i < notes.length; i++) {
                playTone(notes[i], 'square', 0.18, c.currentTime + i * 0.1, 0.1);
                playTone(notes[i] * 0.5, 'triangle', 0.18, c.currentTime + i * 0.1, 0.06);
            }
        },
        star: function (delay) {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            playTone(1200, 'sine', 0.3, c.currentTime + (delay || 0), 0.08, 1800);
            playTone(1800, 'triangle', 0.2, c.currentTime + (delay || 0) + 0.05, 0.05);
        }
    };

    // === Background Music - Simple chiptune loop ===
    var melody = [
        // [note freq, duration in 16ths]
        [523, 2], [659, 2], [784, 2], [659, 2], // C E G E
        [880, 2], [784, 2], [659, 2], [523, 2], // A G E C
        [587, 2], [659, 2], [784, 2], [880, 2], // D E G A
        [784, 2], [659, 2], [587, 2], [523, 2], // G E D C
        [523, 2], [784, 2], [880, 2], [784, 2], // C G A G
        [659, 2], [523, 2], [587, 2], [659, 2], // E C D E
        [784, 2], [880, 2], [1047, 4],            // G A C(high)
        [880, 2], [784, 2],                       // A G
    ];
    var bass = [
        [262, 8], [220, 8], // C3 A2
        [294, 8], [262, 8], // D3 C3
        [262, 8], [220, 8], // C3 A2
        [294, 4], [262, 4], [220, 4], [196, 4], // D3 C3 A2 G2
    ];

    function startMusic() {
        if (musicPlaying || !musicEnabled) return;
        var c = getCtx(); if (!c) return;
        musicPlaying = true;

        if (!musicGain) {
            musicGain = c.createGain();
            musicGain.connect(c.destination);
        }
        musicGain.gain.setValueAtTime(0.04, c.currentTime);

        scheduleLoop();
    }

    function scheduleLoop() {
        if (!musicPlaying || !musicEnabled) return;
        var c = getCtx(); if (!c) return;
        var bpm = 140;
        var sixteenth = 60 / bpm / 4;
        var t = c.currentTime + 0.05;
        var totalDuration = 0;

        // Melody
        var mt = t;
        for (var i = 0; i < melody.length; i++) {
            var dur = melody[i][1] * sixteenth;
            var osc = c.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(melody[i][0], mt);
            var g = c.createGain();
            g.gain.setValueAtTime(0.04, mt);
            g.gain.exponentialRampToValueAtTime(0.001, mt + dur * 0.9);
            osc.connect(g); g.connect(musicGain);
            osc.start(mt); osc.stop(mt + dur);
            mt += dur;
        }
        totalDuration = mt - t;

        // Bass
        var bt = t;
        for (var j = 0; j < bass.length; j++) {
            var bdur = bass[j][1] * sixteenth;
            var bosc = c.createOscillator();
            bosc.type = 'triangle';
            bosc.frequency.setValueAtTime(bass[j][0], bt);
            var bg = c.createGain();
            bg.gain.setValueAtTime(0.05, bt);
            bg.gain.exponentialRampToValueAtTime(0.001, bt + bdur * 0.8);
            bosc.connect(bg); bg.connect(musicGain);
            bosc.start(bt); bosc.stop(bt + bdur);
            bt += bdur;
        }

        // Schedule next loop
        musicInterval = setTimeout(function () {
            if (musicPlaying && musicEnabled) scheduleLoop();
        }, totalDuration * 1000 - 100);
    }

    function stopMusic() {
        musicPlaying = false;
        if (musicInterval) { clearTimeout(musicInterval); musicInterval = null; }
    }

    return {
        sfx: sfx,
        startMusic: startMusic,
        stopMusic: stopMusic,
        setSfxEnabled: function (v) { sfxEnabled = v; },
        setMusicEnabled: function (v) {
            musicEnabled = v;
            if (!v) stopMusic(); else startMusic();
        },
        getSfxEnabled: function () { return sfxEnabled; },
        getMusicEnabled: function () { return musicEnabled; },
        ensureContext: function () { getCtx(); }
    };
})();
