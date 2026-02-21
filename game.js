const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const scoreboardEl = document.getElementById('scoreboard');

const TILE = 64;
const PLAYER_RADIUS = 18;

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
      { x: 17, y: 2, hp: 50 }
    ],
    pickups: [
      { x: 3.5, y: 3.5, type: 'ammo', value: 15 },
      { x: 20.5, y: 13.5, type: 'med', value: 20 }
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
      [4, 4, 16, 1], [4, 4, 1, 9], [8, 8, 1, 9], [12, 1, 1, 8],
      [16, 7, 1, 10], [20, 2, 1, 9], [23, 8, 1, 8],
      [5, 12, 13, 1], [15, 15, 10, 1]
    ],
    enemies: [
      { x: 7, y: 14, hp: 70 },
      { x: 11, y: 3, hp: 70 },
      { x: 17, y: 11, hp: 80 },
      { x: 22, y: 5, hp: 80 },
      { x: 24, y: 14, hp: 90 }
    ],
    pickups: [
      { x: 2.5, y: 15.5, type: 'ammo', value: 20 },
      { x: 25.5, y: 2.5, type: 'med', value: 25 },
      { x: 14.5, y: 10.5, type: 'ammo', value: 10 }
    ],
    spawn: { x: 2.5, y: 2.5 },
    exit: { x: 25.5, y: 15.5 }
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
    speed: 280,
    fireCooldown: 0,
    angle: 0,
    magazineSize: 12,
    ammoInMag: 12,
    reserveAmmo: 60,
    reloadTime: 1.2,
    reloading: 0,
    invulnerable: 0
  },
  bullets: [],
  enemyBullets: [],
  enemies: [],
  pickups: [],
  keys: new Set(),
  mouse: { x: canvas.width / 2, y: canvas.height / 2, down: false },
  activeMap: null
};

function startMap(index, keepPlayerState = true) {
  const map = maps[index];
  game.activeMap = map;
  game.mapIndex = index;

  const prev = game.player;
  const hp = keepPlayerState ? Math.max(prev.hp, 30) : prev.maxHp;
  const reserve = keepPlayerState ? prev.reserveAmmo : 60;

  game.player = {
    ...prev,
    x: map.spawn.x * TILE,
    y: map.spawn.y * TILE,
    hp,
    reserveAmmo: reserve,
    ammoInMag: Math.min(prev.ammoInMag, prev.magazineSize),
    fireCooldown: 0,
    reloading: 0,
    invulnerable: 0.4
  };

  game.enemies = map.enemies.map((e, i) => ({
    id: `${index}-${i}`,
    x: e.x * TILE,
    y: e.y * TILE,
    hp: e.hp,
    maxHp: e.hp,
    speed: 120 + Math.random() * 20,
    cooldown: Math.random() * 0.8
  }));

  game.pickups = map.pickups.map((p, i) => ({
    id: `${index}-p-${i}`,
    x: p.x * TILE,
    y: p.y * TILE,
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
  game.player.reserveAmmo = 60;
  game.player.ammoInMag = game.player.magazineSize;
  startMap(0, false);
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
  return mapRects().some((r) => circleRectCollision(x, y, radius, r));
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

function shootPlayerBullet() {
  const p = game.player;
  if (p.fireCooldown > 0 || p.reloading > 0 || p.ammoInMag <= 0) return;

  p.ammoInMag -= 1;
  p.fireCooldown = 0.16;

  const spread = (Math.random() - 0.5) * 0.08;
  const ang = p.angle + spread;

  game.bullets.push({
    x: p.x + Math.cos(ang) * 20,
    y: p.y + Math.sin(ang) * 20,
    vx: Math.cos(ang) * 720,
    vy: Math.sin(ang) * 720,
    damage: 22,
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
  }

  p.angle = Math.atan2(game.mouse.y - canvas.height / 2, game.mouse.x - canvas.width / 2);

  if (game.mouse.down) {
    shootPlayerBullet();
  }

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
    const toPlayer = normalize(p.x - enemy.x, p.y - enemy.y);
    const distance = Math.hypot(p.x - enemy.x, p.y - enemy.y);

    if (distance > 120) {
      moveWithCollision(enemy, toPlayer.x * enemy.speed * dt, toPlayer.y * enemy.speed * dt, 16);
    }

    enemy.cooldown -= dt;
    if (distance < 620 && enemy.cooldown <= 0) {
      shootEnemyBullet(enemy, toPlayer);
      enemy.cooldown = 1.2 + Math.random() * 0.8;
    }

    if (distance < PLAYER_RADIUS + 16 && p.invulnerable <= 0) {
      p.hp -= 12;
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
      p.hp -= bullet.damage;
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
      } else {
        p.hp = Math.min(p.maxHp, p.hp + pickup.value);
        game.message = `Patched armor +${pickup.value}`;
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

  if (living === 0 && atExit) {
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

  for (const pickup of game.pickups) {
    if (!pickup.alive) continue;
    const s = worldToScreen(pickup.x, pickup.y, camera);
    ctx.fillStyle = pickup.type === 'ammo' ? '#ffd062' : '#7bf9ff';
    ctx.fillRect(s.x - 10, s.y - 10, 20, 20);
  }

  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;
    const s = worldToScreen(enemy.x, enemy.y, camera);

    ctx.fillStyle = '#ff6483';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 16, 0, Math.PI * 2);
    ctx.fill();

    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = '#1f2f3d';
    ctx.fillRect(s.x - 18, s.y - 26, 36, 5);
    ctx.fillStyle = '#86ff95';
    ctx.fillRect(s.x - 18, s.y - 26, 36 * hpRatio, 5);
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

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(p.angle);
  ctx.fillStyle = p.invulnerable > 0 ? '#ffe28a' : '#50f0ff';
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e2937';
  ctx.fillRect(-4, -4, 26, 8);
  ctx.restore();
}

function updatePanel(livingEnemies) {
  const p = game.player;

  statusEl.innerHTML = `
    <p><strong>Map:</strong> <span class="value-accent">${game.activeMap.name}</span></p>
    <p><strong>HP:</strong> <span class="${p.hp < 35 ? 'value-danger' : 'value-good'}">${Math.max(0, Math.round(p.hp))}/${p.maxHp}</span></p>
    <p><strong>Ammo:</strong> <span class="value-accent">${p.ammoInMag}</span> / ${p.reserveAmmo} reserve</p>
    <p><strong>Hostiles:</strong> ${livingEnemies}</p>
  `;

  scoreboardEl.innerHTML = `
    <p><strong>Wins:</strong> <span class="value-good">${game.wins}</span></p>
    <p><strong>Losses:</strong> <span class="value-danger">${game.losses}</span></p>
    <p><strong>Kills this run:</strong> ${game.killCount}</p>
    <p><strong>Status:</strong> ${game.message}</p>
  `;
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
  if (key === 'm') {
    const next = (game.mapIndex + 1) % maps.length;
    startMap(next, true);
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

startMap(0, false);
updatePanel(game.enemies.length);
requestAnimationFrame(gameLoop);
