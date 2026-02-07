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
    var musicTimeout = null;

    function getCtx() {
        if (!ctx) {
            try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function tone(freq, type, dur, start, vol, rampTo) {
        var c = getCtx(); if (!c) return;
        var t = start || c.currentTime;
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, t);
        if (rampTo) o.frequency.linearRampToValueAtTime(rampTo, t + dur);
        g.gain.setValueAtTime(vol || 0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + dur);
    }

    function noise(dur, start, vol) {
        var c = getCtx(); if (!c) return;
        var t = start || c.currentTime;
        var sz = Math.max(1, Math.floor(c.sampleRate * dur));
        var buf = c.createBuffer(1, sz, c.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
        var s = c.createBufferSource(); s.buffer = buf;
        var g = c.createGain();
        g.gain.setValueAtTime(vol || 0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        s.connect(g); g.connect(c.destination);
        s.start(t);
    }

    var sfx = {
        click: function () {
            if (!sfxEnabled) return;
            tone(1200, 'square', 0.05, null, 0.06);
        },
        pickup: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            tone(600, 'sine', 0.08, c.currentTime, 0.12, 900);
        },
        place: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            tone(180, 'sine', 0.12, c.currentTime, 0.15);
            noise(0.06, c.currentTime, 0.1);
        },
        clear: function (n) {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            var notes = [523, 659, 784, 1047];
            for (var i = 0; i < Math.min((n || 1) + 1, 5); i++) {
                tone(notes[Math.min(i, 3)], 'sine', 0.25, c.currentTime + i * 0.08, 0.12);
                tone(notes[Math.min(i, 3)] * 1.5, 'triangle', 0.2, c.currentTime + i * 0.08, 0.05);
            }
        },
        combo: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            var n = [523, 659, 784, 1047, 1319];
            for (var i = 0; i < 5; i++) tone(n[i], 'square', 0.15, c.currentTime + i * 0.05, 0.08);
        },
        collect: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            tone(880, 'sine', 0.15, c.currentTime, 0.1, 1320);
            tone(1320, 'triangle', 0.1, c.currentTime + 0.08, 0.06);
        },
        gameOver: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            tone(440, 'sawtooth', 0.3, c.currentTime, 0.1, 220);
            tone(330, 'sawtooth', 0.4, c.currentTime + 0.2, 0.08, 165);
            tone(220, 'sawtooth', 0.5, c.currentTime + 0.5, 0.06, 110);
        },
        levelComplete: function () {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            var n = [523, 659, 784, 1047, 784, 1047, 1319];
            for (var i = 0; i < n.length; i++) {
                tone(n[i], 'square', 0.18, c.currentTime + i * 0.1, 0.1);
                tone(n[i] * 0.5, 'triangle', 0.18, c.currentTime + i * 0.1, 0.06);
            }
        },
        star: function (delay) {
            if (!sfxEnabled) return;
            var c = getCtx(); if (!c) return;
            tone(1200, 'sine', 0.3, c.currentTime + (delay || 0), 0.08, 1800);
        }
    };

    // === Background Music ===
    var melody = [
        [523,2],[659,2],[784,2],[659,2],[880,2],[784,2],[659,2],[523,2],
        [587,2],[659,2],[784,2],[880,2],[784,2],[659,2],[587,2],[523,2],
        [523,2],[784,2],[880,2],[784,2],[659,2],[523,2],[587,2],[659,2],
        [784,2],[880,2],[1047,4],[880,2],[784,2]
    ];
    var bass = [
        [262,8],[220,8],[294,8],[262,8],[262,8],[220,8],[294,4],[262,4],[220,4],[196,4]
    ];

    function startMusic() {
        if (musicPlaying || !musicEnabled) return;
        var c = getCtx(); if (!c) return;
        musicPlaying = true;
        if (!musicGain) { musicGain = c.createGain(); musicGain.connect(c.destination); }
        musicGain.gain.setValueAtTime(0.04, c.currentTime);
        scheduleLoop();
    }

    function scheduleLoop() {
        if (!musicPlaying || !musicEnabled) return;
        var c = getCtx(); if (!c) return;
        var bpm = 140, six = 60 / bpm / 4, t = c.currentTime + 0.05, dur = 0;
        var mt = t;
        for (var i = 0; i < melody.length; i++) {
            var d = melody[i][1] * six;
            var o = c.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(melody[i][0], mt);
            var g = c.createGain(); g.gain.setValueAtTime(0.04, mt); g.gain.exponentialRampToValueAtTime(0.001, mt + d * 0.9);
            o.connect(g); g.connect(musicGain); o.start(mt); o.stop(mt + d); mt += d;
        }
        dur = mt - t;
        var bt = t;
        for (var j = 0; j < bass.length; j++) {
            var bd = bass[j][1] * six;
            var bo = c.createOscillator(); bo.type = 'triangle'; bo.frequency.setValueAtTime(bass[j][0], bt);
            var bg = c.createGain(); bg.gain.setValueAtTime(0.05, bt); bg.gain.exponentialRampToValueAtTime(0.001, bt + bd * 0.8);
            bo.connect(bg); bg.connect(musicGain); bo.start(bt); bo.stop(bt + bd); bt += bd;
        }
        musicTimeout = setTimeout(function () { if (musicPlaying && musicEnabled) scheduleLoop(); }, dur * 1000 - 100);
    }

    function stopMusic() {
        musicPlaying = false;
        if (musicTimeout) { clearTimeout(musicTimeout); musicTimeout = null; }
    }

    return {
        sfx: sfx,
        startMusic: startMusic,
        stopMusic: stopMusic,
        setSfxEnabled: function (v) { sfxEnabled = v; },
        setMusicEnabled: function (v) { musicEnabled = v; if (!v) stopMusic(); else startMusic(); },
        ensureContext: function () { getCtx(); }
    };
})();
