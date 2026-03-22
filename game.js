const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;
const statusEl = document.getElementById('status');
const scoreboardEl = document.getElementById('scoreboard');
const settingsEl = document.getElementById('settings');
const pauseOverlayEl = document.getElementById('pauseOverlay');

const TILE = 64;
const PLAYER_RADIUS = 18;

const HUMANOID_VARIANTS = [
  { skin: '#f0bf96', shirt: '#6ec2ff', pants: '#2f4f7d', hair: '#6b4428' },
  { skin: '#e4a373', shirt: '#4dc7a4', pants: '#2a3e59', hair: '#2f1f1a' },
  { skin: '#b9825b', shirt: '#f07f76', pants: '#3d3d63', hair: '#1d1b1b' },
  { skin: '#8f5f3d', shirt: '#8f9eff', pants: '#2f374f', hair: '#131313' },
  { skin: '#6b452f', shirt: '#f3c36c', pants: '#343047', hair: '#101010' }
];

const CHARACTER_DEFS = [
  {
    id: 'vanguard',
    name: 'VANGUARD',
    title: 'Heavy Assault',
    desc: 'Armored tank with heavy plating. Built to absorb punishment so others don\'t have to.',
    hp: 130,
    maxHp: 130,
    armor: 70,
    maxArmor: 100,
    speed: 240,
    skin: '#d8a87f',
    skinDark: '#b07850',
    shirt: '#4a6a30',
    shirtDark: '#2d4a1a',
    pants: '#3a5230',
    boots: '#1e2818',
    hair: '#2a1a0a',
    hasHelmet: true,
    helmetColor: '#3d5a28',
    helmetDark: '#263819',
    accentColor: '#8bc34a',
    glowColor: 'rgba(139,195,74,0.35)'
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    title: 'Cyber Operative',
    desc: 'Balanced fighter with cybernetic augmentations. Reliable in any combat scenario.',
    hp: 100,
    maxHp: 100,
    armor: 40,
    maxArmor: 100,
    speed: 280,
    skin: '#ffd0aa',
    skinDark: '#d49f77',
    shirt: '#73ccff',
    shirtDark: '#3c9dd0',
    pants: '#365786',
    boots: '#1b2532',
    hair: '#5f3f2a',
    hasHelmet: false,
    accentColor: '#7ce6ff',
    glowColor: 'rgba(124,230,255,0.35)'
  },
  {
    id: 'ghost',
    name: 'GHOST',
    title: 'Shadow Infiltrator',
    desc: 'Lightning-fast assassin. Fragile under fire but devastatingly quick to strike.',
    hp: 80,
    maxHp: 80,
    armor: 0,
    maxArmor: 100,
    speed: 340,
    skin: '#c8a088',
    skinDark: '#a07858',
    shirt: '#141420',
    shirtDark: '#0a0a0e',
    pants: '#0c0c18',
    boots: '#060608',
    hair: '#e0e0f0',
    hasHelmet: false,
    hasHood: true,
    hoodColor: '#0a0a16',
    hoodDark: '#050508',
    accentColor: '#ff6b9d',
    glowColor: 'rgba(255,107,157,0.35)'
  }
];

const WEAPONS = {
  knife: {
    name: 'Knife',
    slot: '1',
    cooldown: 0.3,
    damage: 50,
    range: 70,
    arc: Math.PI * 0.53
  },
  handgun: {
    name: 'Handgun',
    slot: '2',
    cooldown: 0.35,
    damage: 28,
    projectileSpeed: 780,
    spread: 0.03,
    magazineSize: 15,
    reloadTime: 1.5,
    reserveAmmo: 60,
    ammoPickupType: 'ammo-handgun',
    ammoPickupValue: 15
  },
  shotgun: {
    name: 'Shotgun',
    slot: '3',
    cooldown: 0.65,
    damage: 16,
    projectileSpeed: 560,
    spread: 0.30,
    pelletCount: 8,
    magazineSize: 8,
    reloadTime: 2.2,
    reserveAmmo: 32,
    maxDistance: TILE * 4,
    ammoPickupType: 'ammo-shotgun',
    ammoPickupValue: 8
  },
  machinegun: {
    name: 'Machine Gun',
    slot: '4',
    cooldown: 0.075,
    damage: 12,
    projectileSpeed: 880,
    spread: 0.12,
    magazineSize: 40,
    reloadTime: 2.5,
    reserveAmmo: 160,
    ammoPickupType: 'ammo-machinegun',
    ammoPickupValue: 40
  },
  sniper: {
    name: 'Sniper Rifle',
    slot: '5',
    cooldown: 1.2,
    damage: 95,
    projectileSpeed: 1500,
    spread: 0.006,
    magazineSize: 5,
    reloadTime: 3.0,
    reserveAmmo: 20,
    pierceCount: 2,
    ammoPickupType: 'ammo-sniper',
    ammoPickupValue: 5
  },
  rocket: {
    name: 'Rocket Launcher',
    slot: '6',
    cooldown: 0.8,
    damage: 140,
    projectileSpeed: 380,
    spread: 0.02,
    magazineSize: 1,
    reloadTime: 4.0,
    reserveAmmo: 5,
    pierceCount: 4,
    ammoPickupType: 'ammo-rocket',
    ammoPickupValue: 2
  }
};

// Retro Wolfenstein/Doom/CyberDogs inspired color themes — bold, saturated
const LEVEL_THEMES = [
  { // Level 1: Steel blue bunker (Wolfenstein vibes)
    floorBase: ['#2a3848', '#1f2d3a'],
    floorGradient: ['rgba(100, 140, 180, 0.15)', 'rgba(50, 70, 90, 0.12)', 'rgba(20, 30, 42, 0.2)'],
    lineColor: 'rgba(100, 160, 200, 0.18)',
    panelColor: 'rgba(180, 200, 220, 0.15)',
    boltColor: 'rgba(140, 170, 200, 0.35)',
    borderColor: 'rgba(120, 150, 180, 0.3)',
    wallGradient: ['#5a6a7a', '#3e4e5e', '#252f3a'],
    wallGloss: ['rgba(200, 220, 240, 0.12)', 'rgba(100, 140, 180, 0.06)', 'rgba(15, 20, 30, 0.2)'],
    wallStripe: 'rgba(150, 180, 210, 0.3)',
    wallAccent: 'rgba(80, 160, 220, 0.2)',
    wallBolt: 'rgba(170, 200, 230, 0.3)',
    wallBorder: '#7a9ab5'
  },
  { // Level 2: Brown stone dungeon (Doom E1 vibes)
    floorBase: ['#382a20', '#2a1f16'],
    floorGradient: ['rgba(180, 140, 90, 0.15)', 'rgba(100, 75, 45, 0.12)', 'rgba(40, 28, 18, 0.2)'],
    lineColor: 'rgba(220, 170, 100, 0.18)',
    panelColor: 'rgba(210, 190, 160, 0.15)',
    boltColor: 'rgba(200, 160, 110, 0.35)',
    borderColor: 'rgba(180, 140, 95, 0.3)',
    wallGradient: ['#7a6248', '#554030', '#38281c'],
    wallGloss: ['rgba(230, 210, 180, 0.12)', 'rgba(180, 140, 90, 0.06)', 'rgba(40, 30, 18, 0.2)'],
    wallStripe: 'rgba(200, 170, 120, 0.3)',
    wallAccent: 'rgba(220, 160, 80, 0.2)',
    wallBolt: 'rgba(220, 190, 150, 0.3)',
    wallBorder: '#a08058'
  },
  { // Level 3: Toxic green/dark (CyberDogs/Doom E3 vibes)
    floorBase: ['#1a2a1a', '#142014'],
    floorGradient: ['rgba(80, 180, 80, 0.12)', 'rgba(40, 90, 40, 0.1)', 'rgba(15, 35, 15, 0.18)'],
    lineColor: 'rgba(100, 220, 100, 0.16)',
    panelColor: 'rgba(150, 210, 150, 0.12)',
    boltColor: 'rgba(120, 200, 120, 0.3)',
    borderColor: 'rgba(80, 160, 80, 0.28)',
    wallGradient: ['#3a5a3a', '#284228', '#1a2e1a'],
    wallGloss: ['rgba(150, 230, 150, 0.1)', 'rgba(80, 160, 80, 0.05)', 'rgba(10, 25, 10, 0.18)'],
    wallStripe: 'rgba(120, 200, 120, 0.25)',
    wallAccent: 'rgba(100, 240, 100, 0.15)',
    wallBolt: 'rgba(140, 220, 140, 0.28)',
    wallBorder: '#5a9a5a'
  }
];

// Maps: 3-tile-wide main hallway with rooms branching off via doors
// Retro Wolfenstein/Doom/CyberDogs style. Spawn room ALWAYS safe (no enemies)
// Enemies evenly distributed across non-spawn rooms only
const maps = [
  {
    // Level 1: "Docking Ring"
    // Corridor y:11-13, x:11-43. Spawn x:1-9 y:8-17. Rooms branch N/S.
    // ARMORY(S x:14-18), DOCK(N x:25-29), HUB(S x:35-39), EXIT(E x:45-50)
    name: 'Docking Ring',
    width: 52, height: 26,
    walls: [
      [0,0,52,1],[0,25,52,1],[0,0,1,26],[51,0,1,26],
      // spawn fill
      [1,1,9,7],[1,19,9,6],
      // spawn walls
      [1,8,9,1],[1,18,9,1],
      [10,8,1,3],[10,14,1,4],
      // corridor N wall y:10, gap x:25-29 for DOCK
      [10,10,15,1],[30,10,14,1],
      // corridor S wall y:14, gap x:14-18 ARMORY, gap x:35-39 HUB
      [10,14,4,1],[19,14,16,1],[40,14,4,1],
      // fill above corridor
      [10,1,15,9],[24,1,1,9],[30,1,1,9],[31,1,13,9],
      // fill below corridor
      [10,15,4,10],[13,15,1,10],[19,15,1,10],[20,15,15,10],
      [34,15,1,10],[40,15,1,10],[41,15,3,10],
      // exit room
      [45,1,6,7],[45,19,6,6],
      [45,8,6,1],[45,18,6,1],
      [44,8,1,3],[44,14,1,4],
    ],
    doors: [
      {x:10,y:12,w:1,h:1,locked:false,orientation:'v',swingDir:1},
      {x:16,y:14,w:1,h:1,locked:false,orientation:'h',swingDir:1},
      {x:27,y:10,w:1,h:1,locked:false,orientation:'h',swingDir:-1},
      {x:37,y:14,w:1,h:1,locked:false,orientation:'h',swingDir:1},
      {x:44,y:12,w:1,h:1,locked:true,orientation:'v',swingDir:1},
    ],
    keyPickup:{x:27.5,y:5},
    spawn:{x:5,y:12.5},
    exit:{x:48,y:12.5},
    features: [
      // corridor N wall paintings
      {type:'painting-landscape',x:12,y:10.7},
      {type:'painting-portrait',x:21,y:10.7},
      {type:'painting-abstract',x:33,y:10.7},
      {type:'painting-landscape',x:42,y:10.7},
      // corridor lamp posts
      {type:'lamp-post',x:11,y:12},{type:'lamp-post',x:17,y:12},
      {type:'lamp-post',x:23,y:12},{type:'lamp-post',x:31,y:12},
      {type:'lamp-post',x:38,y:12},{type:'lamp-post',x:43,y:12},
      // corridor benches (S wall, visual only)
      {type:'bench',x:12,y:13.3},{type:'bench',x:22,y:13.3},
      {type:'bench',x:32,y:13.3},{type:'bench',x:41,y:13.3},
      // corridor potted plants
      {type:'potted-plant',x:19.5,y:10.5},{type:'potted-plant',x:34.5,y:14.5},
      // spawn room
      {type:'floor-rug',x:5,y:12.5},{type:'ceiling-fan',x:5,y:12.5},
      {type:'painting-portrait',x:3,y:8.7},{type:'painting-landscape',x:7,y:8.7},
      // armory
      {type:'crate-stack',x:15,y:20},{type:'crate-stack',x:17,y:22},
      {type:'wall-terminal',x:14.7,y:16},
      // dock
      {type:'wall-banner',x:27,y:1.7},{type:'painting-portrait',x:25.5,y:1.7},
      {type:'floor-rug',x:27,y:5},
      // hub
      {type:'wall-pipes',x:35.7,y:17},{type:'wall-clock',x:37,y:15.7},
      {type:'floor-grate',x:37,y:20},
      // exit
      {type:'wall-terminal',x:48,y:9.7},
    ],
    enemies: [
      {x:16,y:20,hp:55},
      {x:27,y:4,hp:55},
      {x:37,y:19,hp:60,type:'shield'},
      {x:48,y:13,hp:65,type:'flanker'},
    ],
    pickups: [
      {x:16,y:22,type:'ammo-handgun',value:15},
      {x:27.5,y:8,type:'health',value:20},
      {x:37,y:22,type:'armor',value:20},
    ],
  },
  {
    // Level 2: "Core Archive"
    // Corridor y:11-13, x:11-43. Spawn x:1-9 y:8-17.
    // LIBRARY(N x:14-18), SERVER(S x:23-28), ARCHIVE(N x:33-38), STUDY+EXIT(S x:43-50)
    name: 'Core Archive',
    width: 52, height: 26,
    walls: [
      [0,0,52,1],[0,25,52,1],[0,0,1,26],[51,0,1,26],
      [1,1,9,7],[1,19,9,6],
      [1,8,9,1],[1,18,9,1],
      [10,8,1,3],[10,14,1,4],
      // corridor N wall y:10, gap x:14-18 LIBRARY, gap x:33-38 ARCHIVE
      [10,10,4,1],[19,10,14,1],[39,10,5,1],
      // corridor S wall y:14, gap x:23-28 SERVER, gap x:43-44 STUDY entry
      [10,14,13,1],[29,14,14,1],
      // fill above corridor
      [10,1,3,9],[13,1,1,9],[19,1,1,9],[20,1,13,9],
      [32,1,1,9],[39,1,1,9],[40,1,4,9],
      // fill below corridor
      [10,15,13,10],[22,15,1,10],[29,15,1,10],[30,15,13,10],
      // STUDY room x:44-50 y:15-24 (E wall is outer x:51, S wall is outer y:25)
      // locked partition at y:20, gap at x:47
      [44,20,3,1],[48,20,3,1],
      // fill top-right
      [45,1,6,9],
    ],
    doors: [
      {x:10,y:12,w:1,h:1,locked:false,orientation:'v',swingDir:1},
      {x:16,y:10,w:1,h:1,locked:false,orientation:'h',swingDir:-1},
      {x:25,y:14,w:1,h:1,locked:false,orientation:'h',swingDir:1},
      {x:35,y:10,w:1,h:1,locked:false,orientation:'h',swingDir:-1},
      {x:43,y:14,w:1,h:1,locked:false,orientation:'h',swingDir:1},
      {x:47,y:20,w:1,h:1,locked:true,orientation:'h',swingDir:1},
    ],
    keyPickup:{x:35.5,y:5},
    spawn:{x:5,y:12.5},
    exit:{x:47.5,y:22.5},
    features: [
      {type:'painting-landscape',x:12,y:10.7},{type:'painting-portrait',x:22,y:10.7},
      {type:'painting-abstract',x:40,y:10.7},{type:'painting-landscape',x:31,y:10.7},
      {type:'lamp-post',x:11,y:12},{type:'lamp-post',x:20,y:12},
      {type:'lamp-post',x:31,y:12},{type:'lamp-post',x:41,y:12},
      {type:'bench',x:12,y:13.3},{type:'bench',x:22,y:13.3},
      {type:'bench',x:32,y:13.3},{type:'bench',x:41,y:13.3},
      {type:'potted-plant',x:13.5,y:10.5},{type:'potted-plant',x:19.5,y:10.5},
      {type:'floor-rug',x:5,y:12.5},{type:'ceiling-fan',x:5,y:12.5},
      {type:'painting-portrait',x:3,y:8.7},{type:'painting-landscape',x:7,y:8.7},
      {type:'wall-bookshelf',x:14.7,y:3},{type:'wall-bookshelf',x:14.7,y:7},
      {type:'wall-terminal',x:23.7,y:17},{type:'wall-pipes',x:23.7,y:21},
      {type:'wall-banner',x:35,y:1.7},{type:'floor-rug',x:16,y:5},
      {type:'floor-rug',x:47,y:17},{type:'wall-clock',x:47,y:15.7},
      {type:'crate-stack',x:25,y:22},
    ],
    enemies: [
      {x:16,y:4,hp:65},
      {x:25,y:20,hp:70,type:'shield'},
      {x:35,y:4,hp:75},
      {x:47,y:17,hp:65},
      {x:45,y:22,hp:50,type:'dog'},
    ],
    pickups: [
      {x:16,y:8,type:'ammo-handgun',value:20},
      {x:25,y:22,type:'health',value:25},
      {x:35.5,y:8,type:'armor',value:25},
      {x:47,y:19,type:'ammo-shotgun',value:4},
    ],
  },
  {
    // Level 3: "Reactor Vault"
    // Corridor y:11-13, x:11-43. Spawn x:1-9 y:8-17.
    // DECON(N x:14-18), REACTOR(S x:22-28), COOLING(N x:32-38), CONTROL+EXIT(S x:43-50)
    name: 'Reactor Vault',
    width: 52, height: 26,
    walls: [
      [0,0,52,1],[0,25,52,1],[0,0,1,26],[51,0,1,26],
      [1,1,9,7],[1,19,9,6],
      [1,8,9,1],[1,18,9,1],
      [10,8,1,3],[10,14,1,4],
      // corridor N wall y:10, gap x:14-18 DECON, gap x:32-38 COOLING
      [10,10,4,1],[19,10,13,1],[39,10,5,1],
      // corridor S wall y:14, gap x:22-28 REACTOR, gap x:43-44 CONTROL entry
      [10,14,12,1],[29,14,14,1],
      // fill above corridor
      [10,1,3,9],[13,1,1,9],[19,1,1,9],[20,1,12,9],
      [31,1,1,9],[39,1,1,9],[40,1,4,9],
      // fill below corridor
      [10,15,12,10],[21,15,1,10],[29,15,1,10],[30,15,13,10],
      // CONTROL+EXIT room x:44-50 y:15-24
      // locked partition at y:20, gap at x:47
      [44,20,3,1],[48,20,3,1],
      // fill top-right
      [45,1,6,9],
    ],
    doors: [
      {x:10,y:12,w:1,h:1,locked:false,orientation:'v',swingDir:1},
      {x:16,y:10,w:1,h:1,locked:false,orientation:'h',swingDir:-1},
      {x:25,y:14,w:1,h:1,locked:false,orientation:'h',swingDir:1},
      {x:35,y:10,w:1,h:1,locked:false,orientation:'h',swingDir:-1},
      {x:43,y:14,w:1,h:1,locked:false,orientation:'h',swingDir:1},
      {x:47,y:20,w:1,h:1,locked:true,orientation:'h',swingDir:1},
    ],
    keyPickup:{x:35.5,y:5},
    spawn:{x:5,y:12.5},
    exit:{x:47.5,y:22.5},
    features: [
      {type:'painting-landscape',x:12,y:10.7},{type:'painting-portrait',x:22,y:10.7},
      {type:'painting-abstract',x:40,y:10.7},
      {type:'lamp-post',x:11,y:12},{type:'lamp-post',x:20,y:12},
      {type:'lamp-post',x:30,y:12},{type:'lamp-post',x:40,y:12},
      {type:'bench',x:12,y:13.3},{type:'bench',x:22,y:13.3},
      {type:'bench',x:31,y:13.3},{type:'bench',x:41,y:13.3},
      {type:'potted-plant',x:13.5,y:10.5},{type:'potted-plant',x:19.5,y:10.5},
      {type:'potted-plant',x:31.5,y:10.5},{type:'potted-plant',x:39.5,y:10.5},
      {type:'floor-rug',x:5,y:12.5},{type:'ceiling-fan',x:5,y:12.5},
      {type:'painting-portrait',x:3,y:8.7},{type:'painting-landscape',x:7,y:8.7},
      {type:'wall-banner',x:16,y:1.7},
      {type:'wall-pipes',x:22.7,y:17},{type:'wall-pipes',x:22.7,y:21},
      {type:'wall-terminal',x:44,y:15.7},{type:'wall-terminal',x:44,y:21.7},
      {type:'wall-clock',x:35,y:1.7},{type:'floor-rug',x:25,y:20},
      {type:'floor-grate',x:35,y:5},{type:'crate-stack',x:25,y:22},
      {type:'crate-stack',x:47,y:17},{type:'wall-bookshelf',x:39.3,y:4},
    ],
    enemies: [
      {x:16,y:4,hp:90},
      {x:25,y:20,hp:95},{x:27,y:18,hp:95,type:'flanker'},
      {x:35,y:4,hp:90,type:'shield'},{x:37,y:6,hp:85},
      {x:45,y:17,hp:100},{x:48,y:22,hp:70,type:'dog'},
    ],
    pickups: [
      {x:16,y:8,type:'health',value:25},
      {x:25,y:22,type:'ammo-handgun',value:15},
      {x:35.5,y:8,type:'armor',value:35},
      {x:47,y:19,type:'ammo-sniper',value:3},
    ],
  },
];

const game = {
  running: true,
  paused: false,
  state: 'character-select',
  charSelectHover: -1,
  lastTime: performance.now(),
  wins: 0,
  losses: 0,
  mapIndex: 0,
  killCount: 0,
  message: 'Clear hostiles and reach the uplink.',
  objectiveMode: 'purge',
  keybinds: {
    reload: 'r',
    pause: 'p',
    objectiveToggle: 'g',
    weapon1: WEAPONS.knife.slot,
    weapon2: WEAPONS.handgun.slot,
    weapon3: WEAPONS.shotgun.slot,
    weapon4: WEAPONS.machinegun.slot,
    weapon5: WEAPONS.sniper.slot,
    weapon6: WEAPONS.rocket.slot
  },
  difficulty: {
    hpScale: 1,
    speedScale: 1,
    enemyDamageScale: 1,
    fireRateScale: 1,
    label: 'Normal'
  },
  player: {
    x: 0,
    y: 0,
    hp: 100,
    maxHp: 100,
    armor: 40,
    maxArmor: 100,
    speed: 280,
    fireCooldown: 0,
    angle: 0,
    activeWeapon: 'handgun',
    ammo: {
      handgun: { mag: WEAPONS.handgun.magazineSize, reserve: WEAPONS.handgun.reserveAmmo },
      shotgun: { mag: WEAPONS.shotgun.magazineSize, reserve: WEAPONS.shotgun.reserveAmmo },
      machinegun: { mag: WEAPONS.machinegun.magazineSize, reserve: WEAPONS.machinegun.reserveAmmo },
      sniper: { mag: WEAPONS.sniper.magazineSize, reserve: WEAPONS.sniper.reserveAmmo },
      rocket: { mag: WEAPONS.rocket.magazineSize, reserve: WEAPONS.rocket.reserveAmmo }
    },
    reloading: 0,
    reloadingWeapon: null,
    invulnerable: 0,
    walkCycle: 0,
    moving: false,
    knifeAnim: 0
  },
  bullets: [],
  enemyBullets: [],
  muzzleFlashes: [],
  explosions: [],
  enemies: [],
  pickups: [],
  doors: [],
  hasKey: false,
  doorInteract: false,
  startGrace: 0,
  keys: new Set(),
  mouse: { x: canvas.width / 2, y: canvas.height / 2, down: false },
  activeMap: null,
  navGridCache: new Map()
};

function normalizeKey(value, fallback) {
  if (!value) return fallback;
  const trimmed = String(value).trim().toLowerCase();
  if (!trimmed) return fallback;
  return trimmed === ' ' ? 'space' : trimmed;
}

function difficultyProfile() {
  const mapScale = game.mapIndex * 0.12;
  const winScale = game.wins * 0.08;
  const combined = mapScale + winScale;
  const hpScale = 1 + combined;
  const speedScale = 1 + game.mapIndex * 0.05 + game.wins * 0.03;
  const enemyDamageScale = 1 + game.mapIndex * 0.06 + game.wins * 0.04;
  const fireRateScale = 1 + game.mapIndex * 0.08 + game.wins * 0.05;
  const threatScore = hpScale + speedScale + enemyDamageScale + fireRateScale;
  let label = 'Normal';
  if (threatScore > 5.8) label = 'Lethal';
  else if (threatScore > 5.1) label = 'Hard';
  else if (threatScore > 4.5) label = 'Elevated';

  return { hpScale, speedScale, enemyDamageScale, fireRateScale, label };
}


function currentWeapon() {
  return WEAPONS[game.player.activeWeapon];
}

function ammoState(weaponKey = game.player.activeWeapon) {
  return game.player.ammo[weaponKey] || null;
}

function mapBoundsPx() {
  return {
    width: game.activeMap.width * TILE,
    height: game.activeMap.height * TILE
  };
}

function startMap(index, keepPlayerState = true) {
  const map = maps[index];
  game.activeMap = map;
  game.mapIndex = index;
  game.difficulty = difficultyProfile();
  game.navGridCache.clear();

  const prev = game.player;
  const hp = keepPlayerState ? Math.max(prev.hp, 30) : prev.maxHp;
  const armor = keepPlayerState ? prev.armor : (prev.charDef ? prev.charDef.armor : 40);

  // Initialize doors first so nav grid used for spawn placement is correct
  game.doors = (map.doors || []).map((d, i) => ({
    ...d,
    id: `${index}-door-${i}`,
    open: false,
    openAnim: 0
  }));
  game.navGridCache.clear();

  const playerSpawn = findNearestOpenPoint(map.spawn.x * TILE, map.spawn.y * TILE, PLAYER_RADIUS);

  game.player = {
    ...prev,
    x: playerSpawn.x,
    y: playerSpawn.y,
    hp,
    armor,
    ammo: {
      handgun: {
        mag: keepPlayerState ? Math.min((prev.ammo.handgun || {}).mag || 0, WEAPONS.handgun.magazineSize) : WEAPONS.handgun.magazineSize,
        reserve: keepPlayerState ? ((prev.ammo.handgun || {}).reserve || WEAPONS.handgun.reserveAmmo) : WEAPONS.handgun.reserveAmmo
      },
      shotgun: {
        mag: keepPlayerState ? Math.min((prev.ammo.shotgun || {}).mag || 0, WEAPONS.shotgun.magazineSize) : WEAPONS.shotgun.magazineSize,
        reserve: keepPlayerState ? ((prev.ammo.shotgun || {}).reserve || WEAPONS.shotgun.reserveAmmo) : WEAPONS.shotgun.reserveAmmo
      },
      machinegun: {
        mag: keepPlayerState ? Math.min((prev.ammo.machinegun || {}).mag || 0, WEAPONS.machinegun.magazineSize) : WEAPONS.machinegun.magazineSize,
        reserve: keepPlayerState ? ((prev.ammo.machinegun || {}).reserve || WEAPONS.machinegun.reserveAmmo) : WEAPONS.machinegun.reserveAmmo
      },
      sniper: {
        mag: keepPlayerState ? Math.min((prev.ammo.sniper || {}).mag || 0, WEAPONS.sniper.magazineSize) : WEAPONS.sniper.magazineSize,
        reserve: keepPlayerState ? ((prev.ammo.sniper || {}).reserve || WEAPONS.sniper.reserveAmmo) : WEAPONS.sniper.reserveAmmo
      },
      rocket: {
        mag: keepPlayerState ? Math.min((prev.ammo.rocket || {}).mag || 0, WEAPONS.rocket.magazineSize) : WEAPONS.rocket.magazineSize,
        reserve: keepPlayerState ? ((prev.ammo.rocket || {}).reserve || WEAPONS.rocket.reserveAmmo) : WEAPONS.rocket.reserveAmmo
      }
    },
    fireCooldown: 0,
    reloading: 0,
    reloadingWeapon: null,
    invulnerable: 0.4,
    walkCycle: prev.walkCycle || 0,
    moving: false,
    knifeAnim: 0
  };

  game.enemies = map.enemies.map((e, i) => {
    const type = e.type || 'humanoid';
    const radius = type === 'dog' ? 14 : type === 'shield' ? 18 : 16;
    const hpScaleByType = type === 'shield' ? 1.28 : type === 'flanker' ? 0.88 : 1;
    const scaledHp = Math.round(e.hp * game.difficulty.hpScale * hpScaleByType);
    const baseSpeed = type === 'dog' ? 210 + Math.random() * 25 : type === 'flanker' ? 175 + Math.random() * 24 : 120 + Math.random() * 20;
    let safeSpawn = findReachableOpenPoint(
      e.x * TILE,
      e.y * TILE,
      radius,
      playerSpawn.x,
      playerSpawn.y
    );
    // Enforce: no enemies in spawn room + minimum distance from player
    const MIN_ENEMY_SPAWN_DIST = 14 * TILE;
    const inSpawnRoom = (px, py) => {
      const tx = px / TILE;
      const ty = py / TILE;
      return tx >= 0 && tx <= 10 && ty >= 7 && ty <= 19;
    };
    const spawnDist = Math.hypot(safeSpawn.x - playerSpawn.x, safeSpawn.y - playerSpawn.y);
    if (spawnDist < MIN_ENEMY_SPAWN_DIST || inSpawnRoom(safeSpawn.x, safeSpawn.y)) {
      const origin = worldToTile(playerSpawn.x, playerSpawn.y);
      const reachable = buildReachableTileSet(origin, radius);
      let bestPoint = null;
      let bestDistFromPlayer = 0;
      let bestDistFromIntended = Infinity;
      const intendedX = e.x * TILE;
      const intendedY = e.y * TILE;
      for (const key of reachable) {
        const [tx, ty] = key.split(',').map(Number);
        const center = tileCenter(tx, ty);
        const dPlayer = Math.hypot(center.x - playerSpawn.x, center.y - playerSpawn.y);
        if (dPlayer < MIN_ENEMY_SPAWN_DIST || inSpawnRoom(center.x, center.y)) continue;
        const dIntended = Math.hypot(center.x - intendedX, center.y - intendedY);
        if (!bestPoint || dIntended < bestDistFromIntended) {
          bestPoint = center;
          bestDistFromPlayer = dPlayer;
          bestDistFromIntended = dIntended;
        }
      }
      if (bestPoint) safeSpawn = bestPoint;
    }
    const variant = HUMANOID_VARIANTS[Math.floor(Math.random() * HUMANOID_VARIANTS.length)];
    return {
      id: `${index}-${i}`,
      type,
      x: safeSpawn.x,
      y: safeSpawn.y,
      hp: scaledHp,
      maxHp: scaledHp,
      speed: baseSpeed * game.difficulty.speedScale,
      cooldown: Math.random() * 0.8,
      radius,
      walkCycle: Math.random() * Math.PI * 2,
      moving: false,
      variant,
      alerted: false,
      seesPlayer: false,
      guardOrigin: { x: safeSpawn.x, y: safeSpawn.y },
      guardTarget: { x: safeSpawn.x, y: safeSpawn.y },
      facingAngle: 0,
      path: [],
      pathTarget: { tx: Math.floor(safeSpawn.x / TILE), ty: Math.floor(safeSpawn.y / TILE) },
      pathRecalc: 0
    };
  });

  game.pickups = map.pickups.map((p, i) => ({
    ...findReachableOpenPoint(
      p.x * TILE,
      p.y * TILE,
      12,
      playerSpawn.x,
      playerSpawn.y
    ),
    id: `${index}-p-${i}`,
    type: p.type,
    value: p.value,
    alive: true
  }));

  game.bullets = [];
  game.enemyBullets = [];
  game.muzzleFlashes = [];
  game.explosions = [];

  // doors already initialized above (before enemy spawn to get correct nav grid)
  game.hasKey = false;
  game.keyPickup = map.keyPickup ? {
    x: map.keyPickup.x * TILE,
    y: map.keyPickup.y * TILE,
    alive: true
  } : null;

  game.startGrace = 2.5;
  game.message = `Map loaded: ${map.name} · Threat ${game.difficulty.label}`;
}

function resetRun(lostRound = false) {
  if (lostRound) game.losses += 1;
  game.paused = false;
  game.killCount = 0;
  game.hasKey = false;
  game.player.reloading = 0;
  game.player.reloadingWeapon = null;
  game.player.hp = game.player.maxHp;
  game.player.armor = game.player.charDef ? game.player.charDef.armor : 40;
  game.player.ammo.handgun = { mag: WEAPONS.handgun.magazineSize, reserve: WEAPONS.handgun.reserveAmmo };
  game.player.ammo.shotgun = { mag: WEAPONS.shotgun.magazineSize, reserve: WEAPONS.shotgun.reserveAmmo };
  game.player.ammo.machinegun = { mag: WEAPONS.machinegun.magazineSize, reserve: WEAPONS.machinegun.reserveAmmo };
  game.player.ammo.sniper = { mag: WEAPONS.sniper.magazineSize, reserve: WEAPONS.sniper.reserveAmmo };
  game.player.ammo.rocket = { mag: WEAPONS.rocket.magazineSize, reserve: WEAPONS.rocket.reserveAmmo };
  startMap(0, false);
}

function applyDamage(amount) {
  const p = game.player;
  const armorAbsorb = Math.min(p.armor, amount * 0.7);
  p.armor -= armorAbsorb;
  p.hp -= amount - armorAbsorb;
}

function mapRects() {
  const rects = game.activeMap.walls.map(([x, y, w, h]) => ({
    x: x * TILE,
    y: y * TILE,
    w: w * TILE,
    h: h * TILE
  }));
  // closed doors act as walls
  for (const door of game.doors) {
    if (!door.open) {
      rects.push({ x: door.x * TILE, y: door.y * TILE, w: door.w * TILE, h: door.h * TILE });
    }
  }
  return rects;
}

function circleRectCollision(cx, cy, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function blockedAt(x, y, radius) {
  const bounds = mapBoundsPx();
  if (x - radius < 0 || y - radius < 0 || x + radius > bounds.width || y + radius > bounds.height) return true;
  return mapRects().some((r) => circleRectCollision(x, y, radius, r));
}

function hasLineOfSight(x0, y0, x1, y1, step = 16) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  const samples = Math.max(1, Math.ceil(distance / step));

  for (let i = 1; i < samples; i += 1) {
    const t = i / samples;
    const x = x0 + dx * t;
    const y = y0 + dy * t;
    if (blockedAt(x, y, 4)) return false;
  }

  return true;
}

function worldToTile(x, y) {
  return {
    tx: Math.max(0, Math.min(game.activeMap.width - 1, Math.floor(x / TILE))),
    ty: Math.max(0, Math.min(game.activeMap.height - 1, Math.floor(y / TILE)))
  };
}

function tileCenter(tx, ty) {
  return {
    x: (tx + 0.5) * TILE,
    y: (ty + 0.5) * TILE
  };
}

function getWalkGrid(radius) {
  const key = Math.round(radius);
  if (game.navGridCache.has(key)) return game.navGridCache.get(key);

  const grid = [];
  for (let y = 0; y < game.activeMap.height; y += 1) {
    const row = [];
    for (let x = 0; x < game.activeMap.width; x += 1) {
      const center = tileCenter(x, y);
      row.push(!blockedAt(center.x, center.y, radius));
    }
    grid.push(row);
  }

  game.navGridCache.set(key, grid);
  return grid;
}

function buildPath(start, goal, radius) {
  const grid = getWalkGrid(radius);
  const width = game.activeMap.width;
  const height = game.activeMap.height;

  if (!grid[start.ty]?.[start.tx] || !grid[goal.ty]?.[goal.tx]) return [];

  const queue = [start];
  let head = 0;
  const visited = new Set([`${start.tx},${start.ty}`]);
  const parent = new Map();
  const neighbors = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  while (head < queue.length) {
    const node = queue[head++];
    if (node.tx === goal.tx && node.ty === goal.ty) break;

    for (const offset of neighbors) {
      const nx = node.tx + offset.x;
      const ny = node.ty + offset.y;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!grid[ny][nx]) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;

      visited.add(key);
      parent.set(key, `${node.tx},${node.ty}`);
      queue.push({ tx: nx, ty: ny });
    }
  }

  const goalKey = `${goal.tx},${goal.ty}`;
  if (!visited.has(goalKey)) return [];

  const path = [];
  let currentKey = goalKey;
  while (currentKey) {
    const [tx, ty] = currentKey.split(',').map(Number);
    path.push(tileCenter(tx, ty));
    currentKey = parent.get(currentKey);
  }

  path.reverse();
  if (path.length > 0) path.shift();
  return path;
}

function buildReachableTileSet(origin, radius) {
  const grid = getWalkGrid(radius);
  const width = game.activeMap.width;
  const height = game.activeMap.height;
  if (!grid[origin.ty]?.[origin.tx]) return new Set();

  const visited = new Set([`${origin.tx},${origin.ty}`]);
  const queue = [origin];
  let head = 0;
  const neighbors = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  while (head < queue.length) {
    const node = queue[head++];
    for (const offset of neighbors) {
      const nx = node.tx + offset.x;
      const ny = node.ty + offset.y;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!grid[ny][nx]) continue;

      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ tx: nx, ty: ny });
    }
  }

  return visited;
}

function enemyCanSeePlayer(enemy, player) {
  const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
  if (distance > 680) return false;
  return hasLineOfSight(enemy.x, enemy.y, player.x, player.y);
}

function updateEnemyAwareness(enemy, player) {
  if (game.startGrace > 0) return;
  if (enemy.type === 'dog') {
    if (!enemy.alerted) {
      // Dogs detect by proximity (scent range) rather than instant alert
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist < 480 || enemy.seesPlayer) {
        enemy.alerted = true;
        game.message = 'Something detected you!';
      }
    }
    return;
  }

  if (!enemy.alerted && enemy.seesPlayer) {
    enemy.alerted = true;
    game.message = 'Enemies spotted you!';
  }
}

function chooseGuardPoint(enemy) {
  const radiusTiles = 3;
  const base = worldToTile(enemy.guardOrigin.x, enemy.guardOrigin.y);
  const grid = getWalkGrid(enemy.radius);
  const candidates = [];

  for (let y = base.ty - radiusTiles; y <= base.ty + radiusTiles; y += 1) {
    for (let x = base.tx - radiusTiles; x <= base.tx + radiusTiles; x += 1) {
      if (x <= 0 || y <= 0 || x >= game.activeMap.width - 1 || y >= game.activeMap.height - 1) continue;
      if (!grid[y]?.[x]) continue;
      candidates.push(tileCenter(x, y));
    }
  }

  if (candidates.length === 0) return { ...enemy.guardOrigin };
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function moveEnemyToward(enemy, targetX, targetY, dt) {
  const start = worldToTile(enemy.x, enemy.y);
  const goal = worldToTile(targetX, targetY);
  const targetChanged = enemy.pathTarget.tx !== goal.tx || enemy.pathTarget.ty !== goal.ty;
  enemy.pathRecalc -= dt;

  if (targetChanged || enemy.pathRecalc <= 0 || enemy.path.length === 0) {
    enemy.path = buildPath(start, goal, enemy.radius);
    enemy.pathTarget = goal;
    enemy.pathRecalc = enemy.alerted ? 0.35 : 1.2;
  }

  const waypoint = enemy.path[0] || { x: targetX, y: targetY };
  if (Math.hypot(waypoint.x - enemy.x, waypoint.y - enemy.y) < Math.max(12, enemy.radius)) {
    enemy.path.shift();
  }

  const steerTarget = enemy.path[0] || { x: targetX, y: targetY };
  const dir = normalize(steerTarget.x - enemy.x, steerTarget.y - enemy.y);
  moveWithCollision(enemy, dir.x * enemy.speed * dt, dir.y * enemy.speed * dt, enemy.radius);

  enemy.moving = true;
  enemy.walkCycle += dt * (enemy.type === 'dog' ? 16 : 10);
}

function findNearestOpenPoint(x, y, radius) {
  if (!blockedAt(x, y, radius)) return { x, y };

  const baseX = Math.floor(x / TILE);
  const baseY = Math.floor(y / TILE);
  const maxRadius = Math.max(game.activeMap.width, game.activeMap.height);

  for (let ring = 1; ring <= maxRadius; ring += 1) {
    for (let oy = -ring; oy <= ring; oy += 1) {
      for (let ox = -ring; ox <= ring; ox += 1) {
        if (Math.abs(ox) !== ring && Math.abs(oy) !== ring) continue;

        const tx = baseX + ox;
        const ty = baseY + oy;
        if (tx <= 0 || ty <= 0 || tx >= game.activeMap.width - 1 || ty >= game.activeMap.height - 1) continue;

        const candidateX = (tx + 0.5) * TILE;
        const candidateY = (ty + 0.5) * TILE;
        if (!blockedAt(candidateX, candidateY, radius)) {
          return { x: candidateX, y: candidateY };
        }
      }
    }
  }

  return { x, y };
}

function findReachableOpenPoint(x, y, radius, originX, originY) {
  const fallback = findNearestOpenPoint(x, y, radius);
  const origin = worldToTile(originX, originY);
  const reachable = buildReachableTileSet(origin, radius);
  if (reachable.size === 0) return fallback;

  const preferred = worldToTile(fallback.x, fallback.y);
  const preferredKey = `${preferred.tx},${preferred.ty}`;
  if (reachable.has(preferredKey)) return fallback;

  let closest = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const key of reachable) {
    const [tx, ty] = key.split(',').map(Number);
    const center = tileCenter(tx, ty);
    const dist = Math.hypot(center.x - x, center.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      closest = center;
    }
  }

  return closest || fallback;
}

function moveWithCollision(entity, dx, dy, radius) {
  const steps = 4;
  for (let i = 0; i < steps; i += 1) {
    const px = entity.x + dx / steps;
    if (!blockedAt(px, entity.y, radius)) entity.x = px;

    const py = entity.y + dy / steps;
    if (!blockedAt(entity.x, py, radius)) entity.y = py;
  }
}

function worldToScreen(x, y, camera) {
  return {
    x: x - camera.x + canvas.width / 2,
    y: y - camera.y + canvas.height / 2
  };
}

function normalize(dx, dy) {
  const mag = Math.hypot(dx, dy) || 1;
  return { x: dx / mag, y: dy / mag };
}

function performKnifeAttack() {
  const p = game.player;
  const knife = WEAPONS.knife;
  let hitSomeone = false;

  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const distance = Math.hypot(dx, dy);
    if (distance > knife.range + enemy.radius) continue;

    const enemyAngle = Math.atan2(dy, dx);
    const delta = Math.atan2(Math.sin(enemyAngle - p.angle), Math.cos(enemyAngle - p.angle));
    if (Math.abs(delta) > knife.arc / 2) continue;
    if (!hasLineOfSight(p.x, p.y, enemy.x, enemy.y, 10)) continue;

    enemy.hp -= knife.damage;
    hitSomeone = true;
    if (enemy.hp <= 0) {
      game.killCount += 1;
      game.message = `Knifed target (${game.killCount})`;
    } else {
      game.message = 'Knife hit!';
    }
  }

  if (!hitSomeone) {
    game.message = 'Knife swing missed.';
  }
}

function spawnMuzzleFlash(x, y, angle, color = '#a9f8ff', large = false) {
  game.muzzleFlashes.push({
    x,
    y,
    angle,
    color,
    life: large ? 0.14 : 0.08,
    maxLife: large ? 0.14 : 0.08,
    size: large ? 22 + Math.random() * 8 : 10 + Math.random() * 5
  });
}

const ROCKET_BLAST_RADIUS = 180;
const ROCKET_BLAST_DAMAGE = 110;

function triggerExplosion(x, y) {
  // Visual explosion entry
  game.explosions.push({
    x,
    y,
    life: 0.55,
    maxLife: 0.55,
    radius: ROCKET_BLAST_RADIUS
  });

  // Big central flash
  spawnMuzzleFlash(x, y, 0, '#ff8c00', true);
  spawnMuzzleFlash(x, y, Math.PI * 0.5, '#ffdd44', true);
  spawnMuzzleFlash(x, y, Math.PI, '#ff5500', true);
  spawnMuzzleFlash(x, y, Math.PI * 1.5, '#ff8c00', true);

  // Area damage to enemies
  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;
    const dist = Math.hypot(enemy.x - x, enemy.y - y);
    if (dist > ROCKET_BLAST_RADIUS) continue;
    // Damage falls off toward edge of blast
    const falloff = 1 - (dist / ROCKET_BLAST_RADIUS) * 0.6;
    enemy.hp -= Math.round(ROCKET_BLAST_DAMAGE * falloff);
    if (enemy.hp <= 0) {
      game.killCount += 1;
      game.message = `Target down (${game.killCount})`;
    }
  }

  // Self-damage if player is in blast radius
  const playerDist = Math.hypot(game.player.x - x, game.player.y - y);
  if (playerDist < ROCKET_BLAST_RADIUS && game.player.invulnerable <= 0) {
    const falloff = 1 - (playerDist / ROCKET_BLAST_RADIUS) * 0.6;
    applyDamage(Math.round(60 * falloff));
    game.player.invulnerable = 0.4;
    game.message = 'Caught in blast!';
  }
}

function shootPlayerWeapon() {
  const p = game.player;
  if (p.fireCooldown > 0 || p.reloading > 0) return;

  if (p.activeWeapon === 'knife') {
    p.fireCooldown = WEAPONS.knife.cooldown;
    p.knifeAnim = 0.3;
    performKnifeAttack();
    return;
  }

  const weapon = currentWeapon();
  const ammo = ammoState();
  if (!weapon || !ammo || ammo.mag <= 0) return;

  ammo.mag -= 1;
  p.fireCooldown = weapon.cooldown;

  const pellets = weapon.pelletCount || 1;
  for (let i = 0; i < pellets; i += 1) {
    const spread = (Math.random() - 0.5) * weapon.spread;
    const ang = p.angle + spread;
    game.bullets.push({
      x: p.x + Math.cos(ang) * 20,
      y: p.y + Math.sin(ang) * 20,
      vx: Math.cos(ang) * weapon.projectileSpeed,
      vy: Math.sin(ang) * weapon.projectileSpeed,
      damage: weapon.damage,
      life: 1.4,
      weapon: p.activeWeapon,
      travelled: 0,
      maxDistance: weapon.maxDistance || Number.POSITIVE_INFINITY,
      pierceLeft: weapon.pierceCount || 1,
      hitTargets: new Set()
    });
  }

  const flashColor = p.activeWeapon === 'sniper' ? '#ff4444'
    : p.activeWeapon === 'shotgun' ? '#ff9a3c'
    : p.activeWeapon === 'machinegun' ? '#a0f0ff'
    : p.activeWeapon === 'rocket' ? '#ff6a00'
    : p.activeWeapon === 'handgun' ? '#fff5a0'
    : '#9bf7ff';
  spawnMuzzleFlash(
    p.x + Math.cos(p.angle) * 26,
    p.y + Math.sin(p.angle) * 26,
    p.angle,
    flashColor,
    p.activeWeapon === 'rocket'
  );
}

function shootEnemyBullet(enemy, dir) {
  game.enemyBullets.push({
    x: enemy.x,
    y: enemy.y,
    vx: dir.x * 380,
    vy: dir.y * 380,
    damage: (enemy.type === 'shield' ? 12 : 10) * game.difficulty.enemyDamageScale,
    life: 2
  });

  spawnMuzzleFlash(
    enemy.x + dir.x * 18,
    enemy.y + dir.y * 18,
    Math.atan2(dir.y, dir.x),
    '#ffbe8b'
  );
}

function computePlayerBulletDamage(enemy, bullet) {
  let damage = bullet.damage;
  if (enemy.type === 'shield') {
    const incoming = normalize(bullet.vx, bullet.vy);
    const facing = { x: Math.cos(enemy.facingAngle), y: Math.sin(enemy.facingAngle) };
    const frontDot = incoming.x * facing.x + incoming.y * facing.y;
    if (frontDot > 0.58) {
      damage *= 0.35;
    }
  }
  return damage;
}

function reloadWeapon() {
  const p = game.player;
  if (p.activeWeapon === 'knife') return;
  const weapon = currentWeapon();
  const ammo = ammoState();
  if (!weapon || !ammo) return;
  if (p.reloading > 0 || ammo.mag >= weapon.magazineSize || ammo.reserve <= 0) return;

  p.reloading = weapon.reloadTime;
  p.reloadingWeapon = p.activeWeapon;
  game.message = `Reloading ${weapon.name}...`;
}

function update(dt) {
  if (game.state === 'character-select') return;

  const p = game.player;

  if (!game.running || game.paused) return;

  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  p.reloading = Math.max(0, p.reloading - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.knifeAnim = Math.max(0, p.knifeAnim - dt);
  game.startGrace = Math.max(0, game.startGrace - dt);

  if (p.reloadingWeapon && p.reloading === 0) {
    const reloadWep = WEAPONS[p.reloadingWeapon];
    const reloadAmmo = p.ammo[p.reloadingWeapon];
    if (reloadWep && reloadAmmo) {
      const needed = reloadWep.magazineSize - reloadAmmo.mag;
      const used = Math.min(needed, reloadAmmo.reserve);
      reloadAmmo.mag += used;
      reloadAmmo.reserve -= used;
      game.message = `${reloadWep.name} reloaded.`;
    }
    p.reloadingWeapon = null;
  }

  let mx = 0;
  let my = 0;

  if (game.keys.has('w')) my -= 1;
  if (game.keys.has('s')) my += 1;
  if (game.keys.has('a')) mx -= 1;
  if (game.keys.has('d')) mx += 1;

  if (mx !== 0 || my !== 0) {
    const n = normalize(mx, my);
    moveWithCollision(p, n.x * p.speed * dt, n.y * p.speed * dt, PLAYER_RADIUS);
    p.moving = true;
    p.walkCycle += dt * 10;
  } else {
    p.moving = false;
  }

  p.angle = Math.atan2(game.mouse.y - canvas.height / 2, game.mouse.x - canvas.width / 2);

  if (game.mouse.down) shootPlayerWeapon();

  for (const bullet of game.bullets) {
    const stepX = bullet.vx * dt;
    const stepY = bullet.vy * dt;
    bullet.x += stepX;
    bullet.y += stepY;
    bullet.life -= dt;
    bullet.travelled += Math.hypot(stepX, stepY);

    if (bullet.travelled >= bullet.maxDistance || blockedAt(bullet.x, bullet.y, 4)) {
      bullet.life = 0;
      continue;
    }

    for (const enemy of game.enemies) {
      if (enemy.hp <= 0 || bullet.hitTargets.has(enemy.id)) continue;
      const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
      if (dist < enemy.radius + 4) {
        enemy.hp -= computePlayerBulletDamage(enemy, bullet);
        bullet.hitTargets.add(enemy.id);
        bullet.pierceLeft -= 1;
        if (enemy.hp <= 0) {
          game.killCount += 1;
          game.message = `Target down (${game.killCount})`;
        }
        if (bullet.pierceLeft <= 0) {
          bullet.life = 0;
          break;
        }
      }
    }
  }

  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.seesPlayer = enemyCanSeePlayer(enemy, p);
    updateEnemyAwareness(enemy, p);

    const toPlayer = normalize(p.x - enemy.x, p.y - enemy.y);
    const distance = Math.hypot(p.x - enemy.x, p.y - enemy.y);
    enemy.facingAngle = Math.atan2(toPlayer.y, toPlayer.x);

    if (enemy.alerted) {
      const chaseBuffer = enemy.type === 'dog' ? 34 : 140;
      if (distance > chaseBuffer) {
        if (enemy.type === 'flanker' && distance < 520) {
          const flankDir = normalize(-toPlayer.y, toPlayer.x);
          const flankDistance = 110 + Math.sin(performance.now() * 0.003 + enemy.walkCycle) * 35;
          moveEnemyToward(enemy, p.x + flankDir.x * flankDistance, p.y + flankDir.y * flankDistance, dt);
        } else {
          moveEnemyToward(enemy, p.x, p.y, dt);
        }
      } else {
        enemy.moving = false;
      }
    } else {
      const guardDistance = Math.hypot(enemy.x - enemy.guardTarget.x, enemy.y - enemy.guardTarget.y);
      if (guardDistance < 18 || enemy.path.length === 0) {
        enemy.guardTarget = chooseGuardPoint(enemy);
      }
      moveEnemyToward(enemy, enemy.guardTarget.x, enemy.guardTarget.y, dt);
    }

    enemy.cooldown -= dt;

    if (enemy.type === 'dog') {
      const meleeRange = TILE + enemy.radius;
      if (distance < meleeRange && enemy.cooldown <= 0 && p.invulnerable <= 0) {
        applyDamage(18 * game.difficulty.enemyDamageScale);
        p.invulnerable = 0.5;
        enemy.cooldown = 0.85 / game.difficulty.fireRateScale;
        game.message = 'Dog rushed you!';
      }
      continue;
    }

    if (enemy.alerted && distance < 620 && enemy.cooldown <= 0 && enemy.seesPlayer) {
      shootEnemyBullet(enemy, toPlayer);
      enemy.cooldown = (1.2 + Math.random() * 0.8) / game.difficulty.fireRateScale;
    }

    if (distance < PLAYER_RADIUS + enemy.radius && p.invulnerable <= 0) {
      applyDamage(12 * game.difficulty.enemyDamageScale);
      p.invulnerable = 0.55;
      game.message = 'Close contact!';
    }
  }

  for (const bullet of game.enemyBullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (blockedAt(bullet.x, bullet.y, 4)) {
      bullet.life = 0;
      continue;
    }

    const hitPlayer = Math.hypot(p.x - bullet.x, p.y - bullet.y) < PLAYER_RADIUS;
    if (hitPlayer && p.invulnerable <= 0) {
      applyDamage(bullet.damage);
      p.invulnerable = 0.4;
      bullet.life = 0;
      game.message = 'You were hit.';
    }
  }

  for (const pickup of game.pickups) {
    if (!pickup.alive) continue;
    if (Math.hypot(p.x - pickup.x, p.y - pickup.y) < 28) {
      pickup.alive = false;
      if (pickup.type.startsWith('ammo-')) {
        const weaponKey = pickup.type.replace('ammo-', '');
        if (p.ammo[weaponKey]) {
          p.ammo[weaponKey].reserve += pickup.value;
          game.message = `Picked up ${WEAPONS[weaponKey].name} ammo +${pickup.value}`;
        }
      } else if (pickup.type === 'health') {
        p.hp = Math.min(p.maxHp, p.hp + pickup.value);
        game.message = `Picked up health +${pickup.value}`;
      } else {
        p.armor = Math.min(p.maxArmor, p.armor + pickup.value);
        game.message = `Picked up armor +${pickup.value}`;
      }
    }
  }

  // key pickup
  if (game.keyPickup && game.keyPickup.alive) {
    if (Math.hypot(p.x - game.keyPickup.x, p.y - game.keyPickup.y) < 28) {
      game.keyPickup.alive = false;
      game.hasKey = true;
      game.message = 'Key acquired! Find the locked door.';
    }
  }

  // door opening: player must press SPACE near a door. Doors hold open 3s then close.
  // Enemies cannot activate doors and cannot get stuck in closing doors.
  for (const door of game.doors) {
    const doorCenterX = (door.x + door.w / 2) * TILE;
    const doorCenterY = (door.y + door.h / 2) * TILE;
    const dist = Math.hypot(p.x - doorCenterX, p.y - doorCenterY);

    if (door.open) {
      const phase = door.phase || 'opening';

      if (phase === 'opening') {
        door.openAnim = Math.min(1, door.openAnim + dt * 2);
        if (door.openAnim >= 1) {
          door.phase = 'hold';
          door.holdTimer = door.locked ? Number.POSITIVE_INFINITY : 3;
        }
      } else if (phase === 'hold') {
        if (!door.locked) {
          if (dist < TILE * 2) {
            door.holdTimer = 3; // reset hold timer while player is nearby
          } else {
            door.holdTimer -= dt;
            if (door.holdTimer <= 0) {
              // Check no enemy is inside the door tile before closing
              const doorRect = { x: door.x * TILE, y: door.y * TILE, w: door.w * TILE, h: door.h * TILE };
              let enemyInDoor = false;
              for (const enemy of game.enemies) {
                if (enemy.hp <= 0) continue;
                if (circleRectCollision(enemy.x, enemy.y, enemy.radius + 4, doorRect)) {
                  enemyInDoor = true;
                  break;
                }
              }
              // Also check player
              if (circleRectCollision(p.x, p.y, PLAYER_RADIUS, doorRect)) enemyInDoor = true;
              if (!enemyInDoor) {
                door.phase = 'closing';
              } else {
                door.holdTimer = 0.5; // retry shortly
              }
            }
          }
        }
      } else if (phase === 'closing') {
        door.openAnim = Math.max(0, door.openAnim - dt * 2);
        if (door.openAnim <= 0) {
          door.open = false;
          door.phase = 'closed';
          game.navGridCache.clear();
        }
      }
      continue;
    }

    // Show prompt when near a closed door
    if (dist < TILE * 1.5) {
      door.showPrompt = true;
      if (game.doorInteract) {
        game.doorInteract = false;
        if (!door.locked) {
          door.open = true;
          door.phase = 'opening';
          door.openAnim = 0;
          game.navGridCache.clear();
          game.message = 'Door opened.';
        } else if (game.hasKey) {
          door.open = true;
          door.phase = 'opening';
          door.openAnim = 0;
          game.navGridCache.clear();
          game.message = 'Door unlocked!';
        } else if (!game.doorMsgCooldown || game.doorMsgCooldown <= 0) {
          game.message = 'Door is locked. Find the key!';
          game.doorMsgCooldown = 1.5;
        }
      }
    } else {
      door.showPrompt = false;
    }
  }
  game.doorInteract = false; // consume the interact flag
  if (game.doorMsgCooldown > 0) game.doorMsgCooldown -= dt;

  game.bullets = game.bullets.filter((b) => {
    if (b.life <= 0 && b.weapon === 'rocket') triggerExplosion(b.x, b.y);
    return b.life > 0;
  });
  game.enemyBullets = game.enemyBullets.filter((b) => b.life > 0);
  game.muzzleFlashes = game.muzzleFlashes.filter((flash) => {
    flash.life -= dt;
    return flash.life > 0;
  });
  game.explosions = game.explosions.filter((exp) => {
    exp.life -= dt;
    return exp.life > 0;
  });

  if (p.hp <= 0) {
    game.message = 'You were eliminated. Restarting run...';
    resetRun(true);
    return;
  }

  const living = game.enemies.filter((e) => e.hp > 0).length;
  const exitWorld = { x: game.activeMap.exit.x * TILE, y: game.activeMap.exit.y * TILE };
  const atExit = Math.hypot(p.x - exitWorld.x, p.y - exitWorld.y) < 42;

  if (atExit) {
    if (game.objectiveMode === 'purge' && living > 0) {
      game.message = `Exit locked: ${living} hostiles remain.`;
      updatePanel(living);
      return;
    }
    if (game.mapIndex === maps.length - 1) {
      game.wins += 1;
      game.message = 'Mission complete. New run started.';
      resetRun(false);
    } else {
      startMap(game.mapIndex + 1, true);
    }
  }

  updatePanel(living);
}

function drawSpaceParallax(camera) {
  const t = performance.now() * 0.00014;
  const fieldWidth = canvas.width + 320;
  const fieldHeight = canvas.height + 320;
  const layers = [
    { speed: 0.025, sizeMin: 0.55, sizeMax: 1.1, density: 460, alphaMin: 0.12, alphaMax: 0.34, driftX: 22, driftY: 12, seed: 1.17 },
    { speed: 0.055, sizeMin: 0.8, sizeMax: 1.45, density: 300, alphaMin: 0.2, alphaMax: 0.5, driftX: 37, driftY: 18, seed: 2.73 },
    { speed: 0.1, sizeMin: 1.1, sizeMax: 1.95, density: 180, alphaMin: 0.28, alphaMax: 0.7, driftX: 49, driftY: 25, seed: 3.91 },
    { speed: 0.165, sizeMin: 1.7, sizeMax: 2.7, density: 80, alphaMin: 0.42, alphaMax: 0.9, driftX: 66, driftY: 34, seed: 5.21 }
  ];

  const pseudoRandom = (value, seed) => {
    const n = Math.sin(value * 127.1 + seed * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };

  ctx.fillStyle = '#010101';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    for (let i = 0; i < layer.density; i += 1) {
      const hashX = pseudoRandom(i + 1.35, layer.seed);
      const hashY = pseudoRandom(i * 1.91 + 7.2, layer.seed + 0.63);
      const hashSize = pseudoRandom(i * 2.37 + 3.5, layer.seed + 1.11);
      const hashAlpha = pseudoRandom(i * 1.19 + 9.7, layer.seed + 2.07);
      const x = (hashX * fieldWidth - camera.x * layer.speed + t * layer.driftX) % fieldWidth;
      const y = (hashY * fieldHeight - camera.y * layer.speed + t * layer.driftY) % fieldHeight;
      const drawX = (x + fieldWidth) % fieldWidth - 160;
      const drawY = (y + fieldHeight) % fieldHeight - 160;
      const size = layer.sizeMin + hashSize * (layer.sizeMax - layer.sizeMin);
      const alpha = layer.alphaMin + hashAlpha * (layer.alphaMax - layer.alphaMin);

      const warmChance = pseudoRandom(i * 0.73 + 4.1, layer.seed + 3.6);
      if (warmChance > 0.985) {
        ctx.fillStyle = `rgba(255, 232, 205, ${Math.min(1, alpha + 0.12).toFixed(3)})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      }

      ctx.fillRect(Math.round(drawX), Math.round(drawY), Math.ceil(size), Math.ceil(size));
    }
  }
}


function drawGrid(camera) {
  const mapWidth = game.activeMap.width;
  const mapHeight = game.activeMap.height;
  const startX = Math.max(0, Math.floor((camera.x - canvas.width / 2) / TILE) - 1);
  const endX = Math.min(mapWidth - 1, Math.ceil((camera.x + canvas.width / 2) / TILE) + 1);
  const startY = Math.max(0, Math.floor((camera.y - canvas.height / 2) / TILE) - 1);
  const endY = Math.min(mapHeight - 1, Math.ceil((camera.y + canvas.height / 2) / TILE) + 1);

  const theme = LEVEL_THEMES[game.mapIndex % LEVEL_THEMES.length];

  for (let gy = startY; gy <= endY; gy += 1) {
    for (let gx = startX; gx <= endX; gx += 1) {
      const tileWorldX = gx * TILE;
      const tileWorldY = gy * TILE;
      const sx = tileWorldX - camera.x + canvas.width / 2;
      const sy = tileWorldY - camera.y + canvas.height / 2;

      const baseShade = (gx + gy + game.mapIndex) % 2 === 0 ? theme.floorBase[0] : theme.floorBase[1];
      ctx.fillStyle = baseShade;
      ctx.fillRect(sx, sy, TILE, TILE);

      const floorGrad = ctx.createLinearGradient(sx, sy, sx + TILE, sy + TILE);
      floorGrad.addColorStop(0, theme.floorGradient[0]);
      floorGrad.addColorStop(0.5, theme.floorGradient[1]);
      floorGrad.addColorStop(1, theme.floorGradient[2]);
      ctx.fillStyle = floorGrad;
      ctx.fillRect(sx, sy, TILE, TILE);

      // retro floor detail — blocky lines and corner bolts
      ctx.fillStyle = theme.lineColor;
      ctx.fillRect(sx + 8, sy + 8, TILE - 16, 2);
      ctx.fillRect(sx + 8, sy + TILE - 10, TILE - 16, 2);

      ctx.fillStyle = theme.panelColor;
      ctx.fillRect(sx + TILE * 0.25, sy + TILE * 0.2, TILE * 0.5, 2);
      ctx.fillRect(sx + TILE * 0.2, sy + TILE * 0.75, TILE * 0.6, 2);

      ctx.fillStyle = theme.boltColor;
      ctx.fillRect(sx + 8, sy + 8, 3, 3);
      ctx.fillRect(sx + TILE - 11, sy + 8, 3, 3);
      ctx.fillRect(sx + 8, sy + TILE - 11, 3, 3);
      ctx.fillRect(sx + TILE - 11, sy + TILE - 11, 3, 3);

      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawSciWall(x, y, w, h, theme) {
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, theme.wallGradient[0]);
  gradient.addColorStop(0.52, theme.wallGradient[1]);
  gradient.addColorStop(1, theme.wallGradient[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);

  const gloss = ctx.createLinearGradient(x, y, x, y + h);
  gloss.addColorStop(0, theme.wallGloss[0]);
  gloss.addColorStop(0.35, theme.wallGloss[1]);
  gloss.addColorStop(1, theme.wallGloss[2]);
  ctx.fillStyle = gloss;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = theme.wallStripe;
  for (let px = x + 8; px < x + w - 8; px += 24) {
    ctx.fillRect(px, y + 4, 12, 1.2);
    ctx.fillRect(px, y + h - 5.5, 12, 1);
  }

  ctx.fillStyle = theme.wallAccent;
  for (let py = y + 10; py < y + h - 10; py += 28) {
    ctx.fillRect(x + 4, py, 1.5, 12);
    ctx.fillRect(x + w - 5.5, py, 1.5, 12);
  }

  ctx.fillStyle = theme.wallBolt;
  for (let py = y + 16; py < y + h - 14; py += 36) {
    ctx.fillRect(x + 6, py - 1, 3, 3);
    ctx.fillRect(x + w - 9, py - 1, 3, 3);
  }

  ctx.strokeStyle = theme.wallBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawKeyPickup(x, y) {
  ctx.save();
  ctx.translate(x, y);

  // glow aura
  const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
  aura.addColorStop(0, 'rgba(255, 215, 60, 0.55)');
  aura.addColorStop(1, 'rgba(255, 180, 0, 0.0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();

  // key body
  const bob = Math.sin(performance.now() * 0.004) * 3;
  ctx.translate(0, bob);

  // key ring (circle)
  ctx.strokeStyle = '#ffd740';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-4, -4, 6, 0, Math.PI * 2);
  ctx.stroke();

  // key shaft
  ctx.fillStyle = '#ffd740';
  ctx.fillRect(1, -5, 14, 3);

  // key teeth
  ctx.fillRect(11, -2, 3, 4);
  ctx.fillRect(7, -2, 3, 3);

  ctx.restore();
}

function drawDoorPanel(x, y, w, h, locked) {
  // door base - wood grain
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, '#5a3a1a');
  gradient.addColorStop(0.5, '#8b5e2f');
  gradient.addColorStop(1, '#5a3a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);

  // frame
  ctx.strokeStyle = '#d4a44a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  // lock indicator for locked doors
  if (locked) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(cx - 5, cy - 3, 10, 8);
    ctx.strokeStyle = '#ffd740';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 5, cy - 3, 10, 8);
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 3.5, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffd740';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // cross bars for reinforced look
  ctx.strokeStyle = 'rgba(180, 140, 60, 0.35)';
  ctx.lineWidth = 1;
  if (h > w) {
    for (let stripe = y + 10; stripe < y + h - 6; stripe += 16) {
      ctx.beginPath();
      ctx.moveTo(x + 3, stripe);
      ctx.lineTo(x + w - 3, stripe);
      ctx.stroke();
    }
  } else {
    for (let stripe = x + 10; stripe < x + w - 6; stripe += 16) {
      ctx.beginPath();
      ctx.moveTo(stripe, y + 3);
      ctx.lineTo(stripe, y + h - 3);
      ctx.stroke();
    }
  }
}

function drawDoor(sx, sy, tw, th, door, theme) {
  const thickness = 14;
  const swingProgress = door.openAnim || 0;
  const angle = swingProgress * (Math.PI * 0.45) * (door.swingDir || 1);

  // always draw door frame (the archway remains visible)
  ctx.save();
  ctx.strokeStyle = '#d4a44a';
  ctx.lineWidth = 3;
  ctx.strokeRect(sx + 1, sy + 1, tw - 2, th - 2);
  // frame corner accents
  ctx.fillStyle = '#b8882e';
  const cs = 5;
  ctx.fillRect(sx, sy, cs, cs);
  ctx.fillRect(sx + tw - cs, sy, cs, cs);
  ctx.fillRect(sx, sy + th - cs, cs, cs);
  ctx.fillRect(sx + tw - cs, sy + th - cs, cs, cs);
  ctx.restore();

  // always draw the swinging panel — visible at all stages (open, hold, closing)

  ctx.save();

  if ((door.orientation || 'v') === 'v') {
    // vertical wall door: panel is tall and thin, swings around top hinge
    const hingeX = sx + tw / 2;
    const hingeY = sy;
    ctx.translate(hingeX, hingeY);
    ctx.rotate(angle);
    drawDoorPanel(-thickness / 2, 0, thickness, th, door.locked);
  } else {
    // horizontal wall door: panel is wide and thin, swings around left hinge
    const hingeX = sx;
    const hingeY = sy + th / 2;
    ctx.translate(hingeX, hingeY);
    ctx.rotate(angle);
    drawDoorPanel(0, -thickness / 2, tw, thickness, door.locked);
  }

  ctx.restore();
}

// ===== UNIQUE LEVEL FEATURES =====

function drawMapFeatures(camera) {
  const map = game.activeMap;
  if (!map.features) return;
  for (const feature of map.features) {
    const s = worldToScreen(feature.x * TILE, feature.y * TILE, camera);
    switch (feature.type) {
      case 'docking-clamp': drawDockingClamp(s.x, s.y); break;
      case 'airlock-chamber': drawAirlockChamber(s.x, s.y); break;
      case 'data-core': drawDataCore(s.x, s.y); break;
      case 'server-racks': drawServerRacks(s.x, s.y); break;
      case 'reactor-core': drawReactorCore(s.x, s.y); break;
      case 'coolant-pipes': drawCoolantPipes(s.x, s.y); break;
      case 'painting-landscape': drawPaintingLandscape(s.x, s.y); break;
      case 'painting-portrait': drawPaintingPortrait(s.x, s.y); break;
      case 'painting-abstract': drawPaintingAbstract(s.x, s.y); break;
      case 'wall-terminal': drawWallTerminal(s.x, s.y); break;
      case 'wall-pipes': drawWallPipes(s.x, s.y); break;
      case 'floor-grate': drawFloorGrate(s.x, s.y); break;
      case 'wall-banner': drawWallBanner(s.x, s.y); break;
      case 'floor-rug': drawFloorRug(s.x, s.y); break;
      case 'lamp-post': drawLampPost(s.x, s.y); break;
      case 'ceiling-fan': drawCeilingFan(s.x, s.y); break;
      case 'potted-plant': drawPottedPlant(s.x, s.y); break;
      case 'crate-stack': drawCrateStack(s.x, s.y); break;
      case 'wall-clock': drawWallClock(s.x, s.y); break;
      case 'wall-bookshelf': drawWallBookshelf(s.x, s.y); break;
      case 'bench': drawBench(s.x, s.y); break;
    }
  }
}

function drawDockingClamp(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // base plate
  ctx.fillStyle = 'rgba(100, 120, 140, 0.25)';
  ctx.fillRect(-48, -48, 96, 96);
  ctx.strokeStyle = 'rgba(150, 180, 200, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-48, -48, 96, 96);
  // mechanical arms
  ctx.strokeStyle = '#8a9bab';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-40, 5); ctx.lineTo(-18, -22); ctx.lineTo(0, -8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, 5); ctx.lineTo(18, -22); ctx.lineTo(0, -8); ctx.stroke();
  // hydraulic cylinders
  ctx.fillStyle = '#5a7080';
  ctx.fillRect(-36, 10, 10, 24);
  ctx.fillRect(26, 10, 10, 24);
  // piston highlights
  ctx.fillStyle = '#7a9aaa';
  ctx.fillRect(-34, 12, 3, 20);
  ctx.fillRect(31, 12, 3, 20);
  // clamp heads
  ctx.fillStyle = '#d4a44a';
  ctx.beginPath(); ctx.arc(-40, 5, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(40, 5, 6, 0, Math.PI * 2); ctx.fill();
  // center pivot
  ctx.fillStyle = '#4a6a8a';
  ctx.beginPath(); ctx.arc(0, -8, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6a8aaa';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -8, 10, 0, Math.PI * 2); ctx.stroke();
  // inner bolt
  ctx.fillStyle = '#2a3a4a';
  ctx.beginPath(); ctx.arc(0, -8, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawAirlockChamber(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const t = performance.now() * 0.002;
  // warning stripes floor pattern
  ctx.save();
  ctx.beginPath();
  ctx.rect(-55, -55, 110, 110);
  ctx.clip();
  ctx.fillStyle = 'rgba(200, 180, 30, 0.13)';
  for (let i = -7; i < 7; i++) {
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(i * 18, -85, 9, 170);
    ctx.restore();
  }
  ctx.restore();
  // outer pressure ring
  const pulseAlpha = 0.3 + Math.sin(t) * 0.15;
  ctx.strokeStyle = `rgba(80, 200, 220, ${pulseAlpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.stroke();
  // inner ring
  ctx.strokeStyle = `rgba(80, 200, 220, ${pulseAlpha * 0.6})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
  // pressure indicators (4 rotating dots)
  const dotAlpha = 0.5 + Math.sin(t * 1.5) * 0.3;
  ctx.fillStyle = `rgba(100, 255, 200, ${dotAlpha})`;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + t * 0.3;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 32, Math.sin(a) * 32, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // center status light
  const statusPulse = 0.6 + Math.sin(t * 2) * 0.3;
  ctx.fillStyle = `rgba(50, 255, 180, ${statusPulse})`;
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawDataCore(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const t = performance.now() * 0.001;
  // glow aura
  const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 55);
  glow.addColorStop(0, `rgba(100, 180, 255, ${0.35 + Math.sin(t * 2) * 0.12})`);
  glow.addColorStop(1, 'rgba(50, 100, 200, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 55, 0, Math.PI * 2); ctx.fill();
  // core sphere
  const coreGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
  coreGrad.addColorStop(0, '#aaddff');
  coreGrad.addColorStop(0.6, '#4488cc');
  coreGrad.addColorStop(1, '#224466');
  ctx.fillStyle = coreGrad;
  ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  // rotating data rings
  ctx.strokeStyle = 'rgba(130, 200, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, 30, 10, t * 0.5, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(130, 200, 255, 0.4)';
  ctx.beginPath(); ctx.ellipse(0, 0, 26, 12, -t * 0.3 + 1, 0, Math.PI * 2); ctx.stroke();
  // data particles orbiting
  ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
  for (let i = 0; i < 6; i++) {
    const a = t * 0.8 + (i / 6) * Math.PI * 2;
    const r = 24 + Math.sin(t + i) * 4;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawServerRacks(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const t = performance.now() * 0.003;
  for (let rack = -1; rack <= 1; rack++) {
    const rx = rack * 30;
    // rack body
    ctx.fillStyle = '#1a2233';
    ctx.fillRect(rx - 11, -34, 22, 68);
    ctx.strokeStyle = '#3a4a5a';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx - 11, -34, 22, 68);
    // drive bays with blinking lights
    for (let bay = 0; bay < 7; bay++) {
      const by = -29 + bay * 9;
      ctx.fillStyle = '#0d1520';
      ctx.fillRect(rx - 8, by, 16, 6);
      // activity light
      const blink = Math.sin(t * (2 + rack + bay * 0.7) + rack * 3 + bay * 1.5);
      ctx.fillStyle = blink > 0 ? '#00ff88' : '#1a3322';
      ctx.fillRect(rx + 5, by + 1.5, 3, 3);
      // power light
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(rx - 7, by + 1.5, 2, 3);
    }
  }
  ctx.restore();
}

function drawReactorCore(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const t = performance.now() * 0.001;
  // hazard floor markings
  ctx.strokeStyle = 'rgba(255, 200, 50, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.stroke();
  // radiation trefoil segments
  ctx.fillStyle = 'rgba(255, 200, 50, 0.1)';
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + t * 0.2;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, 46, a, a + Math.PI * 0.45);
    ctx.closePath(); ctx.fill();
  }
  // core glow
  const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 40);
  const pulseIntensity = 0.5 + Math.sin(t * 3) * 0.2;
  glow.addColorStop(0, `rgba(255, 120, 50, ${pulseIntensity})`);
  glow.addColorStop(0.5, `rgba(255, 80, 30, ${pulseIntensity * 0.5})`);
  glow.addColorStop(1, 'rgba(200, 50, 20, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
  // core center
  const coreGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 14);
  coreGrad.addColorStop(0, '#ffeecc');
  coreGrad.addColorStop(0.5, '#ff8844');
  coreGrad.addColorStop(1, '#cc4422');
  ctx.fillStyle = coreGrad;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
  // containment ring
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
  // containment bolts
  ctx.fillStyle = '#aa8855';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 22, Math.sin(a) * 22, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCoolantPipes(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const t = performance.now() * 0.002;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // main pipes
  ctx.strokeStyle = '#4a7a8a';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, 40); ctx.stroke();
  // branch pipes
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(-32, -28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(32, 0); ctx.lineTo(32, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(25, -25); ctx.stroke();
  // pipe highlights
  ctx.strokeStyle = '#6a9aaa';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-50, -2); ctx.lineTo(50, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, -40); ctx.lineTo(-2, 40); ctx.stroke();
  // flow indicators (animated dots)
  ctx.fillStyle = '#88ddff';
  for (let i = 0; i < 5; i++) {
    const progress = ((t * 0.5 + i * 0.2) % 1);
    ctx.beginPath();
    ctx.arc(-50 + progress * 100, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 4; i++) {
    const progress = ((t * 0.4 + i * 0.25) % 1);
    ctx.beginPath();
    ctx.arc(0, -40 + progress * 80, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // junction nodes
  ctx.fillStyle = '#3a6a7a';
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5a8a9a';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
  // secondary junctions
  ctx.fillStyle = '#3a6a7a';
  ctx.beginPath(); ctx.arc(-32, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(32, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -25, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// === DECORATIVE ROOM DETAILS ===

function drawPaintingLandscape(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // frame
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-24, -18, 48, 36);
  ctx.strokeStyle = '#d4a44a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-24, -18, 48, 36);
  // canvas background — sky
  const sky = ctx.createLinearGradient(-20, -14, -20, 4);
  sky.addColorStop(0, '#4a7ab5');
  sky.addColorStop(0.6, '#7ab5d4');
  sky.addColorStop(1, '#c4daa4');
  ctx.fillStyle = sky;
  ctx.fillRect(-20, -14, 40, 28);
  // mountains
  ctx.fillStyle = '#5a7a5a';
  ctx.beginPath();
  ctx.moveTo(-20, 8); ctx.lineTo(-8, -6); ctx.lineTo(4, 4); ctx.lineTo(14, -4); ctx.lineTo(20, 8);
  ctx.closePath(); ctx.fill();
  // ground
  ctx.fillStyle = '#4a6a3a';
  ctx.fillRect(-20, 8, 40, 6);
  // sun
  ctx.fillStyle = '#ffe866';
  ctx.beginPath(); ctx.arc(12, -8, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPaintingPortrait(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // ornate frame
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-20, -24, 40, 48);
  ctx.strokeStyle = '#c89a44';
  ctx.lineWidth = 3;
  ctx.strokeRect(-20, -24, 40, 48);
  ctx.strokeStyle = '#a07a30';
  ctx.lineWidth = 1;
  ctx.strokeRect(-17, -21, 34, 42);
  // dark background
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(-15, -19, 30, 38);
  // face oval
  const faceGrad = ctx.createRadialGradient(0, -4, 2, 0, -4, 12);
  faceGrad.addColorStop(0, '#e8c8a0');
  faceGrad.addColorStop(1, '#b8905a');
  ctx.fillStyle = faceGrad;
  ctx.beginPath(); ctx.ellipse(0, -4, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
  // eyes
  ctx.fillStyle = '#2a3a4a';
  ctx.fillRect(-4, -7, 2.5, 2); ctx.fillRect(1.5, -7, 2.5, 2);
  // collar
  ctx.fillStyle = '#4a5a8a';
  ctx.fillRect(-10, 8, 20, 10);
  ctx.restore();
}

function drawPaintingAbstract(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // frame
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(-22, -18, 44, 36);
  ctx.strokeStyle = '#8a8aaa';
  ctx.lineWidth = 2;
  ctx.strokeRect(-22, -18, 44, 36);
  // abstract shapes
  ctx.fillStyle = 'rgba(200, 60, 80, 0.7)';
  ctx.beginPath(); ctx.arc(-6, -4, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(60, 120, 200, 0.6)';
  ctx.fillRect(2, -8, 14, 14);
  ctx.fillStyle = 'rgba(220, 180, 40, 0.65)';
  ctx.beginPath();
  ctx.moveTo(-14, 10); ctx.lineTo(-4, -6); ctx.lineTo(6, 10);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-16, 4); ctx.bezierCurveTo(-8, -12, 8, 16, 16, 0); ctx.stroke();
  ctx.restore();
}

function drawWallTerminal(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const t = performance.now() * 0.002;
  // terminal body
  ctx.fillStyle = '#1a2233';
  ctx.fillRect(-16, -20, 32, 40);
  ctx.strokeStyle = '#3a5a7a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-16, -20, 32, 40);
  // screen
  const screenGlow = 0.4 + Math.sin(t) * 0.1;
  ctx.fillStyle = `rgba(30, 80, 60, ${screenGlow})`;
  ctx.fillRect(-12, -16, 24, 20);
  // scan lines
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = `rgba(0, 255, 120, ${0.15 + Math.sin(t + i * 0.5) * 0.08})`;
    ctx.fillRect(-11, -15 + i * 2.5, 22, 1);
  }
  // blinking cursor
  if (Math.sin(t * 3) > 0) {
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(-8, -4, 5, 2);
  }
  // keyboard area
  ctx.fillStyle = '#2a3a4a';
  ctx.fillRect(-10, 6, 20, 10);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      ctx.fillStyle = '#4a5a6a';
      ctx.fillRect(-8 + c * 4, 7 + r * 3, 3, 2);
    }
  }
  ctx.restore();
}

function drawWallPipes(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // vertical pipes
  ctx.strokeStyle = '#5a7080';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-12, -28); ctx.lineTo(-12, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -28); ctx.lineTo(12, 28); ctx.stroke();
  // pipe highlights
  ctx.strokeStyle = '#7a9aaa';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-13.5, -28); ctx.lineTo(-13.5, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-1.5, -28); ctx.lineTo(-1.5, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10.5, -28); ctx.lineTo(10.5, 28); ctx.stroke();
  // connectors
  ctx.fillStyle = '#6a8090';
  ctx.fillRect(-15, -8, 7, 4);
  ctx.fillRect(-3, 4, 7, 4);
  ctx.fillRect(9, -14, 7, 4);
  // valve wheel
  ctx.strokeStyle = '#aa6644';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -18, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#cc8855';
  ctx.beginPath(); ctx.arc(0, -18, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFloorGrate(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(40, 50, 60, 0.6)';
  ctx.fillRect(-24, -24, 48, 48);
  ctx.strokeStyle = 'rgba(80, 100, 120, 0.5)';
  ctx.lineWidth = 1;
  // grate lines
  for (let i = -20; i <= 20; i += 8) {
    ctx.beginPath(); ctx.moveTo(i, -22); ctx.lineTo(i, 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-22, i); ctx.lineTo(22, i); ctx.stroke();
  }
  // bolts at corners
  ctx.fillStyle = 'rgba(120, 140, 160, 0.4)';
  ctx.beginPath(); ctx.arc(-20, -20, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, -20, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-20, 20, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, 20, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawWallBanner(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // banner pole
  ctx.fillStyle = '#8a7a5a';
  ctx.fillRect(-20, -22, 40, 3);
  // fabric
  const t = performance.now() * 0.001;
  ctx.fillStyle = '#6a2030';
  ctx.beginPath();
  ctx.moveTo(-16, -19);
  ctx.lineTo(16, -19);
  ctx.lineTo(14, 16 + Math.sin(t) * 2);
  ctx.lineTo(0, 22 + Math.sin(t + 1) * 2);
  ctx.lineTo(-14, 16 + Math.sin(t + 2) * 2);
  ctx.closePath();
  ctx.fill();
  // emblem
  ctx.fillStyle = '#d4a44a';
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6a2030';
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  // fringe
  ctx.strokeStyle = '#d4a44a';
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 16 + Math.sin(t + i * 0.3) * 2);
    ctx.lineTo(i, 20 + Math.sin(t + i * 0.3) * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFloorRug(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // rug body
  ctx.fillStyle = 'rgba(100, 40, 50, 0.35)';
  ctx.fillRect(-30, -20, 60, 40);
  // border pattern
  ctx.strokeStyle = 'rgba(180, 120, 60, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-28, -18, 56, 36);
  ctx.strokeStyle = 'rgba(160, 100, 50, 0.2)';
  ctx.strokeRect(-24, -14, 48, 28);
  // center design
  ctx.fillStyle = 'rgba(180, 140, 80, 0.2)';
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(200, 160, 90, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawLampPost(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const t = performance.now() * 0.003;
  const flicker = 0.75 + Math.sin(t * 2.1) * 0.1 + Math.sin(t * 4.8) * 0.05;
  // ground glow (circle of light on floor)
  const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 28);
  glow.addColorStop(0, `rgba(255, 220, 150, ${flicker * 0.22})`);
  glow.addColorStop(0.6, `rgba(255, 200, 120, ${flicker * 0.08})`);
  glow.addColorStop(1, 'rgba(255, 180, 80, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
  // post base (top-down: small dark circle)
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  // post top rim
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
  // lamp head (bright center dot)
  ctx.fillStyle = `rgba(255, 240, 200, ${flicker})`;
  ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  // inner bright glow
  const inner = ctx.createRadialGradient(0, 0, 1, 0, 0, 8);
  inner.addColorStop(0, `rgba(255, 240, 200, ${flicker * 0.6})`);
  inner.addColorStop(1, 'rgba(255, 220, 150, 0)');
  ctx.fillStyle = inner;
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCeilingFan(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const t = performance.now() * 0.002;
  // shadow on floor
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.beginPath(); ctx.ellipse(0, 0, 28, 28, 0, 0, Math.PI * 2); ctx.fill();
  // blades
  ctx.strokeStyle = 'rgba(100, 90, 70, 0.3)';
  ctx.lineWidth = 6;
  for (let i = 0; i < 4; i++) {
    const a = t + (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24);
    ctx.stroke();
  }
  // center hub
  ctx.fillStyle = 'rgba(80, 70, 60, 0.4)';
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPottedPlant(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // pot
  ctx.fillStyle = '#8a5533';
  ctx.fillRect(-8, 4, 16, 12);
  ctx.fillStyle = '#6a3a1a';
  ctx.fillRect(-10, 2, 20, 4);
  // soil
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-7, 2, 14, 3);
  // leaves
  ctx.fillStyle = '#3a7a3a';
  ctx.beginPath(); ctx.ellipse(-6, -4, 6, 8, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a8a4a';
  ctx.beginPath(); ctx.ellipse(5, -6, 5, 9, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a6a2a';
  ctx.beginPath(); ctx.ellipse(0, -10, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
  // stem
  ctx.strokeStyle = '#2a5a2a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, -6); ctx.stroke();
  ctx.restore();
}

function drawCrateStack(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // bottom crate
  ctx.fillStyle = '#5a4a30';
  ctx.fillRect(-18, -4, 36, 24);
  ctx.strokeStyle = '#3a3020';
  ctx.lineWidth = 1;
  ctx.strokeRect(-18, -4, 36, 24);
  // cross bars
  ctx.strokeStyle = '#7a6a4a';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-18, -4); ctx.lineTo(18, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(18, -4); ctx.lineTo(-18, 20); ctx.stroke();
  // top crate (smaller, offset)
  ctx.fillStyle = '#6a5a3a';
  ctx.fillRect(-12, -20, 24, 18);
  ctx.strokeStyle = '#4a3a20';
  ctx.strokeRect(-12, -20, 24, 18);
  // label
  ctx.fillStyle = '#aa9a6a';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CARGO', 0, -9);
  ctx.restore();
}

function drawWallClock(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const t = performance.now() * 0.001;
  // clock face
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5a4a3a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
  // hour marks
  ctx.fillStyle = '#3a3030';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.fillRect(Math.cos(a) * 11 - 1, Math.sin(a) * 11 - 1, 2, 2);
  }
  // hour hand
  const hourAngle = (t * 0.01) % (Math.PI * 2);
  ctx.strokeStyle = '#2a2020';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(hourAngle - Math.PI / 2) * 7, Math.sin(hourAngle - Math.PI / 2) * 7);
  ctx.stroke();
  // minute hand
  const minAngle = (t * 0.1) % (Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(minAngle - Math.PI / 2) * 10, Math.sin(minAngle - Math.PI / 2) * 10);
  ctx.stroke();
  // center dot
  ctx.fillStyle = '#4a3a2a';
  ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawWallBookshelf(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // shelf frame
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(-22, -24, 44, 48);
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(-22, -24, 44, 48);
  // shelves
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-20, -8, 40, 2);
  ctx.fillRect(-20, 8, 40, 2);
  // books on each shelf
  const bookColors = ['#8a3030', '#3060a0', '#308050', '#7a6020', '#5030a0', '#a05020', '#206060'];
  for (let shelf = 0; shelf < 3; shelf++) {
    const shelfY = -22 + shelf * 16;
    let bx = -18;
    for (let b = 0; b < 6; b++) {
      const bw = 4 + Math.sin(shelf * 3 + b * 7) * 2;
      const bh = 12 + Math.sin(shelf * 5 + b * 3) * 2;
      ctx.fillStyle = bookColors[(shelf * 3 + b) % bookColors.length];
      ctx.fillRect(bx, shelfY + (14 - bh), bw, bh);
      bx += bw + 1;
      if (bx > 16) break;
    }
  }
  ctx.restore();
}

function drawBench(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // bench seat (top-down: dark wood rectangle)
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-16, -5, 32, 10);
  // wood grain lines
  ctx.strokeStyle = 'rgba(90, 60, 30, 0.6)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-14, -2); ctx.lineTo(14, -2);
  ctx.moveTo(-14, 2); ctx.lineTo(14, 2);
  ctx.stroke();
  // legs (4 corners, small dark squares)
  ctx.fillStyle = '#3a2210';
  ctx.fillRect(-15, -4, 3, 3);
  ctx.fillRect(12, -4, 3, 3);
  ctx.fillRect(-15, 1, 3, 3);
  ctx.fillRect(12, 1, 3, 3);
  // armrests
  ctx.fillStyle = '#4a2a10';
  ctx.fillRect(-17, -6, 4, 12);
  ctx.fillRect(13, -6, 4, 12);
  ctx.restore();
}

function drawExitStairs(x, y) {
  ctx.save();
  ctx.translate(x, y);

  const aura = ctx.createRadialGradient(0, 0, 6, 0, 0, 40);
  aura.addColorStop(0, 'rgba(145, 255, 244, 0.48)');
  aura.addColorStop(1, 'rgba(84, 212, 201, 0.04)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(123, 243, 255, 0.34)';
  ctx.fillRect(-26, 17, 52, 6);
  ctx.fillStyle = 'rgba(150, 255, 248, 0.46)';
  ctx.fillRect(-20, 10, 40, 5);
  ctx.fillStyle = 'rgba(188, 255, 250, 0.58)';
  ctx.fillRect(-14, 3, 28, 5);
  ctx.fillStyle = 'rgba(222, 255, 251, 0.72)';
  ctx.fillRect(-7, -4, 14, 5);

  ctx.strokeStyle = '#8ff8ec';
  ctx.lineWidth = 1;
  ctx.strokeRect(-26, 17, 52, 6);
  ctx.strokeRect(-20, 10, 40, 5);
  ctx.strokeRect(-14, 3, 28, 5);
  ctx.strokeRect(-7, -4, 14, 5);

  ctx.restore();
}

function drawAmmoPickupIcon(x, y, ammoType) {
  ctx.save();
  ctx.translate(x, y);

  if (ammoType === 'ammo-shotgun') {
    ctx.fillStyle = '#203040';
    ctx.fillRect(-7, -5, 14, 10);
    ctx.fillStyle = '#ff5648';
    ctx.fillRect(-6, -4, 12, 8);
    ctx.fillStyle = '#ffe8ca';
    ctx.fillRect(-3, -4, 6, 2);
  } else if (ammoType === 'ammo-sniper') {
    ctx.fillStyle = '#1f2a38';
    ctx.fillRect(-2.2, -7, 4.4, 12);
    ctx.fillStyle = '#d84a4a';
    ctx.beginPath();
    ctx.moveTo(-2.2, -7);
    ctx.lineTo(2.2, -7);
    ctx.lineTo(0, -10.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f6f8ff';
    ctx.fillRect(-1, 4, 2, 3);
  } else if (ammoType === 'ammo-machinegun') {
    // machine gun — linked ammo belt icon
    const links = [-6, -2, 2, 6];
    for (const lx of links) {
      ctx.fillStyle = '#3a4a5a';
      ctx.fillRect(lx - 1.5, -4, 3, 8);
      ctx.fillStyle = '#7de8ff';
      ctx.fillRect(lx - 1, -3.5, 2, 1.5);
    }
    ctx.fillStyle = '#5a7090';
    ctx.fillRect(-8, -1, 16, 2);
  } else if (ammoType === 'ammo-rocket') {
    // rocket icon — warhead + body
    ctx.fillStyle = '#8a3010';
    ctx.fillRect(-6, -2.5, 10, 5);
    ctx.fillStyle = '#ff6a00';
    ctx.beginPath();
    ctx.moveTo(4, -2.5);
    ctx.lineTo(4, 2.5);
    ctx.lineTo(9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffb060';
    ctx.fillRect(-6, -1, 4, 2);
    ctx.fillStyle = '#3a1808';
    ctx.fillRect(-9, -3, 3, 6);
  } else {
    // handgun — compact pistol bullets
    const bulletOffsets = [-4.5, 0, 4.5];
    for (const offset of bulletOffsets) {
      ctx.fillStyle = '#2a3442';
      ctx.fillRect(offset - 2, -5, 4, 8);
      ctx.fillStyle = '#f0efdc';
      ctx.fillRect(offset - 1.2, -4.5, 2.4, 6);
      ctx.fillStyle = '#e8a020';
      ctx.beginPath();
      ctx.moveTo(offset - 1.2, -4.5);
      ctx.lineTo(offset + 1.2, -4.5);
      ctx.lineTo(offset, -7.5);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawHealthPickupIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-7, -7, 14, 14);
  ctx.strokeStyle = '#d3dbe5';
  ctx.lineWidth = 1;
  ctx.strokeRect(-7, -7, 14, 14);

  ctx.fillStyle = '#d82a3a';
  ctx.fillRect(-2, -5.5, 4, 11);
  ctx.fillRect(-5.5, -2, 11, 4);

  ctx.restore();
}

function draw() {
  if (game.state === 'character-select') {
    drawCharacterSelectScreen();
    return;
  }

  const p = game.player;
  const camera = { x: p.x, y: p.y };

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const theme = LEVEL_THEMES[game.mapIndex % LEVEL_THEMES.length];

  drawSpaceParallax(camera);
  drawGrid(camera);
  drawMapFeatures(camera);

  for (const wall of mapRects()) {
    const s = worldToScreen(wall.x, wall.y, camera);
    drawSciWall(s.x, s.y, wall.w, wall.h, theme);
  }

  // draw doors (swing-open style)
  for (const door of game.doors) {
    const ds = worldToScreen(door.x * TILE, door.y * TILE, camera);
    drawDoor(ds.x, ds.y, door.w * TILE, door.h * TILE, door, theme);
    // draw spacebar prompt if player is near a closed door
    if (door.showPrompt && !door.open) {
      const promptX = ds.x + (door.w * TILE) / 2;
      const promptY = ds.y - 16;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(promptX - 48, promptY - 14, 96, 22);
      ctx.strokeStyle = '#ffd740';
      ctx.lineWidth = 1;
      ctx.strokeRect(promptX - 48, promptY - 14, 96, 22);
      ctx.fillStyle = '#ffd740';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(door.locked && !game.hasKey ? 'LOCKED' : '[SPACE] Open', promptX, promptY + 1);
      ctx.restore();
    }
  }

  const exitPoint = worldToScreen(game.activeMap.exit.x * TILE, game.activeMap.exit.y * TILE, camera);
  drawExitStairs(exitPoint.x, exitPoint.y);

  // draw key pickup
  if (game.keyPickup && game.keyPickup.alive) {
    const ks = worldToScreen(game.keyPickup.x, game.keyPickup.y, camera);
    drawKeyPickup(ks.x, ks.y);
  }

  for (const pickup of game.pickups) {
    if (!pickup.alive) continue;
    const s = worldToScreen(pickup.x, pickup.y, camera);
    if (pickup.type === 'ammo-handgun') ctx.fillStyle = '#f5e26a';
    if (pickup.type === 'ammo-shotgun') ctx.fillStyle = '#ff7d57';
    if (pickup.type === 'ammo-sniper') ctx.fillStyle = '#ff5470';
    if (pickup.type === 'ammo-machinegun') ctx.fillStyle = '#7de8ff';
    if (pickup.type === 'ammo-rocket') ctx.fillStyle = '#ff6a00';
    if (pickup.type === 'health') ctx.fillStyle = '#7bff9f';
    if (pickup.type === 'armor') ctx.fillStyle = '#7bf9ff';
    ctx.fillRect(s.x - 10, s.y - 10, 20, 20);

    if (pickup.type.startsWith('ammo-')) drawAmmoPickupIcon(s.x, s.y + 1, pickup.type);
    if (pickup.type === 'health') drawHealthPickupIcon(s.x, s.y);
    if (pickup.type === 'armor') {
      ctx.fillStyle = '#1d2b38';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡', s.x, s.y + 4);
    }
  }

  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;
    const s = worldToScreen(enemy.x, enemy.y, camera);

    if (enemy.alerted) {
      ctx.strokeStyle = 'rgba(255, 82, 82, 0.95)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 60, 60, 0.95)';
      ctx.shadowBlur = 13;
      if (enemy.type === 'dog') {
        ctx.beginPath();
        ctx.arc(s.x, s.y, enemy.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(s.x - 14, s.y - 20, 28, 42);
      }
      ctx.shadowBlur = 0;
    }

    if (enemy.type === 'dog') {
      drawDogEnemy(enemy, s.x, s.y);
    } else {
      drawHumanoidEnemy(enemy, s.x, s.y);
    }

    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = '#1f2f3d';
    ctx.fillRect(s.x - 18, s.y - 28, 36, 5);
    ctx.fillStyle = '#86ff95';
    ctx.fillRect(s.x - 18, s.y - 28, 36 * hpRatio, 5);

    if (enemy.type === 'shield' || enemy.type === 'flanker') {
      ctx.fillStyle = enemy.type === 'shield' ? '#91d9ff' : '#ff98a2';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.type === 'shield' ? '🛡' : '⚡', s.x, s.y - 34);
    }
  }

  for (const bullet of game.bullets) {
    const s = worldToScreen(bullet.x, bullet.y, camera);
    if (bullet.weapon === 'rocket') {
      // Rocket — large elongated warhead with trail
      const ang = Math.atan2(bullet.vy, bullet.vx);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#ff6a00';
      ctx.fillRect(-10, -4, 18, 8);
      ctx.fillStyle = '#ffb060';
      ctx.fillRect(6, -2.5, 5, 5);
      ctx.fillStyle = 'rgba(255,120,0,0.45)';
      ctx.fillRect(-18, -5, 9, 10);
      ctx.restore();
    } else if (bullet.weapon === 'sniper') {
      const ang = Math.atan2(bullet.vy, bullet.vx);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(-9, -1.5, 18, 3);
      ctx.fillStyle = '#ffaaaa';
      ctx.fillRect(-9, -0.5, 18, 1);
      ctx.restore();
    } else if (bullet.weapon === 'shotgun') {
      ctx.fillStyle = '#ffd9a1';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (bullet.weapon === 'machinegun') {
      ctx.fillStyle = '#a0f8ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // handgun
      ctx.fillStyle = '#f5e870';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const bullet of game.enemyBullets) {
    const s = worldToScreen(bullet.x, bullet.y, camera);
    ctx.fillStyle = '#ff9558';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw explosions — expanding shockwave ring + inner fireball
  for (const exp of game.explosions) {
    const s = worldToScreen(exp.x, exp.y, camera);
    const t = 1 - exp.life / exp.maxLife; // 0 = just spawned, 1 = fading out
    const currentRadius = exp.radius * (0.15 + t * 0.85);
    const alpha = Math.max(0, 1 - t * 1.1);

    // Outer shockwave ring
    ctx.beginPath();
    ctx.arc(s.x, s.y, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 160, 40, ${alpha * 0.9})`;
    ctx.lineWidth = 5 * (1 - t);
    ctx.stroke();

    // Mid fire ring
    if (t < 0.5) {
      const fireR = currentRadius * 0.65;
      ctx.beginPath();
      ctx.arc(s.x, s.y, fireR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 90, 10, ${alpha * 0.55})`;
      ctx.fill();
    }

    // Central fireball
    if (t < 0.35) {
      const coreR = currentRadius * 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, coreR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 240, 160, ${alpha * 0.85})`;
      ctx.fill();
    }
  }

  for (const flash of game.muzzleFlashes) {
    const s = worldToScreen(flash.x, flash.y, camera);
    const alpha = flash.life / flash.maxLife;
    const flashSize = flash.size * (0.5 + alpha * 0.7);

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(flash.angle);
    ctx.fillStyle = `rgba(255, 245, 210, ${Math.min(0.95, alpha)})`;
    ctx.beginPath();
    ctx.moveTo(flashSize, 0);
    ctx.lineTo(-flashSize * 0.35, flashSize * 0.5);
    ctx.lineTo(-flashSize * 0.35, -flashSize * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = flash.color;
    ctx.globalAlpha = alpha * 0.75;
    ctx.beginPath();
    ctx.arc(0, 0, flashSize * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (p.activeWeapon === 'sniper') {
    ctx.strokeStyle = 'rgba(255, 54, 54, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + Math.cos(p.angle) * 20, canvas.height / 2 + Math.sin(p.angle) * 20);
    ctx.lineTo(game.mouse.x, game.mouse.y);
    ctx.stroke();
  }

  drawPlayer(p);

  ctx.fillStyle = 'rgba(15, 23, 35, 0.7)';
  ctx.fillRect(16, 16, 270, 68);
  ctx.strokeStyle = '#60d7ff';
  ctx.strokeRect(16, 16, 270, 68);
  ctx.fillStyle = '#c7f5ff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Level ${game.mapIndex + 1}: ${game.activeMap.name}`, 26, 38);
  ctx.font = '13px sans-serif';
  ctx.fillText('SPACE to open doors · Reach STAIRS', 26, 55);
  // key status indicator
  if (game.keyPickup) {
    ctx.fillStyle = game.hasKey ? '#ffd740' : '#666';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(game.hasKey ? 'KEY' : 'KEY: ???', 26, 73);
    if (game.hasKey) {
      ctx.fillStyle = '#ffd740';
      ctx.fillRect(62, 64, 10, 10);
      ctx.strokeStyle = '#d4a44a';
      ctx.strokeRect(62, 64, 10, 10);
    }
  }

  if (game.paused) {
    ctx.fillStyle = 'rgba(6, 12, 18, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function csRoundRect(cx, cy, cw, ch, r) {
  cx = Math.round(cx); cy = Math.round(cy);
  cw = Math.round(cw); ch = Math.round(ch);
  r = Math.min(r, cw / 2, ch / 2);
  ctx.beginPath();
  ctx.moveTo(cx + r, cy);
  ctx.lineTo(cx + cw - r, cy);
  ctx.arcTo(cx + cw, cy, cx + cw, cy + r, r);
  ctx.lineTo(cx + cw, cy + ch - r);
  ctx.arcTo(cx + cw, cy + ch, cx + cw - r, cy + ch, r);
  ctx.lineTo(cx + r, cy + ch);
  ctx.arcTo(cx, cy + ch, cx, cy + ch - r, r);
  ctx.lineTo(cx, cy + r);
  ctx.arcTo(cx, cy, cx + r, cy, r);
  ctx.closePath();
}

function csWrapText(text, cx, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCharacterSprite(cd, cx, cy, sc) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sc, sc);

  // Legs
  ctx.fillStyle = cd.pants;
  ctx.fillRect(-9, 7, 7, 15);
  ctx.fillRect(2, 7, 7, 15);
  // Boots
  ctx.fillStyle = cd.boots;
  ctx.fillRect(-10, 22, 9, 3);
  ctx.fillRect(1, 22, 9, 3);

  // Torso
  const tg = ctx.createLinearGradient(-10, -4, 10, 14);
  tg.addColorStop(0, cd.shirt);
  tg.addColorStop(1, cd.shirtDark);
  ctx.fillStyle = tg;
  ctx.fillRect(-11, -4, 22, 15);

  // Vanguard chest plate
  if (cd.hasHelmet) {
    ctx.fillStyle = cd.helmetColor;
    ctx.fillRect(-9, -3, 18, 12);
    ctx.fillStyle = cd.helmetDark;
    ctx.fillRect(-7, -1, 14, 3);
    ctx.fillStyle = cd.accentColor;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-3, 2, 6, 2);
    ctx.globalAlpha = 1;
  }

  // Arms
  ctx.fillStyle = cd.skin;
  ctx.fillRect(-15, 0, 4, 10);
  ctx.fillRect(11, 0, 4, 10);

  // Head
  if (cd.hasHelmet) {
    ctx.fillStyle = cd.helmetColor;
    ctx.fillRect(-9, -18, 18, 15);
    ctx.fillStyle = cd.helmetDark;
    ctx.fillRect(-7, -15, 14, 7);
    ctx.fillStyle = 'rgba(180,255,100,0.6)';
    ctx.fillRect(-6, -14, 12, 5);
    ctx.fillStyle = cd.accentColor;
    ctx.fillRect(-9, -4, 18, 2);
  } else if (cd.hasHood) {
    ctx.fillStyle = cd.hoodColor;
    ctx.fillRect(-10, -19, 20, 16);
    ctx.fillStyle = cd.hoodDark;
    ctx.fillRect(-8, -17, 16, 7);
    ctx.fillStyle = cd.skin;
    ctx.fillRect(-5, -13, 10, 9);
    ctx.fillStyle = cd.accentColor;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-4, -11, 3, 2.5);
    ctx.fillRect(1, -11, 3, 2.5);
    ctx.globalAlpha = 1;
    ctx.fillStyle = cd.hoodColor;
    ctx.fillRect(-10, -5, 20, 3);
  } else {
    const hg = ctx.createLinearGradient(-8, -16, 8, -4);
    hg.addColorStop(0, cd.skin);
    hg.addColorStop(1, cd.skinDark);
    ctx.fillStyle = hg;
    ctx.fillRect(-8, -16, 16, 13);
    ctx.fillStyle = cd.hair;
    ctx.fillRect(-8, -16, 16, 4);
    ctx.fillStyle = '#15202a';
    ctx.fillRect(-5, -10, 2.4, 2.2);
    ctx.fillRect(2, -10, 2.4, 2.2);
  }

  // Weapon
  ctx.fillStyle = '#1f344a';
  ctx.fillRect(11, -1, 13, 4);
  ctx.fillStyle = cd.accentColor;
  ctx.fillRect(22, -0.5, 4, 2.5);

  ctx.restore();
}

function drawCharCard(cd, cardX, cardY, cardW, cardH, isHovered) {
  ctx.save();

  if (isHovered) {
    ctx.shadowColor = cd.accentColor;
    ctx.shadowBlur = 24;
  }

  csRoundRect(cardX, cardY, cardW, cardH, 10);
  ctx.fillStyle = isHovered ? 'rgba(22,32,52,0.97)' : 'rgba(12,18,30,0.92)';
  ctx.fill();
  ctx.strokeStyle = isHovered ? cd.accentColor : 'rgba(100,140,180,0.28)';
  ctx.lineWidth = isHovered ? 2 : 1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Preview panel background
  const prevH = Math.round(cardH * 0.30);
  csRoundRect(cardX + 4, cardY + 4, cardW - 8, prevH, 7);
  ctx.fillStyle = isHovered ? 'rgba(30,45,65,0.55)' : 'rgba(14,20,34,0.6)';
  ctx.fill();

  // Accent glow strip at top of card
  csRoundRect(cardX + 4, cardY + 4, cardW - 8, 4, 3);
  ctx.fillStyle = cd.accentColor;
  ctx.globalAlpha = isHovered ? 0.8 : 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Character sprite
  const spriteScale = Math.min(cardW, prevH) / 130;
  drawCharacterSprite(cd, cardX + cardW / 2, cardY + prevH * 0.62, spriteScale);

  // Name
  const fs = Math.max(12, Math.round(cardW * 0.1));
  ctx.fillStyle = isHovered ? cd.accentColor : '#c8dae8';
  ctx.font = `bold ${fs}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(cd.name, cardX + cardW / 2, cardY + prevH + fs + 6);

  // Title
  const fsTitle = Math.max(10, Math.round(cardW * 0.072));
  ctx.fillStyle = '#8899aa';
  ctx.font = `${fsTitle}px monospace`;
  ctx.fillText(cd.title, cardX + cardW / 2, cardY + prevH + fs + fsTitle + 10);

  // Stats
  const statsTop = cardY + prevH + fs + fsTitle + 20;
  const barPad = Math.round(cardW * 0.1);
  const barAvailW = cardW - barPad * 2;
  const labelW = Math.round(barAvailW * 0.38);
  const barX = cardX + barPad + labelW;
  const barW2 = barAvailW - labelW;
  const statH = 5;
  const fsS = Math.max(9, Math.round(cardW * 0.065));

  const stats = [
    { label: 'HP', val: cd.hp, max: 130, color: '#7bff9f' },
    { label: 'ARMOR', val: cd.armor, max: 70, color: '#7bf9ff' },
    { label: 'SPEED', val: cd.speed - 200, max: 140, color: '#ffcc44' }
  ];

  stats.forEach((s, si) => {
    const sy = statsTop + si * Math.round(cardH * 0.07);
    ctx.fillStyle = '#6677aa';
    ctx.font = `${fsS}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(s.label, cardX + barPad, sy + statH);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(barX, sy, barW2, statH);
    const fill = Math.round((s.val / s.max) * barW2);
    ctx.fillStyle = s.color;
    ctx.fillRect(barX, sy, fill, statH);
  });

  // Description
  const descTop = statsTop + 3 * Math.round(cardH * 0.07) + 8;
  ctx.fillStyle = '#667788';
  const fsDesc = Math.max(9, Math.round(cardW * 0.065));
  ctx.font = `${fsDesc}px monospace`;
  ctx.textAlign = 'center';
  const lines = csWrapText(cd.desc, cardX + cardW / 2, cardW - 24, fsDesc + 4);
  lines.forEach((ln, li) => {
    ctx.fillText(ln, cardX + cardW / 2, descTop + li * (fsDesc + 5));
  });

  // Select button
  const btnH = Math.round(cardH * 0.1);
  const btnY = cardY + cardH - btnH - 8;
  const btnX = cardX + 10;
  const btnW = cardW - 20;
  csRoundRect(btnX, btnY, btnW, btnH, 5);
  ctx.fillStyle = isHovered ? cd.accentColor : 'rgba(80,110,150,0.2)';
  ctx.fill();
  ctx.strokeStyle = isHovered ? cd.accentColor : 'rgba(100,140,180,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const fsBtnLabel = Math.max(10, Math.round(cardW * 0.08));
  ctx.fillStyle = isHovered ? '#000' : '#7788aa';
  ctx.font = `bold ${fsBtnLabel}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(isHovered ? '[ SELECT ]' : 'SELECT', cardX + cardW / 2, btnY + btnH * 0.67);

  ctx.restore();
}

function drawCharacterSelectScreen() {
  const W = canvas.width;
  const H = canvas.height;

  // Background
  ctx.fillStyle = '#070b12';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(80,130,200,0.05)';
  ctx.lineWidth = 1;
  const gs = 48;
  for (let gx = 0; gx < W; gx += gs) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += gs) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // Corner accents
  const acLen = 36;
  const acW = 2;
  ctx.strokeStyle = 'rgba(120,200,255,0.25)';
  ctx.lineWidth = acW;
  [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([ox, oy, dx, dy]) => {
    ctx.beginPath(); ctx.moveTo(ox + dx * 12, oy); ctx.lineTo(ox + dx * (12 + acLen), oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy + dy * 12); ctx.lineTo(ox, oy + dy * (12 + acLen)); ctx.stroke();
  });

  // Title
  const titleSize = Math.max(20, Math.round(W * 0.028));
  ctx.font = `bold ${titleSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SELECT YOUR OPERATIVE', W / 2, H * 0.1);

  // Subtitle
  const subSize = Math.max(10, Math.round(W * 0.011));
  ctx.font = `${subSize}px monospace`;
  ctx.fillStyle = 'rgba(100,170,220,0.7)';
  ctx.fillText('Choose wisely — each operative has unique strengths', W / 2, H * 0.1 + titleSize * 0.9);

  // Cards
  const gap = W * 0.028;
  const cardW = Math.round((W * 0.82 - gap * 2) / 3);
  const cardH = Math.round(H * 0.76);
  const totalW = cardW * 3 + gap * 2;
  const startX = Math.round((W - totalW) / 2);
  const cardTop = Math.round(H * 0.17);

  CHARACTER_DEFS.forEach((cd, i) => {
    const cx = startX + i * (cardW + gap);
    drawCharCard(cd, cx, cardTop, cardW, cardH, game.charSelectHover === i);
  });
}

function getCharSelectCardBounds() {
  const W = canvas.width;
  const H = canvas.height;
  const gap = W * 0.028;
  const cardW = Math.round((W * 0.82 - gap * 2) / 3);
  const cardH = Math.round(H * 0.76);
  const totalW = cardW * 3 + gap * 2;
  const startX = Math.round((W - totalW) / 2);
  const cardTop = Math.round(H * 0.17);
  return CHARACTER_DEFS.map((_, i) => ({
    x: startX + i * (cardW + gap),
    y: cardTop,
    w: cardW,
    h: cardH
  }));
}

function selectCharacter(charDef) {
  const p = game.player;
  p.charDef = charDef;
  p.hp = charDef.hp;
  p.maxHp = charDef.maxHp;
  p.armor = charDef.armor;
  p.maxArmor = charDef.maxArmor;
  p.speed = charDef.speed;
  game.state = 'playing';
  startMap(0, false);
  updatePanel(game.enemies.length);
}

function drawPlayer(player) {
  const cd = player.charDef || CHARACTER_DEFS[1];
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  const stride = player.moving ? Math.sin(player.walkCycle) : 0;
  const bob = player.moving ? Math.sin(player.walkCycle * 2) * 2.2 : 0;
  const armSwing = player.moving ? Math.sin(player.walkCycle + Math.PI / 2) * 0.4 : 0;
  const recoil = Math.max(0, player.fireCooldown * 34);
  const shirtColor = player.invulnerable > 0 ? '#ffd66e' : cd.shirt;
  const knifeProgress = player.knifeAnim > 0 ? 1 - player.knifeAnim / 0.3 : 0;
  const knifeStabOffset = player.activeWeapon === 'knife' ? Math.sin(knifeProgress * Math.PI) * 16 : 0;

  ctx.save();
  ctx.translate(x, y + bob);

  const legLiftA = stride * 5.8;
  const legLiftB = -stride * 5.8;
  ctx.fillStyle = cd.pants;
  ctx.fillRect(-9, 7 + legLiftA, 7, 15);
  ctx.fillRect(2, 7 + legLiftB, 7, 15);

  ctx.fillStyle = cd.boots;
  ctx.fillRect(-10, 22 + legLiftA, 9, 3);
  ctx.fillRect(1, 22 + legLiftB, 9, 3);

  const torsoGrad = ctx.createLinearGradient(-10, -6, 10, 12);
  torsoGrad.addColorStop(0, shirtColor);
  torsoGrad.addColorStop(1, player.invulnerable > 0 ? '#d4aa00' : cd.shirtDark);
  ctx.fillStyle = torsoGrad;
  ctx.fillRect(-11, -4, 22, 15);

  // Vanguard chest armor plate
  if (cd.hasHelmet) {
    ctx.fillStyle = cd.helmetColor;
    ctx.fillRect(-9, -3, 18, 12);
    ctx.fillStyle = cd.helmetDark;
    ctx.fillRect(-7, -1, 14, 3);
    ctx.fillStyle = cd.accentColor;
    ctx.fillRect(-3, 2, 6, 2);
  }

  ctx.save();
  ctx.rotate(player.angle * 0.32);

  ctx.fillStyle = cd.skin;
  ctx.save();
  ctx.translate(-11, 2);
  ctx.rotate(-0.5 + armSwing);
  ctx.fillRect(-2, -2, 4, 11);
  ctx.restore();

  ctx.save();
  ctx.translate(11, 2);
  ctx.rotate(0.45 - armSwing * 0.6);
  ctx.fillRect(-2, -2, 4, 11);
  ctx.restore();

  // Head
  if (cd.hasHelmet) {
    ctx.fillStyle = cd.helmetColor;
    ctx.fillRect(-9, -18, 18, 15);
    ctx.fillStyle = cd.helmetDark;
    ctx.fillRect(-7, -15, 14, 7);
    ctx.fillStyle = 'rgba(180,255,100,0.55)';
    ctx.fillRect(-6, -14, 12, 5);
    ctx.fillStyle = cd.accentColor;
    ctx.fillRect(-9, -4, 18, 2);
  } else if (cd.hasHood) {
    ctx.fillStyle = cd.hoodColor;
    ctx.fillRect(-10, -18, 20, 15);
    ctx.fillStyle = cd.hoodDark;
    ctx.fillRect(-8, -16, 16, 6);
    ctx.fillStyle = cd.skin;
    ctx.fillRect(-5, -12, 10, 8);
    ctx.fillStyle = cd.accentColor;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-4, -10, 3, 2);
    ctx.fillRect(1, -10, 3, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = cd.hoodColor;
    ctx.fillRect(-10, -5, 20, 3);
  } else {
    const headGrad = ctx.createLinearGradient(-8, -16, 8, -4);
    headGrad.addColorStop(0, cd.skin);
    headGrad.addColorStop(1, cd.skinDark);
    ctx.fillStyle = headGrad;
    ctx.fillRect(-8, -16, 16, 13);

    ctx.fillStyle = cd.hair;
    ctx.fillRect(-8, -16, 16, 4);
  }

  if (!cd.hasHelmet && !cd.hasHood) {
    const eyeOffsetX = Math.cos(player.angle) * 1.7;
    const eyeOffsetY = Math.sin(player.angle) * 1.4;
    ctx.fillStyle = '#15202a';
    ctx.fillRect(-5 + eyeOffsetX, -10 + eyeOffsetY, 2.4, 2.2);
    ctx.fillRect(2 + eyeOffsetX, -10 + eyeOffsetY, 2.4, 2.2);
  }

  // Body is already rotated by (angle * 0.32). Gun must add (angle * 0.68) so
  // total canvas rotation = 0.32 + 0.68 = 1.0 × angle — pointing at the mouse.
  ctx.save();
  ctx.rotate(player.angle * 0.68);
  if (player.activeWeapon === 'knife') {
    // Knife — handle + blade
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(8 + knifeStabOffset * 0.2, -3, 6, 6);
    ctx.fillStyle = '#8a7060';
    ctx.fillRect(13 + knifeStabOffset * 0.2, -2, 2, 4);
    ctx.fillStyle = '#e8eef4';
    ctx.fillRect(14 + knifeStabOffset, -1.5, 14, 1.5);
    ctx.fillRect(14 + knifeStabOffset, 0, 12, 1);
    ctx.fillStyle = '#b0c8e0';
    ctx.fillRect(26 + knifeStabOffset, -2, 3, 1.5);
  } else if (player.activeWeapon === 'handgun') {
    // Handgun — compact semi-auto pistol
    ctx.fillStyle = '#1e2c38';
    ctx.fillRect(6 - recoil, -2.5, 14, 5);
    ctx.fillStyle = '#38495a';
    ctx.fillRect(7 - recoil, -4.5, 5, 2);
    ctx.fillStyle = '#2a3a48';
    ctx.fillRect(8 - recoil, -2, 4, 6);
    ctx.fillStyle = '#c8d4de';
    ctx.fillRect(19 - recoil, -1.2, 2, 2.4);
    ctx.fillStyle = '#f5e26a';
    ctx.fillRect(20.5 - recoil, -0.6, 1.5, 1.2);
  } else if (player.activeWeapon === 'shotgun') {
    // Shotgun — pump-action with wood stock
    ctx.fillStyle = '#1a2830';
    ctx.fillRect(6 - recoil, -3.5, 20, 7);
    ctx.fillStyle = '#7e4a20';
    ctx.fillRect(6 - recoil, -2.5, 10, 5);
    ctx.fillStyle = '#5a3418';
    ctx.fillRect(9 - recoil, 1, 7, 3);
    ctx.fillStyle = '#b8c8d4';
    ctx.fillRect(23 - recoil, -2, 5, 4);
    ctx.fillStyle = '#888';
    ctx.fillRect(22 - recoil, -1, 1.5, 2);
  } else if (player.activeWeapon === 'machinegun') {
    // Machine Gun — long barrel, visible magazine
    ctx.fillStyle = '#1c2e3c';
    ctx.fillRect(6 - recoil, -3, 22, 6);
    ctx.fillStyle = '#2a4050';
    ctx.fillRect(7 - recoil, -5.5, 7, 2.5);
    ctx.fillStyle = '#3a5568';
    ctx.fillRect(14 - recoil, -1.5, 6, 5.5);
    ctx.fillStyle = '#7de8ff';
    ctx.fillRect(26 - recoil, -1, 4, 2);
    ctx.fillStyle = '#a0f8ff';
    ctx.fillRect(29 - recoil, -0.5, 2, 1);
  } else if (player.activeWeapon === 'sniper') {
    // Sniper Rifle — long with scope
    ctx.fillStyle = '#1e2e40';
    ctx.fillRect(5 - recoil, -2.5, 28, 5);
    ctx.fillStyle = '#2e4558';
    ctx.fillRect(13 - recoil, -6.5, 11, 4);
    ctx.fillStyle = '#0a1018';
    ctx.fillRect(16 - recoil, -8.5, 5, 2);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(31 - recoil, -1.2, 3, 2.4);
    ctx.fillStyle = '#aacae0';
    ctx.fillRect(15 - recoil, -7.5, 3, 1);
  } else if (player.activeWeapon === 'rocket') {
    // Rocket Launcher — wide tube on shoulder
    ctx.fillStyle = '#2a2010';
    ctx.fillRect(4 - recoil, -5, 24, 10);
    ctx.fillStyle = '#3a3020';
    ctx.fillRect(12 - recoil, -6, 8, 3);
    ctx.fillStyle = '#6a5a3a';
    ctx.fillRect(4 - recoil, -4, 6, 8);
    ctx.fillStyle = '#ff8020';
    ctx.fillRect(27 - recoil, -3.5, 5, 7);
    ctx.fillStyle = '#ffb060';
    ctx.fillRect(28 - recoil, -2, 4, 4);
    ctx.fillStyle = '#ff6a00';
    ctx.fillRect(30 - recoil, -1, 3, 2);
  } else {
    ctx.fillStyle = '#1f344a';
    ctx.fillRect(8 - recoil, -2.2, 13, 4.4);
    ctx.fillStyle = '#7ce6ff';
    ctx.fillRect(19 - recoil, -1.3, 4, 2.6);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(-12, -8, 24, 1);
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

function drawHumanoidEnemy(enemy, x, y) {
  const palette = enemy.variant || HUMANOID_VARIANTS[0];
  const stride = enemy.moving ? Math.sin(enemy.walkCycle) : 0;
  const bob = enemy.moving ? Math.sin(enemy.walkCycle * 2) * 1.9 : 0;
  const sway = enemy.moving ? Math.sin(enemy.walkCycle * 0.5) * 0.22 : 0;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(sway);

  ctx.fillStyle = palette.pants;
  ctx.fillRect(-9, 7 + stride * 5, 7, 15);
  ctx.fillRect(2, 7 - stride * 5, 7, 15);

  ctx.fillStyle = '#201d1d';
  ctx.fillRect(-10, 22 + stride * 5, 9, 3);
  ctx.fillRect(1, 22 - stride * 5, 9, 3);

  const shirtGrad = ctx.createLinearGradient(-10, -4, 10, 12);
  shirtGrad.addColorStop(0, palette.shirt);
  shirtGrad.addColorStop(1, 'rgba(28, 34, 51, 0.9)');
  ctx.fillStyle = shirtGrad;
  ctx.fillRect(-11, -4, 22, 15);

  ctx.fillStyle = palette.skin;
  const armSwing = enemy.moving ? Math.sin(enemy.walkCycle + Math.PI / 2) * 2 : 0;
  ctx.fillRect(-13, 0 + armSwing, 3.5, 10);
  ctx.fillRect(9.5, 0 - armSwing, 3.5, 10);
  ctx.fillRect(-8, -16, 16, 13);

  ctx.fillStyle = palette.hair;
  ctx.fillRect(-8, -16, 16, 4);

  ctx.fillStyle = '#16212b';
  ctx.fillRect(-5 + sway * 8, -10, 2.2, 2.2);
  ctx.fillRect(2.5 + sway * 8, -10, 2.2, 2.2);

  ctx.fillStyle = '#ba5058';
  ctx.fillRect(8, 1.2, 10, 4.2);

  ctx.restore();
}

function drawDogEnemy(enemy, x, y) {
  const runOffset = enemy.moving ? Math.sin(enemy.walkCycle) : 0;
  const bob = enemy.moving ? Math.cos(enemy.walkCycle * 2) * 1.6 : 0;

  ctx.save();
  ctx.translate(x, y + bob);

  const bodyGrad = ctx.createLinearGradient(-14, -7, 10, 8);
  bodyGrad.addColorStop(0, '#7a6353');
  bodyGrad.addColorStop(1, '#5f4a3f');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(-14, -6, 24, 13);

  ctx.fillStyle = '#6a5448';
  ctx.fillRect(8, -9, 11, 11);

  ctx.fillStyle = '#201815';
  ctx.fillRect(14, -11, 3, 4);
  ctx.fillRect(10, -11, 3, 4);

  ctx.fillStyle = '#342822';
  ctx.fillRect(-10, 6 + runOffset * 3, 4, 10);
  ctx.fillRect(-2, 6 - runOffset * 3, 4, 10);
  ctx.fillRect(4, 6 + runOffset * 3, 4, 10);
  ctx.fillRect(12, 6 - runOffset * 3, 4, 10);

  ctx.fillStyle = '#70594c';
  ctx.fillRect(-18, -6, 7, 3);

  ctx.fillStyle = '#e9d8a7';
  ctx.fillRect(17, -3, 2, 2);

  ctx.restore();
}

function updatePanel(livingEnemies) {
  const p = game.player;
  const hpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
  const armorRatio = Math.max(0, Math.min(1, p.armor / p.maxArmor));
  const activeWeapon = WEAPONS[p.activeWeapon];
  const activeAmmo = ammoState();
  const magSize = activeWeapon.magazineSize || 1;
  const ammoRatio = activeAmmo ? Math.max(0, Math.min(1, activeAmmo.mag / magSize)) : 1;
  const reloadRatio = p.reloading > 0 ? 1 - p.reloading / (activeWeapon.reloadTime || 1) : 0;
  const statusMsg = p.reloading > 0 ? `Reloading... ${Math.round(reloadRatio * 100)}%` : game.message;
  const objectiveText = game.objectiveMode === 'purge' ? 'Clear all hostiles before exit' : 'Reach exit any time';

  statusEl.innerHTML = `
    <div class="hud-section">
      <p class="hud-title">Mission Overview</p>
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Map</span>
          <span class="meta-value value-accent">${game.activeMap.name}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Level</span>
          <span class="meta-value value-accent">${game.mapIndex + 1}/${maps.length}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Objective</span>
          <span class="meta-value value-accent">${game.objectiveMode === 'purge' ? 'Purge' : 'Speedrun'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Threat</span>
          <span class="meta-value ${game.difficulty.label === 'Lethal' ? 'value-danger' : 'value-accent'}">${game.difficulty.label}</span>
        </div>
      </div>
    </div>

    <div class="hud-section stat-stack">
      <div class="stat-card">
        <div class="stat-row"><span class="stat-label">HP</span><span class="stat-value ${p.hp < 35 ? 'value-danger' : 'value-good'}">${Math.max(0, Math.round(p.hp))}/${p.maxHp}</span></div>
        <div class="meter"><div class="meter-fill hp" style="width:${hpRatio * 100}%"></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-row"><span class="stat-label">Armor</span><span class="stat-value ${p.armor < 25 ? 'value-danger' : 'value-accent'}">${Math.max(0, Math.round(p.armor))}/${p.maxArmor}</span></div>
        <div class="meter"><div class="meter-fill armor" style="width:${armorRatio * 100}%"></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-row"><span class="stat-label">Ammo</span><span class="stat-value value-accent">${activeAmmo ? `${activeAmmo.mag}/${magSize} <small>· ${activeAmmo.reserve} reserve</small>` : '∞'}</span></div>
        <div class="meter"><div class="meter-fill ammo" style="width:${ammoRatio * 100}%"></div></div>
        ${p.reloading > 0 ? `<div class="reload-wrap"><div class="stat-row"><span class="stat-label">Reload</span><span class="stat-value value-accent">${Math.round(reloadRatio * 100)}%</span></div><div class="meter"><div class="meter-fill reload" style="width:${reloadRatio * 100}%"></div></div></div>` : ''}
      </div>
      <div class="stat-card">
        <div class="stat-row"><span class="stat-label">Weapon</span><span class="stat-value value-accent">${activeWeapon.name} <small>(press 1-6)</small></span></div>
        <div class="meter"><div class="meter-fill armor" style="width:100%"></div></div>
      </div>
    </div>

    ${game.keyPickup ? `<div class="stat-card"><div class="stat-row"><span class="stat-label">Key</span><span class="stat-value ${game.hasKey ? 'value-good' : 'value-danger'}">${game.hasKey ? 'Acquired' : 'Not Found'}</span></div><div class="meter"><div class="meter-fill ${game.hasKey ? 'hp' : 'reload'}" style="width:${game.hasKey ? 100 : 0}%"></div></div></div>` : ''}

    <p class="status-text"><strong>Status:</strong> ${statusMsg}</p>
    <p class="status-text"><strong>Objective:</strong> ${objectiveText} (toggle: ${game.keybinds.objectiveToggle.toUpperCase()})</p>
  `;

  scoreboardEl.innerHTML = `
    <div class="hud-section">
      <p class="hud-title">Run Stats</p>
      <div class="kpi-row">
        <div class="kpi">
          <span class="meta-label">Wins</span>
          <span class="meta-value value-good">${game.wins}</span>
        </div>
        <div class="kpi">
          <span class="meta-label">Losses</span>
          <span class="meta-value value-danger">${game.losses}</span>
        </div>
        <div class="kpi">
          <span class="meta-label">Hostiles</span>
          <span class="meta-value">${livingEnemies}</span>
        </div>
      </div>
      <div class="kpi">
        <span class="meta-label">Kills this run</span>
        <span class="meta-value">${game.killCount}</span>
      </div>
      <p class="status-text">Key rebinding is available in the pause menu.</p>
    </div>
  `;
}

function syncSettingsInputs() {
  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  const pauseBtn = document.getElementById('pauseToggleBtn');
  if (pauseBtn) pauseBtn.textContent = game.paused ? 'Resume' : 'Pause';

  setValue('objectiveModeSelect', game.objectiveMode);
}

function setPaused(nextPaused) {
  game.paused = nextPaused;
  game.message = game.paused ? 'Paused.' : 'Resumed.';
  syncSettingsInputs();
  renderPauseOverlay();
}

function renderPauseOverlay() {
  if (!pauseOverlayEl) return;

  if (!game.paused) {
    pauseOverlayEl.classList.remove('is-visible');
    pauseOverlayEl.innerHTML = '';
    return;
  }

  pauseOverlayEl.classList.add('is-visible');
  pauseOverlayEl.innerHTML = `
    <div class="pause-card">
      <h2>Paused</h2>
      <p>Adjust controls while paused, then resume your run.</p>
      <div class="settings-row"><span>Reload key</span><input id="pauseReloadBindInput" maxlength="1" value="${game.keybinds.reload}" /></div>
      <div class="settings-row"><span>Pause key</span><input id="pausePauseBindInput" maxlength="1" value="${game.keybinds.pause}" /></div>
      <div class="settings-row"><span>Objective key</span><input id="pauseObjectiveBindInput" maxlength="1" value="${game.keybinds.objectiveToggle}" /></div>
      <button id="resumeBtn" type="button">Resume</button>
    </div>
  `;

  document.getElementById('resumeBtn')?.addEventListener('click', () => setPaused(false));
  document.getElementById('pauseReloadBindInput')?.addEventListener('change', (e) => {
    game.keybinds.reload = normalizeKey(e.target.value, game.keybinds.reload);
    renderPauseOverlay();
  });
  document.getElementById('pausePauseBindInput')?.addEventListener('change', (e) => {
    game.keybinds.pause = normalizeKey(e.target.value, game.keybinds.pause);
    renderPauseOverlay();
  });
  document.getElementById('pauseObjectiveBindInput')?.addEventListener('change', (e) => {
    game.keybinds.objectiveToggle = normalizeKey(e.target.value, game.keybinds.objectiveToggle);
    renderPauseOverlay();
  });
}

function initSettingsUI() {
  settingsEl.innerHTML = `
    <p class="hud-title">Settings</p>
    <div class="settings-card">
      <div class="settings-row">
        <span>Run state</span>
        <button id="pauseToggleBtn" type="button">Pause</button>
      </div>
      <div class="settings-row">
        <span>Objective Mode</span>
        <select id="objectiveModeSelect">
          <option value="purge">Purge (clear all)</option>
          <option value="speedrun">Speedrun (free exit)</option>
        </select>
      </div>
      <p class="status-text">Key rebinding is available in the pause menu.</p>
    </div>
  `;

  document.getElementById('pauseToggleBtn')?.addEventListener('click', () => {
    setPaused(!game.paused);
  });

  document.getElementById('objectiveModeSelect')?.addEventListener('change', (e) => {
    game.objectiveMode = e.target.value;
    game.message = `Objective mode: ${game.objectiveMode === 'purge' ? 'Purge' : 'Speedrun'}`;
    syncSettingsInputs();
  });

  syncSettingsInputs();
  renderPauseOverlay();
}

function resizeCanvasToViewport() {
  const width = Math.max(960, Math.min(1700, window.innerWidth * 0.73));
  const height = width / 1.85;

  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  game.mouse.x = canvas.width / 2;
  game.mouse.y = canvas.height / 2;
}

function gameLoop(timestamp) {
  const dt = game.paused ? 0 : Math.min((timestamp - game.lastTime) / 1000, 0.033);
  game.lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') return;
  game.keys.add(key);

  if (key === game.keybinds.pause) {
    setPaused(!game.paused);
  }

  if (key === game.keybinds.objectiveToggle) {
    game.objectiveMode = game.objectiveMode === 'purge' ? 'speedrun' : 'purge';
    game.message = `Objective mode: ${game.objectiveMode === 'purge' ? 'Purge' : 'Speedrun'}`;
    syncSettingsInputs();
  }

  if (key === ' ') {
    e.preventDefault();
    game.doorInteract = true;
  }

  if (key === game.keybinds.reload) reloadWeapon();
  if (key === game.keybinds.weapon1) {
    game.player.activeWeapon = 'knife';
    game.player.reloading = 0;
    game.player.reloadingWeapon = null;
    game.message = 'Knife equipped.';
  }
  if (key === game.keybinds.weapon2) {
    game.player.activeWeapon = 'handgun';
    game.player.reloading = 0;
    game.player.reloadingWeapon = null;
    game.message = 'Handgun equipped.';
  }
  if (key === game.keybinds.weapon3) {
    game.player.activeWeapon = 'shotgun';
    game.player.reloading = 0;
    game.player.reloadingWeapon = null;
    game.message = 'Shotgun equipped.';
  }
  if (key === game.keybinds.weapon4) {
    game.player.activeWeapon = 'machinegun';
    game.player.reloading = 0;
    game.player.reloadingWeapon = null;
    game.message = 'Machine Gun equipped.';
  }
  if (key === game.keybinds.weapon5) {
    game.player.activeWeapon = 'sniper';
    game.player.reloading = 0;
    game.player.reloadingWeapon = null;
    game.message = 'Sniper Rifle equipped.';
  }
  if (key === game.keybinds.weapon6) {
    game.player.activeWeapon = 'rocket';
    game.player.reloading = 0;
    game.player.reloadingWeapon = null;
    game.message = 'Rocket Launcher equipped.';
  }
});

window.addEventListener('keyup', (e) => {
  game.keys.delete(e.key.toLowerCase());
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  game.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;

  if (game.state === 'character-select') {
    const mx = game.mouse.x;
    const my = game.mouse.y;
    const bounds = getCharSelectCardBounds();
    let hover = -1;
    bounds.forEach((b, i) => {
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) hover = i;
    });
    game.charSelectHover = hover;
    canvas.style.cursor = hover >= 0 ? 'pointer' : 'default';
  }
});

canvas.addEventListener('mousedown', () => {
  if (game.state === 'character-select') {
    if (game.charSelectHover >= 0) {
      selectCharacter(CHARACTER_DEFS[game.charSelectHover]);
      canvas.style.cursor = 'default';
    }
    return;
  }
  game.mouse.down = true;
});

window.addEventListener('mouseup', () => {
  game.mouse.down = false;
});

window.addEventListener('resize', resizeCanvasToViewport);

resizeCanvasToViewport();
initSettingsUI();
requestAnimationFrame(gameLoop);
