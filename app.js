const SUBJECTS = ["英語","数学","国語","社会","理科","音楽","美術"];
const TIME_LIMIT = 6 * 60;

if (!Array.isArray(window.QUESTIONS)) {
  // 互換用。questions.jsがオブジェクト形式で定義されている場合に使用。
}

const questionBank = (typeof QUESTIONS !== "undefined" ? QUESTIONS : (window.QUESTIONS || {}));
const TOTAL_SCORE = SUBJECTS.reduce((sum, s) => sum + ((questionBank[s] || []).length), 0);

const state = {
  name: "",
  subjectIndex: 0,
  answers: {},
  results: {},
  score: 0,
  timer: null,
  endAt: 0,
  finished: false,
  submitted: false
};

let db = null;

function $(id) { return document.getElementById(id); }

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function getQuestions(subject) {
  return Array.isArray(questionBank[subject]) ? questionBank[subject] : [];
}

function startTest() {
  const name = ($("name").value || "").trim();
  if (!name) {
    alert("名前を入力してください。");
    return;
  }

  for (const subject of SUBJECTS) {
    if (!getQuestions(subject).length) {
      alert(`${subject}の問題データが読み込まれていません。questions.jsを確認してください。`);
      return;
    }
  }

  state.name = name.slice(0, 40);
  state.subjectIndex = 0;
  state.answers = {};
  state.results = {};
  state.score = 0;
  state.finished = false;
  state.submitted = false;
  showSubject();
}

function showSubject() {
  clearInterval(state.timer);

  const subject = SUBJECTS[state.subjectIndex];
  const questions = getQuestions(subject);

  $("startScreen").classList.add("hidden");
  $("testScreen").classList.remove("hidden");
  $("resultScreen").classList.add("hidden");

  $("subjectTitle").textContent = `${subject} ${state.subjectIndex + 1}/${SUBJECTS.length}`;
  $("progressText").textContent = `${questions.length}問 / 6分`;

  $("questionArea").innerHTML = questions.map((q, i) => `
    <article class="question-card">
      <div class="question-number">第${i + 1}問</div>
      <div class="question-text">${esc(q.q)}</div>
      <div class="choices">
        ${(Array.isArray(q.c) ? q.c : []).map((choice, j) => `
          <label class="choice">
            <input type="radio" name="q${i}" value="${j}">
            <span>${esc(choice)}</span>
          </label>
        `).join("")}
      </div>
    </article>
  `).join("");

  $("submitButton").disabled = false;
  state.endAt = Date.now() + TIME_LIMIT * 1000;
  updateTimer();
  state.timer = setInterval(updateTimer, 250);
  window.scrollTo({top:0, behavior:"smooth"});
}

function updateTimer() {
  const left = Math.max(0, state.endAt - Date.now());
  const sec = Math.ceil(left / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  $("timer").textContent = `${m}:${String(s).padStart(2,"0")}`;

  if (left <= 0) {
    clearInterval(state.timer);
    submitSubject(true);
  }
}

function submitSubject(auto = false) {
  if (state.submitted) return;
  state.submitted = true;
  clearInterval(state.timer);
  $("submitButton").disabled = true;

  const subject = SUBJECTS[state.subjectIndex];
  const questions = getQuestions(subject);
  const picked = {};

  questions.forEach((_, i) => {
    const el = document.querySelector(`input[name="q${i}"]:checked`);
    picked[i] = el ? Number(el.value) : null;
  });

  let correct = 0;
  questions.forEach((q, i) => {
    if (picked[i] === q.a) correct++;
  });

  state.answers[subject] = picked;
  state.results[subject] = {
    correct,
    total: questions.length,
    percent: questions.length ? Math.round(correct / questions.length * 100) : 0
  };
  state.score += correct;

  if (auto) {
    alert(`${subject}の制限時間が終了しました。自動的に採点します。`);
  }

  state.submitted = false;

  if (state.subjectIndex < SUBJECTS.length - 1) {
    state.subjectIndex++;
    showSubject();
  } else {
    state.finished = true;
    showResults();
  }
}

async function showResults() {
  clearInterval(state.timer);
  $("testScreen").classList.add("hidden");
  $("resultScreen").classList.remove("hidden");

  $("resultName").textContent = state.name;
  $("totalScore").textContent = `${state.score} / ${TOTAL_SCORE}`;

  $("resultTable").innerHTML = SUBJECTS.map(s => {
    const r = state.results[s];
    return `<tr><td>${esc(s)}</td><td>${r.correct}/${r.total}</td><td>${r.percent}%</td></tr>`;
  }).join("");

  if (window.Chart) {
    const canvas = $("radarChart");
    if (window.resultChart) window.resultChart.destroy();
    window.resultChart = new Chart(canvas, {
      type: "radar",
      data: {
        labels: SUBJECTS,
        datasets: [{
          label: "正答率",
          data: SUBJECTS.map(s => state.results[s].percent)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
        plugins: { legend: { display: false } }
      }
    });
  }

  renderReview();
  await saveScore();
}

function renderReview() {
  $("reviewArea").innerHTML = SUBJECTS.map(subject => {
    const qs = getQuestions(subject);
    const ans = state.answers[subject] || {};
    return `<section class="review-section"><h3>${esc(subject)}</h3>` +
      qs.map((q,i) => {
        const selected = ans[i];
        const ok = selected === q.a;
        return `<div class="review-item ${ok ? "correct" : "wrong"}">
          <strong>第${i+1}問 ${ok ? "○ 正解" : "× 不正解"}</strong>
          <div>${esc(q.q)}</div>
          <div>あなたの回答：${selected == null ? "未回答" : esc(q.c[selected])}</div>
          <div>正解：${esc(q.c[q.a])}</div>
        </div>`;
      }).join("") + `</section>`;
  }).join("");
}

function initSupabase() {
  if (typeof supabase === "undefined" || !window.isSupabaseConfigured || !isSupabaseConfigured()) {
    $("configWarning").textContent = "Supabase未設定です。テスト自体は利用できますが、ランキング保存にはconfig.jsの設定が必要です。";
    return;
  }
  db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function saveScore() {
  if (!db) {
    $("rankingArea").innerHTML = "<p>ランキングはSupabase設定後に利用できます。</p>";
    return;
  }

  try {
    const { error } = await db.from("scores").insert({
      name: state.name,
      total: state.score,
      breakdown: state.results
    });
    if (error) throw error;
    await loadRanking();
  } catch (e) {
    console.error(e);
    $("rankingArea").innerHTML = "<p>ランキング保存に失敗しました。Supabaseの設定・SQL・RLSを確認してください。</p>";
  }
}

async function loadRanking() {
  const { data, error } = await db.rpc("get_public_ranking");
  if (error) throw error;

  $("rankingArea").innerHTML = data?.length
    ? `<ol class="ranking-list">${data.map((r,i) =>
        `<li><span>${i+1}位</span> ${esc(r.name)} <strong>${r.total}点</strong></li>`
      ).join("")}</ol>`
    : "<p>まだランキングデータがありません。</p>";
}

async function shareResult() {
  const text = `大人の小中学力テスト\n${state.name}：${state.score}/${TOTAL_SCORE}点\n` +
    SUBJECTS.map(s => `${s} ${state.results[s].percent}%`).join(" / ");

  if (navigator.share) {
    try {
      await navigator.share({title:"大人の小中学力テスト 結果",text});
      return;
    } catch (_) {}
  }

  try {
    await navigator.clipboard.writeText(text);
    alert("結果をコピーしました。SNSへ貼り付けてください。");
  } catch (_) {
    prompt("以下をコピーしてください。", text);
  }
}

function restart() {
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  initSupabase();
  $("startButton").addEventListener("click", startTest);
  $("shareButton").addEventListener("click", shareResult);
  $("printButton").addEventListener("click", () => window.print());
  $("restartButton").addEventListener("click", restart);
});
