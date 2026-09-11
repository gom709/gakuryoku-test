/* ==========================================================
   GitHub Pages + Supabase edition
========================================================== */
const SUPABASE_URL = "https://ghuivkwpfeswjmefwwai.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodWl2a3dwZmVzd2ptZWZ3d2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDQwMjUsImV4cCI6MjEwNDE4MDAyNX0.o3tULJESEHZjjpp6X4VjsTpYnEvrU8gOI2nfy9FXvSE";

let db = null;
if (SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY) {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const $ = id => document.getElementById(id);

let state = {
  name: "",
  subjectIndex: 0,
  answers: {},
  results: {},
  timer: null,
  deadline: 0
};

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

window.onload = function() {
  if ($("startBtn")) {
    $("startBtn").onclick = () => {
      const name = $("name") ? $("name").value.trim() : "";
      if (!name) {
        alert("名前を入力してください。");
        return;
      }
      state.name = name;
      state.subjectIndex = 0;
      state.answers = {};
      state.results = {};
      
      if ($("start")) $("start").classList.add("hidden");
      if ($("result")) $("result").classList.add("hidden");
      if ($("quiz")) $("quiz").classList.remove("hidden");
      
      startSubject();
    };
  }

  // 「もう一度受験する」ボタンの処理を追加・初期化
  if ($("retryBtn")) {
    $("retryBtn").onclick = () => {
      if ($("result")) $("result").classList.add("hidden");
      if ($("quiz")) $("quiz").classList.add("hidden");
      if ($("start")) $("start").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }
  
  if ($("submitBtn")) {
    $("submitBtn").onclick = () => submitSubject(false);
  }

  loadAndRenderRanking();
};

function startSubject() {
  const subject = SUBJECTS[state.subjectIndex];
  if ($("subjectTitle")) $("subjectTitle").textContent = subject;
  if ($("progress")) $("progress").textContent = `${state.subjectIndex + 1} / ${SUBJECTS.length}`;
  
  const qs = QUESTION_BANK[subject] || [];
  if ($("questions")) {
    $("questions").innerHTML = qs.map((x, i) => `
      <div class="question">
        <div class="qtext">第${i + 1}問 ${esc(x.q)}</div>
        ${x.options.map((o, j) => `
          <label class="option">
            <input type="radio" name="${x.id}" value="${j}">
            ${String.fromCharCode(65 + j)}. ${esc(o)}
          </label>
        `).join("")}
      </div>
    `).join("");
  }

  if ($("submitBtn")) $("submitBtn").disabled = false;
  
  state.deadline = Date.now() + (LIMIT_MINUTES[subject] || 3) * 60 * 1000;
  clearInterval(state.timer);
  state.timer = setInterval(tick, 250);
  tick();
  
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function tick() {
  const ms = Math.max(0, state.deadline - Date.now());
  const sec = Math.ceil(ms / 1000);
  
  if ($("timer")) {
    $("timer").textContent = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
    $("timer").classList.toggle("danger", sec <= 30);
  }

  if (ms <= 0) {
    clearInterval(state.timer);
    submitSubject(true);
  }
}

async function submitSubject(auto) {
  if ($("submitBtn") && $("submitBtn").disabled) return;
  if ($("submitBtn")) $("submitBtn").disabled = true;
  clearInterval(state.timer);

  const subject = SUBJECTS[state.subjectIndex];
  const qs = QUESTION_BANK[subject] || [];
  let score = 0;
  state.answers[subject] = [];

  qs.forEach(x => {
    const el = document.querySelector(`input[name="${x.id}"]:checked`);
    const chosen = el ? Number(el.value) : null;
    if (chosen === x.answer) score++;
    state.answers[subject].push({
      id: x.id,
      chosen,
      correct: x.answer,
      q: x.q,
      options: x.options
    });
  });

  state.results[subject] = score;

  if (auto) alert(`${subject}は制限時間終了です。回答を締め切りました。`);

  if (state.subjectIndex < SUBJECTS.length - 1) {
    state.subjectIndex++;
    startSubject();
  } else {
    await finish();
  }
}

async function finish() {
  if ($("quiz")) $("quiz").classList.add("hidden");
  if ($("result")) $("result").classList.remove("hidden");

  const total = Object.values(state.results).reduce((a, b) => a + b, 0);
  const maxTotal = SUBJECTS.reduce((acc, s) => acc + (QUESTION_BANK[s] ? QUESTION_BANK[s].length : 0), 0);

  let levelTitle = "";
  let levelComment = "";
  if (total >= 86) { // 約85%以上
    levelTitle = "👑 超人・教授レベル！";
    levelComment = "恐ろしい知性…！今すぐクイズ番組に出演するか、知識を鼻にかけて自慢して回りましょう！";
  } else if (total >= 71) { // 約70%以上
    levelTitle = "🎓 高校生（進学校）レベル！";
    levelComment = "素晴らしい記憶力！大人の経験値と知識が見事に融合した、文句なしの秀才です。";
  } else if (total >= 56) { // 約55%以上
    levelTitle = "🏫 中学3年生レベル！";
    levelComment = "高校受験なら余裕で合格圏内！社会人として十分すぎる教養をお持ちです。";
  } else if (total >= 41) { // 約40%以上
    levelTitle = "🎒 小学6年生レベル！";
    levelComment = "義務教育の基礎はバッチリ！「忘れてたけど見覚えはある」をしっかり正解に繋げられました。";
  } else if (total >= 26) { // 約25%以上
    levelTitle = "🐥 小学3年生レベル！";
    levelComment = "あれ…？昔習ったはずなのに…？社会に出て使わない知識は脳のゴミ箱に捨ててきたタイプですね！";
  } else {
    levelTitle = "🐣 ひよこ組（未就学児）レベル！";
    levelComment = "大丈夫、社会で生きていくのに「台形の面積公式」は滅多に使いません！伸びしろしかありません！";
  }

  if ($("summary")) {
    $("summary").innerHTML = `
      <div class="level-box" style="margin-bottom: 15px; padding: 15px; background: #f0f8ff; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.1rem; font-weight: bold; color: #0056b3;">あなたの判定結果</div>
        <div style="font-size: 1.6rem; font-weight: bold; margin: 8px 0; color: #2c3e50;">${levelTitle}</div>
        <p style="font-size: 0.95rem; margin: 0; color: #555;">${levelComment}</p>
      </div>
      <div class="scorebig">${total} / ${maxTotal}点</div>
      <p style="text-align:center">総合正答率 <b>${maxTotal > 0 ? (total / maxTotal * 100).toFixed(1) : 0}%</b></p>
    ` + SUBJECTS.map(s => {
      const qLen = QUESTION_BANK[s] ? QUESTION_BANK[s].length : 0;
      const res = state.results[s] ?? 0;
      const pct = qLen > 0 ? (res / qLen * 100).toFixed(1) : 0;
      return `<div class="subject-row"><span>${s}</span><b>${res} / ${qLen}（${pct}%）</b></div>`;
    }).join("");
  }

  renderReview();
  renderRadar();

  await saveScore(total);
  await loadAndRenderRanking();
}

function renderReview() {
  if (!$("answerReview")) return;
  $("answerReview").innerHTML = SUBJECTS.map(s => {
    const qLen = QUESTION_BANK[s] ? QUESTION_BANK[s].length : 0;
    const res = state.results[s] ?? 0;
    const answers = state.answers[s] || [];
    
    return `
      <details><summary><b>${s}</b> ${res}/${qLen}</summary>
      ${answers.map((x, i) => {
        const ok = x.chosen === x.correct;
        const yours = x.chosen === null ? "未回答" : `${String.fromCharCode(65 + x.chosen)}. ${esc(x.options[x.chosen])}`;
        const ans = `${String.fromCharCode(65 + x.correct)}. ${esc(x.options[x.correct])}`;
        return `
          <div class="review-item">
            <b>第${i + 1}問</b> ${ok ? "⭕" : "❌"}<br>
            <span class="${ok ? "correct" : "wrong"}">あなたの回答：${yours}</span><br>
            正解：${ans}
          </div>
        `;
      }).join("")}
      </details>
    `;
  }).join("");
}

function renderRadar() {
  if (!$("radar") || typeof Chart === "undefined") return;
  const ctx = $("radar");
  if (window._radar) window._radar.destroy();
  window._radar = new Chart(ctx, {
    type: "radar",
    data: {
      labels: SUBJECTS,
      datasets: [{
        label: "正答率",
        data: SUBJECTS.map(s => {
          const qLen = QUESTION_BANK[s] ? QUESTION_BANK[s].length : 0;
          return qLen > 0 ? (state.results[s] / qLen * 100) : 0;
        }),
        fill: true
      }]
    },
    options: {
      scales: {
        r: { min: 0, max: 100, ticks: { stepSize: 20 } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

async function loadAndRenderRanking() {
  let rows = [];
  if (!db) {
    rows = JSON.parse(localStorage.getItem("localRanking") || "[]");
  } else {
    const { data, error } = await db
      .from("scores")
      .select("name,total,created_at")
      .order("total", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(30);
      
    if (error) {
      console.error(error);
      if ($("ranking")) $("ranking").textContent = "ランキング取得に失敗しました。";
      if ($("startRanking")) $("startRanking").textContent = "ランキング取得に失敗しました。";
      return;
    }
    rows = data || [];
  }

  renderRankingToElement("ranking", rows);
  renderRankingToElement("startRanking", rows);
}

function renderRankingToElement(elementId, rows) {
  const el = $(elementId);
  if (!el) return;
  if (!db) {
    el.innerHTML = `<p class="small">Supabase未設定のため、デモ表示です。</p>` + rows.map((r, i) => `
      <div class="rank"><b>${i + 1}位</b> ${esc(r.name)} <b>${r.total}点</b><span class="small"> ${new Date(r.created_at).toLocaleString("ja-JP")}</span></div>
    `).join("");
  } else {
    el.innerHTML = rows.map((r, i) => `
      <div class="rank"><b>${i + 1}位</b> ${esc(r.name)} <b>${r.total}点</b><span class="small"> ${new Date(r.created_at).toLocaleString("ja-JP")}</span></div>
    `).join("");
  }
}

async function saveScore(total) {
  if (!db) {
    const local = JSON.parse(localStorage.getItem("localRanking") || "[]");
    local.push({ name: state.name, total, created_at: new Date().toISOString() });
    local.sort((a, b) => b.total - a.total);
    local.splice(30);
    localStorage.setItem("localRanking", JSON.stringify(local));
    return;
  }
  const { error } = await db.from("scores").insert({ name: state.name, total, breakdown: state.results });
  if (error) console.error(error);
}
