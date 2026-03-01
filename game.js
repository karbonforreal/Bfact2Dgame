const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const scoreboardEl = document.getElementById('scoreboard');

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
    spread: 0.08
  },
  knife: {
    name: 'Knife',
    slot: '2',
    cooldown: 0.32,
    damage: 38,
    range: 74,
    arc: Math.PI * 0.48
  }
};

const maps = [
  {
    name: 'Docking Ring',
    width: 24,
    height: 16,
    walls: [
      [0, 0, 24, 1], [0, 15, 24, 1], [0, 0, 1, 16], [23, 0, 1, 16],
      [5, 2, 1, 9], [10, 5, 1, 10], [13, 1, 1, 9], [18, 6, 1, 9],
      [2, 11, 7, 1], [14, 3, 7, 1]
    ],
    enemies: [
      { x: 7, y: 4, hp: 55 },
      { x: 11, y: 12, hp: 65 },
      { x: 19, y: 10, hp: 65 },
      { x: 17, y: 2, hp: 50 },
      { x: 20, y: 8, hp: 45, type: 'dog' }
    ],
    pickups: [
      { x: 3.5, y: 3.5, type: 'ammo', value: 15 },
      { x: 20.5, y: 13.5, type: 'health', value: 20 },
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
      [0, 0, 28, 1], [0, 17, 28, 1], [0, 0, 1, 18], [27, 0, 1, 18],
      [4, 4, 16, 1], [4, 4, 1, 9], [8, 8, 1, 9], [12, 5, 1, 4],
      [16, 7, 1, 10], [20, 6, 1, 5], [23, 8, 1, 8],
      [5, 12, 13, 1], [15, 15, 10, 1]
    ],
    enemies: [
      { x: 7, y: 14, hp: 70 },
      { x: 11, y: 3, hp: 70 },
      { x: 17, y: 11, hp: 80 },
      { x: 22, y: 5, hp: 80 },
      { x: 24, y: 14, hp: 90 },
      { x: 13, y: 15, hp: 55, type: 'dog' },
      { x: 21, y: 12, hp: 55, type: 'dog' }
    ],
    pickups: [
      { x: 2.5, y: 15.5, type: 'ammo', value: 20 },
      { x: 25.5, y: 2.5, type: 'health', value: 25 },
      { x: 14.5, y: 10.5, type: 'ammo', value: 10 },
      { x: 20.5, y: 15.5, type: 'armor', value: 25 }
    ],
    spawn: { x: 2.5, y: 2.5 },
    exit: { x: 25.5, y: 15.5 }
  },
  {
    name: 'Reactor Vault',
    width: 30,
    height: 20,
    walls: [
      [0, 0, 30, 1], [0, 19, 30, 1], [0, 0, 1, 20], [29, 0, 1, 20],
      [3, 4, 10, 1], [3, 4, 1, 10], [7, 8, 1, 10], [11, 2, 1, 8],
      [15, 6, 1, 12], [19, 3, 1, 10], [23, 8, 1, 10], [26, 3, 1, 13],
      [4, 14, 16, 1], [10, 17, 12, 1]
    ],
    enemies: [
      { x: 5, y: 16, hp: 85 },
      { x: 9, y: 6, hp: 90 },
      { x: 14, y: 11, hp: 95 },
      { x: 18, y: 5, hp: 90 },
      { x: 22, y: 14, hp: 100 },
      { x: 25, y: 10, hp: 105 },
      { x: 12, y: 15, hp: 70, type: 'dog' },
      { x: 24, y: 4, hp: 70, type: 'dog' }
    ],
    pickups: [
      { x: 2.5, y: 17.5, type: 'ammo', value: 20 },
      { x: 13.5, y: 3.5, type: 'health', value: 25 },
      { x: 21.5, y: 16.5, type: 'armor', value: 35 },
      { x: 27.5, y: 2.5, type: 'ammo', value: 15 }
    ],
    spawn: { x: 2.5, y: 2.5 },
    exit: { x: 27.5, y: 17.5 }
  }
];

const game = {
  running: true,
  lastTime: performance.now(),
  wins: 0,
  losses: 0,
  mapIndex: 0,
  killCount: 0,
  message: 'Clear hostiles and reach the uplink.',
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
    magazineSize: 12,
    ammoInMag: 12,
    reserveAmmo: 60,
    activeWeapon: 'blaster',
    reloadTime: 1.2,
    reloading: 0,
    invulnerable: 0,
    walkCycle: 0,
    moving: false
  },
  bullets: [],
  enemyBullets: [],
  enemies: [],
  pickups: [],
  keys: new Set(),
  mouse: { x: canvas.width / 2, y: canvas.height / 2, down: false },
  activeMap: null,
  navGridCache: new Map()
};

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
  game.navGridCache.clear();

  const prev = game.player;
  const hp = keepPlayerState ? Math.max(prev.hp, 30) : prev.maxHp;
  const armor = keepPlayerState ? prev.armor : 40;
  const reserve = keepPlayerState ? prev.reserveAmmo : 60;

  const playerSpawn = findNearestOpenPoint(map.spawn.x * TILE, map.spawn.y * TILE, PLAYER_RADIUS);

  game.player = {
    ...prev,
    x: playerSpawn.x,
    y: playerSpawn.y,
    hp,
    armor,
    reserveAmmo: reserve,
    ammoInMag: Math.min(prev.ammoInMag, prev.magazineSize),
    fireCooldown: 0,
    reloading: 0,
    invulnerable: 0.4,
    walkCycle: prev.walkCycle || 0,
    moving: false
  };

  game.enemies = map.enemies.map((e, i) => {
    const type = e.type || 'humanoid';
    const radius = type === 'dog' ? 14 : 16;
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
      hp: e.hp,
      maxHp: e.hp,
      speed: type === 'dog' ? 210 + Math.random() * 25 : 120 + Math.random() * 20,
      cooldown: Math.random() * 0.8,
      radius,
      walkCycle: Math.random() * Math.PI * 2,
      moving: false,
      variant,
      alerted: type === 'dog',
      guardOrigin: { x: safeSpawn.x, y: safeSpawn.y },
      guardTarget: { x: safeSpawn.x, y: safeSpawn.y },
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
  game.message = `Map loaded: ${map.name}`;
}

function resetRun(lostRound = false) {
  if (lostRound) game.losses += 1;
  game.killCount = 0;
  game.player.hp = game.player.maxHp;
  game.player.armor = 40;
  game.player.reserveAmmo = 60;
  game.player.ammoInMag = game.player.magazineSize;
  startMap(0, false);
}

function applyDamage(amount) {
  const p = game.player;
  const armorAbsorb = Math.min(p.armor, amount * 0.7);
  p.armor -= armorAbsorb;
  p.hp -= amount - armorAbsorb;
}

function mapRects() {
  return game.activeMap.walls.map(([x, y, w, h]) => ({
    x: x * TILE,
    y: y * TILE,
    w: w * TILE,
    h: h * TILE
  }));
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

  if (!enemy.alerted && enemyCanSeePlayer(enemy, player)) {
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

function shootPlayerWeapon() {
  const p = game.player;
  if (p.fireCooldown > 0 || p.reloading > 0) return;

  if (p.activeWeapon === 'knife') {
    p.fireCooldown = WEAPONS.knife.cooldown;
    performKnifeAttack();
    return;
  }

  if (p.ammoInMag <= 0) return;

  const blaster = WEAPONS.blaster;

  p.ammoInMag -= 1;
  p.fireCooldown = blaster.cooldown;

  const spread = (Math.random() - 0.5) * blaster.spread;
  const ang = p.angle + spread;

  game.bullets.push({
    x: p.x + Math.cos(ang) * 20,
    y: p.y + Math.sin(ang) * 20,
    vx: Math.cos(ang) * blaster.projectileSpeed,
    vy: Math.sin(ang) * blaster.projectileSpeed,
    damage: blaster.damage,
    life: 1.05
  });
}

function shootEnemyBullet(enemy, dir) {
  game.enemyBullets.push({
    x: enemy.x,
    y: enemy.y,
    vx: dir.x * 380,
    vy: dir.y * 380,
    damage: 10,
    life: 2
  });
}

function reloadWeapon() {
  const p = game.player;
  if (p.reloading > 0 || p.ammoInMag === p.magazineSize || p.reserveAmmo <= 0) return;
  p.reloading = p.reloadTime;
  game.message = 'Reloading...';
}

function update(dt) {
  const p = game.player;

  if (!game.running) return;

  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  p.reloading = Math.max(0, p.reloading - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt);

  if (p.reloading === 0 && p.ammoInMag < p.magazineSize && game.message === 'Reloading...') {
    const needed = p.magazineSize - p.ammoInMag;
    const used = Math.min(needed, p.reserveAmmo);
    p.ammoInMag += used;
    p.reserveAmmo -= used;
    game.message = 'Magazine topped up.';
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
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (blockedAt(bullet.x, bullet.y, 4)) {
      bullet.life = 0;
      continue;
    }

    for (const enemy of game.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
      if (dist < 18) {
        enemy.hp -= bullet.damage;
        bullet.life = 0;
        if (enemy.hp <= 0) {
          game.killCount += 1;
          game.message = `Target down (${game.killCount})`;
        }
        break;
      }
    }
  }

  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;
    updateEnemyAwareness(enemy, p);

    const toPlayer = normalize(p.x - enemy.x, p.y - enemy.y);
    const distance = Math.hypot(p.x - enemy.x, p.y - enemy.y);

    if (enemy.alerted) {
      const chaseBuffer = enemy.type === 'dog' ? 34 : 140;
      if (distance > chaseBuffer) {
        moveEnemyToward(enemy, p.x, p.y, dt);
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
        applyDamage(18);
        p.invulnerable = 0.5;
        enemy.cooldown = 0.85;
        game.message = 'Dog rushed you!';
      }
      continue;
    }

    if (enemy.alerted && distance < 620 && enemy.cooldown <= 0 && enemyCanSeePlayer(enemy, p)) {
      shootEnemyBullet(enemy, toPlayer);
      enemy.cooldown = 1.2 + Math.random() * 0.8;
    }

    if (distance < PLAYER_RADIUS + enemy.radius && p.invulnerable <= 0) {
      applyDamage(12);
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
      if (pickup.type === 'ammo') {
        p.reserveAmmo += pickup.value;
        game.message = `Picked up ammo +${pickup.value}`;
      } else if (pickup.type === 'health') {
        p.hp = Math.min(p.maxHp, p.hp + pickup.value);
        game.message = `Picked up health +${pickup.value}`;
      } else {
        p.armor = Math.min(p.maxArmor, p.armor + pickup.value);
        game.message = `Picked up armor +${pickup.value}`;
      }
    }
  }

  game.bullets = game.bullets.filter((b) => b.life > 0);
  game.enemyBullets = game.enemyBullets.filter((b) => b.life > 0);

  if (p.hp <= 0) {
    game.message = 'You were eliminated. Restarting run...';
    resetRun(true);
    return;
  }

  const living = game.enemies.filter((e) => e.hp > 0).length;
  const exitWorld = { x: game.activeMap.exit.x * TILE, y: game.activeMap.exit.y * TILE };
  const atExit = Math.hypot(p.x - exitWorld.x, p.y - exitWorld.y) < 42;

  if (atExit) {
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

function drawGrid(camera) {
  const startX = Math.floor((camera.x - canvas.width / 2) / TILE) - 1;
  const endX = Math.ceil((camera.x + canvas.width / 2) / TILE) + 1;
  const startY = Math.floor((camera.y - canvas.height / 2) / TILE) - 1;
  const endY = Math.ceil((camera.y + canvas.height / 2) / TILE) + 1;

  ctx.strokeStyle = 'rgba(87, 129, 166, 0.2)';
  ctx.lineWidth = 1;

  for (let gx = startX; gx <= endX; gx += 1) {
    const screenX = gx * TILE - camera.x + canvas.width / 2;
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvas.height);
    ctx.stroke();
  }

  for (let gy = startY; gy <= endY; gy += 1) {
    const screenY = gy * TILE - camera.y + canvas.height / 2;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(canvas.width, screenY);
    ctx.stroke();
  }
}

function draw() {
  const p = game.player;
  const camera = { x: p.x, y: p.y };

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid(camera);

  for (const wall of mapRects()) {
    const s = worldToScreen(wall.x, wall.y, camera);
    ctx.fillStyle = '#1f3446';
    ctx.fillRect(s.x, s.y, wall.w, wall.h);
    ctx.strokeStyle = '#3f6b8f';
    ctx.strokeRect(s.x, s.y, wall.w, wall.h);
  }

  const exitPoint = worldToScreen(game.activeMap.exit.x * TILE, game.activeMap.exit.y * TILE, camera);
  ctx.fillStyle = 'rgba(117, 255, 157, 0.25)';
  ctx.beginPath();
  ctx.arc(exitPoint.x, exitPoint.y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#99ffb5';
  ctx.stroke();

  ctx.fillStyle = '#b4ffd7';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exitPoint.x, exitPoint.y + 5);

  for (const pickup of game.pickups) {
    if (!pickup.alive) continue;
    const s = worldToScreen(pickup.x, pickup.y, camera);
    if (pickup.type === 'ammo') ctx.fillStyle = '#ffd062';
    if (pickup.type === 'health') ctx.fillStyle = '#7bff9f';
    if (pickup.type === 'armor') ctx.fillStyle = '#7bf9ff';
    ctx.fillRect(s.x - 10, s.y - 10, 20, 20);
    ctx.fillStyle = '#1d2b38';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    const marker = pickup.type === 'ammo' ? 'A' : pickup.type === 'health' ? '+' : '🛡';
    ctx.fillText(marker, s.x, s.y + 4);
  }

  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;
    const s = worldToScreen(enemy.x, enemy.y, camera);

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
  }

  for (const bullet of game.bullets) {
    const s = worldToScreen(bullet.x, bullet.y, camera);
    ctx.fillStyle = '#79e8ff';
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

  drawPlayer(p);

  ctx.fillStyle = 'rgba(15, 23, 35, 0.7)';
  ctx.fillRect(16, 16, 250, 52);
  ctx.strokeStyle = '#60d7ff';
  ctx.strokeRect(16, 16, 250, 52);
  ctx.fillStyle = '#c7f5ff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Level ${game.mapIndex + 1}: ${game.activeMap.name}`, 26, 38);
  ctx.font = '13px sans-serif';
  ctx.fillText('Reach EXIT to advance', 26, 58);
}

function drawPlayer(player) {
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  const bob = player.moving ? Math.sin(player.walkCycle * 2) * 1.5 : 0;
  const step = player.moving ? Math.sin(player.walkCycle) * 5 : 0;
  const facing = Math.cos(player.angle) >= 0 ? 1 : -1;
  const shirtColor = player.invulnerable > 0 ? '#f9d97a' : '#6ec2ff';

  ctx.save();
  ctx.translate(x, y + bob);

  // Legs (alternating to fake a walk cycle)
  ctx.fillStyle = '#2f4f7d';
  ctx.fillRect(-8, 9 + step, 6, 14);
  ctx.fillRect(2, 9 - step, 6, 14);

  // Shoes
  ctx.fillStyle = '#1f2430';
  ctx.fillRect(-9, 22 + step, 8, 3);
  ctx.fillRect(1, 22 - step, 8, 3);

  // Torso
  ctx.fillStyle = shirtColor;
  ctx.fillRect(-10, -3, 20, 14);

  // Arms
  ctx.fillStyle = '#d99c72';
  ctx.fillRect(-13, 0, 3, 10);
  ctx.fillRect(10, 0, 3, 10);

  // Head + hair
  ctx.fillStyle = '#f0bf96';
  ctx.fillRect(-7, -15, 14, 12);
  ctx.fillStyle = '#6b4428';
  ctx.fillRect(-7, -15, 14, 4);

  // Eyes (single-pixel retro look)
  ctx.fillStyle = '#1d2730';
  ctx.fillRect(-4, -10, 2, 2);
  ctx.fillRect(2, -10, 2, 2);

  // Weapon + facing direction
  ctx.save();
  ctx.scale(facing, 1);
  if (player.activeWeapon === 'knife') {
    ctx.fillStyle = '#303b45';
    ctx.fillRect(8, 3, 4, 3);
    ctx.fillStyle = '#d9e7f2';
    ctx.fillRect(12, 2, 10, 2);
    ctx.fillRect(12, 4, 10, 1);
  } else {
    ctx.fillStyle = '#23384d';
    ctx.fillRect(8, 2, 12, 4);
    ctx.fillStyle = '#7ce6ff';
    ctx.fillRect(18, 3, 4, 2);
  }
  ctx.restore();

  ctx.restore();
}

function drawHumanoidEnemy(enemy, x, y) {
  const palette = enemy.variant || HUMANOID_VARIANTS[0];
  const bob = enemy.moving ? Math.sin(enemy.walkCycle * 2) * 1.5 : 0;
  const step = enemy.moving ? Math.sin(enemy.walkCycle) * 4.5 : 0;

  ctx.save();
  ctx.translate(x, y + bob);

  ctx.fillStyle = palette.pants;
  ctx.fillRect(-8, 9 + step, 6, 14);
  ctx.fillRect(2, 9 - step, 6, 14);

  ctx.fillStyle = '#201d1d';
  ctx.fillRect(-9, 22 + step, 8, 3);
  ctx.fillRect(1, 22 - step, 8, 3);

  ctx.fillStyle = palette.shirt;
  ctx.fillRect(-10, -3, 20, 14);

  ctx.fillStyle = palette.skin;
  ctx.fillRect(-13, 0, 3, 10);
  ctx.fillRect(10, 0, 3, 10);
  ctx.fillRect(-7, -15, 14, 12);

  ctx.fillStyle = palette.hair;
  ctx.fillRect(-7, -15, 14, 4);

  ctx.fillStyle = '#1d2730';
  ctx.fillRect(-4, -10, 2, 2);
  ctx.fillRect(2, -10, 2, 2);

  ctx.fillStyle = '#a83f45';
  ctx.fillRect(8, 2, 9, 4);

  ctx.restore();
}

function drawDogEnemy(enemy, x, y) {
  const runOffset = enemy.moving ? Math.sin(enemy.walkCycle) * 3 : 0;
  const bob = enemy.moving ? Math.cos(enemy.walkCycle * 2) * 1.2 : 0;

  ctx.save();
  ctx.translate(x, y + bob);

  ctx.fillStyle = '#6f5849';
  ctx.fillRect(-14, -5, 24, 12);

  ctx.fillStyle = '#5a463b';
  ctx.fillRect(8, -8, 10, 10);

  ctx.fillStyle = '#2b211d';
  ctx.fillRect(14, -10, 3, 4);
  ctx.fillRect(10, -10, 3, 4);

  ctx.fillStyle = '#332923';
  ctx.fillRect(-10, 6 + runOffset, 4, 10);
  ctx.fillRect(-2, 6 - runOffset, 4, 10);
  ctx.fillRect(4, 6 + runOffset, 4, 10);
  ctx.fillRect(12, 6 - runOffset, 4, 10);

  ctx.fillStyle = '#6f5849';
  ctx.fillRect(-18, -6, 7, 3);

  ctx.restore();
}

function updatePanel(livingEnemies) {
  const p = game.player;
  const hpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
  const armorRatio = Math.max(0, Math.min(1, p.armor / p.maxArmor));
  const ammoRatio = Math.max(0, Math.min(1, p.ammoInMag / p.magazineSize));
  const reloadRatio = p.reloading > 0 ? 1 - p.reloading / p.reloadTime : 0;
  const activeWeapon = WEAPONS[p.activeWeapon];
  const statusMsg = p.reloading > 0 ? `Reloading... ${Math.round(reloadRatio * 100)}%` : game.message;

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
        <div class="stat-row"><span class="stat-label">Ammo</span><span class="stat-value value-accent">${p.ammoInMag}/${p.magazineSize} <small>· ${p.reserveAmmo} reserve</small></span></div>
        <div class="meter"><div class="meter-fill ammo" style="width:${ammoRatio * 100}%"></div></div>
        ${p.reloading > 0 ? `<div class="reload-wrap"><div class="stat-row"><span class="stat-label">Reload</span><span class="stat-value value-accent">${Math.round(reloadRatio * 100)}%</span></div><div class="meter"><div class="meter-fill reload" style="width:${reloadRatio * 100}%"></div></div></div>` : ''}
      </div>
      <div class="stat-card">
        <div class="stat-row"><span class="stat-label">Weapon</span><span class="stat-value value-accent">${activeWeapon.name} <small>(press 1/2)</small></span></div>
        <div class="meter"><div class="meter-fill armor" style="width:100%"></div></div>
      </div>
    </div>

    <p class="status-text"><strong>Status:</strong> ${statusMsg}</p>
    <p class="status-text"><strong>Pickups:</strong> A = Ammo · + = Health · 🛡 = Armor</p>
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
    </div>
  `;
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
  const dt = Math.min((timestamp - game.lastTime) / 1000, 0.033);
  game.lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  game.keys.add(key);

  if (key === 'r') reloadWeapon();
  if (key === WEAPONS.blaster.slot) {
    game.player.activeWeapon = 'blaster';
    game.message = 'Switched to blaster.';
  }
  if (key === WEAPONS.knife.slot) {
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
updatePanel(game.enemies.length);
requestAnimationFrame(gameLoop);
