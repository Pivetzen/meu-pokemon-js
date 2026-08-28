const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resolução original do Game Boy: 160x144 pixels (10x9 tiles de 16px)
const TILE_SIZE = 16;
const COLS = 10;
const ROWS = 9;

// Mapa de Matriz: 0 = Grama (livre), 1 = Parede/Obstáculo
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

// Estado do Jogador
const player = {
    x: 1, // Posição em tiles na grade
    y: 1,
    pixelX: 16,
    pixelY: 16,
    targetPixelX: 16,
    targetPixelY: 16,
    speed: 1, // Velocidade do movimento pixel a pixel
    isMoving: false
};

// Mapeamento de Teclas
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false
};

// Ouvintes de Teclado
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Suporte aos Botões da Tela (Mobile)
function bindTouchButton(elementId, keyName) {
    const btn = document.getElementById(elementId);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyName] = true; });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyName] = false; });
    btn.addEventListener('mousedown', () => { keys[keyName] = true; });
    btn.addEventListener('mouseup', () => { keys[keyName] = false; });
}

bindTouchButton('btnUp', 'ArrowUp');
bindTouchButton('btnDown', 'ArrowDown');
bindTouchButton('btnLeft', 'ArrowLeft');
bindTouchButton('btnRight', 'ArrowRight');

// Validação de Colisão
function isSolid(tileX, tileY) {
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) return true;
    return map[tileY][tileX] === 1;
}

// Atualização da Lógica
function update() {
    if (!player.isMoving) {
        let nextX = player.x;
        let nextY = player.y;

        if (keys.ArrowUp || keys.w) nextY--;
        else if (keys.ArrowDown || keys.s) nextY++;
        else if (keys.ArrowLeft || keys.a) nextX--;
        else if (keys.ArrowRight || keys.d) nextX++;

        if (nextX !== player.x || nextY !== player.y) {
            if (!isSolid(nextX, nextY)) {
                player.x = nextX;
                player.y = nextY;
                player.targetPixelX = nextX * TILE_SIZE;
                player.targetPixelY = nextY * TILE_SIZE;
                player.isMoving = true;
            }
        }
    }

    // Transição suave entre blocos
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

// Desenhar Elementos
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar Mapa
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 1) {
                ctx.fillStyle = '#0f380f'; // Parede / Obstáculo
            } else {
                ctx.fillStyle = '#8bac0f'; // Chão livre
            }
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            
            // Grid sutil retro
            ctx.strokeStyle = '#306230';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Desenhar Jogador
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(player.pixelX + 2, player.pixelY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
}

// Game Loop Principal
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
