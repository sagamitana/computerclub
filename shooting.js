// ===== canvas 準備 =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 画面サイズをウィンドウに合わせる（スマホ対応）
const SIZE = Math.min(window.innerWidth, window.innerHeight, 480);
canvas.width  = SIZE;
canvas.height = SIZE * 1.4;

// ===== 自機 =====
const player = {
  x:     canvas.width / 2 - 20,
  y:     canvas.height - 60,
  w:     40,
  h:     40,
  speed: canvas.width / 96   // 画面サイズに応じた速さ
};

// ===== 弾 =====
let bullets = [];

// ===== 敵 =====
let enemies = [];

// ===== スコアとゲーム状態 =====
let score    = 0;
let gameOver = false;

// ===== 敵を一体追加する関数 =====
function addEnemy() {
  if (gameOver) return;    // ゲームオーバー中は追加しない
  enemies.push({
    x:     Math.random() * (canvas.width - 36),
    y:     -36,
    w:     36,
    h:     36,
    speed: 1.5 + Math.random() * 1.5   // ランダムな速さ
  });
}

// 1.5秒ごとに敵を追加
setInterval(addEnemy, 1500);
 
// ===== キー入力 (PC用) =====
const keys = {};
document.addEventListener("keydown", function(e) { keys[e.key] = true; });
document.addEventListener("keyup",   function(e) { keys[e.key] = false; });

// ===== 弾を発射する関数 =====
function shoot(targetX, targetY) {
  if (gameOver) return;
  const fromX = player.x + player.w / 2;
  const fromY = player.y + player.h / 2;
  const dx = targetX - fromX;
  const dy = targetY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  bullets.push({
    x:  fromX,
    y:  fromY,
    vx: dx / dist * 9,
    vy: dy / dist * 9
  });
}

// ===== クリックで弾発射 (PC用) ====
canvas.addEventListener("click", function(e) {
  if (gameOver) {
    restartGame();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  shoot((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
});

// ===== クリックで弾発射 (スマホ用) ====
canvas.addEventListener("touchstart", function(e) {
  e.preventDefault();
  if (gameOver) {
    restartGame();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const touch = e.touches[0];
  shoot((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
}, { passive: false });

// ===== 当たり判定の関数 =====
function isHit(b, e) {
  return (
    b.x > e.x &&
    b.x < e.x + e.w &&
    b.y > e.y &&
    b.y < e.y + e.h
  );
}

// ===== ゲームリスタートの関数 =====
function restartGame() {
  score    = 0;
  gameOver = false;
  bullets  = [];
  enemies  = [];
  player.x = canvas.width / 2 - 20;
  gameLoop();
}

// ===== ゲームループ =====
function gameLoop() {
  if (gameOver) return;

  // 自機移動 (PC : 矢印キー)
  if (keys["ArrowLeft"])  { player.x -= player.speed; }
  if (keys["ArrowRight"]) { player.x += player.speed; }
  if (player.x < 0) { player.x = 0; }
  if (player.x + player.w > canvas.width) { player.x = canvas.width - player.w; }

  // 弾を動かす
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;
  }

  // 弾の処理 : 画面外 または 敵に命中したら消す
  bullets = bullets.filter(function(b) {
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      return false;
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (isHit(b, enemies[i])) {
        enemies.splice(i, 1); // 敵を消す
        score += 10;           // スコアを加算
        return false;          // 弾も消す
      }
    }
    return true;
  });
    
  // 敵を動かす
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].y += enemies[i].speed;
  }

  // 敵が自機のラインまで来たらゲームオーバー
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].y + enemies[i].h >= player.y) {
      gameOver = true;
    }
  }

  // 画面下に出た敵を消す
  enemies = enemies.filter(function(e) {
    return e.y < canvas.height + 40;
  });
 
  // ===== 描画 =====
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // スコア表示
  ctx.fillStyle = "#ffffff";
  ctx.font = Math.floor(SIZE / 24) + "px monospace";
  ctx.textAlign = "left";
  ctx.fillText("SCORE: " + score, 10, 28);

  // 自機
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // 弾
  ctx.fillStyle = "#ffff00";
  for (let i = 0; i < bullets.length; i++) {
    ctx.beginPath();
    ctx.arc(bullets[i].x, bullets[i].y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 敵
  ctx.fillStyle = "#ff4444";
  for (let i = 0; i <enemies. length; i++) {
    ctx.fillRect(enemies[i].x, enemies[i].y, enemies[i].w, enemies[i].h);
  }

  // ゲームオーバー表示
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold " + Math.floor(SIZE / 10) + "px monospace";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = Math.floor(SIZE / 18) + "px monospace";
    ctx.fillText("SCORE: " + score, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillStyle = "#aaaaaa";
    ctx.font = Math.floor(SIZE / 22) + "px monospace";
    ctx.fillText("タップしてもう一度", canvas.width / 2, canvas.height / 2 + 56);
    return;
  }
  
  requestAnimationFrame(gameLoop);
}

// ゲームスタート
gameLoop();