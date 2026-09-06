/* ==========================================================
   GitHub Pages + Supabase edition
   1) 下の SUPABASE_URL / SUPABASE_ANON_KEY を設定
   2) supabase.sql をSupabase SQL Editorで実行
   ========================================================== */
const SUPABASE_URL = "https://ghuivkwpfeswjmefwwai.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodWl2a3dwZmVzd2ptZWZ3d2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDQwMjUsImV4cCI6MjEwNDE4MDAyNX0.o3tULJESEHZjjpp6X4VjsTpYnEvrU8gOI2nfy9FXvSE";

let db = null;
if (SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY !== "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodWl2a3dwZmVzd2ptZWZ3d2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDQwMjUsImV4cCI6MjEwNDE4MDAyNX0.o3tULJESEHZjjpp6X4VjsTpYnEvrU8gOI2nfy9FXvSE") {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const $ = id => document.getElementById(id);
let state = {name:"", subjectIndex:0, answers:{}, results:{}, timer:null, deadline:0};

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function shuffle(a){return a.slice().sort(()=>Math.random()-.5);}

$("startBtn").onclick = () => {
  const name = $("name").value.trim();
  if(!name){alert("名前を入力してください。"); return;}
  state.name=name; state.subjectIndex=0; state.answers={}; state.results={};
  $("start").classList.add("hidden"); $("result").classList.add("hidden"); $("quiz").classList.remove("hidden");
  startSubject();
};

function startSubject(){
  const subject=SUBJECTS[state.subjectIndex];
  $("subjectTitle").textContent=subject;
  $("progress").textContent=`${state.subjectIndex+1}/7`;
  const qs=QUESTION_BANK[subject];
  $("questions").innerHTML=qs.map((x,i)=>`
    <div class="question">
      <div class="qtext">第${i+1}問　${esc(x.q)}</div>
      ${x.options.map((o,j)=>`
        <label class="option">
          <input type="radio" name="${x.id}" value="${j}"> ${String.fromCharCode(65+j)}. ${esc(o)}
        </label>`).join("")}
    </div>`).join("");
  $("submitBtn").disabled=false;
  state.deadline=Date.now()+LIMIT_MINUTES[subject]*60*1000;
  clearInterval(state.timer);
  state.timer=setInterval(tick,250);
  tick();
  window.scrollTo({top:0,behavior:"smooth"});
}

function tick(){
  const ms=Math.max(0,state.deadline-Date.now());
  const sec=Math.ceil(ms/1000);
  $("timer").textContent=`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
  $("timer").classList.toggle("danger",sec<=30);
  if(ms<=0){clearInterval(state.timer); submitSubject(true);}
}

$("submitBtn").onclick=()=>submitSubject(false);

async function submitSubject(auto){
  if($("submitBtn").disabled) return;
  $("submitBtn").disabled=true;
  clearInterval(state.timer);
  const subject=SUBJECTS[state.subjectIndex];
  const qs=QUESTION_BANK[subject];
  let score=0;
  state.answers[subject]=[];
  qs.forEach(x=>{
    const el=document.querySelector(`input[name="${x.id}"]:checked`);
    const chosen=el?Number(el.value):null;
    if(chosen===x.answer)score++;
    state.answers[subject].push({id:x.id,chosen,correct:x.answer,q:x.q,options:x.options});
  });
  state.results[subject]=score;
  if(auto) alert(`${subject}は制限時間終了です。回答を締め切りました。`);
  if(state.subjectIndex<6){
    state.subjectIndex++;
    startSubject();
  }else{
    await finish();
  }
}

async function finish(){
  $("quiz").classList.add("hidden"); $("result").classList.remove("hidden");
  const total=Object.values(state.results).reduce((a,b)=>a+b,0);
  $("summary").innerHTML=`<div class="scorebig">${total} / 120点</div>
  <p style="text-align:center">総合正答率 <b>${(total/110*100).toFixed(1)}%</b></p>`+
  SUBJECTS.map(s=>`<div class="subject-row"><span>${s}</span><b>${state.results[s]} / ${QUESTION_BANK[s].length}（${(state.results[s]/QUESTION_BANK[s].length*100).toFixed(1)}%）</b></div>`).join("");
  renderReview();
  renderRadar();
  await saveAndLoadRanking(total);
}

function renderReview(){
  $("answerReview").innerHTML=SUBJECTS.map(s=>`
    <details><summary><b>${s}</b>　${state.results[s]}/${QUESTION_BANK[s].length}</summary>
    ${state.answers[s].map((x,i)=>{
      const ok=x.chosen===x.correct;
      const yours=x.chosen===null?"未回答":`${String.fromCharCode(65+x.chosen)}. ${esc(x.options[x.chosen])}`;
      const ans=`${String.fromCharCode(65+x.correct)}. ${esc(x.options[x.correct])}`;
      return `<div class="review-item">
        <b>第${i+1}問</b> ${ok?"⭕":"❌"}<br>
        <span class="${ok?"correct":"wrong"}">あなたの回答：${yours}</span><br>
        正解：${ans}
      </div>`;
    }).join("")}</details>`).join("");
}

function renderRadar(){
  const ctx=$("radar");
  if(window._radar) window._radar.destroy();
  window._radar=new Chart(ctx,{type:"radar",data:{
    labels:SUBJECTS,datasets:[{label:"正答率",data:SUBJECTS.map(s=>state.results[s]/QUESTION_BANK[s].length*100),fill:true}]
  },options:{scales:{r:{min:0,max:100,ticks:{stepSize:20}}},plugins:{legend:{display:false}}}});
}

async function saveAndLoadRanking(total){
  if(!db){
    $("ranking").innerHTML=`<p class="small">Supabase未設定のため、ランキングはこの端末内だけのデモです。</p>`;
    const local=JSON.parse(localStorage.getItem("localRanking")||"[]");
    local.push({name:state.name,total,created_at:new Date().toISOString()});
    local.sort((a,b)=>b.total-a.total); local.splice(20);
    localStorage.setItem("localRanking",JSON.stringify(local));
    renderRanking(local); return;
  }
  const {error}=await db.from("scores").insert({name:state.name,total,breakdown:state.results});
  if(error){console.error(error); $("ranking").textContent="ランキング保存に失敗しました。"; return;}
  const {data}=await db.from("scores").select("name,total,created_at").order("total",{ascending:false}).order("created_at",{ascending:true}).limit(20);
  renderRanking(data||[]);
}
function renderRanking(rows){
  $("ranking").innerHTML=rows.map((r,i)=>`<div class="rank"><b>${i+1}位</b>　${esc(r.name)}　<b>${r.total}点</b><span class="small">　${new Date(r.created_at).toLocaleString("ja-JP")}</span></div>`).join("");
}
$("retryBtn").onclick=()=>location.reload();

// 結果を保存する関数（例）
async function saveScore(name, totalScore) {
  if (!db) return;
  const { error } = await db
    .from('scores')
    .insert([{ name: name, total_score: totalScore }]);

  if (error) {
    console.error('スコアの保存に失敗しました:', error);
  }
}

// ランキングを取得して表示する関数（例）
async function loadLeaderboard() {
  if (!db) return;
  const { data, error } = await db
    .from('scores')
    .select('name, total_score')
    .order('total_score', { ascending: false })
    .limit(10);

  if (error) {
    console.error('ランキングの取得に失敗しました:', error);
    return;
  }

  // HTML側で用意した <ol id="rankingList"></ol> などに出力する
  const listEl = $("rankingList");
  if (listEl) {
    listEl.innerHTML = data.map((item, index) => 
      `<li>${index + 1}位: ${esc(item.name)} - ${item.total_score}点</li>`
    ).join('');
  }
}

