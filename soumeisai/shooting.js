// ===== canvasの準備 =====
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
const SIZE   = Math.min(window.innerWidth, window.innerHeight, 480);
canvas.width  = SIZE;
canvas.height = SIZE * 1.4;

// ===== ランキングサーバーのURL =====
const RANKING_SERVER = "https://osamu.my.coocan.jp/bunkasai/ranking.php";

// ===== 自機 =====
const player = {
  x:     canvas.width / 2 - 20,
  y:     canvas.height - 60,
  w:     40,
  h:     40,
  speed: canvas.width / 96
};

// ===== 弾・敵・スコア・状態 =====
let bullets  = [];
let enemies  = [];
let score    = 0;
let gameOver = false;

// ===== 敵を追加する関数 =====
function addEnemy() {
  if (gameOver) return;
  enemies.push({
    x:     Math.random() * (canvas.width - 36),
    y:     -36,
    w:     36,
    h:     36,
    speed: 1.5 + Math.random() * 1.5
  });
}
setInterval(addEnemy, 1500);

// ===== キー入力 =====
const keys = {};
document.addEventListener("keydown", function(e) { keys[e.key] = true; });
document.addEventListener("keyup",   function(e) { keys[e.key] = false; });

// ===== 弾を発射する関数 =====
function shoot(targetX, targetY) {
  if (gameOver) return;
  const fromX = player.x + player.w / 2;
  const fromY = player.y + player.h / 2;
  const dx    = targetX - fromX;
  const dy    = targetY - fromY;
  const dist  = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  bullets.push({ x: fromX, y: fromY, vx: dx / dist * 9, vy: dy / dist * 9 });
}

// ===== クリックで発射（PC用） =====
canvas.addEventListener("click", function(e) {
  if (gameOver) return;  // ゲームオーバー中はクリックで発射しない
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  shoot((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
});

// ===== タップで発射（スマホ用） =====
canvas.addEventListener("touchstart", function(e) {
  e.preventDefault();
  if (gameOver) return;
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const touch  = e.touches[0];
  shoot((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
}, { passive: false });

// ===== 当たり判定 =====
function isHit(b, e) {
  return b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h;
}

// ===== ニックネーム入力とスコア送信 =====
function showNameInput() {
  // 半透明の背景を作る
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); display: flex; align-items: center;
    justify-content: center; z-index: 100;
  `;

  // 入力フォームを作る
  overlay.innerHTML = `
    <div style="background:#12121e; border:1px solid #2a2a3a; border-radius:12px; padding:24px; width:280px; text-align:center;">
      <p style="color:#fff; font-size:16px; margin-bottom:8px;">GAME OVER</p>
      <p style="color:#4af0c8; font-size:22px; font-weight:bold; margin-bottom:16px;">SCORE: ${score}</p>
      <p style="color:#aaa; font-size:14px; margin-bottom:10px;">ニックネームを入力してランキングに登録！</p>
      <input id="nameInput" type="text" maxlength="20" placeholder="ニックネーム"
        style="width:100%; padding:10px; background:#0a0a12; border:1px solid #444; border-radius:8px;
               color:#fff; font-size:15px; text-align:center; margin-bottom:12px;">
      <button id="submitBtn"
        style="width:100%; padding:10px; background:#4af0c8; color:#000; border:none; border-radius:8px;
               font-size:15px; font-weight:bold; cursor:pointer; margin-bottom:8px;">
        登録する
      </button>
      <button id="skipBtn"
        style="width:100%; padding:8px; background:transparent; color:#888; border:1px solid #333;
               border-radius:8px; font-size:13px; cursor:pointer;">
        登録しない
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // 登録ボタンを押したとき
  document.getElementById("submitBtn").addEventListener("click", function() {
    const name = document.getElementById("nameInput").value.trim() || "名無し";
    document.body.removeChild(overlay);
    sendScore("shooting", name, score);  // サーバーにスコアを送る
  });

  // スキップボタンを押したとき
  document.getElementById("skipBtn").addEventListener("click", function() {
    document.body.removeChild(overlay);
    showRetry();  // リスタートボタンを表示する
  });
}

// ===== スコアをサーバーに送る関数 =====
function sendScore(game, name, score) {
  fetch(RANKING_SERVER, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ game: game, name: name, score: score })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    // 送信成功後にリスタートボタンを表示する
    showRetry(data.ranking, name, score);
  })
  .catch(function() {
    // 通信エラーの場合もリスタートボタンを表示する
    showRetry();
  });
}

// ===== リスタートボタンを表示する関数 =====
function showRetry(ranking, myName, myScore) {
  // ランキングを表示する
  let rankMsg = "";
  if (ranking && myName) {
    const myRank = ranking.find(function(r) { return r.name === myName && r.score === myScore; });
    if (myRank) { rankMsg = myRank.rank + "位にランクイン！"; }
  }

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); display: flex; align-items: center;
    justify-content: center; z-index: 100;
  `;
  overlay.innerHTML = `
    <div style="background:#12121e; border:1px solid #2a2a3a; border-radius:12px; padding:24px; width:280px; text-align:center;">
      <p style="color:#4af0c8; font-size:18px; font-weight:bold; margin-bottom:8px;">${rankMsg}</p>
      <a href="ranking.html" style="display:block; color:#aaf; font-size:14px; margin-bottom:16px;">ランキングを見る</a>
      <button id="retryBtn"
        style="width:100%; padding:10px; background:transparent; color:#fff; border:1px solid #444;
               border-radius:8px; font-size:15px; cursor:pointer; margin-bottom:8px;">
        もう一度プレイ
      </button>
      <a href="index.html"
        style="display:block; width:100%; padding:10px; background:transparent; color:#888;
               border:1px solid #333; border-radius:8px; font-size:13px; text-align:center;
               text-decoration:none;">
        メニューに戻る
      </a>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("retryBtn").addEventListener("click", function() {
    document.body.removeChild(overlay);
    restartGame();
  });
}

// ===== ゲームリスタート =====
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

  // 自機移動
  if (keys["ArrowLeft"])  { player.x -= player.speed; }
  if (keys["ArrowRight"]) { player.x += player.speed; }
  if (player.x < 0) { player.x = 0; }
  if (player.x + player.w > canvas.width) { player.x = canvas.width - player.w; }

  // 弾を動かす
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;
  }

  // 当たり判定
  bullets = bullets.filter(function(b) {
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) return false;
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (isHit(b, enemies[i])) {
        enemies.splice(i, 1);
        score += 10;
        return false;
      }
    }
    return true;
  });

  // 敵を動かす
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].y += enemies[i].speed;
  }

  // ゲームオーバー判定
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].y + enemies[i].h >= player.y) {
      gameOver = true;
      setTimeout(showNameInput, 500);  // 0.5秒後にニックネーム入力を表示する
    }
  }

  // 画面外の敵を消す
  enemies = enemies.filter(function(e) { return e.y < canvas.height + 40; });

  // 描画
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = Math.floor(SIZE / 24) + "px monospace";
  ctx.textAlign = "left";
  ctx.fillText("SCORE: " + score, 10, 28);

  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(player.x, player.y, player.w, player.h);

  ctx.fillStyle = "#ffff00";
  for (let i = 0; i < bullets.length; i++) {
    ctx.beginPath();
    ctx.arc(bullets[i].x, bullets[i].y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ff4444";
  for (let i = 0; i < enemies.length; i++) {
    ctx.fillRect(enemies[i].x, enemies[i].y, enemies[i].w, enemies[i].h);
  }

  if (!gameOver) { requestAnimationFrame(gameLoop); }
}

gameLoop();
