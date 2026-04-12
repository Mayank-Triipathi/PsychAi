/* ═══════════════════════════════════════════════════════
   test.js  —  Chat-based Wellness Assessment
   ═══════════════════════════════════════════════════════ */

const QUESTIONS = [
  "How have you been feeling emotionally lately?",
  "Do you feel overwhelmed or anxious?",
  "Are you facing financial stress?",
  "Do money issues worry you often?",
  "How are your relationships?",
  "Do you feel supported?",
  "Do past experiences affect you?",
  "Do you think about uncomfortable memories?"
];

let chatHistory = [];   // [{role: 'user'|'assistant', content: string}]
let chatBusy    = false;
let chatEnded   = false;

/* ─────────────────────────────────────────────────────
   ENTRY POINT
   ───────────────────────────────────────────────────── */
function startTest() {
  if (!S.token || S.role !== 'user') {
    toast('Please log in as a user first', 'error');
    showPage('page-auth');
    return;
  }

  chatHistory = [];
  chatBusy    = false;
  chatEnded   = false;

  showPage('page-test');
  buildChatUI();

  // ✅ Start with first question (NO API call)
  addBubble('assistant', QUESTIONS[0]);
}

/* ─────────────────────────────────────────────────────
   BUILD UI  (replaces page-test content)
   ───────────────────────────────────────────────────── */
function buildChatUI() {
  document.getElementById('page-test').innerHTML = `
    <div id="chat-shell">
      <div id="chat-header">
        <div id="chat-header-left">
          <div id="chat-ai-avatar">🧠</div>
          <div>
            <p id="chat-name">Wellness Assessment</p>
            <p id="chat-status">Online</p>
          </div>
        </div>
      </div>

      <div id="chat-body"></div>

      <div id="chat-footer">
        <div id="chat-input-box">
          <textarea
            id="chat-input"
            placeholder="Type a message…"
            rows="1"
            onkeydown="handleChatKey(event)"
            oninput="autoResize(this)"
          ></textarea>
          <button id="chat-send" onclick="handleSend()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`;

  injectChatCSS();
}

/* ─────────────────────────────────────────────────────
   SEND HANDLERS
   ───────────────────────────────────────────────────── */
function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function handleSend() {
  if (chatBusy || chatEnded) return;

  const input = document.getElementById('chat-input');
  const text  = (input?.value || '').trim();
  if (!text) return;

  addBubble('user', text);
  chatHistory.push({ role: 'user', content: text });

  input.value = '';
  autoResize(input);

  const userAnswers = chatHistory.filter(m => m.role === 'user');

  // ✅ If less than 8 → just ask next question
  if (userAnswers.length < 8) {
    addBubble('assistant', QUESTIONS[userAnswers.length]);
    return;
  }

  // ✅ When 8 answers reached → call backend ONCE
  sendToAI();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 130) + 'px';
}

/* ─────────────────────────────────────────────────────
   API CALL
   ───────────────────────────────────────────────────── */
async function sendToAI() {
  chatBusy = true;
  setInputLocked(true);

  const typingId = addTypingIndicator();

  const res = await api('/api/chat-assessment', 'POST', {
  answers: chatHistory
    .filter(m => m.role === 'user')
    .map(m => m.content)
});

  removeTypingIndicator(typingId);

  if (!res.ok) {
    addBubble('assistant', "Sorry, something went wrong. Please try again.");
    chatBusy = false;
    setInputLocked(false);
    return;
  }

  const { reply, done, prediction } = res.data;

  // Add AI reply to history and show bubble
  chatHistory.push({ role: 'assistant', content: reply });
  addBubble('assistant', reply);

  if (done) {
    chatEnded = true;
    setInputLocked(true);

    // Save prediction
    if (prediction) {
      S.scores = prediction;
      const submitRes = await api('/api/create-prediction', 'POST', {
        userId:         S.user?._id,
        emotional:      prediction.emotional    || 0,
        financial:      prediction.financial    || 0,
        relationship:   prediction.relationship || 0,
        trauma:         prediction.trauma       || 0,
        primaryProblem: prediction.primaryProblem || '',
      });
      if (submitRes.ok) {
        S.predictionId = (submitRes.data._id || submitRes.data.data?._id);
      }
    }

    // Show results card after short pause
    setTimeout(() => showResultsCard(prediction), 800);
  } else {
    chatBusy = false;
    setInputLocked(false);
    document.getElementById('chat-input')?.focus();
  }
}

/* ─────────────────────────────────────────────────────
   BUBBLE HELPERS
   ───────────────────────────────────────────────────── */
function addBubble(role, text) {
  const body = document.getElementById('chat-body');
  if (!body) return;

  const row = document.createElement('div');
  row.className = `chat-row ${role === 'user' ? 'row-user' : 'row-ai'}`;

  // Convert **bold** and newlines
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  row.innerHTML = `<div class="bubble bubble-${role === 'user' ? 'user' : 'ai'}">${html}</div>`;
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}

function addTypingIndicator() {
  const body = document.getElementById('chat-body');
  if (!body) return null;

  const id  = 'typing-' + Date.now();
  const row = document.createElement('div');
  row.className = 'chat-row row-ai';
  row.id = id;
  row.innerHTML = `
    <div class="bubble bubble-ai typing-bubble">
      <span></span><span></span><span></span>
    </div>`;
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  if (id) document.getElementById(id)?.remove();
}

function setInputLocked(locked) {
  const input = document.getElementById('chat-input');
  const btn   = document.getElementById('chat-send');
  if (input) input.disabled = locked;
  if (btn)   btn.disabled   = locked;
}

/* ─────────────────────────────────────────────────────
   RESULTS CARD
   ───────────────────────────────────────────────────── */
function showResultsCard(prediction) {
  const body = document.getElementById('chat-body');
  if (!body || !prediction) return;

  const domains = [
    { key: 'emotional',    label: 'Emotional',    color: '#B39DDB' },
    { key: 'financial',    label: 'Financial',    color: '#F4A261' },
    { key: 'relationship', label: 'Relationship', color: '#74B3CE' },
    { key: 'trauma',       label: 'Trauma',       color: '#7CAE7A' },
  ];

  const bars = domains.map(d => `
    <div class="rc-bar-row">
      <span class="rc-lbl">${d.label}</span>
      <div class="rc-track">
        <div class="rc-fill" data-w="${prediction[d.key] || 0}"
             style="width:0%;background:${d.color}"></div>
      </div>
      <span class="rc-pct">${prediction[d.key] || 0}%</span>
    </div>`).join('');

  const row = document.createElement('div');
  row.className = 'chat-row row-ai';
  row.innerHTML = `
    <div class="results-card">
      <div class="rc-head">
        <span class="rc-emoji">🧠</span>
        <div>
          <p class="rc-title">Your Wellness Report</p>
          <p class="rc-sub">Based on your responses</p>
        </div>
      </div>
      <div class="rc-bars">${bars}</div>
      <div class="rc-primary">
        <p class="rc-primary-lbl">PRIMARY CONCERN</p>
        <p class="rc-primary-val">${prediction.primaryProblem || ''} Stress</p>
      </div>
      <button class="btn btn-primary btn-full" style="margin-top:16px"
              onclick="initBooking(); showPage('page-booking')">
        Find Hospitals &amp; Book →
      </button>
    </div>`;

  body.appendChild(row);
  body.scrollTop = body.scrollHeight;

  // Animate bars
  requestAnimationFrame(() => {
    row.querySelectorAll('.rc-fill').forEach(el => {
      setTimeout(() => { el.style.width = el.dataset.w + '%'; }, 120);
    });
  });
}

/* ─────────────────────────────────────────────────────
   CSS
   ───────────────────────────────────────────────────── */
function injectChatCSS() {
  if (document.getElementById('chat-css')) return;
  const s = document.createElement('style');
  s.id = 'chat-css';
  s.textContent = `
#chat-shell {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 72px);
  max-width: 720px;
  margin: 0 auto;
}

#chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(124,174,122,0.15);
  background: rgba(253,250,246,0.96);
  backdrop-filter: blur(14px);
  flex-shrink: 0;
}
#chat-header-left { display:flex; align-items:center; gap:12px; }
#chat-ai-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg,var(--sage),var(--peach));
  display: flex; align-items: center; justify-content: center;
  font-size: 19px;
}
#chat-name  { font-weight: 800; font-size: 15px; }
#chat-status {
  font-size: 12px; color: var(--sage-dark); font-weight: 700;
}
#chat-status::before {
  content: ''; display: inline-block;
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--sage); margin-right: 5px;
}

#chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scroll-behavior: smooth;
}

.chat-row { display:flex; }
.row-ai   { justify-content: flex-start; }
.row-user { justify-content: flex-end; }

.bubble {
  max-width: 75%;
  padding: 11px 15px;
  font-size: 14.5px;
  line-height: 1.6;
  font-weight: 600;
  animation: bubbleIn 0.22s ease;
}
@keyframes bubbleIn {
  from { opacity:0; transform: translateY(6px); }
  to   { opacity:1; transform: translateY(0); }
}
.bubble-ai {
  background: white;
  color: var(--dark);
  border: 1px solid rgba(124,174,122,0.18);
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.bubble-user {
  background: linear-gradient(135deg, var(--sage), var(--sage-dark));
  color: white;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 3px 14px rgba(124,174,122,0.3);
}

.typing-bubble {
  display: flex; align-items: center; gap: 5px;
  padding: 14px 18px;
}
.typing-bubble span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--sage); display: inline-block;
  animation: typeDot 1.1s infinite ease-in-out;
}
.typing-bubble span:nth-child(2) { animation-delay:.18s; }
.typing-bubble span:nth-child(3) { animation-delay:.36s; }
@keyframes typeDot {
  0%,60%,100% { transform:translateY(0); opacity:.4; }
  30%          { transform:translateY(-5px); opacity:1; }
}

#chat-footer {
  flex-shrink: 0;
  padding: 12px 16px 18px;
  border-top: 1px solid rgba(124,174,122,0.12);
  background: rgba(253,250,246,0.96);
  backdrop-filter: blur(14px);
}
#chat-input-box {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: white;
  border: 2px solid rgba(124,174,122,0.22);
  border-radius: 16px;
  padding: 9px 9px 9px 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
#chat-input-box:focus-within {
  border-color: var(--sage);
  box-shadow: 0 0 0 3px rgba(124,174,122,0.12);
}
#chat-input {
  flex: 1;
  border: none; outline: none;
  background: transparent;
  font-family: 'Nunito', sans-serif;
  font-size: 14.5px; font-weight: 600;
  color: var(--dark);
  resize: none;
  min-height: 22px; max-height: 130px;
  line-height: 1.5;
}
#chat-input::placeholder { color: #B0BEC5; }
#chat-input:disabled { opacity: 0.45; }

#chat-send {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, var(--sage), var(--sage-dark));
  border: none; cursor: pointer; color: white;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.2s;
}
#chat-send:hover:not(:disabled) {
  transform: scale(1.07);
  box-shadow: 0 3px 12px rgba(124,174,122,0.4);
}
#chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

/* Results card */
.results-card {
  background: white;
  border: 1px solid rgba(124,174,122,0.15);
  border-radius: 18px;
  padding: 22px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 6px 30px rgba(124,174,122,0.13);
  animation: bubbleIn 0.4s ease;
}
.rc-head { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.rc-emoji { font-size:32px; }
.rc-title { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; }
.rc-sub   { font-size:12px; color:var(--mid); margin-top:2px; }
.rc-bars  { margin-bottom:16px; }
.rc-bar-row { display:flex; align-items:center; gap:10px; margin-bottom:9px; }
.rc-lbl   { font-size:12px; font-weight:700; color:var(--dark-soft); width:80px; flex-shrink:0; }
.rc-track { flex:1; height:8px; background:var(--light); border-radius:100px; overflow:hidden; }
.rc-fill  { height:100%; border-radius:100px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }
.rc-pct   { font-size:12px; font-weight:900; width:30px; text-align:right; color:var(--dark); }
.rc-primary {
  background: rgba(124,174,122,0.08);
  border-radius: var(--radius-sm);
  padding: 13px 16px;
  text-align: center;
}
.rc-primary-lbl {
  font-size:10px; font-weight:900; letter-spacing:1px;
  color:var(--mid); text-transform:uppercase; margin-bottom:3px;
}
.rc-primary-val {
  font-family:'Playfair Display',serif;
  font-size:19px; font-weight:900; color:var(--sage-dark);
}
  `;
  document.head.appendChild(s);
}