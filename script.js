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

// Mapa: 0 = Grama, 1 = Parede/Árvore
const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Gerador Dinâmico de Sprites em Tela (Pixel Art)
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
    }
    return c;
}

function createCharacterSprite(colorTheme, direction) {
    const c = document.createElement('canvas');
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    const cx = c.getContext('2d');

    // Cabeça
    cx.fillStyle = COLOR.DARKEST;
    cx.fillRect(4, 1, 8, 6);
    
    // Detalhe do cabelo/boné (diferencia o NPC do player)
    cx.fillStyle = colorTheme;
    cx.fillRect(5, 2, 6, 2);

    cx.fillStyle = COLOR.DARKEST;
    // Olhos conforme direção
    if (direction === 'down') {
        cx.fillRect(5, 4, 2, 2);
        cx.fillRect(9, 4, 2, 2);
    } else if (direction === 'left') {
        cx.fillRect(5, 4, 2, 2);
    } else if (direction === 'right') {
        cx.fillRect(9, 4, 2, 2);
    }

    // Corpo e Pernas
    cx.fillRect(4, 7, 8, 5);
    cx.fillRect(4, 12, 3, 4);
    cx.fillRect(9, 12, 3, 4);

    return c;
}

// Criar conjunto de Sprites do Personagem
function createCharSpriteSet(colorTheme) {
    return {
        down: createCharacterSprite(colorTheme, 'down'),
        up: createCharacterSprite(colorTheme, 'up'),
        left: createCharacterSprite(colorTheme, 'left'),
        right: createCharacterSprite(colorTheme, 'right')
    };
}

const sprites = {
    grass: createTileSprite('grass'),
    wall: createTileSprite('wall'),
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

// Lista de NPCs no mapa
const npcs = [
    {
        id: 'prof_oak',
        x: 5,
        y: 4,
        direction: 'down',
        dialogue: [
            "OAK: Ola! Bem-vindo ao mundo dos monstros!",
            "OAK: Pressione A para interagir com as coisas."
        ]
    }
];

// Gerenciador do Sistema de Diálogos
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

        // Vira o NPC para olhar na direção do Jogador
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
            this.active = false; // Fecha a caixa de diálogo
        }
    }
};

// Controles de Teclado
const keys = {};

window.addEventListener('keydown', (e) => {
    // Interagir com Botão A (Teclas: Enter, Espaço, 'z', 'Z', 'a', 'A')
    if (['Enter', ' ', 'z', 'Z', 'a', 'A'].includes(e.key)) {
        handleInteract();
    }
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Suporte para Botões Mobile / Tela
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

// Ação de Interação (Botão A)
function handleInteract() {
    // Se a caixa de texto já estiver aberta, avança o texto
    if (dialogueSystem.active) {
        dialogueSystem.advance();
        return;
    }

    // Se o jogador estiver andando, não interage
    if (player.isMoving) return;

    // Calcula o bloco exatamente à frente do jogador
    let targetX = player.x;
    let targetY = player.y;

    if (player.direction === 'up') targetY--;
    else if (player.direction === 'down') targetY++;
    else if (player.direction === 'left') targetX--;
    else if (player.direction === 'right') targetX++;

    // Verifica se existe um NPC nessa posição
    const hitNpc = npcs.find(npc => npc.x === targetX && npc.y === targetY);
    if (hitNpc) {
        dialogueSystem.start(hitNpc.dialogue, hitNpc);
    }
}

// Checa Colisão (Limites do mapa, paredes e NPCs)
function isSolid(tileX, tileY) {
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) return true;
    if (map[tileY][tileX] === 1) return true;
    
    // NPC é um obstáculo sólido
    const npcHere = npcs.some(npc => npc.x === tileX && npc.y === tileY);
    if (npcHere) return true;

    return false;
}

function update() {
    // Se o diálogo estiver ativo, bloqueia a movimentação do jogador
    if (dialogueSystem.active) return;

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
        }
    }
}

function drawDialogueBox() {
    if (!dialogueSystem.active) return;

    // Dimensões e Posição da Caixa de Diálogo (Estilo GB)
    const boxX = 4;
    const boxY = 96;
    const boxWidth = 152;
    const boxHeight = 44;

    // Fundo da Caixa
    ctx.fillStyle = COLOR.LIGHTEST;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Bordas Duplas Retro
    ctx.strokeStyle = COLOR.DARKEST;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4);

    // Estilo do Texto
    ctx.fillStyle = COLOR.DARKEST;
    ctx.font = '8px monospace';
    ctx.textBaseline = 'top';

    // Quebra texto longo em linhas simples
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

    // Indicador de "Pressione A para Avançar" (Seta piscante)
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

    // Desenhar Mapa
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tileType = map[r][c] === 1 ? 'wall' : 'grass';
            ctx.drawImage(sprites[tileType], c * TILE_SIZE, r * TILE_SIZE);
        }
    }

    // Desenhar NPCs
    npcs.forEach(npc => {
        const npcSprite = sprites.npc[npc.direction];
        ctx.drawImage(npcSprite, npc.x * TILE_SIZE, npc.y * TILE_SIZE);
    });

    // Desenhar Jogador
    const playerSprite = sprites.player[player.direction];
    ctx.drawImage(playerSprite, player.pixelX, player.pixelY);

    // Desenhar Caixa de Diálogo
    drawDialogueBox();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
