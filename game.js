const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
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

const WEAPONS = {
  blaster: {
    name: 'Blaster',
    slot: '1',
    cooldown: 0.16,
    damage: 22,
    projectileSpeed: 720,
    spread: 0.08,
    magazineSize: 12,
    reloadTime: 1.2,
    reserveAmmo: 60,
    ammoPickupType: 'ammo-blaster',
    ammoPickupValue: 15
  },
  shotgun: {
    name: 'Shotgun',
    slot: '2',
    cooldown: 0.55,
    damage: 14,
    projectileSpeed: 640,
    spread: 0.34,
    pelletCount: 5,
    magazineSize: 2,
    reloadTime: 1.95,
    reserveAmmo: 12,
    maxDistance: TILE * 3,
    ammoPickupType: 'ammo-shotgun',
    ammoPickupValue: 4
  },
  sniper: {
    name: 'Sniper',
    slot: '3',
    cooldown: 0.95,
    damage: 65,
    projectileSpeed: 1200,
    spread: 0.015,
    magazineSize: 3,
    reloadTime: 2.5,
    reserveAmmo: 15,
    pierceCount: 3,
    ammoPickupType: 'ammo-sniper',
    ammoPickupValue: 3
  },
  knife: {
    name: 'Knife',
    slot: '4',
    cooldown: 0.32,
    damage: 38,
    range: 74,
    arc: Math.PI * 0.48
  }
};

const LEVEL_THEMES = [
  {
    floorBase: ['#263541', '#1e2c36'],
    floorGradient: ['rgba(127, 169, 199, 0.2)', 'rgba(64, 84, 102, 0.17)', 'rgba(25, 35, 47, 0.3)'],
    lineColor: 'rgba(126, 196, 235, 0.11)',
    panelColor: 'rgba(206, 222, 232, 0.12)',
    boltColor: 'rgba(129, 153, 174, 0.24)',
    borderColor: 'rgba(144, 172, 194, 0.25)',
    wallGradient: ['#52616f', '#374452', '#242f39'],
    wallGloss: ['rgba(214, 226, 238, 0.16)', 'rgba(127, 162, 191, 0.08)', 'rgba(19, 27, 37, 0.24)'],
    wallStripe: 'rgba(170, 191, 210, 0.24)',
    wallAccent: 'rgba(111, 184, 233, 0.14)',
    wallBolt: 'rgba(185, 206, 223, 0.2)',
    wallBorder: '#95aec2'
  },
  {
    floorBase: ['#2f2a25', '#231f1a'],
    floorGradient: ['rgba(191, 154, 104, 0.2)', 'rgba(112, 85, 55, 0.17)', 'rgba(45, 32, 22, 0.3)'],
    lineColor: 'rgba(238, 185, 118, 0.11)',
    panelColor: 'rgba(229, 210, 184, 0.12)',
    boltColor: 'rgba(180, 145, 109, 0.23)',
    borderColor: 'rgba(188, 153, 113, 0.25)',
    wallGradient: ['#74624f', '#504135', '#342a22'],
    wallGloss: ['rgba(232, 215, 193, 0.15)', 'rgba(188, 145, 97, 0.09)', 'rgba(47, 35, 24, 0.24)'],
    wallStripe: 'rgba(218, 183, 138, 0.22)',
    wallAccent: 'rgba(239, 173, 95, 0.14)',
    wallBolt: 'rgba(226, 200, 168, 0.2)',
    wallBorder: '#be976c'
  },
  {
    floorBase: ['#2a252f', '#211c26'],
    floorGradient: ['rgba(169, 124, 199, 0.2)', 'rgba(94, 71, 114, 0.18)', 'rgba(37, 29, 45, 0.3)'],
    lineColor: 'rgba(208, 147, 241, 0.12)',
    panelColor: 'rgba(221, 197, 232, 0.13)',
    boltColor: 'rgba(165, 130, 186, 0.24)',
    borderColor: 'rgba(168, 136, 191, 0.28)',
    wallGradient: ['#665379', '#463755', '#2e2338'],
    wallGloss: ['rgba(225, 208, 236, 0.15)', 'rgba(169, 123, 199, 0.09)', 'rgba(38, 28, 48, 0.26)'],
    wallStripe: 'rgba(205, 177, 222, 0.23)',
    wallAccent: 'rgba(194, 130, 232, 0.14)',
    wallBolt: 'rgba(211, 186, 227, 0.2)',
    wallBorder: '#ad89c9'
  }
];

const maps = [
  {
    name: 'Docking Ring',
    width: 24,
    height: 16,
    walls: [
      // outer boundary
      [0, 0, 24, 1], [0, 15, 24, 1], [0, 0, 1, 16], [23, 0, 1, 16],
      // interior walls
      [5, 2, 1, 9], [10, 5, 1, 10], [13, 1, 1, 9],
      [2, 11, 7, 1], [14, 3, 7, 1],
      // exit room enclosure: bottom-right corner room (x:19-23, y:12-15)
      [19, 12, 1, 1], [19, 14, 1, 1], // left wall of exit room with gap at y=13 for door
      [19, 12, 4, 1]  // top wall of exit room
    ],
    // door at tile (19, 13) - entrance to exit room (1 tile wide)
    doors: [
      { x: 19, y: 13, w: 1, h: 1 }
    ],
    // key placed far from door, in the upper-left area
    keyPickup: { x: 3.5, y: 8.5 },
    enemies: [
      { x: 7, y: 4, hp: 55 },
      { x: 11, y: 12, hp: 65, type: 'flanker' },
      { x: 17, y: 8, hp: 65 },
      { x: 17, y: 2, hp: 50, type: 'shield' },
      { x: 15, y: 6, hp: 45, type: 'dog' }
    ],
    pickups: [
      { x: 3.5, y: 3.5, type: 'ammo-blaster', value: 15 },
      { x: 14.5, y: 7.5, type: 'health', value: 20 },
      { x: 11.5, y: 8.5, type: 'armor', value: 20 }
    ],
    spawn: { x: 2.5, y: 2.5 },
    exit: { x: 21.5, y: 13.5 }
  },
  {
    name: 'Core Archive',
    width: 28,
    height: 18,
    walls: [
      // outer boundary
      [0, 0, 28, 1], [0, 17, 28, 1], [0, 0, 1, 18], [27, 0, 1, 18],
      // interior walls
      [4, 4, 16, 1], [4, 4, 1, 9], [8, 8, 1, 9], [12, 5, 1, 4],
      [16, 7, 1, 10], [20, 6, 1, 5],
      [5, 12, 13, 1],
      // exit room enclosure: bottom-right (x:23-27, y:13-17)
      [23, 13, 4, 1],  // top wall of exit room
      [23, 13, 1, 2],  // left wall segment above door
      [23, 16, 1, 1]   // left wall segment below door
    ],
    // door at tile (23, 15) - entrance to exit room
    doors: [
      { x: 23, y: 15, w: 1, h: 1 }
    ],
    // key placed far away, upper-left area
    keyPickup: { x: 2.5, y: 6.5 },
    enemies: [
      { x: 7, y: 14, hp: 70, type: 'shield' },
      { x: 11, y: 3, hp: 70 },
      { x: 17, y: 11, hp: 80, type: 'flanker' },
      { x: 22, y: 5, hp: 80 },
      { x: 24, y: 3, hp: 90 },
      { x: 13, y: 15, hp: 55, type: 'dog' },
      { x: 10, y: 10, hp: 55, type: 'dog' }
    ],
    pickups: [
      { x: 2.5, y: 15.5, type: 'ammo-blaster', value: 20 },
      { x: 25.5, y: 2.5, type: 'health', value: 25 },
      { x: 14.5, y: 10.5, type: 'ammo-shotgun', value: 4 },
      { x: 6.5, y: 6.5, type: 'armor', value: 25 }
    ],
    spawn: { x: 2.5, y: 2.5 },
    exit: { x: 25.5, y: 15.5 }
  },
  {
    name: 'Reactor Vault',
    width: 30,
    height: 20,
    walls: [
      // outer boundary
      [0, 0, 30, 1], [0, 19, 30, 1], [0, 0, 1, 20], [29, 0, 1, 20],
      // interior walls
      [3, 4, 10, 1], [3, 4, 1, 10], [7, 8, 1, 10], [11, 2, 1, 8],
      [15, 6, 1, 12], [19, 3, 1, 10],
      [4, 14, 16, 1], [10, 17, 12, 1],
      // exit room enclosure: bottom-right (x:24-29, y:15-19)
      [24, 15, 5, 1],  // top wall of exit room
      [24, 15, 1, 2],  // left wall segment above door
      [24, 18, 1, 1]   // left wall segment below door
    ],
    // door at tile (24, 17) - entrance to exit room
    doors: [
      { x: 24, y: 17, w: 1, h: 1 }
    ],
    // key placed far away, upper-left area
    keyPickup: { x: 5.5, y: 6.5 },
    enemies: [
      { x: 5, y: 16, hp: 85 },
      { x: 9, y: 6, hp: 90, type: 'shield' },
      { x: 14, y: 11, hp: 95 },
      { x: 18, y: 5, hp: 90, type: 'flanker' },
      { x: 22, y: 11, hp: 100 },
      { x: 13, y: 3, hp: 105 },
      { x: 12, y: 15, hp: 70, type: 'dog' },
      { x: 20, y: 8, hp: 70, type: 'dog' }
    ],
    pickups: [
      { x: 2.5, y: 17.5, type: 'ammo-sniper', value: 3 },
      { x: 13.5, y: 3.5, type: 'health', value: 25 },
      { x: 16.5, y: 16.5, type: 'armor', value: 35 },
      { x: 22.5, y: 4.5, type: 'ammo-blaster', value: 15 }
    ],
    spawn: { x: 2.5, y: 2.5 },
    exit: { x: 27.5, y: 17.5 }
  }
];

const game = {
  running: true,
  paused: false,
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
    weapon1: WEAPONS.blaster.slot,
    weapon2: WEAPONS.shotgun.slot,
    weapon3: WEAPONS.sniper.slot,
    weapon4: WEAPONS.knife.slot
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
    activeWeapon: 'blaster',
    ammo: {
      blaster: { mag: WEAPONS.blaster.magazineSize, reserve: WEAPONS.blaster.reserveAmmo },
      shotgun: { mag: WEAPONS.shotgun.magazineSize, reserve: WEAPONS.shotgun.reserveAmmo },
      sniper: { mag: WEAPONS.sniper.magazineSize, reserve: WEAPONS.sniper.reserveAmmo }
    },
    reloading: 0,
    invulnerable: 0,
    walkCycle: 0,
    moving: false,
    knifeAnim: 0
  },
  bullets: [],
  enemyBullets: [],
  muzzleFlashes: [],
  enemies: [],
  pickups: [],
  doors: [],
  hasKey: false,
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
  const armor = keepPlayerState ? prev.armor : 40;

  const playerSpawn = findNearestOpenPoint(map.spawn.x * TILE, map.spawn.y * TILE, PLAYER_RADIUS);

  game.player = {
    ...prev,
    x: playerSpawn.x,
    y: playerSpawn.y,
    hp,
    armor,
    ammo: {
      blaster: {
        mag: keepPlayerState ? Math.min(prev.ammo.blaster.mag, WEAPONS.blaster.magazineSize) : WEAPONS.blaster.magazineSize,
        reserve: keepPlayerState ? prev.ammo.blaster.reserve : WEAPONS.blaster.reserveAmmo
      },
      shotgun: {
        mag: keepPlayerState ? Math.min(prev.ammo.shotgun.mag, WEAPONS.shotgun.magazineSize) : WEAPONS.shotgun.magazineSize,
        reserve: keepPlayerState ? prev.ammo.shotgun.reserve : WEAPONS.shotgun.reserveAmmo
      },
      sniper: {
        mag: keepPlayerState ? Math.min(prev.ammo.sniper.mag, WEAPONS.sniper.magazineSize) : WEAPONS.sniper.magazineSize,
        reserve: keepPlayerState ? prev.ammo.sniper.reserve : WEAPONS.sniper.reserveAmmo
      }
    },
    fireCooldown: 0,
    reloading: 0,
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
    const safeSpawn = findReachableOpenPoint(
      e.x * TILE,
      e.y * TILE,
      radius,
      playerSpawn.x,
      playerSpawn.y
    );
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
      alerted: type === 'dog',
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

  // initialize doors (closed) and key
  game.doors = (map.doors || []).map((d, i) => ({
    ...d,
    id: `${index}-door-${i}`,
    open: false,
    openAnim: 0
  }));
  game.hasKey = false;
  game.keyPickup = map.keyPickup ? {
    x: map.keyPickup.x * TILE,
    y: map.keyPickup.y * TILE,
    alive: true
  } : null;

  game.message = `Map loaded: ${map.name} · Threat ${game.difficulty.label}`;
}

function resetRun(lostRound = false) {
  if (lostRound) game.losses += 1;
  game.paused = false;
  game.killCount = 0;
  game.hasKey = false;
  game.player.hp = game.player.maxHp;
  game.player.armor = 40;
  game.player.ammo.blaster = { mag: WEAPONS.blaster.magazineSize, reserve: WEAPONS.blaster.reserveAmmo };
  game.player.ammo.shotgun = { mag: WEAPONS.shotgun.magazineSize, reserve: WEAPONS.shotgun.reserveAmmo };
  game.player.ammo.sniper = { mag: WEAPONS.sniper.magazineSize, reserve: WEAPONS.sniper.reserveAmmo };
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
  if (enemy.type === 'dog') {
    enemy.alerted = true;
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

function spawnMuzzleFlash(x, y, angle, color = '#a9f8ff') {
  game.muzzleFlashes.push({
    x,
    y,
    angle,
    color,
    life: 0.08,
    maxLife: 0.08,
    size: 10 + Math.random() * 5
  });
}

function shootPlayerWeapon() {
  const p = game.player;
  if (p.fireCooldown > 0 || p.reloading > 0) return;

  if (p.activeWeapon === 'knife') {
    p.fireCooldown = WEAPONS.knife.cooldown;
    p.knifeAnim = 0.16;
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

  const flashColor = p.activeWeapon === 'sniper' ? '#ff6d6d' : p.activeWeapon === 'shotgun' ? '#ffd58f' : '#9bf7ff';
  spawnMuzzleFlash(
    p.x + Math.cos(p.angle) * 26,
    p.y + Math.sin(p.angle) * 26,
    p.angle,
    flashColor
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
  game.message = `Reloading ${weapon.name}...`;
}

function update(dt) {
  const p = game.player;

  if (!game.running || game.paused) return;

  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  p.reloading = Math.max(0, p.reloading - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.knifeAnim = Math.max(0, p.knifeAnim - dt);

  const currentAmmo = ammoState();
  const weapon = currentWeapon();
  if (weapon && currentAmmo && p.reloading === 0 && currentAmmo.mag < weapon.magazineSize && game.message.startsWith('Reloading')) {
    const needed = weapon.magazineSize - currentAmmo.mag;
    const used = Math.min(needed, currentAmmo.reserve);
    currentAmmo.mag += used;
    currentAmmo.reserve -= used;
    game.message = `${weapon.name} reloaded.`;
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

  // door opening: player walks up to a closed door while holding the key
  for (const door of game.doors) {
    if (door.open) {
      door.openAnim = Math.min(1, door.openAnim + dt * 3);
      continue;
    }
    const doorCenterX = (door.x + door.w / 2) * TILE;
    const doorCenterY = (door.y + door.h / 2) * TILE;
    const dist = Math.hypot(p.x - doorCenterX, p.y - doorCenterY);
    if (dist < TILE * 1.5) {
      if (game.hasKey) {
        door.open = true;
        door.openAnim = 0;
        game.navGridCache.clear();
        game.message = 'Door unlocked!';
      } else if (!game.doorMsgCooldown || game.doorMsgCooldown <= 0) {
        game.message = 'Door is locked. Find the key!';
        game.doorMsgCooldown = 1.5;
      }
    }
  }
  if (game.doorMsgCooldown > 0) game.doorMsgCooldown -= dt;

  game.bullets = game.bullets.filter((b) => b.life > 0);
  game.enemyBullets = game.enemyBullets.filter((b) => b.life > 0);
  game.muzzleFlashes = game.muzzleFlashes.filter((flash) => {
    flash.life -= dt;
    return flash.life > 0;
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

      ctx.fillRect(drawX, drawY, size, size);
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

      const pulse = ((gx * 17 + gy * 11 + Math.floor(performance.now() * 0.004)) % 12) / 12;
      ctx.fillStyle = theme.lineColor.replace('0.11', (0.06 + pulse * 0.05).toFixed(3)).replace('0.12', (0.06 + pulse * 0.05).toFixed(3));
      ctx.fillRect(sx + 6, sy + 6, TILE - 12, 1.7);
      ctx.fillRect(sx + 6, sy + TILE - 8, TILE - 12, 1.4);

      ctx.fillStyle = theme.panelColor;
      ctx.fillRect(sx + TILE * 0.28, sy + TILE * 0.18, TILE * 0.44, 2);
      ctx.fillRect(sx + TILE * 0.18, sy + TILE * 0.72, TILE * 0.64, 1.5);

      ctx.fillStyle = theme.boltColor;
      ctx.beginPath();
      ctx.arc(sx + 12, sy + 12, 2.1, 0, Math.PI * 2);
      ctx.arc(sx + TILE - 12, sy + 12, 2.1, 0, Math.PI * 2);
      ctx.arc(sx + 12, sy + TILE - 12, 2.1, 0, Math.PI * 2);
      ctx.arc(sx + TILE - 12, sy + TILE - 12, 2.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.borderColor;
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
  for (let px = x + 6; px < x + w - 6; px += 18) {
    ctx.fillRect(px, y + 5, 10, 2);
    ctx.fillRect(px, y + h - 7, 10, 1.6);
  }

  ctx.fillStyle = theme.wallAccent;
  for (let py = y + 8; py < y + h - 8; py += 20) {
    ctx.fillRect(x + 5, py, 2, 10);
    ctx.fillRect(x + w - 7, py, 2, 10);
  }

  ctx.fillStyle = theme.wallBolt;
  for (let py = y + 14; py < y + h - 12; py += 28) {
    ctx.beginPath();
    ctx.arc(x + 10, py, 2, 0, Math.PI * 2);
    ctx.arc(x + w - 10, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = theme.wallBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
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

function drawDoor(x, y, w, h, open, openAnim, theme) {
  if (open && openAnim >= 1) return; // fully open, invisible

  ctx.save();
  const alpha = open ? Math.max(0, 1 - openAnim) : 1;
  ctx.globalAlpha = alpha;

  // door base
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, '#5a3a1a');
  gradient.addColorStop(0.5, '#8b5e2f');
  gradient.addColorStop(1, '#5a3a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);

  // door frame border
  ctx.strokeStyle = '#d4a44a';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

  // lock icon in center
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (!open) {
    // lock body
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(cx - 8, cy - 4, 16, 12);
    ctx.strokeStyle = '#ffd740';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 8, cy - 4, 16, 12);

    // lock shackle
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 6, Math.PI, 0);
    ctx.stroke();

    // keyhole
    ctx.fillStyle = '#ffd740';
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 1, cy + 2, 2, 4);
  }

  // cross bars for reinforced look
  ctx.strokeStyle = 'rgba(180, 140, 60, 0.5)';
  ctx.lineWidth = 2;
  for (let stripe = y + 12; stripe < y + h - 8; stripe += 16) {
    ctx.beginPath();
    ctx.moveTo(x + 6, stripe);
    ctx.lineTo(x + w - 6, stripe);
    ctx.stroke();
  }

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
  } else {
    const bulletOffsets = [-5, 0, 5];
    for (const offset of bulletOffsets) {
      ctx.fillStyle = '#2a3442';
      ctx.fillRect(offset - 2.2, -5, 4.4, 8.4);
      ctx.fillStyle = '#f5f8ff';
      ctx.fillRect(offset - 1.2, -4.2, 2.4, 6.8);
      ctx.fillStyle = '#d17a23';
      ctx.beginPath();
      ctx.moveTo(offset - 1.2, -4.2);
      ctx.lineTo(offset + 1.2, -4.2);
      ctx.lineTo(offset, -7.4);
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
  const p = game.player;
  const camera = { x: p.x, y: p.y };

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const theme = LEVEL_THEMES[game.mapIndex % LEVEL_THEMES.length];

  drawSpaceParallax(camera);
  drawGrid(camera);

  for (const wall of mapRects()) {
    const s = worldToScreen(wall.x, wall.y, camera);
    drawSciWall(s.x, s.y, wall.w, wall.h, theme);
  }

  // draw doors
  for (const door of game.doors) {
    const ds = worldToScreen(door.x * TILE, door.y * TILE, camera);
    drawDoor(ds.x, ds.y, door.w * TILE, door.h * TILE, door.open, door.openAnim, theme);
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
    if (pickup.type === 'ammo-blaster') ctx.fillStyle = '#f1af3a';
    if (pickup.type === 'ammo-shotgun') ctx.fillStyle = '#ff7d57';
    if (pickup.type === 'ammo-sniper') ctx.fillStyle = '#ff5470';
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
    ctx.fillStyle = bullet.weapon === 'sniper' ? '#ff5f5f' : bullet.weapon === 'shotgun' ? '#ffd9a1' : '#79e8ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const bullet of game.enemyBullets) {
    const s = worldToScreen(bullet.x, bullet.y, camera);
    ctx.fillStyle = '#ff9558';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
    ctx.fill();
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
  ctx.fillText('Reach STAIRS to ascend', 26, 55);
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

function drawPlayer(player) {
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  const stride = player.moving ? Math.sin(player.walkCycle) : 0;
  const bob = player.moving ? Math.sin(player.walkCycle * 2) * 2.2 : 0;
  const armSwing = player.moving ? Math.sin(player.walkCycle + Math.PI / 2) * 0.4 : 0;
  const recoil = Math.max(0, player.fireCooldown * 34);
  const shirtColor = player.invulnerable > 0 ? '#ffd66e' : '#73ccff';
  const knifeProgress = player.knifeAnim > 0 ? 1 - player.knifeAnim / 0.16 : 0;
  const knifeStabOffset = player.activeWeapon === 'knife' ? Math.sin(knifeProgress * Math.PI) * 14 : 0;

  ctx.save();
  ctx.translate(x, y + bob);

  const legLiftA = stride * 5.8;
  const legLiftB = -stride * 5.8;
  ctx.fillStyle = '#365786';
  ctx.fillRect(-9, 7 + legLiftA, 7, 15);
  ctx.fillRect(2, 7 + legLiftB, 7, 15);

  ctx.fillStyle = '#1b2532';
  ctx.fillRect(-10, 22 + legLiftA, 9, 3);
  ctx.fillRect(1, 22 + legLiftB, 9, 3);

  const torsoGrad = ctx.createLinearGradient(-10, -6, 10, 12);
  torsoGrad.addColorStop(0, shirtColor);
  torsoGrad.addColorStop(1, '#3c9dd0');
  ctx.fillStyle = torsoGrad;
  ctx.fillRect(-11, -4, 22, 15);

  ctx.save();
  ctx.rotate(player.angle * 0.32);

  ctx.fillStyle = '#cf8f69';
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

  const headGrad = ctx.createLinearGradient(-8, -16, 8, -4);
  headGrad.addColorStop(0, '#ffd0aa');
  headGrad.addColorStop(1, '#d49f77');
  ctx.fillStyle = headGrad;
  ctx.fillRect(-8, -16, 16, 13);

  ctx.fillStyle = '#5f3f2a';
  ctx.fillRect(-8, -16, 16, 4);

  const eyeOffsetX = Math.cos(player.angle) * 1.7;
  const eyeOffsetY = Math.sin(player.angle) * 1.4;
  ctx.fillStyle = '#15202a';
  ctx.fillRect(-5 + eyeOffsetX, -10 + eyeOffsetY, 2.4, 2.2);
  ctx.fillRect(2 + eyeOffsetX, -10 + eyeOffsetY, 2.4, 2.2);

  ctx.save();
  ctx.rotate(player.angle);
  if (player.activeWeapon === 'knife') {
    ctx.fillStyle = '#2a3440';
    ctx.fillRect(8 + knifeStabOffset * 0.25, -2, 5, 4);
    ctx.fillStyle = '#dce9f2';
    ctx.fillRect(12 + knifeStabOffset, -2, 12, 2);
    ctx.fillRect(12 + knifeStabOffset, 0, 12, 1);
  } else if (player.activeWeapon === 'shotgun') {
    ctx.fillStyle = '#1f2e38';
    ctx.fillRect(6 - recoil, -3.2, 18, 6.4);
    ctx.fillStyle = '#7e522f';
    ctx.fillRect(6 - recoil, -2.2, 9, 4.6);
    ctx.fillStyle = '#ccd5de';
    ctx.fillRect(22 - recoil, -1.8, 5, 3.6);
  } else if (player.activeWeapon === 'sniper') {
    ctx.fillStyle = '#243648';
    ctx.fillRect(6 - recoil, -2.4, 25, 4.8);
    ctx.fillStyle = '#425a73';
    ctx.fillRect(13 - recoil, -6, 10, 3.4);
    ctx.fillStyle = '#121921';
    ctx.fillRect(16 - recoil, -8, 6, 2);
    ctx.fillStyle = '#ff6565';
    ctx.fillRect(29 - recoil, -1.2, 3, 2.4);
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
        <div class="stat-row"><span class="stat-label">Weapon</span><span class="stat-value value-accent">${activeWeapon.name} <small>(press 1/2/3/4)</small></span></div>
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

  if (key === game.keybinds.reload) reloadWeapon();
  if (key === game.keybinds.weapon1) {
    game.player.activeWeapon = 'blaster';
    game.message = 'Switched to blaster.';
  }
  if (key === game.keybinds.weapon2) {
    game.player.activeWeapon = 'shotgun';
    game.message = 'Switched to shotgun.';
  }
  if (key === game.keybinds.weapon3) {
    game.player.activeWeapon = 'sniper';
    game.message = 'Switched to sniper.';
  }
  if (key === game.keybinds.weapon4) {
    game.player.activeWeapon = 'knife';
    game.message = 'Switched to knife.';
  }
});

window.addEventListener('keyup', (e) => {
  game.keys.delete(e.key.toLowerCase());
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  game.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener('mousedown', () => {
  game.mouse.down = true;
});

window.addEventListener('mouseup', () => {
  game.mouse.down = false;
});

window.addEventListener('resize', resizeCanvasToViewport);

resizeCanvasToViewport();
startMap(0, false);
initSettingsUI();
updatePanel(game.enemies.length);
requestAnimationFrame(gameLoop);
