// ===== canvasの準備 =====
const canvas = document.getElementById("puzzleCanvas");
const ctx    = canvas.getContext("2d");
const COLS   = 3;
const CELL   = Math.min(Math.floor(window.innerWidth * 0.9 / COLS), 120);
const SIZE   = COLS * CELL;
canvas.width  = SIZE;
canvas.height = SIZE;

// ===== ランキングサーバーのURL =====
const RANKING_SERVER = "https://osamu.my.coocan.jp/bunkasai/ranking.php";

// ===== 盤面の設定 =====
let board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
let moves = 0;
const GOAL = "1,2,3,4,5,6,7,8,0";

// ===== 盤面を描く関数 =====
function draw() {
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < board.length; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const x   = col * CELL;
    const y   = row * CELL;
    if (board[i] === 0) { continue; }
    ctx.fillStyle = "#2a2a4a";
    ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
    ctx.strokeStyle = "#555577";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
    ctx.fillStyle = "#aaaaff";
    ctx.font = "bold " + Math.floor(CELL * 0.4) + "px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(board[i], x + CELL / 2, y + CELL / 2);
  }
}

// ===== タップ位置からインデックスを求める関数 =====
function getIndex(clientX, clientY) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top)  * scaleY;
  return Math.floor(y / CELL) * COLS + Math.floor(x / CELL);
}

// ===== タイルを移動する関数 =====
function moveTile(index) {
  const empty = board.indexOf(0);
  const iRow  = Math.floor(index / COLS);
  const iCol  = index % COLS;
  const eRow  = Math.floor(empty / COLS);
  const eCol  = empty % COLS;
  const isAdjacent = (
    (Math.abs(iRow - eRow) === 1 && iCol === eCol) ||
    (Math.abs(iCol - eCol) === 1 && iRow === eRow)
  );
  if (!isAdjacent) { return; }
  board[empty] = board[index];
  board[index] = 0;
  moves++;
  document.getElementById("moves").textContent = "移動回数：" + moves;
  draw();

  // クリア判定
  if (board.join(",") === GOAL) {
    document.getElementById("msg").textContent = "クリア！🎉";
    // 0.5秒後にニックネーム入力を表示する
    setTimeout(showNameInput, 500);
  }
}

// ===== シャッフル関数 =====
function shuffle() {
  board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  moves = 0;
  document.getElementById("moves").textContent = "移動回数：0";
  document.getElementById("msg").textContent = "スタート！";
  for (let i = 0; i < 200; i++) {
    const empty     = board.indexOf(0);
    const eRow      = Math.floor(empty / COLS);
    const eCol      = empty % COLS;
    const neighbors = [];
    if (eRow > 0)        { neighbors.push(empty - COLS); }
    if (eRow < COLS - 1) { neighbors.push(empty + COLS); }
    if (eCol > 0)        { neighbors.push(empty - 1); }
    if (eCol < COLS - 1) { neighbors.push(empty + 1); }
    const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
    board[empty] = board[chosen];
    board[chosen] = 0;
  }
  draw();
}

// ===== ニックネーム入力とスコア送信 =====
function showNameInput() {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); display: flex; align-items: center;
    justify-content: center; z-index: 100;
  `;
  overlay.innerHTML = `
    <div style="background:#12121e; border:1px solid #2a2a3a; border-radius:12px; padding:24px; width:280px; text-align:center;">
      <p style="color:#4af0c8; font-size:20px; font-weight:bold; margin-bottom:8px;">クリア！🎉</p>
      <p style="color:#fff; font-size:16px; margin-bottom:16px;">${moves}手でクリア！</p>
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
        登録しないで終わる
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("submitBtn").addEventListener("click", function() {
    const name = document.getElementById("nameInput").value.trim() || "名無し";
    document.body.removeChild(overlay);
    sendScore("puzzle", name, moves);  // 手数をスコアとして送る
  });

  document.getElementById("skipBtn").addEventListener("click", function() {
    document.body.removeChild(overlay);
    showRetry();
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
  .then(function(data) { showRetry(data.ranking, name, score); })
  .catch(function() { showRetry(); });
}

// ===== リスタートボタンを表示する関数 =====
function showRetry(ranking, myName, myScore) {
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
               border-radius:8px; font-size:15px; cursor:pointer;">
        もう一度プレイ
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById("retryBtn").addEventListener("click", function() {
    document.body.removeChild(overlay);
    shuffle();
  });
}

// ===== イベントの設定 =====
canvas.addEventListener("click", function(e) {
  moveTile(getIndex(e.clientX, e.clientY));
});
canvas.addEventListener("touchstart", function(e) {
  e.preventDefault();
  const touch = e.touches[0];
  moveTile(getIndex(touch.clientX, touch.clientY));
}, { passive: false });
document.getElementById("shuffleBtn").addEventListener("click", shuffle);

draw();
