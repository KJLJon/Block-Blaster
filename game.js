// ============================================================
// Block Blaster - Complete Game Engine
// ============================================================
(function () {
    'use strict';

    // === Constants ===
    var GRID = 8, ROUND = 3;
    var PTS_BLOCK = 1, PTS_LINE = 10, COMBO_MULT = 10, STREAK_BONUS = 10;
    var BLAST_TIME = 60, BLAST_LINE_BONUS = 5;

    var COLORS = [
        'color-red','color-blue','color-green','color-yellow','color-purple',
        'color-orange','color-cyan','color-pink','color-indigo','color-teal','color-lime'
    ];
    var COLOR_MAP = {r:'color-red',b:'color-blue',g:'color-green',y:'color-yellow',
        p:'color-purple',o:'color-orange',c:'color-cyan',k:'color-pink',
        i:'color-indigo',t:'color-teal',l:'color-lime'};

    // Collection mode icons & goals
    var COLLECT_ICONS = ['\u{1F31F}','\u{1F48E}','\u{1F52E}','\u{1F340}','\u{26A1}'];
    var COLLECT_GOAL = 12;
    var COLLECT_ICON_CHANCE = 0.2; // chance per piece cell to get an icon

    // === Piece Definitions ===
    var PDEFS = [
        {s:[[1]],w:3},{s:[[1,1]],w:4},{s:[[1,1,1]],w:5},{s:[[1,1,1,1]],w:3},{s:[[1,1,1,1,1]],w:1},
        {s:[[1],[1]],w:4},{s:[[1],[1],[1]],w:5},{s:[[1],[1],[1],[1]],w:3},{s:[[1],[1],[1],[1],[1]],w:1},
        {s:[[1,1],[1,1]],w:4},{s:[[1,1,1],[1,1,1],[1,1,1]],w:1},
        {s:[[1,0],[1,0],[1,1]],w:3},{s:[[0,1],[0,1],[1,1]],w:3},
        {s:[[1,1],[1,0],[1,0]],w:3},{s:[[1,1],[0,1],[0,1]],w:3},
        {s:[[1,0,0],[1,1,1]],w:2},{s:[[1,1,1],[1,0,0]],w:2},
        {s:[[0,0,1],[1,1,1]],w:2},{s:[[1,1,1],[0,0,1]],w:2},
        {s:[[1,1],[0,1]],w:3},{s:[[1,1],[1,0]],w:3},{s:[[1,0],[1,1]],w:3},{s:[[0,1],[1,1]],w:3},
        {s:[[1,1,1],[0,1,0]],w:2},{s:[[0,1,0],[1,1,1]],w:2},
        {s:[[1,0],[1,1],[1,0]],w:2},{s:[[0,1],[1,1],[0,1]],w:2},
        {s:[[1,1,0],[0,1,1]],w:2},{s:[[0,1,1],[1,1,0]],w:2},
        {s:[[1,0],[1,1],[0,1]],w:2},{s:[[0,1],[1,1],[1,0]],w:2},
        {s:[[1,1],[1,1],[1,1]],w:1},{s:[[1,1,1],[1,1,1]],w:1}
    ];
    var POOL = [];
    PDEFS.forEach(function(d,i){ for(var j=0;j<d.w;j++) POOL.push(i); });

    // === Adventure Levels ===
    var LEVELS = [
        {name:"First Steps",grid:["........","........","........","........","........","........","rrr..rrr","........"],
         obj:{type:"lines",count:1},stars:[30,60,120]},
        {name:"Two Lines",grid:["........","........","........","........","........","bbb..bbb","........","ggg..ggg"],
         obj:{type:"lines",count:2},stars:[50,100,200]},
        {name:"Corner",grid:["RR......","RR......","........","........","........","........","........","........"],
         obj:{type:"targets",count:0},stars:[40,80,160]},
        {name:"The Gap",grid:["........","........","........","rrrRrrrr","........","........","........","........"],
         obj:{type:"targets",count:0},stars:[40,90,180]},
        {name:"Two Gaps",grid:["........","........","ggg.gggg","........","........","bbb.bbbb","........","........"],
         obj:{type:"lines",count:2},stars:[60,120,240]},
        {name:"L-Shape",grid:["........","........","..rrr...","..r.....","..r.....","........","........","........"],
         obj:{type:"lines",count:1},stars:[50,100,200]},
        {name:"Walls",grid:["r......r","r......r","r......r","r......r","r......r","r......r","r......r","R......R"],
         obj:{type:"targets",count:0},stars:[80,160,320]},
        {name:"Checkers",grid:["........","........",".r.r.r..","..r.r.r.","........","........","........","........"],
         obj:{type:"lines",count:2},stars:[70,140,280]},
        {name:"Staircase",grid:["........","........","........","b.......","bb......","bbb.....","bbbb....","BBBBB..."],
         obj:{type:"targets",count:0},stars:[80,160,300]},
        {name:"The Cross",grid:["...R....","...r....","...r....","RRRRRRRR","...r....","...r....","...R....","........"],
         obj:{type:"targets",count:0},stars:[100,200,400]},
        {name:"Diamond",grid:["...g....","..gGg...","...g....","........","........","........","........","........"],
         obj:{type:"targets",count:0},stars:[60,120,240]},
        {name:"Frame",grid:["rrrrrrrr","r......r","r......r","r......r","r......r","r......r","r......r","RRRRRRRR"],
         obj:{type:"targets",count:0},stars:[120,240,480]},
        {name:"Zigzag",grid:["........","........","rr......","..rr....","....rr..","......rr","........","........"],
         obj:{type:"lines",count:2},stars:[80,160,320]},
        {name:"Islands",grid:["........","........",".RR..RR.","........","........",".RR..RR.","........","........"],
         obj:{type:"targets",count:0},stars:[90,180,360]},
        {name:"Almost There",grid:["........","........","........","bBbbbbbb","........","gggggGg.","........","........"],
         obj:{type:"targets",count:0},stars:[60,120,240]},
        {name:"T-Block",grid:["........","..rrr...","...r....","...r....","........","........","........","........"],
         obj:{type:"lines",count:2},stars:[80,160,320]},
        {name:"Columns",grid:["r..b..g.","r..b..g.","r..b..g.","r..b..g.","r..b..g.","R..B..G.","........","........"],
         obj:{type:"targets",count:0},stars:[100,200,400]},
        {name:"Fortress",grid:["........","rrRrrRrr","r......r","r......r","r......r","r......r","rrrrrrrr","........"],
         obj:{type:"targets",count:0},stars:[120,240,480]},
        {name:"Scattered",grid:["R...R...","........","....R...","........","R.......","........","...R...R","........"],
         obj:{type:"targets",count:0},stars:[100,200,400]},
        {name:"Half Full",grid:["rrrrrrrr","bbbbbbbb","gggggggg","yyyyyyyy","........","........","........","........"],
         obj:{type:"lines",count:4},stars:[120,240,500]},
        {name:"Spiral",grid:["rrrrrrrr","........","rrrrrr.r","r......r","r.rrrr.r","r.r..r.r","r.R....r","r.rrrrrr"],
         obj:{type:"targets",count:0},stars:[130,260,520]},
        {name:"Arrows",grid:["...R....","..rrr...",".rrrrr..","........","........",".bbbbb..","..bbb...","...B...."],
         obj:{type:"targets",count:0},stars:[100,200,400]},
        {name:"Tight Fit",grid:["rBrrrrrr","rrrrrGrr","rrRrrrrr","rrrrrrrr","........","........","........","........"],
         obj:{type:"targets",count:0},stars:[120,240,500]},
        {name:"Donut",grid:["..rrrr..","..r..r..","..r..r..","..rRRr..","..rRRr..","..r..r..","..r..r..","..rrrr.."],
         obj:{type:"targets",count:0},stars:[140,280,560]},
        {name:"Stripes",grid:["rrrrrrrr","........","bbbbbbbb","........","gggggggg","........","RRRRRRRR","........"],
         obj:{type:"targets",count:0},stars:[100,200,400]},
        {name:"Maze",grid:["r.r.r.r.","r.r.r.r.",".r.r.r.r",".r.r.r.r","r.r.r.r.","r.r.r.r.",".r.r.R.r",".r.r.r.r"],
         obj:{type:"targets",count:0},stars:[140,280,560]},
        {name:"Loaded",grid:["rrbbggyy","rrbbggyy","ppoocc..","ppoocc..","........","........","........","........"],
         obj:{type:"lines",count:4},stars:[150,300,600]},
        {name:"Final Push",grid:["RbRbRbRb","bRbRbRbR","........","........","........","........","RgRgRgRg","gRgRgRgR"],
         obj:{type:"targets",count:0},stars:[180,360,720]},
        {name:"Gauntlet",grid:["RRRRRRRr","r......r","rr.rrr.r","r..r...r","r.rrrr.r","r......r","rRRRRRRr","........"],
         obj:{type:"targets",count:0},stars:[200,400,800]},
        {name:"Grand Finale",grid:["RbRgRbRg","bRgRbRgR","RgRbRgRb","gRbRgRbR","........","........","........","........"],
         obj:{type:"targets",count:0},stars:[250,500,1000]}
    ];

    // Pre-process levels: count targets
    LEVELS.forEach(function(lv) {
        if (lv.obj.type === 'targets') {
            var c = 0;
            lv.grid.forEach(function(row){ for(var i=0;i<row.length;i++) if(row[i]!=='.' && row[i]===row[i].toUpperCase()) c++; });
            lv.obj.count = c;
        }
    });

    // === State ===
    var mode = 'classic'; // classic | adventure | blast | collect
    var grid = [], pieces = [null,null,null];
    var score = 0, bestScore = 0, streak = 0, gameOver = false;
    var clearAnimating = false, paused = false;
    // Adventure
    var advLevel = 0, advTargetsLeft = 0, advLinesLeft = 0;
    var advProgress = {}; // {levelIndex: starsEarned}
    // Blast
    var blastTimer = 0, blastInterval = null;
    // Collection
    var collectProgress = {}; // {icon: count}
    // Options
    var opts = {sfx:true, music:true, vibration:true, flashy:true, movement:'smooth'};
    // Drag state
    var dragging = false, dragIdx = -1, dragData = null;
    var dragOffX = 0, dragOffY = 0, dragEl = null;
    var lastGR = -1, lastGC = -1, isTouch = false;
    var boardCellSize = 0, boardGap = 3, boardPad = 6;
    // rAF-based smooth drag
    var rawInputX = 0, rawInputY = 0;
    var smoothX = 0, smoothY = 0;
    var rafId = null;
    var posHistory = [];

    // === DOM ===
    var $ = function(id){ return document.getElementById(id); };
    var boardEl = $('board'), ghostEl = $('ghost-layer'), highlightEl = $('highlight-layer');
    var particleEl = $('particle-container'), boardWrap = $('board-wrapper');
    var scoreEl = $('score'), rightValEl = $('right-value'), rightLblEl = $('right-label'), leftLblEl = $('left-label');
    var modeBadge = $('mode-badge');
    var objBar = $('objective-bar'), objText = $('objective-text'), objProg = $('objective-progress');
    var collectionBar = $('collection-bar');
    var comboDisp = $('combo-display'), comboTxt = $('combo-text');
    var goOverlay = $('game-over-overlay'), finalScoreEl = $('final-score'), newBestEl = $('new-best');
    var lcOverlay = $('level-complete-overlay'), lvScoreEl = $('level-score');
    var pauseOverlay = $('pause-overlay');

    // === Screen Navigation ===
    function showScreen(id) {
        var screens = document.querySelectorAll('.screen');
        for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
        $(id).classList.add('active');
    }

    // === Options ===
    function loadOptions() {
        try {
            var s = localStorage.getItem('bbOpts');
            if (s) { var o = JSON.parse(s); for (var k in o) if (opts.hasOwnProperty(k)) opts[k] = o[k]; }
        } catch(e){}
        $('opt-sfx').checked = opts.sfx;
        $('opt-music').checked = opts.music;
        $('opt-vibration').checked = opts.vibration;
        $('opt-flashy').checked = opts.flashy;
        // Set active segment for movement
        var segBtns = document.querySelectorAll('#opt-movement .seg-btn');
        for (var i = 0; i < segBtns.length; i++) {
            segBtns[i].classList.toggle('active', segBtns[i].dataset.val === opts.movement);
        }
        applyOptions();
    }
    function saveOptions() {
        opts.sfx = $('opt-sfx').checked;
        opts.music = $('opt-music').checked;
        opts.vibration = $('opt-vibration').checked;
        opts.flashy = $('opt-flashy').checked;
        localStorage.setItem('bbOpts', JSON.stringify(opts));
        applyOptions();
    }
    function applyOptions() {
        AudioManager.setSfxEnabled(opts.sfx);
        AudioManager.setMusicEnabled(opts.music);
        if (opts.flashy) document.body.classList.remove('reduced-motion');
        else document.body.classList.add('reduced-motion');
    }

    // === Adventure Progress ===
    function loadProgress() {
        try {
            var s = localStorage.getItem('bbAdv');
            if (s) advProgress = JSON.parse(s);
        } catch(e){}
        bestScore = parseInt(localStorage.getItem('bbBest') || '0', 10);
    }
    function saveProgress() {
        localStorage.setItem('bbAdv', JSON.stringify(advProgress));
    }
    function saveBest() {
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bbBest', bestScore.toString());
        }
    }

    // === Level Select ===
    function buildLevelGrid() {
        var g = $('level-grid');
        g.innerHTML = '';
        for (var i = 0; i < LEVELS.length; i++) {
            var btn = document.createElement('button');
            btn.className = 'level-btn';
            var unlocked = i === 0 || (advProgress[i-1] !== undefined && advProgress[i-1] >= 1);
            if (!unlocked) btn.classList.add('locked');
            if (advProgress[i] !== undefined) btn.classList.add('completed');
            btn.dataset.level = i;
            var stars = advProgress[i] || 0;
            var starStr = '';
            for (var s = 0; s < 3; s++) starStr += s < stars ? '\u2605' : '\u2606';
            btn.innerHTML = '<span>' + (i+1) + '</span><span class="level-stars-small">' + starStr + '</span>';
            if (!unlocked) btn.disabled = true;
            btn.addEventListener('click', onLevelClick);
            g.appendChild(btn);
        }
    }
    function onLevelClick(e) {
        var btn = e.currentTarget;
        if (btn.classList.contains('locked')) return;
        AudioManager.sfx.click();
        advLevel = parseInt(btn.dataset.level);
        startGame('adventure');
    }

    // === Board Creation ===
    function createBoard() {
        boardEl.innerHTML = ''; ghostEl.innerHTML = ''; highlightEl.innerHTML = '';
        for (var r = 0; r < GRID; r++) {
            for (var c = 0; c < GRID; c++) {
                var cell = document.createElement('div');
                cell.className = 'cell'; cell.dataset.row = r; cell.dataset.col = c;
                boardEl.appendChild(cell);
                var gc = document.createElement('div');
                gc.className = 'cell'; gc.dataset.row = r; gc.dataset.col = c;
                ghostEl.appendChild(gc);
                var hc = document.createElement('div');
                hc.className = 'cell'; hc.dataset.row = r; hc.dataset.col = c;
                highlightEl.appendChild(hc);
            }
        }
        requestAnimationFrame(updateBoardMetrics);
    }
    function updateBoardMetrics() {
        var fc = boardEl.querySelector('.cell');
        if (fc) boardCellSize = fc.getBoundingClientRect().width;
    }

    // === Start Game ===
    function startGame(m) {
        mode = m;
        grid = [];
        for (var r = 0; r < GRID; r++) { grid[r] = []; for (var c = 0; c < GRID; c++) grid[r][c] = null; }
        pieces = [null,null,null];
        score = 0; streak = 0; gameOver = false; clearAnimating = false; paused = false;
        posHistory = [];
        collectProgress = {};

        goOverlay.classList.add('hidden');
        lcOverlay.classList.add('hidden');
        pauseOverlay.classList.add('hidden');
        createBoard();

        // Mode-specific setup
        if (mode === 'classic') {
            modeBadge.textContent = 'CLASSIC';
            leftLblEl.textContent = 'SCORE';
            rightLblEl.textContent = 'BEST';
            rightValEl.textContent = bestScore;
            objBar.classList.add('hidden');
            collectionBar.classList.add('hidden');
        } else if (mode === 'adventure') {
            var lv = LEVELS[advLevel];
            modeBadge.textContent = 'LV ' + (advLevel+1);
            leftLblEl.textContent = 'SCORE';
            rightLblEl.textContent = 'GOAL';
            objBar.classList.remove('hidden');
            collectionBar.classList.add('hidden');
            loadLevelGrid(lv);
            if (lv.obj.type === 'targets') {
                advTargetsLeft = lv.obj.count;
                objText.textContent = 'Clear target blocks';
                objProg.textContent = '0/' + lv.obj.count;
                rightValEl.textContent = lv.obj.count;
            } else {
                advLinesLeft = lv.obj.count;
                objText.textContent = 'Clear ' + lv.obj.count + ' lines';
                objProg.textContent = '0/' + lv.obj.count;
                rightValEl.textContent = lv.obj.count;
            }
        } else if (mode === 'blast') {
            modeBadge.textContent = 'BLAST';
            leftLblEl.textContent = 'SCORE';
            rightLblEl.textContent = 'TIME';
            blastTimer = BLAST_TIME;
            rightValEl.textContent = blastTimer;
            rightValEl.classList.remove('timer-urgent');
            objBar.classList.add('hidden');
            collectionBar.classList.add('hidden');
            startBlastTimer();
        } else if (mode === 'collect') {
            modeBadge.textContent = 'COLLECT';
            leftLblEl.textContent = 'SCORE';
            rightLblEl.textContent = 'LEFT';
            objBar.classList.add('hidden');
            collectionBar.classList.remove('hidden');
            initCollectionMode();
        }

        scoreEl.textContent = '0';
        showScreen('game-screen');
        renderBoard();
        dealNewPieces();
        AudioManager.ensureContext();
        if (opts.music) AudioManager.startMusic();
    }

    function loadLevelGrid(lv) {
        for (var r = 0; r < GRID; r++) {
            var row = lv.grid[r] || '........';
            for (var c = 0; c < GRID; c++) {
                var ch = row[c] || '.';
                if (ch === '.') { grid[r][c] = null; continue; }
                var lower = ch.toLowerCase();
                var color = COLOR_MAP[lower] || 'color-red';
                var isTarget = ch !== '.' && ch === ch.toUpperCase();
                grid[r][c] = { color: color, target: isTarget };
            }
        }
    }

    // === Collection Mode ===
    function initCollectionMode() {
        // Reset collect progress
        for (var i = 0; i < COLLECT_ICONS.length; i++) collectProgress[COLLECT_ICONS[i]] = 0;
        updateCollectionBar();
        updateCollectRemaining();

        // Place 10-14 scattered blocks in top 6 rows with ~35% having icons
        var blockCount = 10 + Math.floor(Math.random() * 5);
        var placed = 0;
        var attempts = 0;
        while (placed < blockCount && attempts < 200) {
            var r = Math.floor(Math.random() * 6);
            var c = Math.floor(Math.random() * GRID);
            if (grid[r][c] === null) {
                var color = COLORS[Math.floor(Math.random() * COLORS.length)];
                var icon = null;
                if (Math.random() < 0.35) {
                    icon = COLLECT_ICONS[Math.floor(Math.random() * COLLECT_ICONS.length)];
                }
                grid[r][c] = { color: color, icon: icon };
                placed++;
            }
            attempts++;
        }
    }

    function updateCollectionBar() {
        collectionBar.innerHTML = '';
        for (var i = 0; i < COLLECT_ICONS.length; i++) {
            var icon = COLLECT_ICONS[i];
            var count = collectProgress[icon] || 0;
            var done = count >= COLLECT_GOAL;
            var item = document.createElement('div');
            item.className = 'collect-item' + (done ? ' ci-done' : '');
            item.innerHTML = '<span class="ci-icon">' + icon + '</span><span class="ci-count">' +
                Math.min(count, COLLECT_GOAL) + '/' + COLLECT_GOAL + '</span>';
            collectionBar.appendChild(item);
        }
    }

    function updateCollectRemaining() {
        var total = 0;
        for (var i = 0; i < COLLECT_ICONS.length; i++) {
            var left = COLLECT_GOAL - (collectProgress[COLLECT_ICONS[i]] || 0);
            if (left > 0) total += left;
        }
        rightValEl.textContent = total;
    }

    function checkCollectComplete() {
        for (var i = 0; i < COLLECT_ICONS.length; i++) {
            if ((collectProgress[COLLECT_ICONS[i]] || 0) < COLLECT_GOAL) return false;
        }
        return true;
    }

    // === Blast Timer ===
    function startBlastTimer() {
        if (blastInterval) clearInterval(blastInterval);
        blastInterval = setInterval(function() {
            if (paused || gameOver) return;
            blastTimer--;
            rightValEl.textContent = blastTimer;
            if (blastTimer <= 10) rightValEl.classList.add('timer-urgent');
            if (blastTimer <= 0) {
                clearInterval(blastInterval); blastInterval = null;
                endGame();
            }
        }, 1000);
    }
    function stopBlastTimer() {
        if (blastInterval) { clearInterval(blastInterval); blastInterval = null; }
    }

    // === Rendering ===
    function renderBoard() {
        var cells = boardEl.querySelectorAll('.cell');
        for (var i = 0; i < cells.length; i++) {
            var r = parseInt(cells[i].dataset.row), c = parseInt(cells[i].dataset.col);
            cells[i].className = 'cell';
            // Remove any icon children
            var existingIcon = cells[i].querySelector('.cell-icon');
            if (existingIcon) cells[i].removeChild(existingIcon);

            var v = grid[r][c];
            if (v) {
                var color = typeof v === 'string' ? v : v.color;
                cells[i].classList.add('filled', color);
                if (typeof v === 'object' && v.target) cells[i].classList.add('target-block');
                // Render icon for collection mode
                if (typeof v === 'object' && v.icon) {
                    var iconEl = document.createElement('span');
                    iconEl.className = 'cell-icon';
                    iconEl.textContent = v.icon;
                    cells[i].appendChild(iconEl);
                }
            }
        }
    }

    function renderPieces() {
        for (var i = 0; i < ROUND; i++) {
            var slot = $('slot-' + i);
            slot.innerHTML = '';
            var p = pieces[i]; if (!p) continue;
            var pv = document.createElement('div');
            pv.className = 'piece-preview'; pv.dataset.index = i;
            var rows = p.shape.length, cols = p.shape[0].length;
            pv.style.gridTemplateColumns = 'repeat('+cols+',1fr)';
            pv.style.gridTemplateRows = 'repeat('+rows+',1fr)';
            for (var rr = 0; rr < rows; rr++) {
                for (var cc = 0; cc < cols; cc++) {
                    var cell = document.createElement('div');
                    cell.className = 'piece-cell';
                    if (p.shape[rr][cc]) {
                        cell.classList.add(p.color);
                        cell.style.position = 'relative';
                        // Show icon on piece cells in collection mode
                        if (p.icons && p.icons[rr] && p.icons[rr][cc]) {
                            var iconEl = document.createElement('span');
                            iconEl.className = 'piece-icon';
                            iconEl.textContent = p.icons[rr][cc];
                            cell.appendChild(iconEl);
                        }
                    } else {
                        cell.classList.add('empty');
                    }
                    pv.appendChild(cell);
                }
            }
            pv.addEventListener('mousedown', onDragStart);
            pv.addEventListener('touchstart', onDragStart, {passive:false});
            slot.appendChild(pv);
        }
    }

    function updateScore() {
        scoreEl.textContent = score;
        if (mode === 'classic') {
            if (score > bestScore) { bestScore = score; rightValEl.textContent = bestScore; saveBest(); }
        }
    }

    // === Piece Generation ===
    function randPiece() {
        var idx = POOL[Math.floor(Math.random()*POOL.length)];
        var shape = PDEFS[idx].s.map(function(r){return r.slice();});
        var color = COLORS[Math.floor(Math.random()*COLORS.length)];
        var piece = {shape:shape, color:color};

        // In collection mode, randomly assign icons to some cells
        if (mode === 'collect') {
            var icons = [];
            var hasIcon = false;
            for (var r = 0; r < shape.length; r++) {
                icons[r] = [];
                for (var c = 0; c < shape[r].length; c++) {
                    if (shape[r][c] && Math.random() < COLLECT_ICON_CHANCE) {
                        icons[r][c] = COLLECT_ICONS[Math.floor(Math.random() * COLLECT_ICONS.length)];
                        hasIcon = true;
                    } else {
                        icons[r][c] = null;
                    }
                }
            }
            // Make sure at least one cell has an icon sometimes
            if (!hasIcon && Math.random() < 0.4) {
                // Find a filled cell and assign an icon
                for (var rr = 0; rr < shape.length; rr++) {
                    for (var cc = 0; cc < shape[rr].length; cc++) {
                        if (shape[rr][cc]) {
                            icons[rr][cc] = COLLECT_ICONS[Math.floor(Math.random() * COLLECT_ICONS.length)];
                            break;
                        }
                    }
                    if (icons[rr] && icons[rr].some(function(v){return v;})) break;
                }
            }
            piece.icons = icons;
        }

        return piece;
    }

    function dealNewPieces() {
        for (var i = 0; i < ROUND; i++) pieces[i] = randPiece();
        renderPieces();
        if (!canAnyPieceBePlaced()) setTimeout(function(){ endGame(); }, 300);
    }

    // === Board Metrics ===
    function getMetrics() {
        var br = boardEl.getBoundingClientRect();
        var iw = br.width - boardPad*2;
        var cw = (iw - boardGap*(GRID-1)) / GRID;
        var st = cw + boardGap;
        return {rect:br, cw:cw, step:st};
    }

    // === rAF-based Smooth Drag System ===
    function dragRAFLoop() {
        if (!dragging) return;

        var lerpFactor;
        var px, py;

        if (opts.movement === 'precise') {
            // Direct 1:1 movement with dead zone for micro-jitter
            px = rawInputX;
            py = rawInputY;
            smoothX = px;
            smoothY = py;
        } else if (opts.movement === 'accelerated') {
            // Velocity prediction + lerp
            var pred = getPredicted(rawInputX, rawInputY);
            lerpFactor = 0.45;
            smoothX += (pred.x - smoothX) * lerpFactor;
            smoothY += (pred.y - smoothY) * lerpFactor;
            px = smoothX;
            py = smoothY;
        } else {
            // Smooth (default) - gentle lerp
            lerpFactor = 0.3;
            smoothX += (rawInputX - smoothX) * lerpFactor;
            smoothY += (rawInputY - smoothY) * lerpFactor;
            px = smoothX;
            py = smoothY;
        }

        moveDrag(px, py);
        updateGhost(px, py);

        rafId = requestAnimationFrame(dragRAFLoop);
    }

    // === Drag & Drop ===
    function onDragStart(e) {
        if (gameOver || clearAnimating || paused) return;
        e.preventDefault();
        var pv = e.currentTarget;
        var idx = parseInt(pv.dataset.index);
        if (!pieces[idx]) return;
        AudioManager.sfx.pickup();
        isTouch = !!e.touches;
        dragging = true; dragIdx = idx; dragData = pieces[idx];
        pv.classList.add('dragging');
        updateBoardMetrics();
        posHistory = [];

        var cs = boardCellSize;
        var rows = dragData.shape.length, cols = dragData.shape[0].length;
        dragEl = document.createElement('div');
        dragEl.id = 'drag-piece';
        dragEl.style.gridTemplateColumns = 'repeat('+cols+','+cs+'px)';
        dragEl.style.gridTemplateRows = 'repeat('+rows+','+cs+'px)';
        dragEl.style.gap = boardGap+'px';
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var cell = document.createElement('div');
                cell.className = 'piece-cell';
                cell.style.width = cs+'px'; cell.style.height = cs+'px';
                if (dragData.shape[r][c]) {
                    cell.classList.add(dragData.color);
                    // Show icons on drag piece for collection mode
                    if (dragData.icons && dragData.icons[r] && dragData.icons[r][c]) {
                        cell.style.position = 'relative';
                        var iconEl = document.createElement('span');
                        iconEl.className = 'cell-icon';
                        iconEl.textContent = dragData.icons[r][c];
                        cell.appendChild(iconEl);
                    }
                } else {
                    cell.classList.add('empty');
                }
                dragEl.appendChild(cell);
            }
        }
        document.body.appendChild(dragEl);

        var pw = cols*(cs+boardGap)-boardGap;
        var ph = rows*(cs+boardGap)-boardGap;
        dragOffX = pw/2;
        dragOffY = isTouch ? ph + 90 : ph/2;

        var cx = e.touches ? e.touches[0].clientX : e.clientX;
        var cy = e.touches ? e.touches[0].clientY : e.clientY;

        // Initialize smooth position to initial raw position
        rawInputX = cx;
        rawInputY = cy;
        smoothX = cx;
        smoothY = cy;
        trackPos(cx, cy);
        moveDrag(cx, cy);
        updateGhost(cx, cy);

        // Start rAF loop
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(dragRAFLoop);

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onDragMove, {passive:false});
        document.addEventListener('touchend', onDragEnd);
        document.addEventListener('touchcancel', onDragCancel);
    }

    function trackPos(x, y) {
        posHistory.push({x:x, y:y, t:Date.now()});
        if (posHistory.length > 6) posHistory.shift();
    }

    function getPredicted(x, y) {
        if (posHistory.length < 3) return {x:x, y:y};
        var newest = posHistory[posHistory.length-1];
        var oldest = posHistory[0];
        var dt = (newest.t - oldest.t) / 1000;
        if (dt < 0.01) return {x:x, y:y};
        var vx = (newest.x - oldest.x) / dt;
        var vy = (newest.y - oldest.y) / dt;
        // Predict 60ms ahead for "faster than finger" feel
        return {x: x + vx * 0.06, y: y + vy * 0.06};
    }

    function onDragMove(e) {
        if (!dragging) return;
        e.preventDefault();
        var cx = e.touches ? e.touches[0].clientX : e.clientX;
        var cy = e.touches ? e.touches[0].clientY : e.clientY;
        trackPos(cx, cy);
        // Just store raw input; rAF loop handles interpolation and rendering
        rawInputX = cx;
        rawInputY = cy;
    }

    function moveDrag(cx, cy) {
        if (!dragEl) return;
        dragEl.style.left = (cx - dragOffX) + 'px';
        dragEl.style.top = (cy - dragOffY) + 'px';
    }

    function onDragEnd(e) {
        if (!dragging) return;
        e.preventDefault();
        var cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        var cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        // Use the final smoothed position for placement
        var finalX = smoothX, finalY = smoothY;
        // But if the raw and smooth are very close, use raw for precision
        var dx = cx - smoothX, dy = cy - smoothY;
        if (Math.sqrt(dx*dx + dy*dy) < 20) {
            finalX = cx;
            finalY = cy;
        }
        var pos = gridPos(finalX, finalY);
        if (pos && canPlace(dragData.shape, pos.r, pos.c)) {
            placePiece(dragIdx, pos.r, pos.c);
        }
        cleanupDrag();
    }
    function onDragCancel() { cleanupDrag(); }

    function cleanupDrag() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (dragEl && dragEl.parentNode) dragEl.parentNode.removeChild(dragEl);
        dragEl = null;
        var dvs = document.querySelectorAll('.piece-preview.dragging');
        for (var i=0;i<dvs.length;i++) dvs[i].classList.remove('dragging');
        clearGhost(); clearHighlight();
        dragging = false; dragIdx = -1; dragData = null; lastGR = -1; lastGC = -1;
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
        document.removeEventListener('touchcancel', onDragCancel);
    }

    function gridPos(cx, cy) {
        if (!dragData) return null;
        var m = getMetrics();
        var pr = dragData.shape.length, pc = dragData.shape[0].length;
        var pl = cx - dragOffX, pt = cy - dragOffY;
        var col = Math.round((pl - m.rect.left - boardPad) / m.step);
        var row = Math.round((pt - m.rect.top - boardPad) / m.step);
        if (row<0||col<0||row+pr>GRID||col+pc>GRID) return null;
        return {r:row, c:col};
    }

    // === Ghost & Highlight ===
    function updateGhost(cx, cy) {
        var pos = gridPos(cx, cy);
        if (!pos) {
            if (lastGR!==-1||lastGC!==-1){ clearGhost(); clearHighlight(); lastGR=-1;lastGC=-1; }
            return;
        }
        if (pos.r===lastGR&&pos.c===lastGC) return;
        lastGR=pos.r; lastGC=pos.c;
        clearGhost(); clearHighlight();

        var shape=dragData.shape, valid=canPlace(shape,pos.r,pos.c);
        var gcells=ghostEl.querySelectorAll('.cell');
        for(var r=0;r<shape.length;r++){
            for(var c=0;c<shape[r].length;c++){
                if(!shape[r][c]) continue;
                var gr=pos.r+r, gc_=pos.c+c;
                if(gr<0||gr>=GRID||gc_<0||gc_>=GRID) continue;
                var cell=gcells[gr*GRID+gc_];
                if(valid){
                    cell.classList.add('ghost', dragData.color);
                } else {
                    cell.classList.add('ghost-invalid');
                }
            }
        }

        // Highlight rows/cols that would complete if placed here
        if (valid && opts.flashy) highlightCompletions(shape, pos.r, pos.c);
    }

    function highlightCompletions(shape, row, col) {
        // Simulate placement
        var sim = grid.map(function(r){return r.map(function(v){return v;});});
        for(var r=0;r<shape.length;r++){
            for(var c=0;c<shape[r].length;c++){
                if(shape[r][c]) sim[row+r][col+c] = 'x';
            }
        }
        var hcells = highlightEl.querySelectorAll('.cell');
        for(var rr=0;rr<GRID;rr++){
            if(sim[rr].every(function(v){return v!==null;})){
                for(var cc=0;cc<GRID;cc++){
                    hcells[rr*GRID+cc].classList.add('line-highlight');
                }
            }
        }
        for(var cc2=0;cc2<GRID;cc2++){
            var full=true;
            for(var rr2=0;rr2<GRID;rr2++) if(sim[rr2][cc2]===null){full=false;break;}
            if(full){
                for(var rr3=0;rr3<GRID;rr3++){
                    hcells[rr3*GRID+cc2].classList.add('line-highlight');
                }
            }
        }
    }

    function clearGhost() {
        var cells = ghostEl.querySelectorAll('.cell');
        for (var i = 0; i < cells.length; i++) {
            cells[i].className = 'cell';
        }
    }
    function clearHighlight() {
        var cells = highlightEl.querySelectorAll('.cell');
        for (var i = 0; i < cells.length; i++) {
            cells[i].className = 'cell';
        }
    }

    // === Placement ===
    function canPlace(shape,row,col){
        for(var r=0;r<shape.length;r++) for(var c=0;c<shape[r].length;c++){
            if(!shape[r][c]) continue;
            var gr=row+r,gc=col+c;
            if(gr<0||gr>=GRID||gc<0||gc>=GRID) return false;
            if(grid[gr][gc]!==null) return false;
        }
        return true;
    }
    function canPlaceAnywhere(shape){
        for(var r=0;r<=GRID-shape.length;r++) for(var c=0;c<=GRID-shape[0].length;c++)
            if(canPlace(shape,r,c)) return true;
        return false;
    }
    function canAnyPieceBePlaced(){
        for(var i=0;i<ROUND;i++) if(pieces[i]&&canPlaceAnywhere(pieces[i].shape)) return true;
        return false;
    }

    function placePiece(idx, row, col) {
        var p = pieces[idx]; if(!p) return;
        var shape=p.shape, blocks=0;
        for(var r=0;r<shape.length;r++) for(var c=0;c<shape[r].length;c++){
            if(!shape[r][c]) continue;
            if (mode === 'collect') {
                var icon = (p.icons && p.icons[r] && p.icons[r][c]) ? p.icons[r][c] : null;
                grid[row+r][col+c] = { color: p.color, icon: icon };
            } else {
                grid[row+r][col+c] = p.color;
            }
            blocks++;
        }
        score += blocks * PTS_BLOCK;
        pieces[idx] = null;

        AudioManager.sfx.place();
        if(opts.vibration && navigator.vibrate) try{navigator.vibrate(10);}catch(e){}

        renderBoard();
        animatePlace(shape, row, col);

        var linesCleared = checkAndClear();
        if(linesCleared > 0){
            streak++;
            var lp = linesCleared * PTS_LINE * GRID;
            var cb = linesCleared>1 ? (linesCleared-1)*COMBO_MULT*GRID : 0;
            var sb = streak>1 ? (streak-1)*STREAK_BONUS : 0;
            score += lp+cb+sb;
            AudioManager.sfx.clear(linesCleared);
            if(linesCleared >= 2) AudioManager.sfx.combo();
            showCombo(linesCleared, streak);
            showScorePopup(lp+cb+sb);
            if(opts.vibration && navigator.vibrate) try{navigator.vibrate([20,30,20]);}catch(e){}
            if(opts.flashy && linesCleared >= 2) screenShake();
            // Blast: add time
            if(mode==='blast'){
                blastTimer += linesCleared * BLAST_LINE_BONUS;
                rightValEl.textContent = blastTimer;
                if(blastTimer>10) rightValEl.classList.remove('timer-urgent');
            }
            // Adventure: update progress
            if(mode==='adventure') updateAdvProgress(linesCleared);
            // Collection: update progress
            if(mode==='collect') {
                updateCollectionBar();
                updateCollectRemaining();
            }
        } else {
            streak = 0;
        }
        updateScore();

        // Check adventure completion
        if(mode==='adventure' && checkAdvComplete()){
            var delay = linesCleared>0?700:300;
            setTimeout(function(){ completeLevel(); }, delay);
            return;
        }

        // Check collection completion
        if(mode==='collect' && checkCollectComplete()){
            var delay2 = linesCleared>0?700:300;
            setTimeout(function(){ completeCollection(); }, delay2);
            return;
        }

        var allUsed = pieces.every(function(p){return p===null;});
        if(allUsed){
            var d = linesCleared>0?600:150;
            setTimeout(function(){ dealNewPieces(); }, d);
        } else {
            renderPieces();
            var d2 = linesCleared>0?600:50;
            setTimeout(function(){
                if(!gameOver && !canAnyPieceBePlaced()) endGame();
            }, d2);
        }
    }

    function animatePlace(shape,row,col){
        var cells=boardEl.querySelectorAll('.cell');
        for(var r=0;r<shape.length;r++) for(var c=0;c<shape[r].length;c++){
            if(!shape[r][c]) continue;
            var cell=cells[(row+r)*GRID+(col+c)];
            cell.classList.add('placed-pop');
            (function(el){setTimeout(function(){el.classList.remove('placed-pop');},250);})(cell);
        }
    }

    // === Line Clearing ===
    function checkAndClear(){
        var rowsC=[], colsC=[];
        for(var r=0;r<GRID;r++){
            var full=true;
            for(var c=0;c<GRID;c++) if(grid[r][c]===null){full=false;break;}
            if(full) rowsC.push(r);
        }
        for(var c=0;c<GRID;c++){
            var full2=true;
            for(var r2=0;r2<GRID;r2++) if(grid[r2][c]===null){full2=false;break;}
            if(full2) colsC.push(c);
        }
        var total=rowsC.length+colsC.length;
        if(total===0) return 0;

        var toClear = new Set();
        rowsC.forEach(function(r){ for(var c=0;c<GRID;c++) toClear.add(r*GRID+c); });
        colsC.forEach(function(c){ for(var r=0;r<GRID;r++) toClear.add(r*GRID+c); });

        // Track targets and icons cleared
        var targetsCleared = 0;
        toClear.forEach(function(idx){
            var r=Math.floor(idx/GRID), c=idx%GRID;
            var v = grid[r][c];
            if(typeof v==='object' && v) {
                if(v.target) targetsCleared++;
                // Collection mode: collect icons
                if(v.icon && mode === 'collect') {
                    collectProgress[v.icon] = (collectProgress[v.icon] || 0) + 1;
                    AudioManager.sfx.collect();
                }
            }
            grid[r][c]=null;
        });
        if(mode==='adventure' && LEVELS[advLevel].obj.type==='targets') advTargetsLeft -= targetsCleared;

        // Animate
        clearAnimating = true;
        var cells=boardEl.querySelectorAll('.cell');
        toClear.forEach(function(idx){ cells[idx].classList.add('flash'); });

        if(opts.flashy){
            toClear.forEach(function(idx){
                spawnParticles(idx);
            });
        }

        setTimeout(function(){
            toClear.forEach(function(idx){ cells[idx].classList.add('clearing'); });
            setTimeout(function(){
                renderBoard();
                clearAnimating=false;
            }, opts.flashy ? 600 : 300);
        }, 200);

        return total;
    }

    // === Adventure ===
    function updateAdvProgress(linesCleared){
        var lv = LEVELS[advLevel];
        if(lv.obj.type==='targets'){
            var cleared = lv.obj.count - advTargetsLeft;
            objProg.textContent = cleared + '/' + lv.obj.count;
        } else {
            advLinesLeft = Math.max(0, advLinesLeft - linesCleared);
            var done = lv.obj.count - advLinesLeft;
            objProg.textContent = done + '/' + lv.obj.count;
        }
    }
    function checkAdvComplete(){
        var lv = LEVELS[advLevel];
        if(lv.obj.type==='targets') return advTargetsLeft<=0;
        return advLinesLeft<=0;
    }
    function completeLevel(){
        gameOver = true;
        AudioManager.sfx.levelComplete();
        var lv = LEVELS[advLevel];
        var stars = 0;
        for(var i=0;i<3;i++) if(score>=lv.stars[i]) stars=i+1;
        var prev = advProgress[advLevel]||0;
        if(stars>prev) advProgress[advLevel]=stars;
        else if(prev===0) advProgress[advLevel]=1;
        saveProgress();

        lvScoreEl.textContent = score;
        $('level-complete-title').textContent = 'LEVEL COMPLETE!';
        for(var s=1;s<=3;s++){
            var el = $('star-'+s);
            el.textContent = s<=stars ? '\u2605' : '\u2606';
            el.className = 'star' + (s<=stars?' earned':'');
            if(s<=stars) el.style.animationDelay = (s*0.2)+'s';
            if(s<=stars) AudioManager.sfx.star(s*0.3);
        }

        var nextBtn = $('btn-next-level');
        nextBtn.style.display = advLevel < LEVELS.length-1 ? '' : 'none';
        lcOverlay.classList.remove('hidden');
    }

    // === Collection Complete ===
    function completeCollection(){
        gameOver = true;
        AudioManager.sfx.levelComplete();
        saveBest();

        lvScoreEl.textContent = score;
        $('level-complete-title').textContent = 'COLLECTION COMPLETE!';
        // Award stars based on score
        var stars = 1;
        if (score >= 200) stars = 2;
        if (score >= 400) stars = 3;
        for(var s=1;s<=3;s++){
            var el = $('star-'+s);
            el.textContent = s<=stars ? '\u2605' : '\u2606';
            el.className = 'star' + (s<=stars?' earned':'');
            if(s<=stars) el.style.animationDelay = (s*0.2)+'s';
            if(s<=stars) AudioManager.sfx.star(s*0.3);
        }

        $('btn-next-level').style.display = 'none';
        lcOverlay.classList.remove('hidden');
    }

    // === Particles ===
    function spawnParticles(cellIdx){
        var cells=boardEl.querySelectorAll('.cell');
        var cell=cells[cellIdx];
        var rect=cell.getBoundingClientRect();
        var wrapRect=boardWrap.getBoundingClientRect();
        var cx=rect.left-wrapRect.left+rect.width/2;
        var cy=rect.top-wrapRect.top+rect.height/2;
        var colors=['#ff6b6b','#ffd700','#51cf66','#339af0','#cc5de8','#ff9ff3','#ffeaa7'];
        for(var i=0;i<6;i++){
            var p=document.createElement('div');
            p.className='particle';
            var sz=4+Math.random()*6;
            p.style.width=sz+'px'; p.style.height=sz+'px';
            p.style.left=cx+'px'; p.style.top=cy+'px';
            p.style.background=colors[Math.floor(Math.random()*colors.length)];
            var angle=Math.random()*Math.PI*2;
            var dist=30+Math.random()*50;
            p.style.setProperty('--tx', Math.cos(angle)*dist+'px');
            p.style.setProperty('--ty', Math.sin(angle)*dist+'px');
            p.style.setProperty('--duration', (0.5+Math.random()*0.5)+'s');
            particleEl.appendChild(p);
            (function(el){setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},1200);})(p);
        }
        if(Math.random()<0.4){
            var sp=document.createElement('div');
            sp.className='sparkle';
            sp.textContent='\u2728';
            sp.style.left=cx+'px'; sp.style.top=cy+'px';
            sp.style.setProperty('--tx',(Math.random()-0.5)*40+'px');
            sp.style.setProperty('--ty',-(20+Math.random()*30)+'px');
            particleEl.appendChild(sp);
            setTimeout(function(){if(sp.parentNode)sp.parentNode.removeChild(sp);},1000);
        }
    }

    function screenShake(){
        boardWrap.classList.add('screen-shake');
        setTimeout(function(){boardWrap.classList.remove('screen-shake');},300);
    }

    // === Score Popup ===
    function showScorePopup(pts){
        var popup=document.createElement('div');
        popup.className='score-popup';
        popup.textContent='+'+pts;
        var br=boardWrap.getBoundingClientRect();
        popup.style.left=(br.width/2-30)+'px';
        popup.style.top=(br.height/2)+'px';
        boardWrap.appendChild(popup);
        setTimeout(function(){if(popup.parentNode)popup.parentNode.removeChild(popup);},1000);
    }

    // === Combo Display ===
    var comboTimer=null;
    function showCombo(lines,st){
        var t='';
        if(lines>=4) t='INCREDIBLE! \u00d7'+lines;
        else if(lines===3) t='AMAZING! \u00d73';
        else if(lines===2) t='DOUBLE!';
        else if(st>2) t='STREAK \u00d7'+st;
        else if(st===2) t='COMBO!';
        if(!t) return;
        comboTxt.textContent=t;
        comboDisp.classList.remove('hidden');
        comboTxt.style.animation='none';
        void comboTxt.offsetHeight;
        comboTxt.style.animation='';
        clearTimeout(comboTimer);
        comboTimer=setTimeout(function(){comboDisp.classList.add('hidden');},1500);
    }

    // === Game Over ===
    function endGame(){
        gameOver=true;
        stopBlastTimer();
        AudioManager.sfx.gameOver();
        AudioManager.stopMusic();
        finalScoreEl.textContent=score;
        saveBest();
        if(score>=bestScore&&score>0) newBestEl.classList.remove('hidden');
        else newBestEl.classList.add('hidden');
        goOverlay.classList.remove('hidden');
    }

    // === Navigation / Button Handlers ===
    function goToMenu(){
        gameOver=true; stopBlastTimer(); AudioManager.stopMusic();
        goOverlay.classList.add('hidden');
        lcOverlay.classList.add('hidden');
        pauseOverlay.classList.add('hidden');
        showScreen('main-menu');
    }

    // === Init ===
    function init(){
        loadOptions();
        loadProgress();
        createBoard();

        // Menu buttons
        $('btn-classic').addEventListener('click',function(){ AudioManager.sfx.click(); startGame('classic'); });
        $('btn-adventure').addEventListener('click',function(){ AudioManager.sfx.click(); buildLevelGrid(); showScreen('level-select'); });
        $('btn-blast').addEventListener('click',function(){ AudioManager.sfx.click(); startGame('blast'); });
        $('btn-collect').addEventListener('click',function(){ AudioManager.sfx.click(); startGame('collect'); });
        $('btn-options-open').addEventListener('click',function(){ AudioManager.sfx.click(); showScreen('options-screen'); });

        // Back buttons
        $('btn-levels-back').addEventListener('click',function(){ AudioManager.sfx.click(); showScreen('main-menu'); });
        $('btn-options-back').addEventListener('click',function(){ AudioManager.sfx.click(); saveOptions(); showScreen('main-menu'); });
        $('btn-game-back').addEventListener('click',function(){ AudioManager.sfx.click(); goToMenu(); });

        // Game buttons
        $('btn-pause').addEventListener('click',function(){
            if(gameOver) return;
            paused=true; pauseOverlay.classList.remove('hidden');
        });
        $('btn-resume').addEventListener('click',function(){ paused=false; pauseOverlay.classList.add('hidden'); });
        $('btn-pause-menu').addEventListener('click',function(){ goToMenu(); });

        // Overlay buttons
        $('btn-play-again').addEventListener('click',function(){ AudioManager.sfx.click(); goOverlay.classList.add('hidden'); startGame(mode); });
        $('btn-gameover-menu').addEventListener('click',function(){ AudioManager.sfx.click(); goToMenu(); });
        $('btn-next-level').addEventListener('click',function(){
            AudioManager.sfx.click(); lcOverlay.classList.add('hidden');
            advLevel++; startGame('adventure');
        });
        $('btn-levelcomplete-menu').addEventListener('click',function(){ AudioManager.sfx.click(); goToMenu(); });

        // Options listeners
        ['opt-sfx','opt-music','opt-vibration','opt-flashy'].forEach(function(id){
            $(id).addEventListener('change', saveOptions);
        });

        // Movement segmented control
        var segBtns = document.querySelectorAll('#opt-movement .seg-btn');
        for (var i = 0; i < segBtns.length; i++) {
            segBtns[i].addEventListener('click', function(e) {
                var val = e.currentTarget.dataset.val;
                opts.movement = val;
                var btns = document.querySelectorAll('#opt-movement .seg-btn');
                for (var j = 0; j < btns.length; j++) {
                    btns[j].classList.toggle('active', btns[j].dataset.val === val);
                }
                localStorage.setItem('bbOpts', JSON.stringify(opts));
                AudioManager.sfx.click();
            });
        }

        window.addEventListener('resize', updateBoardMetrics);

        // Ensure audio context on first user interaction
        document.addEventListener('touchstart', function(){ AudioManager.ensureContext(); }, {once:true});
        document.addEventListener('mousedown', function(){ AudioManager.ensureContext(); }, {once:true});

        showScreen('main-menu');
    }

    init();
})();
