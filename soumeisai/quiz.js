// ===== ランキングサーバーのURL =====
const RANKING_SERVER = "https://osamu.my.coocan.jp/bunkasai/ranking.php";

// ===== クイズの問題データ =====
// q：問題文、c：選択肢（4つ）、a：正解番号（0から始まる）
const quizData = [
  {
    q: "問題1：ここに問題文を入力",
    c: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    a: 0
  },
  {
    q: "問題2：ここに問題文を入力",
    c: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    a: 1
  },
  {
    q: "問題3：ここに問題文を入力",
    c: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    a: 2
  },
  {
    q: "問題4：ここに問題文を入力",
    c: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    a: 3
  },
  {
    q: "問題5：ここに問題文を入力",
    c: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    a: 0
  }
];

// ===== ゲームの状態 =====
let currentQ = 0;  // 現在の問題番号
let score    = 0;  // 正解数

// ===== 問題を表示する関数 =====
function showQuestion() {
  // 全問終了したら結果を表示する
  if (currentQ >= quizData.length) {
    showResult();
    return;
  }

  const data = quizData[currentQ];

  // 問題番号を更新する
  document.getElementById("progress").textContent =
    "問題 " + (currentQ + 1) + " / " + quizData.length;

  // 問題文を表示する
  document.getElementById("question").textContent = data.q;

  // フィードバックをリセットする
  document.getElementById("feedback").textContent = "";

  // 選択肢ボタンを作って表示する
  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";

  for (let i = 0; i < data.c.length; i++) {
    const btn = document.createElement("button");
    btn.className   = "choice-btn";
    btn.textContent = data.c[i];
    btn.addEventListener("click", function() { checkAnswer(i); });
    choicesEl.appendChild(btn);
  }
}

// ===== 答えを確認する関数 =====
function checkAnswer(selectedIndex) {
  const data      = quizData[currentQ];
  const feedback  = document.getElementById("feedback");
  const buttons   = document.querySelectorAll(".choice-btn");
  const isCorrect = (selectedIndex === data.a);

  if (isCorrect) {
    feedback.textContent = "✓ 正解！";
    feedback.style.color = "#4af0c8";
    score++;
    buttons[selectedIndex].style.background  = "rgba(74, 240, 200, 0.2)";
    buttons[selectedIndex].style.borderColor = "#4af0c8";
  } else {
    feedback.textContent = "✗ 不正解";
    feedback.style.color = "#ff4444";
    buttons[selectedIndex].style.background  = "rgba(255, 68, 68, 0.2)";
    buttons[selectedIndex].style.borderColor = "#ff4444";
    buttons[data.a].style.background  = "rgba(74, 240, 200, 0.15)";
    buttons[data.a].style.borderColor = "#4af0c8";
  }

  // 全ボタンを無効にする
  for (let i = 0; i < buttons.length; i++) { buttons[i].disabled = true; }

  // 1秒後に次の問題へ進む
  setTimeout(function() { currentQ++; showQuestion(); }, 1000);
}

// ===== 結果を表示する関数 =====
function showResult() {
  document.getElementById("progress").textContent = "結果";
  document.getElementById("question").innerHTML =
    "<span style='font-size:24px; font-weight:bold; color:#4af0c8;'>" +
    score + " / " + quizData.length + " 正解！</span>";
  document.getElementById("choices").innerHTML  = "";
  document.getElementById("feedback").textContent = "";

  // 満点の場合はニックネーム入力を促す
  if (score === quizData.length) {
    setTimeout(showNameInput, 600);
  } else {
    // 満点でない場合はもう一度ボタンだけ表示する
    showRetry();
  }
}

// ===== ニックネーム入力（満点者のみ） =====
function showNameInput() {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); display: flex; align-items: center;
    justify-content: center; z-index: 100;
  `;
  overlay.innerHTML = `
    <div style="background:#12121e; border:1px solid #2a2a3a; border-radius:12px; padding:24px; width:280px; text-align:center;">
      <p style="color:#ffd700; font-size:20px; font-weight:bold; margin-bottom:8px;">全問正解！🎉</p>
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

  document.getElementById("submitBtn").addEventListener("click", function() {
    const name = document.getElementById("nameInput").value.trim() || "名無し";
    document.body.removeChild(overlay);
    // クイズは満点（全問正解）＝quizData.lengthをスコアとして送る
    sendScore("quiz", name, quizData.length);
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

// ===== もう一度ボタンを表示する関数 =====
function showRetry(ranking, myName, myScore) {
  let rankMsg = "";
  if (ranking && myName) {
    const myRank = ranking.find(function(r) { return r.name === myName && r.score === myScore; });
    if (myRank) { rankMsg = myRank.rank + "位にランクイン！"; }
  }

  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";

  if (rankMsg) {
    const msg = document.createElement("p");
    msg.style.cssText = "color:#4af0c8; font-weight:bold; font-size:16px; margin-bottom:12px;";
    msg.textContent   = rankMsg;
    choicesEl.appendChild(msg);
  }

  const rankLink = document.createElement("a");
  rankLink.href        = "ranking.html";
  rankLink.textContent = "ランキングを見る";
  rankLink.style.cssText = "display:block; color:#aaf; font-size:14px; margin-bottom:16px; text-align:center;";
  choicesEl.appendChild(rankLink);

  const retryBtn = document.createElement("button");
  retryBtn.className   = "retry-btn";
  retryBtn.textContent = "もう一度チャレンジ";
  retryBtn.style.marginBottom = "8px";
  retryBtn.addEventListener("click", function() {
    currentQ = 0;
    score    = 0;
    showQuestion();
  });
  choicesEl.appendChild(retryBtn);

  const menuBtn = document.createElement("a");
  menuBtn.href        = "index.html";
  menuBtn.textContent = "メニューに戻る";
  menuBtn.style.cssText = "display:block; color:#888; font-size:13px; text-align:center; margin-top:8px;";
  choicesEl.appendChild(menuBtn);
}

// ===== 最初の問題を表示する =====
showQuestion();
