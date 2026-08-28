// Garante busca do canvas e fallback caso a tag use outro id padrão
const canvas = document.getElementById('gameCanvas') || document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// Ajusta a resolução interna do canvas para a escala clássica GameBoy (160x144)
canvas.width = 160;
canvas.height = 144;

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

// ==========================================
// SISTEMA DE ÁUDIO SINTETIZADO (Web Audio)
// ==========================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

const soundFX = {
    select() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    },

    bump() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    },

    battleStart() {
        if (!audioCtx) return;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (idx * 0.06));
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime + (idx * 0.06));
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + (idx * 0.06) + 0.05);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + (idx * 0.06));
            osc.stop(audioCtx.currentTime + (idx * 0.06) + 0.05);
        });
    },

    hit() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    },

    catchSuccess() {
        if (!audioCtx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (idx * 0.1));
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime + (idx * 0.1));
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + (idx * 0.1) + 0.09);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + (idx * 0.1));
            osc.stop(audioCtx.currentTime + (idx * 0.1) + 0.09);
        });
    },

    save() {
        if (!audioCtx) return;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (idx * 0.08));
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime + (idx * 0.08));
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + (idx * 0.08) + 0.07);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + (idx * 0.08));
            osc.stop(audioCtx.currentTime + (idx * 0.08) + 0.07);
        });
    },

    heal() {
        if (!audioCtx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (idx * 0.08));
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime + (idx * 0.08));
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + (idx * 0.08) + 0.07);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + (idx * 0.08));
            osc.stop(audioCtx.currentTime + (idx * 0.08) + 0.07);
        });
    }
};

// ==========================================
// DEFINIÇÃO DOS MAPAS
// ==========================================
const maps = {
    town: {
        grid: [
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
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
            { x: 3, y: 3, targetMap: 'house', targetX: 4, targetY: 7, targetDir: 'up' },
            { x: 4, y: 0, targetMap: 'route1', targetX: 4, targetY: 7, targetDir: 'up' },
            { x: 5, y: 0, targetMap: 'route1', targetX: 5, targetY: 7, targetDir: 'up' }
        ],
        npcs: [
            {
                id: 'prof_oak',
                x: 8,
                y: 4,
                direction: 'left',
                dialogue: [
                    "OAK: Siga para o Norte até Viridian!",
                    "OAK: Lá você encontrará o PokéCenter e o PokéMart."
                ]
            }
        ],
        wildEnounters: [
            { name: 'RATTATA', hp: 12, maxHp: 12, level: 2 },
            { name: 'PIDGEY', hp: 12, maxHp: 12, level: 2 }
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
                healer: true,
                dialogue: [
                    "MAE: Voce parece cansado. Deixe-me cuidar dos seus Pokemon...",
                    "MAE: Prontinho! Seu time esta totalmente recuperado!"
                ]
            }
        ]
    },
    route1: {
        grid: [
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 7, 7, 0, 0, 0, 0, 7, 7, 1],
            [1, 7, 7, 0, 1, 1, 0, 7, 7, 1],
            [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
            [1, 7, 7, 7, 0, 0, 7, 7, 7, 1],
            [1, 7, 7, 7, 0, 0, 7, 7, 7, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        warps: [
            { x: 4, y: 0, targetMap: 'viridian', targetX: 4, targetY: 7, targetDir: 'up' },
            { x: 5, y: 0, targetMap: 'viridian', targetX: 5, targetY: 7, targetDir: 'up' },
            { x: 4, y: 7, targetMap: 'town', targetX: 4, targetY: 1, targetDir: 'down' },
            { x: 5, y: 7, targetMap: 'town', targetX: 5, targetY: 1, targetDir: 'down' }
        ],
        npcs: [
            {
                id: 'traveler',
                x: 3,
                y: 3,
                direction: 'right',
                dialogue: [
                    "VIAJANTE: Continue subindo para chegar a Cidade de Viridian!"
                ]
            }
        ],
        wildEnounters: [
            { name: 'RATTATA', hp: 15, maxHp: 15, level: 3 },
            { name: 'PIDGEY', hp: 16, maxHp: 16, level: 3 },
            { name: 'NIDORAN', hp: 18, maxHp: 18, level: 4 },
            { name: 'BELLSPROUT', hp: 17, maxHp: 17, level: 4 }
        ]
    },
    viridian: {
        grid: [
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 0, 3, 3, 3, 0, 3, 3, 3, 1],
            [1, 0, 3, 2, 3, 0, 3, 8, 3, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
            [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        warps: [
            { x: 4, y: 0, targetMap: 'route2', targetX: 4, targetY: 7, targetDir: 'up' },
            { x: 5, y: 0, targetMap: 'route2', targetX: 5, targetY: 7, targetDir: 'up' },
            { x: 3, y: 2, targetMap: 'pokecenter', targetX: 4, targetY: 7, targetDir: 'up' },
            { x: 7, y: 2, targetMap: 'pokemart', targetX: 4, targetY: 7, targetDir: 'up' },
            { x: 4, y: 7, targetMap: 'route1', targetX: 4, targetY: 1, targetDir: 'down' },
            { x: 5, y: 7, targetMap: 'route1', targetX: 5, targetY: 1, targetDir: 'down' }
        ],
        npcs: [
            {
                id: 'viridian_npc',
                x: 1,
                y: 4,
                direction: 'right',
                dialogue: [
                    "CIDADAO: Bem-vindo a Viridian City!",
                    "CIDADAO: Suba ao Norte para chegar na Rota 2 e Floresta de Viridian!"
                ]
            }
        ]
    },
    route2: {
        grid: [
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 7, 7, 1, 0, 0, 1, 7, 7, 1],
            [1, 7, 7, 1, 0, 0, 1, 7, 7, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 7, 7, 7, 0, 0, 7, 7, 7, 1],
            [1, 7, 7, 7, 0, 0, 7, 7, 7, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        warps: [
            { x: 4, y: 0, targetMap: 'viridianForest', targetX: 4, targetY: 7, targetDir: 'up' },
            { x: 5, y: 0, targetMap: 'viridianForest', targetX: 5, targetY: 7, targetDir: 'up' },
            { x: 4, y: 7, targetMap: 'viridian', targetX: 4, targetY: 1, targetDir: 'down' },
            { x: 5, y: 7, targetMap: 'viridian', targetX: 5, targetY: 1, targetDir: 'down' }
        ],
        npcs: [
            {
                id: 'route2_npc',
                x: 2,
                y: 3,
                direction: 'right',
                dialogue: [
                    "JOVEM: A Floresta de Viridian e logo a frente. Cuidado com os insetos!"
                ]
            }
        ],
        wildEnounters: [
            { name: 'CATERPIE', hp: 14, maxHp: 14, level: 3 },
            { name: 'WEEDLE', hp: 14, maxHp: 14, level: 3 },
            { name: 'PIDGEY', hp: 18, maxHp: 18, level: 4 }
        ]
    },
    viridianForest: {
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 7, 7, 7, 0, 0, 7, 7, 7, 1],
            [1, 7, 1, 7, 1, 1, 7, 1, 7, 1],
            [1, 7, 1, 7, 0, 0, 7, 1, 7, 1],
            [1, 0, 1, 7, 7, 7, 7, 1, 0, 1],
            [1, 7, 1, 1, 1, 1, 1, 1, 7, 1],
            [1, 7, 7, 7, 0, 0, 7, 7, 7, 1],
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        warps: [
            { x: 4, y: 7, targetMap: 'route2', targetX: 4, targetY: 1, targetDir: 'down' },
            { x: 5, y: 7, targetMap: 'route2', targetX: 5, targetY: 1, targetDir: 'down' }
        ],
        npcs: [
            {
                id: 'bug_catcher',
                x: 3,
                y: 4,
                direction: 'right',
                dialogue: [
                    "CACADOR: Dizem que Pikachu raramente aparece por esta floresta!"
                ]
            }
        ],
        wildEnounters: [
            { name: 'CATERPIE', hp: 16, maxHp: 16, level: 4 },
            { name: 'WEEDLE', hp: 16, maxHp: 16, level: 4 },
            { name: 'METAPOD', hp: 22, maxHp: 22, level: 5 },
            { name: 'PIKACHU', hp: 20, maxHp: 20, level: 5 }
        ]
    },
    pokecenter: {
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
            { x: 4, y: 7, targetMap: 'viridian', targetX: 3, targetY: 3, targetDir: 'down' },
            { x: 5, y: 7, targetMap: 'viridian', targetX: 3, targetY: 3, targetDir: 'down' }
        ],
        npcs: [
            {
                id: 'nurse_joy',
                x: 4,
                y: 2,
                direction: 'down',
                healer: true,
                dialogue: [
                    "ENFERMEIRA JOY: Ola! Bem-vindo ao Centro Pokemon!",
                    "ENFERMEIRA JOY: Seus Pokemon foram curados totalmente!"
                ]
            }
        ]
    },
    pokemart: {
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
            { x: 4, y: 7, targetMap: 'viridian', targetX: 7, targetY: 3, targetDir: 'down' },
            { x: 5, y: 7, targetMap: 'viridian', targetX: 7, targetY: 3, targetDir: 'down' }
        ],
        npcs: [
            {
                id: 'clerk',
                x: 2,
                y: 2,
                direction: 'right',
                shopkeeper: true,
                dialogue: [
                    "VENDEDOR: Bem-vindo ao Pokemart!",
                    "VENDEDOR: Compre suprimentos para sua jornada!"
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
    } else if (type === 'martDoor') {
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(0, 0, 16, 16);
        cx.fillStyle = COLOR.DARK;
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
        cx.fillRect(8, 8, 16, 18);
        cx.fillRect(4, 14, 4, 8);
        cx.fillRect(24, 14, 4, 8);
        cx.fillStyle = COLOR.DARK;
        cx.fillRect(10, 12, 12, 10);
    } else {
        cx.fillRect(6, 6, 20, 20);
        cx.fillStyle = COLOR.LIGHTEST;
        cx.fillRect(10, 10, 4, 4); cx.fillRect(18, 10, 4, 4);
        cx.fillStyle = COLOR.DARKEST;
        cx.fillRect(11, 11, 2, 2); cx.fillRect(19, 11, 2, 2);
        cx.fillRect(10, 18, 12, 3);
    }
    return c;
}

function createPokeballSprite() {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const cx = c.getContext('2d');

    cx.fillStyle = COLOR.DARKEST;
    cx.fillRect(4, 2, 8, 12);
    cx.fillRect(2, 4, 12, 8);
    cx.fillStyle = COLOR.LIGHTEST;
    cx.fillRect(4, 3, 8, 4);
    cx.fillRect(3, 4, 10, 3);
    cx.fillStyle = COLOR.DARKEST;
    cx.fillRect(2, 7, 12, 2);
    cx.fillRect(6, 6, 4, 4);
    cx.fillStyle = COLOR.LIGHTEST;
    cx.fillRect(7, 7, 2, 2);

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
    7: createTileSprite('tallGrass'),
    8: createTileSprite('martDoor')
};

const sprites = {
    player: createCharSpriteSet(COLOR.LIGHTEST),
    npc: createCharSpriteSet(COLOR.DARK),
    heroMonster: createMonsterSprite('hero'),
    wildMonster: createMonsterSprite('wild'),
    pokeball: createPokeballSprite()
};

// Jogador e Inventário
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
    money: 1000,
    pokeballs: 5,
    potions: 3,
    party: [
        { name: 'PIKACHU', hp: 20, maxHp: 20, level: 5 }
    ]
};

// Sistema de Loja (PokéMart)
const shopSystem = {
    active: false,
    selectedOption: 0,
    message: '',

    open() {
        this.active = true;
        this.selectedOption = 0;
        this.message = 'O que deseja comprar?';
        soundFX.select();
    },

    close() {
        this.active = false;
        soundFX.select();
    },

    buyItem() {
        if (this.selectedOption === 0) {
            if (player.money >= 200) {
                player.money -= 200;
                player.pokeballs++;
                soundFX.select();
                this.message = 'Comptou POKEBOLA!';
            } else {
                soundFX.bump();
                this.message = 'Dinheiro insuficiente!';
            }
        } else if (this.selectedOption === 1) {
            if (player.money >= 300) {
                player.money -= 300;
                player.potions++;
                soundFX.select();
                this.message = 'Comptou POCAO!';
            } else {
                soundFX.bump();
                this.message = 'Dinheiro insuficiente!';
            }
        }
    },

    handleInput(key) {
        if (key === 'ArrowUp' || key === 'w' || key === 'W') {
            this.selectedOption = (this.selectedOption - 1 + 3) % 3;
            soundFX.select();
        }
        if (key === 'ArrowDown' || key === 's' || key === 'S') {
            this.selectedOption = (this.selectedOption + 1) % 3;
            soundFX.select();
        }

        if (['a', 'A', 'Enter', ' '].includes(key)) {
            if (this.selectedOption === 2) {
                this.close();
            } else {
                this.buyItem();
            }
        }

        if (['b', 'B', 'Escape'].includes(key)) {
            this.close();
        }
    },

    draw() {
        if (!this.active) return;

        ctx.fillStyle = COLOR.LIGHTEST;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = COLOR.DARKEST;
        ctx.font = '8px monospace';
        ctx.fillText("--- POKEMART ---", 30, 8);
        ctx.fillText(`SEU DINHEIRO: $${player.money}`, 10, 24);

        ctx.fillText("POKEBOLA    $200", 24, 48);
        ctx.fillText("POCAO       $300", 24, 64);
        ctx.fillText("SAIR", 24, 80);

        const arrowY = 48 + (this.selectedOption * 16);
        ctx.fillText(">", 12, arrowY);

        ctx.fillText(this.message, 10, 116);
    }
};

// Sistema de Menu / Pause
const menuSystem = {
    active: false,
    view: 'main',
    selectedOption: 0,
    bagOption: 0,
    message: '',

    open() {
        this.active = true;
        this.view = 'main';
        this.selectedOption = 0;
        this.bagOption = 0;
        this.message = '';
        soundFX.select();
    },

    close() {
        this.active = false;
        soundFX.select();
    },

    usePotion() {
        if (player.potions <= 0) {
            this.message = "Sem Pocoes!";
            soundFX.bump();
            return;
        }

        const target = player.party.find(mon => mon.hp < mon.maxHp);
        if (!target) {
            this.message = "Time ja esta cheio!";
            soundFX.bump();
            return;
        }

        player.potions--;
        target.hp = Math.min(target.maxHp, target.hp + 20);
        soundFX.heal();
        this.message = `Usou Pocao em ${target.name}!`;
    },

    handleInput(key) {
        if (this.view === 'main') {
            if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                this.selectedOption = (this.selectedOption - 1 + 4) % 4;
                soundFX.select();
            }
            if (key === 'ArrowDown' || key === 's' || key === 'S') {
                this.selectedOption = (this.selectedOption + 1) % 4;
                soundFX.select();
            }

            if (['a', 'A', 'Enter', ' '].includes(key)) {
                soundFX.select();
                if (this.selectedOption === 0) {
                    this.view = 'party';
                } else if (this.selectedOption === 1) {
                    this.view = 'bag';
                    this.bagOption = 0;
                } else if (this.selectedOption === 2) {
                    saveGame();
                    soundFX.save();
                    this.message = "Jogo Salvo!";
                } else if (this.selectedOption === 3) {
                    this.close();
                }
            }

            if (['b', 'B', 'Escape'].includes(key)) {
                this.close();
            }
        } else if (this.view === 'bag') {
            if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === 'ArrowDown' || key === 's' || key === 'S') {
                this.bagOption = (this.bagOption + 1) % 2;
                soundFX.select();
            }

            if (['a', 'A', 'Enter', ' '].includes(key)) {
                if (this.bagOption === 0) {
                    this.usePotion();
                }
            }

            if (['b', 'B', 'Escape'].includes(key)) {
                soundFX.select();
                this.view = 'main';
            }
        } else if (this.view === 'party') {
            if (['b', 'B', 'a', 'A', 'Escape', 'Enter', ' '].includes(key)) {
                soundFX.select();
                this.view = 'main';
            }
        }
    },

    draw() {
        if (!this.active) return;

        if (this.view === 'main') {
            const boxX = 85;
            const boxY = 8;
            const boxW = 70;
            const boxH = 80;

            ctx.fillStyle = COLOR.LIGHTEST;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = COLOR.DARKEST;
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.fillStyle = COLOR.DARKEST;
            ctx.font = '8px monospace';
            ctx.textBaseline = 'top';

            ctx.fillText("TIME", boxX + 16, boxY + 10);
            ctx.fillText("MOCHILA", boxX + 16, boxY + 26);
            ctx.fillText("SALVAR", boxX + 16, boxY + 42);
            ctx.fillText("SAIR", boxX + 16, boxY + 58);

            const arrowY = boxY + 10 + (this.selectedOption * 16);
            ctx.fillText(">", boxX + 6, arrowY);

            if (this.message) {
                ctx.fillStyle = COLOR.LIGHTEST;
                ctx.fillRect(8, 110, 144, 26);
                ctx.strokeStyle = COLOR.DARKEST;
                ctx.strokeRect(8, 110, 144, 26);
                ctx.fillStyle = COLOR.DARKEST;
                ctx.fillText(this.message, 14, 118);
            }
        } else if (this.view === 'bag') {
            ctx.fillStyle = COLOR.LIGHTEST;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = COLOR.DARKEST;
            ctx.font = '8px monospace';
            ctx.fillText("--- MOCHILA ---", 32, 8);
            ctx.fillText(`DINHEIRO: $${player.money}`, 10, 20);

            ctx.fillText(`POCAO    x${player.potions}`, 24, 38);
            ctx.fillText(`POKEBOLA x${player.pokeballs}`, 24, 56);

            const arrowY = 38 + (this.bagOption * 18);
            ctx.fillText(">", 12, arrowY);

            ctx.fillText("[A] USAR ITEM", 10, 100);
            ctx.fillText("[B] VOLTAR", 10, 116);

            if (this.message) {
                ctx.fillText(this.message, 10, 80);
            }
        } else if (this.view === 'party') {
            ctx.fillStyle = COLOR.LIGHTEST;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = COLOR.DARKEST;
            ctx.font = '8px monospace';
            ctx.fillText("--- SEU TIME ---", 30, 8);

            player.party.forEach((mon, idx) => {
                const startY = 22 + (idx * 18);

                ctx.fillText(`${idx + 1}.${mon.name}`, 8, startY);
                ctx.fillText(`L${mon.level}`, 75, startY);

                ctx.strokeRect(95, startY, 35, 4);
                ctx.fillRect(95, startY, (mon.hp / mon.maxHp) * 35, 4);
                ctx.fillText(`${mon.hp}/${mon.maxHp}`, 133, startY);
            });

            ctx.fillText("Pressione B para voltar", 10, 132);
        }
    }
};

// Salvar / Carregar Dados (localStorage)
function saveGame() {
    const saveData = {
        currentMapId,
        playerX: player.x,
        playerY: player.y,
        playerDirection: player.direction,
        money: player.money,
        pokeballs: player.pokeballs,
        potions: player.potions,
        party: player.party
    };
    localStorage.setItem('rpg_gameboy_save', JSON.stringify(saveData));
}

function loadGame() {
    const raw = localStorage.getItem('rpg_gameboy_save');
    if (!raw) return;

    try {
        const saveData = JSON.parse(raw);
        currentMapId = saveData.currentMapId || 'town';
        player.x = saveData.playerX || 1;
        player.y = saveData.playerY || 1;
        player.pixelX = player.x * TILE_SIZE;
        player.pixelY = player.y * TILE_SIZE;
        player.targetPixelX = player.pixelX;
        player.targetPixelY = player.pixelY;
        player.direction = saveData.playerDirection || 'down';
        player.money = saveData.money ?? 1000;
        player.pokeballs = saveData.pokeballs ?? 5;
        player.potions = saveData.potions ?? 3;
        player.party = saveData.party || [{ name: 'PIKACHU', hp: 20, maxHp: 20, level: 5 }];
    } catch (e) {
        console.error("Erro ao carregar save:", e);
    }
}

// Batalha
const battleSystem = {
    active: false,
    state: 'intro',
    flashTimer: 0,
    selectedOption: 0,
    enemy: null,
    message: '',
    pokeballAnim: { active: false, x: 20, y: 70, targetX: 118, targetY: 20 },

    start() {
        this.active = true;
        this.state = 'intro_flash';
        this.flashTimer = 0;
        this.selectedOption = 0;

        const currentMap = maps[currentMapId];
        const encounters = currentMap.wildEnounters || [
            { name: 'RATTATA', hp: 12, maxHp: 12, level: 2 }
        ];

        const randomChoice = encounters[Math.floor(Math.random() * encounters.length)];
        this.enemy = { ...randomChoice };

        this.message = `Um ${this.enemy.name} selvagem apareceu!`;
        soundFX.battleStart();
    },

    handleInput(key) {
        if (this.state === 'intro_flash' || this.pokeballAnim.active) return;

        if (this.state === 'message' || this.state === 'caught') {
            if (['a', 'A', 'Enter', ' ', 'z', 'Z'].includes(key)) {
                soundFX.select();
                const activeMonster = player.party[0];

                if (this.state === 'caught' || this.enemy.hp <= 0 || activeMonster.hp <= 0) {
                    this.endBattle();
                } else {
                    this.state = 'player_turn';
                }
            }
            return;
        }

        if (this.state === 'player_turn') {
            if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                this.selectedOption = (this.selectedOption - 1 + 4) % 4;
                soundFX.select();
            }
            if (key === 'ArrowDown' || key === 's' || key === 'S') {
                this.selectedOption = (this.selectedOption + 1) % 4;
                soundFX.select();
            }

            if (['a', 'A', 'Enter', ' ', 'z', 'Z'].includes(key)) {
                soundFX.select();
                const activeMonster = player.party[0];

                if (this.selectedOption === 0) {
                    soundFX.hit();
                    const damage = Math.floor(Math.random() * 4) + 4;
                    this.enemy.hp = Math.max(0, this.enemy.hp - damage);
                    this.message = `${activeMonster.name} atacou! Causou ${damage} de dano.`;
                    this.state = 'message';

                    if (this.enemy.hp > 0) {
                        setTimeout(() => this.triggerEnemyTurn(), 1200);
                    } else {
                        const rewardMoney = Math.floor(Math.random() * 50) + 50;
                        player.money += rewardMoney;
                        this.message = `${this.enemy.name} desmaiou! Ganhou $${rewardMoney}!`;
                    }
                } else if (this.selectedOption === 1) {
                    if (player.potions <= 0) {
                        this.message = "Sem Pocoes na mochila!";
                        this.state = 'message';
                    } else if (activeMonster.hp >= activeMonster.maxHp) {
                        this.message = `${activeMonster.name} ja esta com HP cheio!`;
                        this.state = 'message';
                    } else {
                        player.potions--;
                        activeMonster.hp = Math.min(activeMonster.maxHp, activeMonster.hp + 20);
                        soundFX.heal();
                        this.message = `Usou Pocao! HP de ${activeMonster.name} restaurado.`;
                        this.state = 'message';
                        setTimeout(() => this.triggerEnemyTurn(), 1200);
                    }
                } else if (this.selectedOption === 2) {
                    if (player.pokeballs <= 0) {
                        this.message = "Voce nao tem mais Pokebolas!";
                        this.state = 'message';
                    } else if (player.party.length >= 6) {
                        this.message = "Seu time ja esta cheio! (Max 6)";
                        this.state = 'message';
                    } else {
                        player.pokeballs--;
                        this.throwPokeball();
                    }
                } else if (this.selectedOption === 3) {
                    this.message = "Voce fugiu com seguranca!";
                    this.state = 'message';
                    this.enemy.hp = 0;
                }
            }
        }
    },

    throwPokeball() {
        this.pokeballAnim = { active: true, x: 20, y: 70, targetX: 118, targetY: 20 };
        this.message = "Voce atirou uma Pokebola!";
        this.state = 'animating';
    },

    attemptCatch() {
        const hpRatio = this.enemy.hp / this.enemy.maxHp;
        const catchChance = 0.9 - (hpRatio * 0.5);

        if (Math.random() < catchChance) {
            soundFX.catchSuccess();
            player.party.push({ ...this.enemy });
            this.message = `Gotcha! ${this.enemy.name} foi capturado!`;
            this.state = 'caught';

            setTimeout(() => {
                if (this.active && this.state === 'caught') {
                    this.endBattle();
                }
            }, 2500);
        } else {
            soundFX.hit();
            this.message = `Ah nao! ${this.enemy.name} escapou!`;
            this.state = 'message';
            setTimeout(() => this.triggerEnemyTurn(), 1200);
        }
    },

    triggerEnemyTurn() {
        if (!this.active || this.enemy.hp <= 0 || this.state === 'caught') return;
        soundFX.hit();
        const activeMonster = player.party[0];
        const damage = Math.floor(Math.random() * 3) + 2;
        activeMonster.hp = Math.max(0, activeMonster.hp - damage);
        this.message = `${this.enemy.name} atacou! Causou ${damage} de dano.`;
        this.state = 'message';

        if (activeMonster.hp <= 0) {
            this.message = `${activeMonster.name} desmaiou! Voce perdeu...`;
        }
    },

    endBattle() {
        this.active = false;
        const activeMonster = player.party[0];
        if (activeMonster.hp <= 0) {
            activeMonster.hp = activeMonster.maxHp;
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

        if (this.pokeballAnim.active) {
            this.pokeballAnim.x += 4;
            this.pokeballAnim.y -= 2;
            if (this.pokeballAnim.x >= this.pokeballAnim.targetX) {
                this.pokeballAnim.active = false;
                this.attemptCatch();
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

        ctx.fillStyle = COLOR.LIGHTEST;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (this.state !== 'caught') {
            ctx.drawImage(sprites.wildMonster, 110, 12);
        }

        ctx.fillStyle = COLOR.DARKEST;
        ctx.font = '8px monospace';
        ctx.fillText(`${this.enemy.name} L${this.enemy.level}`, 8, 12);
        ctx.strokeRect(8, 20, 50, 4);
        ctx.fillRect(8, 20, (this.enemy.hp / this.enemy.maxHp) * 50, 4);

        const activeMonster = player.party[0];
        ctx.drawImage(sprites.heroMonster, 16, 50);

        ctx.fillText(`${activeMonster.name} L${activeMonster.level}`, 88, 56);
        ctx.strokeRect(88, 64, 50, 4);
        ctx.fillRect(88, 64, (activeMonster.hp / activeMonster.maxHp) * 50, 4);
        ctx.fillText(`HP:${activeMonster.hp}/${activeMonster.maxHp}`, 88, 74);

        if (this.pokeballAnim.active) {
            ctx.drawImage(sprites.pokeball, this.pokeballAnim.x, this.pokeballAnim.y);
        }

        ctx.fillStyle = COLOR.LIGHTEST;
        ctx.fillRect(0, 86, 160, 58);
        ctx.strokeStyle = COLOR.DARKEST;
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 88, 156, 54);

        if (this.state === 'player_turn') {
            ctx.fillStyle = COLOR.DARKEST;
            ctx.fillText("ATACAR", 18, 96);
            ctx.fillText(`POCAO (${player.potions})`, 18, 108);
            ctx.fillText(`CAPTURAR (${player.pokeballs})`, 18, 120);
            ctx.fillText("FUGIR", 18, 132);

            const arrowY = 96 + (this.selectedOption * 12);
            ctx.fillText(">", 8, arrowY);
        } else {
            ctx.fillStyle = COLOR.DARKEST;
            ctx.fillText(this.message, 10, 108);
        }
    }
};

// Transição de Telas
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
            if (this.speakerNpc && this.speakerNpc.shopkeeper) {
                shopSystem.open();
            }
        }
    }
};

// Controles
const keys = {};

window.addEventListener('keydown', (e) => {
    initAudio();

    if (shopSystem.active) {
        shopSystem.handleInput(e.key);
        return;
    }

    if (battleSystem.active) {
        battleSystem.handleInput(e.key);
        return;
    }

    if (menuSystem.active) {
        menuSystem.handleInput(e.key);
        return;
    }

    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        menuSystem.open();
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
    if (!btn) return;

    const start = (e) => {
        e.preventDefault();
        initAudio();

        if (shopSystem.active) {
            shopSystem.handleInput(keyName);
            return;
        }

        if (battleSystem.active) {
            battleSystem.handleInput(keyName);
            return;
        }

        if (menuSystem.active) {
            menuSystem.handleInput(keyName);
            return;
        }

        if (keyName === 'Start') {
            menuSystem.open();
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

    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
}

bindTouchButton('btnUp', 'ArrowUp');
bindTouchButton('btnDown', 'ArrowDown');
bindTouchButton('btnLeft', 'ArrowLeft');
bindTouchButton('btnRight', 'ArrowRight');
bindTouchButton('btnA', 'a', true);
bindTouchButton('btnB', 'b');
bindTouchButton('btnStart', 'Start');

function handleInteract() {
    if (transitionManager.active || battleSystem.active || menuSystem.active || shopSystem.active) return;

    if (dialogueSystem.active) {
        soundFX.select();
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
    const hitNpc = currentMap.npcs ? currentMap.npcs.find(npc => npc.x === targetX && npc.y === targetY) : null;
    if (hitNpc) {
        if (hitNpc.healer) {
            player.party.forEach(mon => mon.hp = mon.maxHp);
            soundFX.heal();
        } else {
            soundFX.select();
        }
        dialogueSystem.start(hitNpc.dialogue, hitNpc);
    }
}

function isSolid(tileX, tileY) {
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) return true;
    const currentMap = maps[currentMapId];
    const tileVal = currentMap.grid[tileY][tileX];

    if (tileVal === 1 || tileVal === 3 || tileVal === 4) return true;

    if (currentMap.npcs) {
        const npcHere = currentMap.npcs.some(npc => npc.x === tileX && npc.y === tileY);
        if (npcHere) return true;
    }

    return false;
}

function update() {
    if (shopSystem.active) return;

    if (battleSystem.active) {
        battleSystem.update();
        return;
    }

    if (menuSystem.active) return;

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
            } else {
                soundFX.bump();
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

            const warpHit = currentMap.warps ? currentMap.warps.find(w => w.x === player.x && w.y === player.y) : null;
            if (warpHit) {
                transitionManager.start(warpHit);
                return;
            }

            if (currentMap.grid[player.y][player.x] === 7) {
                if (Math.random() < 0.25) {
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

    if (shopSystem.active) {
        shopSystem.draw();
        return;
    }

    if (battleSystem.active) {
        battleSystem.draw();
        return;
    }

    const currentMap = maps[currentMapId];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tileType = currentMap.grid[r][c];
            ctx.drawImage(tileSprites[tileType], c * TILE_SIZE, r * TILE_SIZE);
        }
    }

    if (currentMap.npcs) {
        currentMap.npcs.forEach(npc => {
            const npcSprite = sprites.npc[npc.direction];
            ctx.drawImage(npcSprite, npc.x * TILE_SIZE, npc.y * TILE_SIZE);
        });
    }

    const playerSprite = sprites.player[player.direction];
    ctx.drawImage(playerSprite, player.pixelX, player.pixelY);

    drawDialogueBox();
    menuSystem.draw();
    transitionManager.draw();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicializar
loadGame();
gameLoop();
