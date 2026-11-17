const STORAGE = {
  currentUser: "ruangskd.currentUser",
  currentName: "ruangskd.currentName",
  history: "ruangskd.history",
  questionRotation: "ruangskd.questionRotation"
};
const DIFFICULTIES = {
  mudah: { questionCount: 10, durationSeconds: 12 * 60 },
  menengah: { questionCount: 30, durationSeconds: 32 * 60 },
  sulit: { questionCount: 50, durationSeconds: 52 * 60 }
};
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const TEST_BANKS = { TIU: "question.json", TKP: "tkp.json", TWK: "twk.json" };
const TEST_TARGETS = { TIU: 80, TKP: 156, TWK: 65 };
const screens = ["landing-view", "auth-view", "dashboard-view", "reviews-view", "quiz-view", "result-view"];

let selectedTest = "TIU";
let selectedDifficulty = null;
let sessionQuestions = [];
let answers = [];
let currentQuestion = 0;
let remainingSeconds = DIFFICULTIES.mudah.durationSeconds;
let timerId = null;
let reviewRefreshId = null;
let reviewRequestPromise = null;
let leaderboardRequestPromise = null;
let scoreProgressRequestId = 0;
let sessionFinished = false;
let accountExpiryTimer = null;

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

function setMobileMenuOpen(isOpen) {
  const toggle = $("mobile-menu-toggle");
  $("landing-nav").classList.toggle("is-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-label", isOpen ? "Tutup menu navigasi" : "Buka menu navigasi");
}

function closeMobileMenu() {
  setMobileMenuOpen(false);
}

function showScreen(screenId) {
  if (screenId !== "reviews-view" && screenId !== "landing-view" && reviewRefreshId !== null) {
    clearInterval(reviewRefreshId);
    reviewRefreshId = null;
  }
  closeMobileMenu();
  $("landing-nav").classList.toggle("hidden", screenId !== "landing-view" || Boolean(currentUser()));
  $("mobile-menu-toggle").classList.toggle("hidden", screenId !== "landing-view" || Boolean(currentUser()));
  screens.forEach((id) => $(id).classList.toggle("hidden", id !== screenId));
}

function currentUser() {
  return localStorage.getItem(STORAGE.currentUser);
}

function currentUserName() {
  const name = localStorage.getItem(STORAGE.currentName);
  return name || (currentUser() ? currentUser().split("@")[0] : "");
}

function syncHeader() {
  const email = currentUser();
  $("session-label").textContent = email ? `Hai, ${currentUserName()}` : "";
  $("logout-button").classList.toggle("hidden", !email);
}

function clearAccountExpiryTimer() {
  if (accountExpiryTimer !== null) clearTimeout(accountExpiryTimer);
  accountExpiryTimer = null;
}

function scheduleAccountExpiry(expiresAt) {
  clearAccountExpiryTimer();
  if (!Number.isSafeInteger(expiresAt)) return;
  const remaining = expiresAt - Date.now();
  accountExpiryTimer = setTimeout(() => {
    if (Date.now() < expiresAt) {
      scheduleAccountExpiry(expiresAt);
      return;
    }
    clearAccountExpiryTimer();
    clearInterval(timerId);
    timerId = null;
    sessionFinished = true;
    localStorage.removeItem(STORAGE.currentUser);
    localStorage.removeItem(STORAGE.currentName);
    syncHeader();
    showScreen("auth-view");
    $("auth-message").textContent = "Masa berlaku akun telah habis. Hubungi admin.";
  }, Math.max(0, Math.min(remaining, 2147483647)));
}

async function handleAuth(event) {
  event.preventDefault();
  const email = $("auth-email").value.trim().toLowerCase();
  const password = $("auth-password").value;
  const message = $("auth-message");
  message.classList.remove("success");
  message.textContent = "";

  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "user-login", email, password })
    });
    const result = await readApiJson(response);
    if (!response.ok || !result.user || result.user.role !== "user") {
      throw new Error(result.error || "Email atau password tidak sesuai.");
    }
    localStorage.setItem(STORAGE.currentUser, result.user.email);
    localStorage.setItem(STORAGE.currentName, result.user.name);
    scheduleAccountExpiry(result.user.expiresAt);
    syncHeader();
    showDashboard();
  } catch (error) {
    message.textContent = error.message || "Login tidak dapat diproses saat ini.";
  }
}

function showDashboard() {
  if (!currentUser()) {
    showLanding();
    return;
  }
  $("welcome-title").textContent = `Siap latihan hari ini, ${currentUserName().split(" ")[0]}?`;
  syncHeader();
  renderHistory();
  renderScoreProgress();
  showScreen("dashboard-view");
}

function showLanding() {
  if (currentUser()) {
    showDashboard();
    return;
  }
  syncHeader();
  showScreen("landing-view");
  renderReviews();
  renderLeaderboard();
  clearInterval(reviewRefreshId);
  reviewRefreshId = setInterval(() => {
    renderReviews();
    renderLeaderboard();
  }, 15000);
}

function showLogin() {
  syncHeader();
  showScreen("auth-view");
  $("auth-email").focus();
}

function showReviews() {
  if (!currentUser()) {
    showLogin();
    return;
  }
  showScreen("reviews-view");
  $("reviews-list").innerHTML = '<p class="empty-state">Memuat ulasan...</p>';
  renderReviews();
  clearInterval(reviewRefreshId);
  reviewRefreshId = setInterval(renderReviews, 15000);
}

function renderHistory() {
  const history = readStored(STORAGE.history, []).filter((item) => item.email === currentUser()).slice(0, 4);
  const list = $("history-list");
  if (!history.length) {
    list.innerHTML = '<p class="empty-state">Belum ada sesi latihan. Setiap langkah kecil tetap berarti.</p>';
    return;
  }
  list.innerHTML = history.map((item) => `
    <div class="history-item"><span>${escapeHtml(item.test || "TIU")} · ${escapeHtml(item.date)} · ${item.correct}/${item.questionCount || 10} benar</span><strong>${item.score}</strong></div>
  `).join("");
}

async function renderScoreProgress() {
  const list = $("score-progress-list");
  const requestId = ++scoreProgressRequestId;
  list.innerHTML = '<p class="empty-state">Memuat progres skor...</p>';
  try {
    const response = await fetch("/api/leaderboard", { cache: "no-store" });
    const result = await readApiJson(response);
    if (!response.ok) throw new Error(result.error || `Progres skor gagal dimuat (${response.status}).`);
    if (!result.progress || Object.entries(TEST_TARGETS).some(([test]) =>
      !Number.isSafeInteger(result.progress[test]) || result.progress[test] < 0)) {
      throw new Error("Data progres skor dari server tidak valid.");
    }
    if (requestId !== scoreProgressRequestId) return;
    list.innerHTML = Object.entries(TEST_TARGETS).map(([test, target]) => {
      const score = result.progress[test];
      const progress = Math.min(100, Math.round((score / target) * 100));
      const reached = score >= target;
      return `
        <div class="score-progress-item">
          <div class="score-progress-heading"><strong>${test}</strong><span class="score-progress-status ${reached ? "target-reached" : "target-pending"}"><i aria-hidden="true">${reached ? "✓" : "×"}</i>${progress}%</span></div>
          <div class="score-progress-track" role="progressbar" aria-label="Progres ${test}" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(score, target)}"><span style="width: ${progress}%"></span></div>
          <small class="${reached ? "target-reached" : ""}">${reached ? `Target tercapai · ${score}/${target}` : `Belum tercapai · ${score}/${target}`}</small>
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("Tidak dapat memuat progres skor:", error);
    if (requestId !== scoreProgressRequestId) return;
    list.innerHTML = `<p class="empty-state">${escapeHtml(error.message || "Progres skor tidak dapat dimuat.")}</p>`;
  }
}

function renderReviews() {
  if (reviewRequestPromise) return reviewRequestPromise;
  reviewRequestPromise = fetchAndRenderReviews();
  return reviewRequestPromise;
}

async function fetchAndRenderReviews() {
  try {
    const response = await fetch("/api/reviews", { cache: "no-store" });
    const savedReviews = await readApiJson(response);
    if (!response.ok) throw new Error(savedReviews.error || `Ulasan gagal dimuat (${response.status}).`);
    if (!Array.isArray(savedReviews)) throw new Error("Data ulasan dari server tidak valid.");
    const reviews = savedReviews
      .filter((review) => review && typeof review.username === "string" && typeof review.comment === "string"
        && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
        && typeof review.createdAt === "string" && Number.isFinite(Date.parse(review.createdAt)))
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
    $("community-review-count").textContent = `${reviews.length} ulasan`;
    $("landing-review-count").textContent = `${reviews.length} ulasan`;
    if (!reviews.length) {
      $("reviews-list").innerHTML = '<p class="empty-state">Belum ada ulasan. Jadilah yang pertama berbagi pengalaman.</p>';
      $("landing-reviews-list").innerHTML = '<p class="community-empty">Belum ada ulasan pengguna.</p>';
      return;
    }
    const renderReview = (review) => {
      const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(review.createdAt));
      return `<article class="user-review">
        <div class="user-review-heading">
          <div><strong class="user-review-name">${escapeHtml(review.username)}</strong><span class="user-review-date">${escapeHtml(date)}</span></div>
          <span class="user-review-stars" aria-label="${review.rating} dari 5 bintang">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span>
        </div>
        <p>${escapeHtml(review.comment)}</p>
      </article>`;
    };
    $("reviews-list").innerHTML = reviews.map(renderReview).join("");
    $("landing-reviews-list").innerHTML = reviews.slice(0, 5).map(renderReview).join("");
  } catch (error) {
    console.error("Tidak dapat memuat ulasan:", error);
    $("community-review-count").textContent = "Tidak tersedia";
    $("landing-review-count").textContent = "Tidak tersedia";
    $("reviews-list").innerHTML = '<p class="empty-state">Ulasan tidak dapat dimuat. Pastikan API sudah ter-deploy, lalu muat ulang halaman.</p>';
    $("landing-reviews-list").innerHTML = '<p class="community-empty">Ulasan belum dapat dimuat. Silakan coba beberapa saat lagi.</p>';
  } finally {
    reviewRequestPromise = null;
  }
}

function renderLeaderboard() {
  if (leaderboardRequestPromise) return leaderboardRequestPromise;
  leaderboardRequestPromise = fetchAndRenderLeaderboard();
  return leaderboardRequestPromise;
}

async function fetchAndRenderLeaderboard() {
  const list = $("landing-leaderboard-list");
  const message = $("leaderboard-message");
  try {
    const response = await fetch("/api/leaderboard", { cache: "no-store" });
    const result = await readApiJson(response);
    if (!response.ok) throw new Error(result.error || `Leaderboard gagal dimuat (${response.status}).`);
    if (!result || !Array.isArray(result.users)
      || result.users.some((user) => !user || typeof user.username !== "string"
        || !Number.isSafeInteger(user.score) || user.score < 0
        || !user.scores || Object.keys(TEST_TARGETS).some((test) =>
          !Number.isSafeInteger(user.scores[test]) || user.scores[test] < 0))) {
      throw new Error("Data leaderboard dari server tidak valid.");
    }
    message.textContent = "";
    if (!result.users.length) {
      list.innerHTML = '<li class="community-empty">Belum ada skor. Selesaikan tryout untuk mengisi peringkat.</li>';
      return;
    }
    list.innerHTML = result.users.slice(0, 5).map((user, index) => `
      <li class="leaderboard-item">
        <span class="leaderboard-rank">${String(index + 1).padStart(2, "0")}</span>
        <span class="leaderboard-player"><strong>${escapeHtml(user.username)}</strong><small>TIU ${user.scores.TIU} · TKP ${user.scores.TKP} · TWK ${user.scores.TWK}</small></span>
        <strong class="leaderboard-score">${user.score}<small>total</small></strong>
      </li>
    `).join("");
  } catch (error) {
    console.error("Tidak dapat memuat leaderboard:", error);
    message.textContent = error.message || "Leaderboard tidak dapat dimuat.";
    list.innerHTML = '<li class="community-empty">Peringkat belum tersedia.</li>';
  } finally {
    leaderboardRequestPromise = null;
  }
}

async function saveLeaderboardScore(test, score) {
  const message = $("leaderboard-submit-message");
  message.textContent = "";
  try {
    const response = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test, score })
    });
    const result = await readApiJson(response);
    if (!response.ok) throw new Error(result.error || `Skor gagal disimpan (${response.status}).`);
    message.textContent = `Skor ${test} berhasil ditambahkan ke akumulasi progres dan leaderboard.`;
    message.classList.add("success");
    renderLeaderboard();
    renderScoreProgress();
  } catch (error) {
    console.error("Tidak dapat menyimpan skor leaderboard:", error);
    message.classList.remove("success");
    message.textContent = error.message || "Skor belum dapat disimpan ke leaderboard.";
  }
}

async function readApiJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("json")) {
    throw new Error("Server API tidak mengembalikan JSON. Pastikan fungsi API sudah ter-deploy.");
  }
  return response.json();
}

async function refreshReviewsAfterSubmit() {
  if (reviewRequestPromise) await reviewRequestPromise;
  return renderReviews();
}

function updateStarRating(rating) {
  $("review-form").querySelectorAll(".star-rating label").forEach((label, index) => {
    label.classList.toggle("selected", index < rating);
  });
}

async function handleReviewSubmit(event) {
  event.preventDefault();
  const message = $("review-message");
  message.classList.remove("success");
  message.textContent = "";
  const email = currentUser();
  if (!email) {
    message.textContent = "Silakan masuk untuk mengirim ulasan.";
    return;
  }
  const selectedRating = document.querySelector('input[name="review-rating"]:checked');
  const rating = selectedRating ? Number(selectedRating.value) : 0;
  const comment = $("review-comment").value.trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
    message.textContent = "Pilih rating dan isi komentar sebelum mengirim.";
    return;
  }
  try {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment })
    });
    const result = await readApiJson(response);
    if (!response.ok) throw new Error(result.error || `Ulasan gagal dikirim (${response.status}).`);
  } catch (error) {
    console.error("Tidak dapat mengirim ulasan:", error);
    message.textContent = error instanceof TypeError
      ? "Server ulasan tidak dapat dijangkau. Coba lagi nanti."
      : error.message || "Ulasan gagal dikirim. Coba lagi nanti.";
    return;
  }
  $("review-form").reset();
  updateStarRating(0);
  message.textContent = "Terima kasih, ulasanmu berhasil dikirim.";
  message.classList.add("success");
  await refreshReviewsAfterSubmit();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

async function loadLocalQuestions(questionCount) {
  const response = await fetch(`./${TEST_BANKS[selectedTest]}`);
  if (!response.ok) throw new Error(`Bank soal tidak dapat dimuat (${response.status}).`);
  const questions = await response.json();
  if (!Array.isArray(questions) || questions.length < questionCount) {
    throw new Error(`Bank soal ${selectedTest} hanya memiliki ${Array.isArray(questions) ? questions.length : 0} dari ${questionCount} soal yang dibutuhkan.`);
  }
  const shuffledIds = (ids) => {
    const shuffled = [...ids];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  };
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const savedRotation = readStored(STORAGE.questionRotation, {});
  const rotation = savedRotation && typeof savedRotation === "object" && !Array.isArray(savedRotation) ? savedRotation : {};
  const savedIds = rotation && Array.isArray(rotation[selectedTest]) ? rotation[selectedTest] : [];
  let remainingIds = [...new Set(savedIds.filter((id) => questionById.has(id)))];
  const remainingSet = new Set(remainingIds);
  const newIds = questions.map((question) => question.id).filter((id) => !remainingSet.has(id));
  if (remainingIds.length) {
    remainingIds.push(...shuffledIds(newIds));
  } else {
    remainingIds = shuffledIds(questions.map((question) => question.id));
  }
  const selectedIds = remainingIds.splice(0, questionCount);
  if (selectedIds.length < questionCount) {
    const selectedSet = new Set(selectedIds);
    const refillIds = shuffledIds(questions.map((question) => question.id).filter((id) => !selectedSet.has(id)));
    const needed = questionCount - selectedIds.length;
    selectedIds.push(...refillIds.slice(0, needed));
    remainingIds = refillIds.slice(needed);
  }
  rotation[selectedTest] = remainingIds;
  writeStored(STORAGE.questionRotation, rotation);
  return selectedIds.map((id) => questionById.get(id));
}

async function beginQuiz() {
  if (!selectedDifficulty) {
    showToast("Pilih tingkat kesulitan sebelum memulai tryout.");
    return;
  }
  const difficulty = DIFFICULTIES[selectedDifficulty];
  $("start-button").disabled = true;
  $("start-button").textContent = "Menyiapkan soal...";
  $("level-options").querySelectorAll("[data-test]").forEach((button) => { button.disabled = true; });
  $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((button) => { button.disabled = true; });
  try {
    sessionQuestions = await loadLocalQuestions(difficulty.questionCount);
    answers = Array(sessionQuestions.length).fill(null);
    currentQuestion = 0;
    remainingSeconds = difficulty.durationSeconds;
    sessionFinished = false;
    renderQuestion();
    showScreen("quiz-view");
    startTimer();
  } catch (error) {
    showToast(error.message || "Soal gagal dimuat.");
    console.error(error);
  } finally {
    $("level-options").querySelectorAll("[data-test]").forEach((button) => { button.disabled = false; });
    $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((button) => { button.disabled = false; });
    $("start-button").disabled = !selectedDifficulty;
    $("start-button").innerHTML = 'Mulai tryout <span>→</span>';
  }
}

function renderQuestion() {
  const question = sessionQuestions[currentQuestion];
  $("quiz-test").textContent = selectedTest;
  $("quiz-counter").textContent = `SOAL ${String(currentQuestion + 1).padStart(2, "0")} / ${sessionQuestions.length}`;
  $("question-category").textContent = question.category.toUpperCase();
  $("question-text").textContent = question.question;
  $("progress-fill").style.width = `${((currentQuestion + 1) / sessionQuestions.length) * 100}%`;
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
  $("next-button").classList.toggle("hidden", currentQuestion === sessionQuestions.length - 1);
  $("submit-button").classList.toggle("hidden", currentQuestion !== sessionQuestions.length - 1);
  $("answered-count").textContent = `${answers.filter((answer) => answer !== null).length}/${sessionQuestions.length} terjawab`;
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
  const score = Math.round((correct / sessionQuestions.length) * 100);
  $("score-value").textContent = String(score);
  $("correct-value").textContent = `${correct} / ${sessionQuestions.length}`;
  $("result-test").textContent = selectedTest;
  $("result-source").textContent = "Bank soal lokal";
  $("result-heading").textContent = score >= 80 ? "Luar biasa, pertahankan!" : score >= 50 ? "Latihan yang hebat!" : "Terus berlatih, kamu pasti bisa!";
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
    test: selectedTest,
    correct,
    score,
    questionCount: sessionQuestions.length,
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date())
  });
  writeStored(STORAGE.history, history.slice(0, 30));
  showScreen("result-view");
  $("leaderboard-submit-message").classList.remove("success");
  if (currentUser()) saveLeaderboardScore(selectedTest, score);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.add("hidden"), 4000);
}

async function restoreUserSession() {
  const hadPreviousSession = Boolean(currentUser());
  try {
    const response = await fetch("/api/auth", { cache: "no-store" });
    const result = await readApiJson(response);
    if (!response.ok) throw new Error(result.error || `Sesi tidak dapat dipulihkan (${response.status}).`);
    if (!result.user || result.user.role !== "user") {
      clearAccountExpiryTimer();
      localStorage.removeItem(STORAGE.currentUser);
      localStorage.removeItem(STORAGE.currentName);
      syncHeader();
      if (hadPreviousSession) {
        $("auth-message").textContent = "Sesi atau masa berlaku akun telah berakhir. Silakan login kembali.";
        showLogin();
      } else {
        showLanding();
      }
      return;
    }
    localStorage.setItem(STORAGE.currentUser, result.user.email);
    localStorage.setItem(STORAGE.currentName, result.user.name);
    scheduleAccountExpiry(result.user.expiresAt);
    syncHeader();
    showDashboard();
  } catch (error) {
    console.error("Tidak dapat memulihkan sesi:", error);
    clearAccountExpiryTimer();
    localStorage.removeItem(STORAGE.currentUser);
    localStorage.removeItem(STORAGE.currentName);
    syncHeader();
    showLogin();
    $("auth-message").textContent = error.message || "Sesi tidak dapat dipulihkan.";
  }
}

function initialize() {
  syncHeader();
  $("mobile-menu-toggle").addEventListener("click", () => {
    setMobileMenuOpen($("mobile-menu-toggle").getAttribute("aria-expanded") !== "true");
  });
  $("landing-nav").querySelectorAll("a, button").forEach((item) => item.addEventListener("click", closeMobileMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobileMenu();
  });
  $("start-test-button").addEventListener("click", showLogin);
  $("nav-start-test-button").addEventListener("click", showLogin);
  $("back-to-landing-button").addEventListener("click", showLanding);
  $("auth-form").addEventListener("submit", handleAuth);
  $("level-options").querySelectorAll("[data-test]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTest = button.dataset.test;
      selectedDifficulty = null;
      $("level-options").querySelectorAll("[data-test]").forEach((item) => item.classList.toggle("selected", item === button));
      $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((item) => {
        item.classList.remove("selected");
        item.setAttribute("aria-pressed", "false");
      });
      $("start-button").disabled = true;
      $("session-limit-pill").textContent = "Pilih tingkat kesulitan";
      $("source-note").textContent = "Pilih tingkat kesulitan untuk melanjutkan.";
      $("bank-title").textContent = `Bank soal ${selectedTest}`;
      $("bank-description").textContent = `Soal dipilih acak dari bank soal ${selectedTest}, lengkap dengan kunci jawaban dan pembahasan.`;
    });
  });
  $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedDifficulty = button.dataset.difficulty;
      const { questionCount, durationSeconds } = DIFFICULTIES[selectedDifficulty];
      const minutes = Math.floor(durationSeconds / 60);
      $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      $("session-limit-pill").textContent = `${questionCount} soal · ${minutes} menit`;
      $("source-note").textContent = `Bank soal ${selectedTest} · ${questionCount} soal acak`;
      $("bank-description").textContent = `${questionCount} soal dipilih acak dari bank soal ${selectedTest}, lengkap dengan kunci jawaban dan pembahasan.`;
      $("start-button").disabled = false;
    });
  });
  $("start-button").addEventListener("click", beginQuiz);
  $("open-reviews-button").addEventListener("click", showReviews);
  $("reviews-home-button").addEventListener("click", showDashboard);
  $("review-form").addEventListener("submit", handleReviewSubmit);
  $("review-form").querySelectorAll('input[name="review-rating"]').forEach((input) => {
    input.addEventListener("change", () => updateStarRating(Number(input.value)));
  });
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
  $("logout-button").addEventListener("click", async () => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" })
      });
      const result = await readApiJson(response);
      if (!response.ok) throw new Error(result.error || "Logout tidak dapat diproses.");
    } catch (error) {
      console.error("Tidak dapat mengakhiri sesi:", error);
    } finally {
      clearAccountExpiryTimer();
      localStorage.removeItem(STORAGE.currentUser);
      localStorage.removeItem(STORAGE.currentName);
      syncHeader();
      showLanding();
    }
  });
  document.querySelectorAll("[data-home]").forEach((element) => element.addEventListener("click", (event) => {
    event.preventDefault();
    if (currentUser()) showDashboard();
    else showLanding();
  }));
  showScreen("landing-view");
  restoreUserSession();
}

initialize();
