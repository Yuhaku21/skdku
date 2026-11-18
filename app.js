const STORAGE = {
  currentUser: "ruangskd.currentUser",
  currentName: "ruangskd.currentName",
  currentValidity: "ruangskd.currentValidity",
  profilePhotoId: "ruangskd.profilePhotoId",
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
const FIXED_ACCESS_LIMITS = {
  "1-day": { questionCount: 10, durationSeconds: 12 * 60 },
  "7-days": { questionCount: 15, durationSeconds: 16 * 60 }
};
const PACKAGES = {
  starter: {
    name: "Starter",
    price: 0,
    benefits: [
      { included: true, text: "Akses selama 1 hari" },
      { included: true, text: "10 soal per sesi" },
      { included: false, text: "Pilih tingkat kesulitan" },
      { included: false, text: "Masuk leaderboard tertinggi" },
      { included: false, text: "E-book gratis" }
    ]
  },
  tempur: {
    name: "Tempur",
    price: 30000,
    benefits: [
      { included: true, text: "Akses selama 7 hari" },
      { included: true, text: "15 soal per sesi" },
      { included: false, text: "Pilih tingkat kesulitan" },
      { included: false, text: "Masuk leaderboard tertinggi" },
      { included: true, text: "E-book gratis" }
    ]
  },
  victory: {
    name: "Victory",
    price: 50000,
    benefits: [
      { included: true, text: "Akses selamanya" },
      { included: true, text: "Pilih jumlah soal dan tingkat kesulitan" },
      { included: true, text: "Masuk leaderboard tertinggi" },
      { included: true, text: "E-book gratis" }
    ]
  }
};
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
let landingReviewCarouselTimer = null;
let landingReviewPage = 0;
let landingReviewPageSize = window.matchMedia("(max-width: 800px)").matches ? 2 : 3;
let landingReviews = [];
let landingReviewCarouselPaused = false;
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

function showPackageDetails(packageKey) {
  const selectedPackage = PACKAGES[packageKey];
  if (!selectedPackage) return;

  const formatPrice = (price) => price === 0 ? "Gratis" : new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(price);
  const benefitsList = $("package-summary-benefits");
  benefitsList.replaceChildren();
  selectedPackage.benefits.forEach((benefit) => {
    const item = document.createElement("li");
    const mark = document.createElement("span");
    mark.className = benefit.included ? "benefit-check" : "benefit-unavailable";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = benefit.included ? "✓" : "×";
    item.append(mark, document.createTextNode(benefit.text));
    benefitsList.append(item);
  });

  $("package-summary-name").textContent = `Paket ${selectedPackage.name}`;
  $("package-summary-price").textContent = formatPrice(selectedPackage.price);
  $("package-summary-total").textContent = formatPrice(selectedPackage.price);
  const message = selectedPackage.price === 0
    ? `hai saya ingin mengaktifkan paket ${selectedPackage.name} gratis`
    : `hai saya ingin memesan harga paketan ${selectedPackage.name}`;
  const whatsappButton = $("package-whatsapp-button");
  whatsappButton.href = `https://wa.me/6283192124659?text=${encodeURIComponent(message)}`;
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  whatsappButton.replaceChildren(
    document.createTextNode(selectedPackage.price === 0
      ? "Hubungi WhatsApp untuk aktivasi "
      : "Lanjutkan pembayaran via WhatsApp "),
    arrow
  );
  $("package-dialog").showModal();
}

function showScreen(screenId) {
  if (screenId !== "reviews-view" && screenId !== "landing-view" && reviewRefreshId !== null) {
    clearInterval(reviewRefreshId);
    reviewRefreshId = null;
  }
  if (screenId !== "landing-view" && landingReviewCarouselTimer !== null) {
    clearInterval(landingReviewCarouselTimer);
    landingReviewCarouselTimer = null;
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

function currentValidity() {
  return localStorage.getItem(STORAGE.currentValidity);
}

function getCurrentSessionConfig() {
  if (currentValidity() === "forever") {
    return selectedDifficulty ? DIFFICULTIES[selectedDifficulty] : null;
  }
  return FIXED_ACCESS_LIMITS[currentValidity()] || null;
}

function updateSessionOptions() {
  const config = getCurrentSessionConfig();
  if (!config) {
    $("session-limit-pill").textContent = currentValidity() === "forever"
      ? "Pilih tingkat kesulitan"
      : "Akses tidak tersedia";
    $("source-note").textContent = currentValidity() === "forever"
      ? "Pilih tingkat kesulitan untuk melanjutkan."
      : "Masa akses akun tidak dikenali. Silakan masuk kembali.";
    $("start-button").disabled = true;
    return;
  }
  const minutes = Math.floor(config.durationSeconds / 60);
  $("session-limit-pill").textContent = `${config.questionCount} soal · ${minutes} menit`;
  $("source-note").textContent = currentValidity() === "forever"
    ? `Akses selamanya · ${config.questionCount} soal acak`
    : `Paket ${currentValidity() === "1-day" ? "1 hari" : "7 hari"} · ${config.questionCount} soal acak`;
  $("bank-title").textContent = `Bank soal ${selectedTest}`;
  $("bank-description").textContent = `${config.questionCount} soal dipilih acak dari bank soal ${selectedTest}, lengkap dengan kunci jawaban dan pembahasan.`;
  $("start-button").disabled = false;
}

function configureAccountAccess() {
  const lifetimeAccess = currentValidity() === "forever";
  $("ebook-card").classList.toggle("hidden", !["7-days", "forever"].includes(currentValidity()));
  $("difficulty-section").classList.toggle("hidden", !lifetimeAccess);
  $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((button) => {
    button.disabled = !lifetimeAccess;
  });
  if (!lifetimeAccess) {
    selectedDifficulty = null;
    $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((button) => {
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    });
  }
  updateSessionOptions();
}

function profilePhotoUrl(profilePhotoId) {
  return `/api/profile?id=${encodeURIComponent(profilePhotoId)}`;
}

function renderProfilePhoto() {
  const profilePhotoId = localStorage.getItem(STORAGE.profilePhotoId);
  const image = $("profile-avatar-image");
  const initial = $("profile-avatar-initial");
  initial.textContent = Array.from(currentUserName().trim())[0] || "U";
  initial.hidden = false;
  initial.classList.remove("hidden");
  image.hidden = true;
  image.classList.add("hidden");
  if (!profilePhotoId) return;
  image.src = `${profilePhotoUrl(profilePhotoId)}&v=${Date.now()}`;
  activateAvatarImages($("profile-avatar"));
}

function activateAvatarImages(root) {
  root.querySelectorAll(".avatar-image").forEach((image) => {
    const fallback = image.parentElement.querySelector(".avatar-initial");
    const showImage = () => {
      image.hidden = false;
      image.classList.remove("hidden");
      fallback.classList.add("hidden");
    };
    const showFallback = () => {
      image.hidden = true;
      image.classList.add("hidden");
      fallback.classList.remove("hidden");
    };
    image.addEventListener("load", showImage, { once: true });
    image.addEventListener("error", showFallback, { once: true });
    if (image.complete) {
      if (image.naturalWidth) showImage();
      else showFallback();
    }
  });
}

function avatarMarkup(profilePhotoId, name, className) {
  const initial = Array.from(String(name).trim())[0] || "U";
  const image = typeof profilePhotoId === "string" && profilePhotoId
    ? `<img class="avatar-image" src="${escapeHtml(profilePhotoUrl(profilePhotoId))}" alt="" loading="lazy" decoding="async" hidden />`
    : "";
  return `<span class="profile-avatar ${className}"><span class="avatar-initial">${escapeHtml(initial)}</span>${image}</span>`;
}

function readProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (!image.naturalWidth || !image.naturalHeight
        || image.naturalWidth > 8000 || image.naturalHeight > 8000) {
        reject(new Error("Ukuran gambar tidak didukung."));
        return;
      }
      const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - sourceSize) / 2;
      const sourceY = (image.naturalHeight - sourceSize) / 2;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Foto tidak dapat diproses di browser ini."));
        return;
      }

      const resize = async () => {
        for (const dimension of [256, 192, 128]) {
          canvas.width = dimension;
          canvas.height = dimension;
          context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, dimension, dimension);
          for (const quality of [0.82, 0.68, 0.54, 0.4, 0.28]) {
            const blob = await new Promise((resolveBlob) => canvas.toBlob(resolveBlob, "image/webp", quality));
            if (blob && blob.type === "image/webp" && blob.size <= 20 * 1024) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(new Error("Foto tidak dapat dibaca."));
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
        reject(new Error("Foto terlalu besar. Coba pilih gambar yang lebih sederhana."));
      };
      resize().catch(reject);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("File tersebut bukan gambar yang dapat dibuka."));
    };
    image.src = objectUrl;
  });
}

async function handleProfilePhotoChange(event) {
  const input = event.currentTarget;
  const file = input.files && input.files[0];
  const message = $("profile-photo-message");
  message.classList.remove("success");
  message.textContent = "";
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
    message.textContent = "Pilih file gambar dengan ukuran maksimal 5 MB.";
    input.value = "";
    return;
  }
  $("profile-photo-button").disabled = true;
  message.textContent = "Memproses foto...";
  try {
    const image = await readProfilePhoto(file);
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image })
    });
    const result = await readApiJson(response);
    if (!response.ok || typeof result.profilePhotoId !== "string") {
      throw new Error(result.error || "Foto profil gagal disimpan.");
    }
    localStorage.setItem(STORAGE.profilePhotoId, result.profilePhotoId);
    renderProfilePhoto();
    message.textContent = "Foto profil berhasil diperbarui.";
    message.classList.add("success");
  } catch (error) {
    console.error("Tidak dapat mengunggah foto profil:", error);
    message.textContent = error.message || "Foto profil gagal diunggah. Coba lagi.";
  } finally {
    $("profile-photo-button").disabled = false;
    input.value = "";
  }
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
    localStorage.removeItem(STORAGE.currentValidity);
    localStorage.removeItem(STORAGE.profilePhotoId);
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
    localStorage.setItem(STORAGE.currentValidity, result.user.validity);
    if (result.user.profilePhotoId) localStorage.setItem(STORAGE.profilePhotoId, result.user.profilePhotoId);
    else localStorage.removeItem(STORAGE.profilePhotoId);
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
  renderProfilePhoto();
  syncHeader();
  configureAccountAccess();
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
  activateAvatarImages(list);
}

async function renderScoreProgress() {
  const list = $("score-progress-list");
  const requestId = ++scoreProgressRequestId;
  list.innerHTML = '<p class="empty-state">Memuat progres skor...</p>';
  $("certificate-status").textContent = "Memeriksa kelayakan sertifikat...";
  $("certificate-status").classList.remove("success");
  $("print-certificate-button").disabled = true;
  try {
    const response = await fetch("/api/leaderboard", { cache: "no-store" });
    const result = await readApiJson(response);
    if (!response.ok) throw new Error(result.error || `Progres skor gagal dimuat (${response.status}).`);
    if (!result.progress || Object.entries(TEST_TARGETS).some(([test]) =>
      !Number.isSafeInteger(result.progress[test]) || result.progress[test] < 0)
      || typeof result.certificateEligible !== "boolean"
      || (result.certificateEligible && (typeof result.certificateName !== "string" || !result.certificateName))) {
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
    activateAvatarImages(track);
    updateCertificate(result.progress, result.certificateEligible, result.certificateName);
  } catch (error) {
    console.error("Tidak dapat memuat progres skor:", error);
    if (requestId !== scoreProgressRequestId) return;
    list.innerHTML = `<p class="empty-state">${escapeHtml(error.message || "Progres skor tidak dapat dimuat.")}</p>`;
    $("certificate-status").textContent = "Kelayakan sertifikat belum dapat diverifikasi. Coba muat ulang dashboard.";
  }
}

function updateCertificate(progress, eligible, certificateName) {
  const status = $("certificate-status");
  const button = $("print-certificate-button");
  button.disabled = !eligible;
  status.classList.toggle("success", eligible);
  if (!eligible) {
    status.textContent = currentValidity() === "forever"
      ? "Akun Victory perlu mencapai seluruh target TIU, TKP, dan TWK untuk membuka sertifikat."
      : "Sertifikat tersedia untuk akun Victory setelah seluruh target TIU, TKP, dan TWK tercapai.";
    return;
  }

  const displayName = certificateName.replace(/\bVictory\b/gi, "").replace(/\s+/g, " ").trim();
  $("certificate-name").textContent = displayName || "Peserta SKDKU";
  $("certificate-score-tiu").textContent = progress.TIU;
  $("certificate-score-tkp").textContent = progress.TKP;
  $("certificate-score-twk").textContent = progress.TWK;
  status.textContent = "Selamat! Akun Victory telah mencapai semua target. Sertifikat siap dicetak atau disimpan sebagai PDF.";
}

function printCertificate() {
  if ($("print-certificate-button").disabled) return;
  $("certificate-date").textContent = `Diterbitkan pada ${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date())}`;
  $("certificate-page").classList.remove("hidden");
  window.print();
}

function showLandingReviewPage(page) {
  const track = $("landing-reviews-list");
  const slides = [...track.querySelectorAll(".landing-review-slide")];
  if (!slides.length) return;
  landingReviewPage = (page + slides.length) % slides.length;
  track.style.transform = `translateX(-${landingReviewPage * 100}%)`;
  slides.forEach((slide, index) => {
    slide.setAttribute("aria-hidden", String(index !== landingReviewPage));
  });
  $("landing-review-page").textContent = `${landingReviewPage + 1} / ${slides.length}`;
}

function renderLandingReviewCarousel(renderReview) {
  const track = $("landing-reviews-list");
  const controls = $("landing-reviews-controls");
  if (!landingReviews.length) {
    track.style.transform = "";
    track.innerHTML = '<p class="community-empty">Belum ada ulasan pengguna.</p>';
    controls.hidden = true;
    if (landingReviewCarouselTimer !== null) {
      clearInterval(landingReviewCarouselTimer);
      landingReviewCarouselTimer = null;
    }
    return;
  }

  const pageCount = Math.ceil(landingReviews.length / landingReviewPageSize);
  landingReviewPage = Math.min(landingReviewPage, pageCount - 1);
  track.innerHTML = Array.from({ length: pageCount }, (_, page) => {
    const start = Math.min(page * landingReviewPageSize, landingReviews.length - landingReviewPageSize);
    const slideReviews = landingReviews.slice(start, start + landingReviewPageSize);
    const firstReview = start + 1;
    const lastReview = start + slideReviews.length;
    return `<div class="landing-review-slide" role="group" aria-roledescription="slide" aria-label="Ulasan ${firstReview} sampai ${lastReview} dari ${landingReviews.length}">
      ${slideReviews.map(renderReview).join("")}
    </div>`;
  }).join("");
  controls.hidden = pageCount <= 1;
  showLandingReviewPage(landingReviewPage);

  if (pageCount > 1 && !$("landing-view").classList.contains("hidden")
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (landingReviewCarouselTimer === null) {
      landingReviewCarouselTimer = setInterval(() => {
        if (!landingReviewCarouselPaused) showLandingReviewPage(landingReviewPage + 1);
      }, 5000);
    }
  } else if (landingReviewCarouselTimer !== null) {
    clearInterval(landingReviewCarouselTimer);
    landingReviewCarouselTimer = null;
  }
}

function renderReviewCard(review) {
  const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(review.createdAt));
  return `<article class="user-review">
    <div class="user-review-heading">
      <div class="user-review-person">
        ${avatarMarkup(review.profilePhotoId, review.username, "user-review-avatar")}
        <div><strong class="user-review-name">${escapeHtml(maskReviewUsername(review.username))}</strong><span class="user-review-date">${escapeHtml(date)}</span></div>
      </div>
      <span class="user-review-stars" aria-label="${review.rating} dari 5 bintang">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span>
    </div>
    <p>${escapeHtml(review.comment)}</p>
  </article>`;
}

function maskReviewUsername(username) {
  const characters = Array.from(String(username).trim());
  if (characters.length <= 4) return characters.join("");
  return `${characters.slice(0, 4).join("")}${"*".repeat(characters.length - 4)}`;
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
      landingReviews = [];
      $("reviews-list").innerHTML = '<p class="empty-state">Belum ada ulasan. Jadilah yang pertama berbagi pengalaman.</p>';
      renderLandingReviewCarousel(renderReviewCard);
      return;
    }
    landingReviews = reviews;
    $("reviews-list").innerHTML = reviews.map(renderReviewCard).join("");
    activateAvatarImages($("reviews-list"));
    renderLandingReviewCarousel(renderReviewCard);
  } catch (error) {
    console.error("Tidak dapat memuat ulasan:", error);
    $("community-review-count").textContent = "Tidak tersedia";
    $("landing-review-count").textContent = "Tidak tersedia";
    $("reviews-list").innerHTML = '<p class="empty-state">Ulasan tidak dapat dimuat. Pastikan API sudah ter-deploy, lalu muat ulang halaman.</p>';
    landingReviews = [];
    $("landing-reviews-list").innerHTML = '<p class="community-empty">Ulasan belum dapat dimuat. Silakan coba beberapa saat lagi.</p>';
    $("landing-reviews-controls").hidden = true;
    if (landingReviewCarouselTimer !== null) {
      clearInterval(landingReviewCarouselTimer);
      landingReviewCarouselTimer = null;
    }
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
        || (user.profilePhotoId !== null && typeof user.profilePhotoId !== "string")
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
        ${avatarMarkup(user.profilePhotoId, user.username, "leaderboard-avatar")}
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
    if (typeof result.leaderboardEligible !== "boolean") {
      throw new Error("Status akses leaderboard dari server tidak valid.");
    }
    message.textContent = result.leaderboardEligible
      ? `Skor ${test} berhasil ditambahkan ke akumulasi progres dan leaderboard.`
      : `Progres ${test} tersimpan. Leaderboard hanya tersedia untuk akun selamanya.`;
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
  const difficulty = getCurrentSessionConfig();
  if (!difficulty) {
    showToast(currentValidity() === "forever"
      ? "Pilih tingkat kesulitan sebelum memulai tryout."
      : "Akses akun tidak tersedia. Silakan masuk kembali.");
    return;
  }
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
    $("start-button").disabled = !getCurrentSessionConfig();
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
      localStorage.removeItem(STORAGE.currentValidity);
      localStorage.removeItem(STORAGE.profilePhotoId);
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
    localStorage.setItem(STORAGE.currentValidity, result.user.validity);
    if (result.user.profilePhotoId) localStorage.setItem(STORAGE.profilePhotoId, result.user.profilePhotoId);
    else localStorage.removeItem(STORAGE.profilePhotoId);
    scheduleAccountExpiry(result.user.expiresAt);
    syncHeader();
    showDashboard();
  } catch (error) {
    console.error("Tidak dapat memulihkan sesi:", error);
    clearAccountExpiryTimer();
    localStorage.removeItem(STORAGE.currentUser);
    localStorage.removeItem(STORAGE.currentName);
    localStorage.removeItem(STORAGE.currentValidity);
    localStorage.removeItem(STORAGE.profilePhotoId);
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
  document.querySelectorAll("[data-package]").forEach((button) => {
    button.addEventListener("click", () => showPackageDetails(button.dataset.package));
  });
  $("package-dialog-close").addEventListener("click", () => $("package-dialog").close());
  $("package-dialog").addEventListener("click", (event) => {
    if (event.target === $("package-dialog")) $("package-dialog").close();
  });
  $("landing-reviews-previous").addEventListener("click", () => showLandingReviewPage(landingReviewPage - 1));
  $("landing-reviews-next").addEventListener("click", () => showLandingReviewPage(landingReviewPage + 1));
  $("landing-reviews-section").addEventListener("mouseenter", () => { landingReviewCarouselPaused = true; });
  $("landing-reviews-section").addEventListener("mouseleave", () => { landingReviewCarouselPaused = false; });
  $("landing-reviews-section").addEventListener("focusin", () => { landingReviewCarouselPaused = true; });
  $("landing-reviews-section").addEventListener("focusout", (event) => {
    if (!$("landing-reviews-section").contains(event.relatedTarget)) landingReviewCarouselPaused = false;
  });
  window.addEventListener("resize", () => {
    const pageSize = window.matchMedia("(max-width: 800px)").matches ? 2 : 3;
    if (pageSize === landingReviewPageSize) return;
    const firstVisibleReview = landingReviewPage * landingReviewPageSize;
    landingReviewPageSize = pageSize;
    landingReviewPage = Math.floor(firstVisibleReview / pageSize);
    renderLandingReviewCarousel(renderReviewCard);
  });
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
      $("level-options").querySelectorAll("[data-test]").forEach((item) => item.classList.toggle("selected", item === button));
      if (currentValidity() === "forever") {
        selectedDifficulty = null;
        $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((item) => {
          item.classList.remove("selected");
          item.setAttribute("aria-pressed", "false");
        });
      }
      updateSessionOptions();
    });
  });
  $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedDifficulty = button.dataset.difficulty;
      $("difficulty-options").querySelectorAll("[data-difficulty]").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      updateSessionOptions();
    });
  });
  $("start-button").addEventListener("click", beginQuiz);
  $("profile-photo-button").addEventListener("click", () => $("profile-photo-input").click());
  $("profile-photo-input").addEventListener("change", handleProfilePhotoChange);
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
  $("print-certificate-button").addEventListener("click", printCertificate);
  window.addEventListener("afterprint", () => $("certificate-page").classList.add("hidden"));
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
      scoreProgressRequestId += 1;
      $("print-certificate-button").disabled = true;
      $("certificate-status").textContent = "Masuk dengan akun Victory untuk memeriksa kelayakan sertifikat.";
      localStorage.removeItem(STORAGE.currentUser);
      localStorage.removeItem(STORAGE.currentName);
      localStorage.removeItem(STORAGE.currentValidity);
      localStorage.removeItem(STORAGE.profilePhotoId);
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
