// ---------------------------------------------------------------------------
// Ski Rainbow – A snow ski race game
// ---------------------------------------------------------------------------

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// UI elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const endTitle = document.getElementById('end-title');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// ---- Constants ------------------------------------------------------------

const TRACK_LENGTH = 12000;        // total distance to finish line
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PLAYER_SPEED_DOWN = 4;       // pixels per frame of downhill scroll
const PLAYER_LATERAL_SPEED = 5;
const SNOWFLAKE_COUNT = 80;

// ---- State ----------------------------------------------------------------

let state; // populated by resetGame()
let keys = {};
let animFrameId = null;

// ---- Input ----------------------------------------------------------------

window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// ---- Helpers --------------------------------------------------------------

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---- Game init / reset ----------------------------------------------------

function resetGame() {
  state = {
    player: { x: W / 2 - 15, y: H - 180, w: 30, h: 40, vy: 0, onGround: true, jumping: false },
    distance: 0,
    score: 0,
    obstacles: [],
    unicorns: [],
    trees: [],
    snowflakes: initSnowflakes(),
    spawnTimer: 0,
    treeTimer: 0,
    gameOver: false,
    finished: false,
    finishLineY: null,    // calculated when close to end
    trailParticles: [],
  };
  generateInitialTrees();
}

function initSnowflakes() {
  const flakes = [];
  for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
    flakes.push({ x: rand(0, W), y: rand(0, H), r: rand(1, 3), speed: rand(1, 3), drift: rand(-0.5, 0.5) });
  }
  return flakes;
}

function generateInitialTrees() {
  for (let i = 0; i < 10; i++) {
    state.trees.push({
      x: rand(0, W - 30),
      y: rand(-H, H),
      size: rand(20, 40),
    });
  }
}

// ---- Spawning -------------------------------------------------------------

function spawnObstacle() {
  // rock
  state.obstacles.push({
    x: rand(40, W - 80),
    y: -60,
    w: rand(30, 55),
    h: rand(25, 40),
    type: 'rock',
  });
}

function spawnUnicorn() {
  const fromLeft = Math.random() > 0.5;
  state.unicorns.push({
    x: fromLeft ? -60 : W + 60,
    y: rand(100, H - 250),
    w: 60,
    h: 40,
    vx: fromLeft ? rand(2, 4.5) : rand(-4.5, -2),
    vy: rand(-1, 1),
    wingPhase: 0,
  });
}

function spawnTree() {
  state.trees.push({
    x: rand(0, W - 30),
    y: -60,
    size: rand(22, 42),
  });
}

// ---- Update ---------------------------------------------------------------

function update() {
  const s = state;
  const p = s.player;

  if (s.gameOver || s.finished) return;

  // Distance
  s.distance += PLAYER_SPEED_DOWN;
  s.score = Math.floor(s.distance / 10);
  scoreEl.textContent = s.score;

  // Player lateral movement
  if (keys['ArrowLeft'] || keys['KeyA']) p.x -= PLAYER_LATERAL_SPEED;
  if (keys['ArrowRight'] || keys['KeyD']) p.x += PLAYER_LATERAL_SPEED;
  p.x = clamp(p.x, 0, W - p.w);

  // Jump
  if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && p.onGround) {
    p.vy = JUMP_FORCE;
    p.onGround = false;
    p.jumping = true;
  }

  // Gravity
  if (!p.onGround) {
    p.vy += GRAVITY;
    p.y += p.vy;
    if (p.y >= H - 180) {
      p.y = H - 180;
      p.vy = 0;
      p.onGround = true;
      p.jumping = false;
    }
  }

  // Trail particles when skiing
  if (p.onGround && Math.random() > 0.5) {
    s.trailParticles.push({ x: p.x + p.w / 2 + rand(-8, 8), y: p.y + p.h, life: 20, r: rand(2, 4) });
  }
  s.trailParticles.forEach(pt => pt.life--);
  s.trailParticles = s.trailParticles.filter(pt => pt.life > 0);

  // Spawn timers
  s.spawnTimer++;
  if (s.spawnTimer % 50 === 0) spawnObstacle();
  if (s.spawnTimer % 90 === 0) spawnUnicorn();
  s.treeTimer++;
  if (s.treeTimer % 30 === 0) spawnTree();

  // Move obstacles down (simulates player going downhill)
  s.obstacles.forEach(o => { o.y += PLAYER_SPEED_DOWN; });
  s.obstacles = s.obstacles.filter(o => o.y < H + 60);

  // Move unicorns
  s.unicorns.forEach(u => {
    u.x += u.vx;
    u.y += u.vy;
    u.wingPhase += 0.15;
  });
  s.unicorns = s.unicorns.filter(u => u.x > -120 && u.x < W + 120 && u.y > -80 && u.y < H + 80);

  // Move trees
  s.trees.forEach(t => { t.y += PLAYER_SPEED_DOWN; });
  s.trees = s.trees.filter(t => t.y < H + 80);

  // Snowflakes
  s.snowflakes.forEach(f => {
    f.y += f.speed + PLAYER_SPEED_DOWN * 0.3;
    f.x += f.drift;
    if (f.y > H) { f.y = -5; f.x = rand(0, W); }
    if (f.x < 0) f.x = W;
    if (f.x > W) f.x = 0;
  });

  // Collision detection (skip if jumping)
  if (!p.jumping) {
    const pBox = { x: p.x + 4, y: p.y + 4, w: p.w - 8, h: p.h - 8 };

    for (const o of s.obstacles) {
      if (rectsOverlap(pBox, o)) { endGame(false); return; }
    }
    for (const u of s.unicorns) {
      if (rectsOverlap(pBox, u)) { endGame(false); return; }
    }
  }

  // Finish line check
  if (s.distance >= TRACK_LENGTH) {
    endGame(true);
  }
}

function endGame(won) {
  state.gameOver = true;
  state.finished = won;
  endTitle.textContent = won ? '🌈 You Win! 🌈' : '💥 Crash!';
  finalScoreEl.textContent = state.score;
  gameOverScreen.classList.remove('hidden');
}

// ---- Drawing --------------------------------------------------------------

function draw() {
  const s = state;
  const p = s.player;

  // Sky / snow gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#b3d9ff');
  grad.addColorStop(0.5, '#dceeff');
  grad.addColorStop(1, '#f0f4f8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Ski track lines (subtle)
  ctx.strokeStyle = 'rgba(180,200,220,0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const lx = 80 + i * 110;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, H);
    ctx.stroke();
  }

  // Trees (background)
  s.trees.forEach(t => drawTree(t.x, t.y, t.size));

  // Trail particles
  s.trailParticles.forEach(pt => {
    ctx.globalAlpha = pt.life / 20;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Obstacles (rocks)
  s.obstacles.forEach(o => drawRock(o));

  // Flying unicorns
  s.unicorns.forEach(u => drawFlyingUnicorn(u));

  // Finish line (draw when close)
  if (s.distance > TRACK_LENGTH - 2000 || s.finished) {
    drawFinishLine();
  }

  // Player
  drawPlayer(p);

  // Snowflakes
  s.snowflakes.forEach(f => {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer(p) {
  const cx = p.x + p.w / 2;
  const cy = p.y;

  // Shadow
  if (p.jumping) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, H - 140, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body
  ctx.fillStyle = '#e04040';
  ctx.fillRect(p.x + 8, cy + 10, 14, 18);

  // Head
  ctx.fillStyle = '#fdd';
  ctx.beginPath();
  ctx.arc(cx, cy + 6, 8, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = '#3070d0';
  ctx.beginPath();
  ctx.arc(cx, cy + 3, 9, Math.PI, 0);
  ctx.fill();

  // Skis
  ctx.fillStyle = '#f0c040';
  ctx.fillRect(p.x - 2, cy + 28, 34, 4);

  // Poles (little lines)
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x + 4, cy + 14);
  ctx.lineTo(p.x - 6, cy + 32);
  ctx.moveTo(p.x + p.w - 4, cy + 14);
  ctx.lineTo(p.x + p.w + 6, cy + 32);
  ctx.stroke();
}

function drawTree(x, y, size) {
  // Trunk
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x + size * 0.35, y + size * 0.6, size * 0.3, size * 0.5);

  // Foliage layers
  ctx.fillStyle = '#2d8a4e';
  drawTriangle(x + size / 2, y, size * 0.9, size * 0.45);
  ctx.fillStyle = '#34a058';
  drawTriangle(x + size / 2, y + size * 0.2, size * 0.75, size * 0.4);
  ctx.fillStyle = '#3cb868';
  drawTriangle(x + size / 2, y + size * 0.4, size * 0.6, size * 0.35);

  // Snow on top
  ctx.fillStyle = '#fff';
  drawTriangle(x + size / 2, y, size * 0.5, size * 0.15);
}

function drawTriangle(cx, top, width, height) {
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.lineTo(cx - width / 2, top + height);
  ctx.lineTo(cx + width / 2, top + height);
  ctx.closePath();
  ctx.fill();
}

function drawRock(o) {
  ctx.fillStyle = '#7a7a8a';
  ctx.beginPath();
  ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9a9aaa';
  ctx.beginPath();
  ctx.ellipse(o.x + o.w / 2 - 4, o.y + o.h / 2 - 4, o.w / 4, o.h / 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlyingUnicorn(u) {
  const cx = u.x + u.w / 2;
  const cy = u.y + u.h / 2;

  // Wings
  const wingY = Math.sin(u.wingPhase) * 8;
  ctx.fillStyle = 'rgba(200,180,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(cx - 10, cy - 10 + wingY, 18, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 10, cy - 10 - wingY, 18, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headX = u.vx > 0 ? cx + 20 : cx - 20;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(headX, cy - 6, 9, 0, Math.PI * 2);
  ctx.fill();

  // Horn (rainbow gradient)
  const hornTip = { x: headX + (u.vx > 0 ? 10 : -10), y: cy - 22 };
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(headX, cy - 14);
  ctx.lineTo(hornTip.x, hornTip.y);
  ctx.stroke();

  // Eye
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(headX + (u.vx > 0 ? 4 : -4), cy - 7, 2, 0, Math.PI * 2);
  ctx.fill();

  // Tail (rainbow)
  const tailX = u.vx > 0 ? cx - 22 : cx + 22;
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#00cc44', '#0088ff', '#8800ff'];
  colors.forEach((c, i) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tailX, cy - 4 + i * 2);
    ctx.quadraticCurveTo(tailX + (u.vx > 0 ? -15 : 15), cy - 10 + i * 4 + Math.sin(u.wingPhase + i) * 3, tailX + (u.vx > 0 ? -25 : 25), cy - 2 + i * 2);
    ctx.stroke();
  });

  // Legs
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  for (let l = -8; l <= 8; l += 16) {
    ctx.beginPath();
    ctx.moveTo(cx + l, cy + 10);
    ctx.lineTo(cx + l, cy + 20);
    ctx.stroke();
  }
}

function drawFinishLine() {
  const progress = state.distance - (TRACK_LENGTH - 2000);
  const yPos = clamp(H - (progress / 2000) * (H + 100), -100, H + 20);

  // Rainbow arch
  const rainbowColors = ['#ff0000', '#ff8800', '#ffdd00', '#00cc44', '#0088ff', '#6600cc'];
  const archCx = W / 2;
  const archCy = yPos + 60;
  rainbowColors.forEach((color, i) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(archCx, archCy, 120 - i * 10, Math.PI, 0);
    ctx.stroke();
  });

  // "FINISH" text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FINISH', archCx, yPos + 50);

  // Left unicorn
  drawFinishUnicorn(archCx - 130, archCy - 10, false);
  // Right unicorn
  drawFinishUnicorn(archCx + 90, archCy - 10, true);
}

function drawFinishUnicorn(x, y, flipX) {
  const dir = flipX ? -1 : 1;
  ctx.save();
  ctx.translate(x + 20, y + 20);

  // Body
  ctx.fillStyle = '#ffe0f0';
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#ffe0f0';
  ctx.beginPath();
  ctx.arc(dir * 22, -10, 11, 0, Math.PI * 2);
  ctx.fill();

  // Horn
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(dir * 22, -20);
  ctx.lineTo(dir * 18, -36);
  ctx.lineTo(dir * 26, -20);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(dir * 26, -12, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Mane (rainbow)
  const maneColors = ['#ff4466', '#ff8800', '#ffee00', '#44dd66', '#4488ff', '#aa44ff'];
  maneColors.forEach((c, i) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(dir * 14, -16 + i * 3);
    ctx.quadraticCurveTo(dir * 6, -22 + i * 5, dir * -2, -14 + i * 3);
    ctx.stroke();
  });

  // Legs
  ctx.strokeStyle = '#eec0d0';
  ctx.lineWidth = 4;
  [-10, -4, 4, 10].forEach(lx => {
    ctx.beginPath();
    ctx.moveTo(lx, 14);
    ctx.lineTo(lx, 30);
    ctx.stroke();
  });

  ctx.restore();
}

// ---- Game loop ------------------------------------------------------------

function gameLoop() {
  update();
  draw();
  animFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  resetGame();
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  gameLoop();
}
