const STORAGE = {
  users: "ruangskd.users",
  currentUser: "ruangskd.currentUser",
  history: "ruangskd.history"
};
const QUESTIONS_PER_SESSION = 10;
const SESSION_SECONDS = 5 * 60;
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const LEVEL_LABELS = { mudah: "Mudah", menengah: "Menengah", sulit: "Sulit" };
const screens = ["auth-view", "dashboard-view", "quiz-view", "result-view"];

let selectedLevel = "mudah";
let sessionQuestions = [];
let answers = [];
let currentQuestion = 0;
let remainingSeconds = SESSION_SECONDS;
let timerId = null;
let isRegisterMode = false;
let sessionFinished = false;

const $ = (id) => document.getElementById(id);
const readStored = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Tidak dapat membaca penyimpanan ${key}:`, error);
    return fallback;
  }
};
const writeStored = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function showScreen(screenId) {
  screens.forEach((id) => $(id).classList.toggle("hidden", id !== screenId));
}

function currentUser() {
  return localStorage.getItem(STORAGE.currentUser);
}

function syncHeader() {
  const email = currentUser();
  $("session-label").textContent = email ? `Hai, ${email.split("@")[0]}` : "";
  $("logout-button").classList.toggle("hidden", !email);
}

function setAuthMode(register) {
  isRegisterMode = register;
  $("login-tab").classList.toggle("active", !register);
  $("register-tab").classList.toggle("active", register);
  $("login-tab").setAttribute("aria-selected", String(!register));
  $("register-tab").setAttribute("aria-selected", String(register));
  $("auth-title").textContent = register ? "Buat akun latihanmu" : "Selamat datang kembali";
  $("auth-description").textContent = register ? "Daftar dan mulai perjalanan persiapanmu." : "Masuk untuk melanjutkan persiapanmu.";
  $("auth-name").classList.toggle("hidden", !register);
  $("name-label").classList.toggle("hidden", !register);
  $("auth-name").required = register;
  $("auth-submit").innerHTML = register ? "Buat akun <span>→</span>" : "Masuk ke akun <span>→</span>";
  $("auth-message").textContent = "";
}

async function passwordHash(password, salt) {
  if (!crypto.subtle) throw new Error("Browser perlu dijalankan melalui localhost untuk membuat akun dengan aman.");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function handleAuth(event) {
  event.preventDefault();
  const email = $("auth-email").value.trim().toLowerCase();
  const password = $("auth-password").value;
  const users = readStored(STORAGE.users, {});
  const message = $("auth-message");
  message.classList.remove("success");
  message.textContent = "";

  try {
    if (isRegisterMode) {
      const name = $("auth-name").value.trim();
      if (!name) throw new Error("Masukkan nama lengkapmu.");
      if (password.length < 6) throw new Error("Kata sandi harus memiliki minimal 6 karakter.");
      if (users[email]) throw new Error("Email ini sudah terdaftar. Silakan masuk.");
      const salt = crypto.randomUUID();
      users[email] = { name, salt, passwordHash: await passwordHash(password, salt) };
      writeStored(STORAGE.users, users);
      message.textContent = "Akun berhasil dibuat. Silakan masuk.";
      message.classList.add("success");
      setAuthMode(false);
      $("auth-email").value = email;
      return;
    }
    const user = users[email];
    if (!user || await passwordHash(password, user.salt) !== user.passwordHash) {
      throw new Error("Email atau kata sandi tidak sesuai.");
    }
    localStorage.setItem(STORAGE.currentUser, email);
    syncHeader();
    showDashboard();
  } catch (error) {
    message.textContent = error.message || "Terjadi kesalahan saat memproses akun.";
  }
}

function showDashboard() {
  if (!currentUser()) {
    syncHeader();
    showScreen("auth-view");
    return;
  }
  const users = readStored(STORAGE.users, {});
  const user = users[currentUser()];
  $("welcome-title").textContent = user ? `Siap latihan hari ini, ${user.name.split(" ")[0]}?` : "Siap latihan hari ini?";
  syncHeader();
  renderHistory();
  showScreen("dashboard-view");
}

function renderHistory() {
  const history = readStored(STORAGE.history, []).filter((item) => item.email === currentUser()).slice(0, 4);
  const list = $("history-list");
  if (!history.length) {
    list.innerHTML = '<p class="empty-state">Belum ada sesi latihan. Setiap langkah kecil tetap berarti.</p>';
    return;
  }
  list.innerHTML = history.map((item) => `
    <div class="history-item"><span>${escapeHtml(LEVEL_LABELS[item.level] || item.level)} · ${escapeHtml(item.date)} · ${item.correct}/10 benar</span><strong>${item.score}</strong></div>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

async function loadLocalQuestions() {
  const response = await fetch("./question.json");
  if (!response.ok) throw new Error(`Bank soal tidak dapat dimuat (${response.status}).`);
  const bank = await response.json();
  const questions = bank[selectedLevel];
  if (!Array.isArray(questions) || questions.length < QUESTIONS_PER_SESSION) {
    throw new Error(`Bank soal level ${selectedLevel} tidak berisi ${QUESTIONS_PER_SESSION} soal.`);
  }
  const shuffledQuestions = [...questions];
  for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledQuestions[index], shuffledQuestions[randomIndex]] = [shuffledQuestions[randomIndex], shuffledQuestions[index]];
  }
  return shuffledQuestions.slice(0, QUESTIONS_PER_SESSION);
}

async function beginQuiz() {
  $("start-button").disabled = true;
  $("start-button").textContent = "Menyiapkan soal...";
  try {
    sessionQuestions = await loadLocalQuestions();
    answers = Array(QUESTIONS_PER_SESSION).fill(null);
    currentQuestion = 0;
    remainingSeconds = SESSION_SECONDS;
    sessionFinished = false;
    renderQuestion();
    showScreen("quiz-view");
    startTimer();
  } catch (error) {
    showToast(error.message || "Soal gagal dimuat.");
    console.error(error);
  } finally {
    $("start-button").disabled = false;
    $("start-button").innerHTML = 'Mulai tryout <span>→</span>';
  }
}

function renderQuestion() {
  const question = sessionQuestions[currentQuestion];
  $("quiz-level").textContent = selectedLevel.toUpperCase();
  $("quiz-counter").textContent = `SOAL ${String(currentQuestion + 1).padStart(2, "0")} / ${QUESTIONS_PER_SESSION}`;
  $("question-category").textContent = question.category.toUpperCase();
  $("question-text").textContent = question.question;
  $("progress-fill").style.width = `${((currentQuestion + 1) / QUESTIONS_PER_SESSION) * 100}%`;
  $("answer-list").innerHTML = question.options.map((option, index) => `
    <button class="answer-option ${answers[currentQuestion] === index ? "selected" : ""}" type="button" data-answer="${index}">
      <span class="answer-letter">${LETTERS[index] || index + 1}</span><span>${escapeHtml(option)}</span>
    </button>
  `).join("");
  $("answer-list").querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      answers[currentQuestion] = Number(button.dataset.answer);
      renderQuestion();
    });
  });
  $("previous-button").disabled = currentQuestion === 0;
  $("previous-button").style.opacity = currentQuestion === 0 ? ".45" : "1";
  $("next-button").classList.toggle("hidden", currentQuestion === QUESTIONS_PER_SESSION - 1);
  $("submit-button").classList.toggle("hidden", currentQuestion !== QUESTIONS_PER_SESSION - 1);
  $("answered-count").textContent = `${answers.filter((answer) => answer !== null).length}/${QUESTIONS_PER_SESSION} terjawab`;
  $("question-grid").innerHTML = sessionQuestions.map((_, index) => `
    <button type="button" class="question-number ${answers[index] !== null ? "answered" : ""} ${index === currentQuestion ? "current" : ""}" data-question="${index}" aria-label="Soal ${index + 1}${answers[index] !== null ? ", terjawab" : ", belum dijawab"}">${String(index + 1).padStart(2, "0")}</button>
  `).join("");
  $("question-grid").querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => {
      currentQuestion = Number(button.dataset.question);
      renderQuestion();
    });
  });
  updateTimerDisplay();
}

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    remainingSeconds -= 1;
    updateTimerDisplay();
    if (remainingSeconds <= 0) finishQuiz(true);
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  $("timer-text").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  $("timer").classList.toggle("warning", remainingSeconds <= 60);
}

function finishQuiz(expired = false) {
  if (sessionFinished) return;
  sessionFinished = true;
  clearInterval(timerId);
  const correct = answers.reduce((total, answer, index) => total + (answer === sessionQuestions[index].answer ? 1 : 0), 0);
  const score = correct * 10;
  $("score-value").textContent = String(score);
  $("correct-value").textContent = `${correct} / ${QUESTIONS_PER_SESSION}`;
  $("result-level").textContent = LEVEL_LABELS[selectedLevel];
  $("result-source").textContent = "Bank soal lokal";
  $("result-heading").textContent = correct >= 8 ? "Luar biasa, pertahankan!" : correct >= 5 ? "Latihan yang hebat!" : "Terus berlatih, kamu pasti bisa!";
  $("result-subtitle").textContent = expired ? "Waktu habis. Pelajari pembahasan dan coba lagi untuk meningkatkan skor." : "Setiap latihan membawamu selangkah lebih siap.";
  const review = $("review-list");
  const incorrect = sessionQuestions.filter((question, index) => answers[index] !== question.answer).length;
  $("review-count").textContent = `${incorrect} perlu ditinjau`;
  review.innerHTML = sessionQuestions.map((question, index) => {
    const isCorrect = answers[index] === question.answer;
    const yourAnswer = answers[index] === null ? "Belum dijawab" : `${LETTERS[answers[index]] || answers[index] + 1}. ${question.options[answers[index]]}`;
    const keyAnswer = `${LETTERS[question.answer] || question.answer + 1}. ${question.options[question.answer]}`;
    return `
      <article class="review-card ${isCorrect ? "correct" : "incorrect"}">
        <div class="review-heading"><strong>SOAL ${String(index + 1).padStart(2, "0")} · ${escapeHtml(question.category)}</strong><span class="review-status">${isCorrect ? "✓ Benar" : "✕ Perlu dipelajari"}</span></div>
        <p class="review-question">${escapeHtml(question.question)}</p>
        <div class="review-answer"><span>Jawabanmu: <strong>${escapeHtml(yourAnswer)}</strong></span>${!isCorrect ? `<span>Kunci jawaban: <strong>${escapeHtml(keyAnswer)}</strong></span>` : ""}</div>
        ${!isCorrect ? `<div class="review-explanation"><strong>Cara menjawab:</strong> ${escapeHtml(question.explanation)}</div>` : ""}
      </article>
    `;
  }).join("");
  const history = readStored(STORAGE.history, []);
  history.unshift({
    email: currentUser(),
    level: selectedLevel,
    correct,
    score,
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date())
  });
  writeStored(STORAGE.history, history.slice(0, 30));
  showScreen("result-view");
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.add("hidden"), 4000);
}

function initialize() {
  syncHeader();
  $("auth-form").addEventListener("submit", handleAuth);
  $("login-tab").addEventListener("click", () => setAuthMode(false));
  $("register-tab").addEventListener("click", () => setAuthMode(true));
  $("level-options").querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLevel = button.dataset.level;
      $("level-options").querySelectorAll("[data-level]").forEach((item) => item.classList.toggle("selected", item === button));
    });
  });
  $("start-button").addEventListener("click", beginQuiz);
  $("next-button").addEventListener("click", () => { currentQuestion += 1; renderQuestion(); });
  $("previous-button").addEventListener("click", () => { currentQuestion = Math.max(0, currentQuestion - 1); renderQuestion(); });
  $("submit-button").addEventListener("click", () => {
    const unanswered = answers.filter((answer) => answer === null).length;
    if (unanswered && !window.confirm(`Masih ada ${unanswered} soal belum dijawab. Selesaikan tryout sekarang?`)) return;
    finishQuiz();
  });
  $("quit-button").addEventListener("click", () => {
    if (window.confirm("Keluar dari sesi? Jawabanmu yang belum dikirim tidak akan disimpan.")) {
      clearInterval(timerId);
      showDashboard();
    }
  });
  $("home-button").addEventListener("click", showDashboard);
  $("logout-button").addEventListener("click", () => {
    localStorage.removeItem(STORAGE.currentUser);
    syncHeader();
    showScreen("auth-view");
    setAuthMode(false);
  });
  document.querySelectorAll("[data-home]").forEach((element) => element.addEventListener("click", (event) => {
    event.preventDefault();
    if (currentUser()) showDashboard();
    else showScreen("auth-view");
  }));
  if (currentUser()) showDashboard();
  else showScreen("auth-view");
}

initialize();
