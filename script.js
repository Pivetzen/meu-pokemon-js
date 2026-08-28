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
        // 0: Grama, 1: Árvore/Parede, 2: Porta, 3: Parede Casa, 7: Grama Alta (Batalha)
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 7, 7, 7, 0, 1],
            [1, 0, 3, 3, 3, 7, 7, 7, 0, 1],
            [1, 0, 3, 2, 3, 7, 7, 7, 0, 1],
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
                x: 8,
                y: 4,
                direction: 'left',
                dialogue: [
                    "OAK: Cuidado com a grama alta acima!",
                    "OAK: Monstros selvagens podem aparecer la."
                ]
            }
        ]
    },
    house: {
        grid: [
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 5, 5, 5, 5, 5, 4],
            [4, 5, 5, 5, 6, 6, 5, 5, 5, 4],
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
                    "MAE: Recupere as energias do seu monstro antes de lutar!"
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
    } else if (type === 'tallGrass') {
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARKEST;
        // Arbusto mais denso de grama alta
        cx.fillRect(1, 2, 3, 12); cx.fillRect(5, 1, 3, 14);
        cx.fillRect(9, 3, 3, 11); cx.fillRect(13, 2, 2, 12);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(2, 4, 1, 8); cx.fillRect(6, 3, 1, 10);
    } else if (type === 'wall') {
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(2, 2, 12, 12);
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(4, 4, 3, 3);
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
    } else if (type === 'indoorWall') {
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(0, 0, 16, 16);
    } else if (type === 'woodFloor') {
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.LIGHTEST;
        cx.fillRect(0, 0, 16, 1);
    } else if (type === 'mat') {
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(2, 2, 12, 12);
    }

    return c;
}

function createMonsterSprite(type) {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const cx = c.getContext('2d');

    cx.fillStyle = COLOR.DARKEST;
    if (type === 'hero') {
        // Dragãozinho (Costas)
        cx.fillRect(8, 8, 16, 18);
        cx.fillRect(4, 14, 4, 8);
        cx.fillRect(24, 14, 4, 8);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(10, 12, 12, 10);
    } else {
        // Monstro Selvagem (Frente)
        cx.fillRect(6, 6, 20, 20);
        cx.fillStyle = COLOR.LIGHTEST;
        cx.fillRect(10, 10, 4, 4); cx.fillRect(18, 10, 4, 4); // Olhos
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(11, 11, 2, 2); cx.fillRect(19, 11, 2, 2);
        cx.fillRect(10, 18, 12, 3); // Boca
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

    if (direction === 'down') { cx.fillRect(5, 4, 2, 2); cx.fillRect(9, 4, 2, 2); }
    else if (direction === 'left') { cx.fillRect(5, 4, 2, 2); }
    else if (direction === 'right') { cx.fillRect(9, 4, 2, 2); }

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
    6: createTileSprite('mat'),
    7: createTileSprite('tallGrass')
};

const sprites = {
    player: createCharSpriteSet(COLOR.LIGHTEST),
    npc: createCharSpriteSet(COLOR.DARK),
    heroMonster: createMonsterSprite('hero'),
    wildMonster: createMonsterSprite('wild')
};

// Jogador
const player = {
    x: 1,
    y: 1,
    pixelX: 16,
    pixelY: 16,
    targetPixelX: 16,
    targetPixelY: 16,
    speed: 1,
    direction: 'down',
    isMoving: false,
    monster: { name: 'PIKACHU', hp: 20, maxHp: 20, level: 5 }
};

// Gerenciador de Batalha
const battleSystem = {
    active: false,
    state: 'intro', // 'intro', 'player_turn', 'enemy_turn', 'message', 'ended'
    flashTimer: 0,
    selectedOption: 0, // 0 = ATACAR, 1 = FUGIR
    enemy: null,
    message: '',

    start() {
        this.active = true;
        this.state = 'intro_flash';
        this.flashTimer = 0;
        this.selectedOption = 0;
        this.enemy = { name: 'RATATA', hp: 15, maxHp: 15, level: 3 };
        this.message = `Um ${this.enemy.name} selvagem apareceu!`;
    },

    handleInput(key) {
        if (this.state === 'intro_flash') return;

        if (this.state === 'message') {
            if (['a', 'A', 'Enter', ' '].includes(key)) {
                if (this.enemy.hp <= 0 || player.monster.hp <= 0) {
                    this.endBattle();
                } else {
                    this.state = 'player_turn';
                }
            }
            return;
        }

        if (this.state === 'player_turn') {
            if (key === 'ArrowUp' || key === 'w' || key === 'W') this.selectedOption = 0;
            if (key === 'ArrowDown' || key === 's' || key === 'S') this.selectedOption = 1;

            if (['a', 'A', 'Enter', ' '].includes(key)) {
                if (this.selectedOption === 0) {
                    // Atacar
                    const damage = Math.floor(Math.random() * 4) + 4;
                    this.enemy.hp = Math.max(0, this.enemy.hp - damage);
                    this.message = `${player.monster.name} atacou! Causou ${damage} de dano.`;
                    this.state = 'message';

                    if (this.enemy.hp > 0) {
                        setTimeout(() => this.triggerEnemyTurn(), 1200);
                    }
                } else {
                    // Fugir
                    this.message = "Voce fugiu com seguranca!";
                    this.state = 'message';
                    this.enemy.hp = 0; // Encerra a batalha ao prosseguir
                }
            }
        }
    },

    triggerEnemyTurn() {
        if (!this.active || this.enemy.hp <= 0) return;
        const damage = Math.floor(Math.random() * 3) + 2;
        player.monster.hp = Math.max(0, player.monster.hp - damage);
        this.message = `${this.enemy.name} atacou! Causou ${damage} de dano.`;
        this.state = 'message';

        if (player.monster.hp <= 0) {
            this.message = `${player.monster.name} fainted! Voce perdeu...`;
        }
    },

    endBattle() {
        this.active = false;
        if (player.monster.hp <= 0) {
            player.monster.hp = player.monster.maxHp; // Cura ao perder
            executeWarp({ targetMap: 'house', targetX: 2, targetY: 3, targetDir: 'down' });
        }
    },

    update() {
        if (this.state === 'intro_flash') {
            this.flashTimer++;
            if (this.flashTimer > 30) {
                this.state = 'message';
            }
        }
    },

    draw() {
        if (this.state === 'intro_flash') {
            if (Math.floor(this.flashTimer / 4) % 2 === 0) {
                ctx.fillStyle = COLOR.DARKEST;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        // Fundo
        ctx.fillStyle = COLOR.LIGHTEST;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Monstro Inimigo (Canto superior direito)
        ctx.drawImage(sprites.wildMonster, 110, 12);
        // HUD Inimigo
        ctx.fillStyle = COLOR.DARKEST;
        ctx.font = '8px monospace';
        ctx.fillText(`${this.enemy.name} L${this.enemy.level}`, 8, 12);
        ctx.strokeRect(8, 20, 50, 4);
        ctx.fillRect(8, 20, (this.enemy.hp / this.enemy.maxHp) * 50, 4);

        // Monstro do Jogador (Canto inferior esquerdo)
        ctx.drawImage(sprites.heroMonster, 16, 50);
        // HUD Jogador
        ctx.fillText(`${player.monster.name} L${player.monster.level}`, 88, 56);
        ctx.strokeRect(88, 64, 50, 4);
        ctx.fillRect(88, 64, (player.monster.hp / player.monster.maxHp) * 50, 4);
        ctx.fillText(`HP:${player.monster.hp}/${player.monster.maxHp}`, 88, 74);

        // Caixa de Controle / Mensagem Inferior
        ctx.fillStyle = COLOR.LIGHTEST;
        ctx.fillRect(0, 90, 160, 54);
        ctx.strokeStyle = COLOR.DARKEST;
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 92, 156, 50);

        if (this.state === 'player_turn') {
            // Menu de Opções
            ctx.fillStyle = COLOR.DARKEST;
            ctx.fillText("ATACAR", 20, 108);
            ctx.fillText("FUGIR", 20, 124);
            // Seta de Seleção
            const arrowY = this.selectedOption === 0 ? 108 : 124;
            ctx.fillText(">", 10, arrowY);
        } else {
            // Exibição de Mensagens
            ctx.fillStyle = COLOR.DARKEST;
            ctx.fillText(this.message, 10, 108);
        }
    }
};

// Gerenciador de Transição de Tela
const transitionManager = {
    active: false,
    alpha: 0,
    state: 'none',
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

// Diálogos
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
    if (battleSystem.active) {
        battleSystem.handleInput(e.key);
        return;
    }

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
        if (battleSystem.active) {
            battleSystem.handleInput(keyName);
            return;
        }
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
    if (transitionManager.active || battleSystem.active) return;

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

function isSolid(tileX, tileY) {
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) return true;
    const currentMap = maps[currentMapId];
    const tileVal = currentMap.grid[tileY][tileX];

    if (tileVal === 1 || tileVal === 3 || tileVal === 4) return true;

    const npcHere = currentMap.npcs.some(npc => npc.x === tileX && npc.y === tileY);
    if (npcHere) return true;

    return false;
}

function update() {
    if (battleSystem.active) {
        battleSystem.update();
        return;
    }

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

            const currentMap = maps[currentMapId];
            
            // Checa portal
            const warpHit = currentMap.warps.find(w => w.x === player.x && w.y === player.y);
            if (warpHit) {
                transitionManager.start(warpHit);
                return;
            }

            // Checa Encontro Aleatório na Grama Alta (30% de chance a cada passo)
            if (currentMap.grid[player.y][player.x] === 7) {
                if (Math.random() < 0.3) {
                    battleSystem.start();
                }
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
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (battleSystem.active) {
        battleSystem.draw();
        return;
    }

    const currentMap = maps[currentMapId];

    // Desenhar Mapa
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tileType = currentMap.grid[r][c];
            ctx.drawImage(tileSprites[tileType], c * TILE_SIZE, r * TILE_SIZE);
        }
    }

    // Desenhar NPCs
    currentMap.npcs.forEach(npc => {
        const npcSprite = sprites.npc[npc.direction];
        ctx.drawImage(npcSprite, npc.x * TILE_SIZE, npc.y * TILE_SIZE);
    });

    // Desenhar Jogador
    const playerSprite = sprites.player[player.direction];
    ctx.drawImage(playerSprite, player.pixelX, player.pixelY);

    // Caixa de Diálogo
    drawDialogueBox();

    // Transição de Tela
    transitionManager.draw();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
