const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 16;
const COLS = 10;
const ROWS = 9;

// Paleta de Cores Clássica do GameBoy
const COLOR = {
    DARKEST: '#0f380f',
    DARK: '#306230',
    LIGHT: '#8bac0f',
    LIGHTEST: '#9bbc0f'
};

// Definição dos Mapas
const maps = {
    town: {
        // 0: Grama, 1: Árvore/Parede, 2: Porta, 3: Parede de Casa
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 3, 3, 3, 0, 0, 1, 0, 1],
            [1, 0, 3, 2, 3, 0, 0, 1, 0, 1], // Porta na posição (3, 3)
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        warps: [
            { x: 3, y: 3, targetMap: 'house', targetX: 4, targetY: 7, targetDir: 'up' }
        ],
        npcs: [
            {
                id: 'prof_oak',
                x: 7,
                y: 4,
                direction: 'down',
                dialogue: [
                    "OAK: Ola! Bem-vindo a cidade!",
                    "OAK: Entre na casa a esquerda para ver o interior."
                ]
            }
        ]
    },
    house: {
        // 4: Parede Interna, 5: Piso Madeira, 6: Tapete de Saída
        grid: [
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 6, 6, 5, 5, 5, 4], // Tapetes de saída
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
        ],
        warps: [
            { x: 4, y: 7, targetMap: 'town', targetX: 3, targetY: 4, targetDir: 'down' },
            { x: 5, y: 7, targetMap: 'town', targetX: 3, targetY: 4, targetDir: 'down' }
        ],
        npcs: [
            {
                id: 'mom',
                x: 2,
                y: 2,
                direction: 'right',
                dialogue: [
                    "MAE: Descanse um pouco antes de sair em sua jornada!",
                    "MAE: Cuidado com a grama alta la fora!"
                ]
            }
        ]
    }
};

let currentMapId = 'town';

// Gerador Dinâmico de Sprites
function createTileSprite(type) {
    const c = document.createElement('canvas');
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    const cx = c.getContext('2d');

    if (type === 'grass') {
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(3, 4, 1, 3); cx.fillRect(4, 5, 1, 2);
        cx.fillRect(11, 10, 1, 3); cx.fillRect(12, 11, 1, 2);
    } else if (type === 'wall') {
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(2, 2, 12, 12);
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(4, 4, 3, 3);
        cx.fillRect(9, 4, 3, 3);
    } else if (type === 'houseWall') {
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(1, 1, 14, 14);
    } else if (type === 'door') {
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.LIGHTEST;
        cx.fillRect(3, 3, 10, 13);
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(4, 8, 2, 2);
    } else if (type === 'indoorWall') {
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(0, 12, 16, 4);
    } else if (type === 'woodFloor') {
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.LIGHTEST;
        cx.fillRect(0, 0, 16, 1);
        cx.fillRect(0, 8, 16, 1);
    } else if (type === 'mat') {
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(2, 2, 12, 12);
    }

    return c;
}

function createCharacterSprite(colorTheme, direction) {
    const c = document.createElement('canvas');
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    const cx = c.getContext('2d');

    cx.fillStyle = COLOR.DARKEST;
    cx.fillRect(4, 1, 8, 6);
    
    cx.fillStyle = colorTheme;
    cx.fillRect(5, 2, 6, 2);

    cx.fillStyle = COLOR.DARKEST;
    if (direction === 'down') {
        cx.fillRect(5, 4, 2, 2);
        cx.fillRect(9, 4, 2, 2);
    } else if (direction === 'left') {
        cx.fillRect(5, 4, 2, 2);
    } else if (direction === 'right') {
        cx.fillRect(9, 4, 2, 2);
    }

    cx.fillRect(4, 7, 8, 5);
    cx.fillRect(4, 12, 3, 4);
    cx.fillRect(9, 12, 3, 4);

    return c;
}

function createCharSpriteSet(colorTheme) {
    return {
        down: createCharacterSprite(colorTheme, 'down'),
        up: createCharacterSprite(colorTheme, 'up'),
        left: createCharacterSprite(colorTheme, 'left'),
        right: createCharacterSprite(colorTheme, 'right')
    };
}

const tileSprites = {
    0: createTileSprite('grass'),
    1: createTileSprite('wall'),
    2: createTileSprite('door'),
    3: createTileSprite('houseWall'),
    4: createTileSprite('indoorWall'),
    5: createTileSprite('woodFloor'),
    6: createTileSprite('mat')
};

const sprites = {
    player: createCharSpriteSet(COLOR.LIGHTEST),
    npc: createCharSpriteSet(COLOR.DARK)
};

// Estado do Jogador
const player = {
    x: 1,
    y: 1,
    pixelX: 16,
    pixelY: 16,
    targetPixelX: 16,
    targetPixelY: 16,
    speed: 1,
    direction: 'down',
    isMoving: false
};

// Gerenciador de Transição de Tela (Fade In / Fade Out)
const transitionManager = {
    active: false,
    alpha: 0,
    state: 'none', // 'fade_out', 'fade_in'
    pendingWarp: null,

    start(warp) {
        this.active = true;
        this.alpha = 0;
        this.state = 'fade_out';
        this.pendingWarp = warp;
    },

    update() {
        if (!this.active) return;

        if (this.state === 'fade_out') {
            this.alpha += 0.08;
            if (this.alpha >= 1) {
                this.alpha = 1;
                // Troca o mapa durante a tela totalmente preta
                executeWarp(this.pendingWarp);
                this.state = 'fade_in';
            }
        } else if (this.state === 'fade_in') {
            this.alpha -= 0.08;
            if (this.alpha <= 0) {
                this.alpha = 0;
                this.active = false;
                this.state = 'none';
            }
        }
    },

    draw() {
        if (this.alpha > 0) {
            ctx.fillStyle = `rgba(15, 56, 15, ${this.alpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
};

// Executa a teletransportação entre os mapas
function executeWarp(warp) {
    currentMapId = warp.targetMap;
    player.x = warp.targetX;
    player.y = warp.targetY;
    player.pixelX = warp.targetX * TILE_SIZE;
    player.pixelY = warp.targetY * TILE_SIZE;
    player.targetPixelX = player.pixelX;
    player.targetPixelY = player.pixelY;
    player.direction = warp.targetDir;
    player.isMoving = false;
}

// Gerenciador de Diálogos
const dialogueSystem = {
    active: false,
    lines: [],
    currentLineIndex: 0,
    speakerNpc: null,

    start(lines, npc = null) {
        this.lines = lines;
        this.currentLineIndex = 0;
        this.speakerNpc = npc;
        this.active = true;

        if (this.speakerNpc) {
            if (player.x < this.speakerNpc.x) this.speakerNpc.direction = 'left';
            else if (player.x > this.speakerNpc.x) this.speakerNpc.direction = 'right';
            else if (player.y < this.speakerNpc.y) this.speakerNpc.direction = 'up';
            else if (player.y > this.speakerNpc.y) this.speakerNpc.direction = 'down';
        }
    },

    advance() {
        this.currentLineIndex++;
        if (this.currentLineIndex >= this.lines.length) {
            this.active = false;
        }
    }
};

// Controles
const keys = {};

window.addEventListener('keydown', (e) => {
    if (['Enter', ' ', 'z', 'Z', 'a', 'A'].includes(e.key)) {
        handleInteract();
    }
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function bindTouchButton(elementId, keyName, isAction = false) {
    const btn = document.getElementById(elementId);
    const start = (e) => {
        e.preventDefault();
        if (isAction) {
            handleInteract();
        } else {
            keys[keyName] = true;
        }
    };
    const end = (e) => {
        e.preventDefault();
        if (!isAction) keys[keyName] = false;
    };

    btn.addEventListener('touchstart', start);
    btn.addEventListener('touchend', end);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
}

bindTouchButton('btnUp', 'ArrowUp');
bindTouchButton('btnDown', 'ArrowDown');
bindTouchButton('btnLeft', 'ArrowLeft');
bindTouchButton('btnRight', 'ArrowRight');
bindTouchButton('btnA', 'a', true);

function handleInteract() {
    if (transitionManager.active) return;

    if (dialogueSystem.active) {
        dialogueSystem.advance();
        return;
    }

    if (player.isMoving) return;

    let targetX = player.x;
    let targetY = player.y;

    if (player.direction === 'up') targetY--;
    else if (player.direction === 'down') targetY++;
    else if (player.direction === 'left') targetX--;
    else if (player.direction === 'right') targetX++;

    const currentMap = maps[currentMapId];
    const hitNpc = currentMap.npcs.find(npc => npc.x === targetX && npc.y === targetY);
    if (hitNpc) {
        dialogueSystem.start(hitNpc.dialogue, hitNpc);
    }
}

// Validação de Colisão
function isSolid(tileX, tileY) {
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) return true;
    
    const currentMap = maps[currentMapId];
    const tileVal = currentMap.grid[tileY][tileX];

    // Paredes e obstáculos sólidos
    if (tileVal === 1 || tileVal === 3 || tileVal === 4) return true;

    // Colisão com NPCs
    const npcHere = currentMap.npcs.some(npc => npc.x === tileX && npc.y === tileY);
    if (npcHere) return true;

    return false;
}

function update() {
    // Atualiza transições de tela
    transitionManager.update();

    if (dialogueSystem.active || transitionManager.active) return;

    if (!player.isMoving) {
        let nextX = player.x;
        let nextY = player.y;
        let requestedDirection = null;

        if (keys.ArrowUp || keys.w || keys.W) { nextY--; requestedDirection = 'up'; }
        else if (keys.ArrowDown || keys.s || keys.S) { nextY++; requestedDirection = 'down'; }
        else if (keys.ArrowLeft || keys.a || keys.A) { nextX--; requestedDirection = 'left'; }
        else if (keys.ArrowRight || keys.d || keys.D) { nextX++; requestedDirection = 'right'; }

        if (requestedDirection) {
            player.direction = requestedDirection;

            if (!isSolid(nextX, nextY)) {
                player.x = nextX;
                player.y = nextY;
                player.targetPixelX = nextX * TILE_SIZE;
                player.targetPixelY = nextY * TILE_SIZE;
                player.isMoving = true;
            }
        }
    }

    if (player.isMoving) {
        if (player.pixelX < player.targetPixelX) player.pixelX += player.speed;
        if (player.pixelX > player.targetPixelX) player.pixelX -= player.speed;
        if (player.pixelY < player.targetPixelY) player.pixelY += player.speed;
        if (player.pixelY > player.targetPixelY) player.pixelY -= player.speed;

        if (player.pixelX === player.targetPixelX && player.pixelY === player.targetPixelY) {
            player.isMoving = false;

            // Verifica se o jogador pisou em um portal ao terminar de andar
            const currentMap = maps[currentMapId];
            const warpHit = currentMap.warps.find(w => w.x === player.x && w.y === player.y);
            if (warpHit) {
                transitionManager.start(warpHit);
            }
        }
    }
}

function drawDialogueBox() {
    if (!dialogueSystem.active) return;

    const boxX = 4;
    const boxY = 96;
    const boxWidth = 152;
    const boxHeight = 44;

    ctx.fillStyle = COLOR.LIGHTEST;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.strokeStyle = COLOR.DARKEST;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4);

    ctx.fillStyle = COLOR.DARKEST;
    ctx.font = '8px monospace';
    ctx.textBaseline = 'top';

    const currentText = dialogueSystem.lines[dialogueSystem.currentLineIndex];
    const words = currentText.split(' ');
    let line1 = '';
    let line2 = '';

    for (let word of words) {
        if ((line1 + word).length <= 22) {
            line1 += word + ' ';
        } else {
            line2 += word + ' ';
        }
    }

    ctx.fillText(line1.trim(), boxX + 6, boxY + 8);
    if (line2) {
        ctx.fillText(line2.trim(), boxX + 6, boxY + 20);
    }

    if (Math.floor(Date.now() / 300) % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(boxX + boxWidth - 10, boxY + boxHeight - 10);
        ctx.lineTo(boxX + boxWidth - 6, boxY + boxHeight - 10);
        ctx.lineTo(boxX + boxWidth - 8, boxY + boxHeight - 6);
        ctx.closePath();
        ctx.fill();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentMap = maps[currentMapId];

    // Desenhar Mapa
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tileType = currentMap.grid[r][c];
            ctx.drawImage(tileSprites[tileType], c * TILE_SIZE, r * TILE_SIZE);
        }
    }

    // Desenhar NPCs do Mapa Atual
    currentMap.npcs.forEach(npc => {
        const npcSprite = sprites.npc[npc.direction];
        ctx.drawImage(npcSprite, npc.x * TILE_SIZE, npc.y * TILE_SIZE);
    });

    // Desenhar Jogador
    const playerSprite = sprites.player[player.direction];
    ctx.drawImage(playerSprite, player.pixelX, player.pixelY);

    // Desenhar Caixa de Diálogo
    drawDialogueBox();

    // Desenhar Transição
    transitionManager.draw();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
