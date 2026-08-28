const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 16;
const COLS = 10;
const ROWS = 9;

// Paleta de Cores Clássica do GameBoy (Monocromática)
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

// Gerador Dinâmico de Sprites em Tela (Pixel Art Procedural)
function createTileSprite(type) {
    const c = document.createElement('canvas');
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    const cx = c.getContext('2d');

    if (type === 'grass') {
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARK;
        // Detalhes de folhinhas de grama
        cx.fillRect(3, 4, 1, 3); cx.fillRect(4, 5, 1, 2);
        cx.fillRect(11, 10, 1, 3); cx.fillRect(12, 11, 1, 2);
    } else if (type === 'wall') {
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(0, 0, 16, 16);
        // Desenho de copa de árvore retro
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(2, 2, 12, 12);
        cx.fillStyle = COLOR.LIGHT;
        cx.fillRect(4, 4, 3, 3);
        cx.fillRect(9, 4, 3, 3);
    }
    return c;
}

function createPlayerSprite(direction, frame) {
    const c = document.createElement('canvas');
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    const cx = c.getContext('2d');

    // Corpo / Cabeça base
    cx.fillStyle = COLOR.DARKEST;
    
    // Cabeça
    cx.fillRect(4, 1, 8, 6);
    // Boné/Cabelo detalhe
    cx.fillStyle = COLOR.LIGHTEST;
    cx.fillRect(5, 2, 6, 2);
    cx.fillStyle = COLOR.DARKEST;

    // Olhos conforme direção
    if (direction === 'down') {
        cx.fillRect(5, 4, 2, 2);
        cx.fillRect(9, 4, 2, 2);
    } else if (direction === 'up') {
        // Costas do personagem
        cx.fillRect(4, 1, 8, 6);
    } else if (direction === 'left') {
        cx.fillRect(5, 4, 2, 2);
    } else if (direction === 'right') {
        cx.fillRect(9, 4, 2, 2);
    }

    // Corpo
    cx.fillRect(4, 7, 8, 5);

    // Pernas com alternância de animação (frame 0 = parado, 1 = perna esq, 2 = perna dir)
    const legOffset = (frame === 1) ? -1 : (frame === 2) ? 1 : 0;
    
    // Perna Esquerda
    cx.fillRect(4 + (frame === 1 ? -1 : 0), 12, 3, 4);
    // Perna Direita
    cx.fillRect(9 + (frame === 2 ? 1 : 0), 12, 3, 4);

    return c;
}

// Inicializar Sprites
const sprites = {
    grass: createTileSprite('grass'),
    wall: createTileSprite('wall'),
    player: {
        down: [createPlayerSprite('down', 0), createPlayerSprite('down', 1), createPlayerSprite('down', 2)],
        up: [createPlayerSprite('up', 0), createPlayerSprite('up', 1), createPlayerSprite('up', 2)],
        left: [createPlayerSprite('left', 0), createPlayerSprite('left', 1), createPlayerSprite('left', 2)],
        right: [createPlayerSprite('right', 0), createPlayerSprite('right', 1), createPlayerSprite('right', 2)]
    }
};

// Estado do Jogador
const player = {
    x: 1,
    y: 1,
    pixelX: 16,
    pixelY: 16,
    targetPixelX: 16,
    targetPixelY: 16,
    speed: 1, // Velocidade de movimento (1px por frame)
    direction: 'down',
    isMoving: false,
    animFrame: 0,
    animTimer: 0
};

// Teclado
const keys = {};

window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Suporte mobile/toque
function bindTouchButton(elementId, keyName) {
    const btn = document.getElementById(elementId);
    const start = (e) => { e.preventDefault(); keys[keyName] = true; };
    const end = (e) => { e.preventDefault(); keys[keyName] = false; };
    btn.addEventListener('touchstart', start);
    btn.addEventListener('touchend', end);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
}

bindTouchButton('btnUp', 'ArrowUp');
bindTouchButton('btnDown', 'ArrowDown');
bindTouchButton('btnLeft', 'ArrowLeft');
bindTouchButton('btnRight', 'ArrowRight');

function isSolid(tileX, tileY) {
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) return true;
    return map[tileY][tileX] === 1;
}

function update() {
    if (!player.isMoving) {
        let nextX = player.x;
        let nextY = player.y;
        let requestedDirection = null;

        if (keys.ArrowUp || keys.w || keys.W) { nextY--; requestedDirection = 'up'; }
        else if (keys.ArrowDown || keys.s || keys.S) { nextY++; requestedDirection = 'down'; }
        else if (keys.ArrowLeft || keys.a || keys.A) { nextX--; requestedDirection = 'left'; }
        else if (keys.ArrowRight || keys.d || keys.D) { nextX++; requestedDirection = 'right'; }

        if (requestedDirection) {
            player.direction = requestedDirection; // Vira para a direção imediatamente

            if (!isSolid(nextX, nextY)) {
                player.x = nextX;
                player.y = nextY;
                player.targetPixelX = nextX * TILE_SIZE;
                player.targetPixelY = nextY * TILE_SIZE;
                player.isMoving = true;
            }
        }
    }

    // Movimentação pixel a pixel e troca de quadros da animação
    if (player.isMoving) {
        if (player.pixelX < player.targetPixelX) player.pixelX += player.speed;
        if (player.pixelX > player.targetPixelX) player.pixelX -= player.speed;
        if (player.pixelY < player.targetPixelY) player.pixelY += player.speed;
        if (player.pixelY > player.targetPixelY) player.pixelY -= player.speed;

        // Animação dos passos
        player.animTimer++;
        if (player.animTimer % 8 === 0) {
            player.animFrame = (player.animFrame === 1) ? 2 : 1;
        }

        // Chegou ao destino na grade
        if (player.pixelX === player.targetPixelX && player.pixelY === player.targetPixelY) {
            player.isMoving = false;
            player.animFrame = 0; // Volta para o frame parado
            player.animTimer = 0;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar Mapa com Tiles
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tileType = map[r][c] === 1 ? 'wall' : 'grass';
            ctx.drawImage(sprites[tileType], c * TILE_SIZE, r * TILE_SIZE);
        }
    }

    // Desenhar Jogador Animado
    const currentSprite = sprites.player[player.direction][player.animFrame];
    ctx.drawImage(currentSprite, player.pixelX, player.pixelY);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
