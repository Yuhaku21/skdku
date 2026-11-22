const STORAGE = {
  currentUser: "ruangskd.currentUser",
  currentName: "ruangskd.currentName",
  currentValidity: "ruangskd.currentValidity",
  profilePhotoId: "ruangskd.profilePhotoId",
  starterWelcomeDismissed: "ruangskd.starterWelcomeDismissed",
  completedTests: "ruangskd.completedTests",
  history: "ruangskd.history",
  questionRotation: "ruangskd.questionRotation",
  tiuLearningProgress: "ruangskd.tiuLearningProgress.v2",
  learningProgress: "ruangskd.learningProgress.v1",
  learningHistory: "ruangskd.learningHistory.v1",
  activityTotals: "ruangskd.activityTotals.v1"
};
const DIFFICULTIES = {
  mudah: { questionCount: 10, durationSeconds: 10 * 60 },
  menengah: { questionCount: 30, durationSeconds: 30 * 60 },
  sulit: { questionCount: 50, durationSeconds: 50 * 60 }
};
const CAT_CONFIG = {
  durationSeconds: 100 * 60,
  questionCounts: { TWK: 30, TIU: 35, TKP: 45 },
  passingScores: { TWK: 65, TIU: 80, TKP: 156 }
};
const CAT_TESTS = ["TWK", "TIU", "TKP"];
const CAT_TOTAL_QUESTION_COUNT = Object.values(CAT_CONFIG.questionCounts)
  .reduce((total, count) => total + count, 0);
const CAT_SCORE_MAXIMUMS = { TWK: 150, TIU: 175, TKP: 225 };
const CAT_TOTAL_SCORE = Object.values(CAT_SCORE_MAXIMUMS)
  .reduce((total, score) => total + score, 0);
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const TIU_LEVEL_GROUPS = [
  {
    title: "Numerik · Level 1–3",
    levels: [
      { id: 1, title: "Level 1", topic: "Operasi hitung dasar" },
      { id: 2, title: "Level 2", topic: "Pecahan dan persentase" },
      { id: 3, title: "Level 3", topic: "Rasio dan penerapan numerik" }
    ]
  },
  {
    title: "Deret · Level 4–6",
    levels: [
      { id: 4, title: "Level 4", topic: "Deret aritmatika" },
      { id: 5, title: "Level 5", topic: "Deret geometri" },
      { id: 6, title: "Level 6", topic: "Fibonacci, kuadrat, dan pola" }
    ]
  },
  {
    title: "Analogi & Verbal · Level 7–9",
    levels: [
      { id: 7, title: "Level 7", topic: "Analogi" },
      { id: 8, title: "Level 8", topic: "Kosakata verbal" },
      { id: 9, title: "Level 9", topic: "Penalaran verbal" }
    ]
  },
  {
    title: "Penalaran Logis & Analitis · Level 10–12",
    levels: [
      { id: 10, title: "Level 10", topic: "Silogisme" },
      { id: 11, title: "Level 11", topic: "Logika bersyarat" },
      { id: 12, title: "Level 12", topic: "Urutan dan posisi" }
    ]
  }
];
const TKP_LEVELS = [
  { id: 1, title: "Level 1", topic: "Pelayanan publik", sections: [{ category: "PELAYANAN PUBLIK" }, { category: "ORIENTASI PELAYANAN" }], material: ["Dengarkan kebutuhan pengguna layanan dengan empati, lalu pastikan informasi yang diberikan akurat dan mudah dipahami.", "Utamakan akses layanan yang adil, tanggap, dan sesuai prosedur. Jelaskan tindak lanjut jika masalah belum dapat diselesaikan saat itu."] },
  { id: 2, title: "Level 2", topic: "Integritas", sections: [{ category: "INTEGRITAS" }], material: ["Jaga kejujuran, konsistensi, dan tanggung jawab dalam setiap keputusan kerja.", "Tolak manipulasi data, gratifikasi, dan penyalahgunaan wewenang. Laporkan masalah melalui jalur yang tepat dan berbasis fakta."] },
  { id: 3, title: "Level 3", topic: "Kerja sama", sections: [{ category: "KERJA SAMA" }], material: ["Bangun tujuan bersama dengan berbagi informasi, menghargai kontribusi, dan menyelesaikan perbedaan secara profesional.", "Ambil peran yang dibutuhkan tim serta berikan dukungan tanpa mengabaikan tanggung jawab pribadi."] },
  { id: 4, title: "Level 4", topic: "Profesionalisme", sections: [{ category: "PROFESIONALISME" }], material: ["Pahami aturan dan standar kerja, lalu gunakan kompetensi secara objektif dan konsisten.", "Kelola tugas dengan cermat, jaga kerahasiaan, dan kembangkan kemampuan untuk memperbaiki kualitas hasil."] },
  { id: 5, title: "Level 5", topic: "Sosial budaya", sections: [{ category: "SOSIAL BUDAYA" }], material: ["Hormati perbedaan latar belakang, budaya, dan cara berkomunikasi.", "Ciptakan lingkungan inklusif dengan bersikap terbuka, tidak diskriminatif, dan menjaga hubungan yang harmonis."] },
  { id: 6, title: "Level 6", topic: "Orientasi hasil & tanggung jawab", sections: [{ category: "ORIENTASI HASIL" }, { category: "TANGGUNG JAWAB" }], material: ["Tetapkan prioritas dan target yang terukur, lalu pantau kemajuan pekerjaan.", "Akui tanggung jawab atas hasil dan tindak lanjuti hambatan dengan solusi yang realistis."] },
  { id: 7, title: "Level 7", topic: "Komunikasi, adaptasi & pengendalian diri", sections: [{ category: "KOMUNIKASI" }, { category: "ADAPTASI" }, { category: "PENGENDALIAN DIRI" }], material: ["Sampaikan gagasan dengan jelas dan dengarkan masukan untuk memastikan pemahaman bersama.", "Hadapi perubahan dengan fleksibel dan kendalikan respons emosi, terutama saat berada di bawah tekanan."] },
  { id: 8, title: "Level 8", topic: "Teknologi & keamanan informasi", sections: [{ category: "TEKNOLOGI INFORMASI" }, { category: "KEAMANAN INFORMASI" }], material: ["Gunakan teknologi untuk bekerja lebih efektif sambil mengikuti kebijakan organisasi.", "Lindungi data dan kredensial, verifikasi sumber informasi, dan laporkan potensi insiden keamanan."] }
];
const TWK_LEVELS = [
  { id: 1, title: "Level 1", topic: "Pancasila", sections: [{ category: "PANCASILA" }], material: ["Pahami Pancasila sebagai dasar negara dan pandangan hidup bangsa.", "Pelajari makna setiap sila dan penerapannya dalam kehidupan bermasyarakat, berbangsa, dan bernegara."] },
  { id: 2, title: "Level 2", topic: "UUD 1945 · Bagian 1", sections: [{ category: "UUD 1945", start: 0, count: 10 }], material: ["Kenali kedudukan UUD Negara Republik Indonesia Tahun 1945 sebagai hukum dasar tertulis.", "Pelajari prinsip kedaulatan rakyat, bentuk negara, dan ketentuan dasar dalam konstitusi."] },
  { id: 3, title: "Level 3", topic: "UUD 1945 · Bagian 2", sections: [{ category: "UUD 1945", start: 10, count: 10 }], material: ["Pahami pembagian kekuasaan dan hubungan antarlembaga negara menurut konstitusi.", "Gunakan bunyi pasal dan konteksnya untuk menilai pernyataan tentang ketatanegaraan."] },
  { id: 4, title: "Level 4", topic: "UUD 1945 · Bagian 3", sections: [{ category: "UUD 1945", start: 20, count: 10 }], material: ["Pelajari hak, kewajiban, dan jaminan konstitusional warga negara.", "Bedakan ketentuan yang mengatur kewenangan lembaga dengan hak warga negara."] },
  { id: 5, title: "Level 5", topic: "Bentuk negara & kebinekaan", sections: [{ category: "BENTUK NEGARA" }, { category: "BHINNEKA TUNGGAL IKA" }, { category: "LEMBAGA NEGARA" }, { category: "HAK DAN KEWAJIBAN" }], material: ["Pahami bentuk Negara Kesatuan Republik Indonesia dan makna Bhinneka Tunggal Ika.", "Kenali fungsi lembaga negara serta keseimbangan hak dan kewajiban warga."] },
  { id: 6, title: "Level 6", topic: "Nasionalisme & wawasan kebangsaan", sections: [{ category: "NASIONALISME" }, { category: "WAWASAN KEBANGSAAN" }], material: ["Nasionalisme diwujudkan melalui kepentingan bersama, persatuan, dan kontribusi positif bagi bangsa.", "Wawasan kebangsaan memandang keberagaman sebagai kekuatan dalam kerangka persatuan Indonesia."] },
  { id: 7, title: "Level 7", topic: "Sejarah Indonesia", sections: [{ category: "SEJARAH KEMERDEKAAN" }, { category: "SEJARAH INDONESIA", start: 0, count: 8 }], material: ["Susun peristiwa sejarah dalam urutan waktu dan pahami hubungan sebab-akibatnya.", "Pelajari perjuangan kemerdekaan serta peran tokoh dan peristiwa penting dalam sejarah Indonesia."] },
  { id: 8, title: "Level 8", topic: "Sejarah & bela negara", sections: [{ category: "SEJARAH INDONESIA", start: 8, count: 3 }, { category: "BELA NEGARA" }], material: ["Tinjau kembali peristiwa sejarah dan nilai persatuan yang terkandung di dalamnya.", "Bela negara dapat diwujudkan melalui sikap taat aturan, menjaga persatuan, dan berkontribusi sesuai peran."] }
];
const PRACTICE_SUBJECTS = {
  TIU: {
    name: "Tes Intelegensia Umum",
    description: "Numerik, deret, analogi, verbal, dan penalaran logis.",
    levels: TIU_LEVEL_GROUPS.flatMap((group) => group.levels),
    groups: TIU_LEVEL_GROUPS
  },
  TKP: {
    name: "Tes Karakteristik Pribadi",
    description: "Pelayanan, integritas, kerja sama, dan karakter kerja.",
    levels: TKP_LEVELS,
    groups: [{ title: "Pengembangan karakter kerja · 8 level", levels: TKP_LEVELS }]
  },
  TWK: {
    name: "Tes Wawasan Kebangsaan",
    description: "Pancasila, konstitusi, kebangsaan, dan sejarah Indonesia.",
    levels: TWK_LEVELS,
    groups: [{ title: "Wawasan kebangsaan · 8 level", levels: TWK_LEVELS }]
  }
};
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
      { included: false, text: "Simulasi CAT dan leaderboard" },
      { included: false, text: "E-book gratis" },
      { included: false, text: "Analisis belajar lanjutan" }
    ]
  },
  tempur: {
    name: "Tempur",
    price: 30000,
    benefits: [
      { included: true, text: "Akses selama 7 hari" },
      { included: true, text: "15 soal per sesi" },
      { included: false, text: "Pilih tingkat kesulitan" },
      { included: true, text: "Ikut leaderboard lewat simulasi CAT" },
      { included: true, text: "E-book gratis" },
      { included: false, text: "Analisis belajar lanjutan" }
    ]
  },
  victory: {
    name: "Victory",
    price: 50000,
    benefits: [
      { included: true, text: "Akses selamanya" },
      { included: true, text: "Pilih jumlah soal dan tingkat kesulitan" },
      { included: true, text: "Ikut leaderboard lewat simulasi CAT" },
      { included: true, text: "E-book gratis" },
      { included: true, text: "Fitur materi belajar" },
      { included: true, text: "Analisis belajar lanjutan" }
    ]
  }
};
const screens = ["landing-view", "auth-view", "starter-auth-view", "dashboard-view", "practice-view", "analysis-view", "profile-view", "reviews-view", "quiz-view", "result-view", "tiu-learning-view"];

let selectedTest = "TIU";
let selectedDifficulty = null;
let sessionQuestions = [];
let answers = [];
let currentQuestion = 0;
let isCatSimulation = false;
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
const practiceDataCache = {};
let selectedPracticeSubject = null;
let activeLearningLevel = null;
let activeLearningQuestions = [];
let activeLearningAnswers = [];
let activeLearningQuestion = 0;
let learningStage = "lesson";

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

function packageWhatsAppUrl(selectedPackage) {
  const message = selectedPackage.price === 0
    ? `hai saya ingin mengaktifkan paket ${selectedPackage.name} gratis`
    : `hai saya ingin memesan harga paketan ${selectedPackage.name}`;
  return `https://wa.me/6283192124659?text=${encodeURIComponent(message)}`;
}

function showPackageDetails(packageKey) {
  const selectedPackage = PACKAGES[packageKey];
  if (!selectedPackage) return;
  if (packageKey === "starter") {
    showStarterAuth("register");
    return;
  }

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
  const whatsappButton = $("package-whatsapp-button");
  whatsappButton.href = packageWhatsAppUrl(selectedPackage);
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

function createUpgradePackageCard(packageKey) {
  const sourceButton = document.querySelector(`[data-package="${packageKey}"]`);
  const sourceCard = sourceButton && sourceButton.closest(".pricing-card");
  if (!sourceCard) throw new Error(`Rincian paket ${packageKey} tidak ditemukan.`);

  const card = sourceCard.cloneNode(true);
  const originalButton = card.querySelector(".pricing-button");
  if (!originalButton) throw new Error(`Tombol paket ${packageKey} tidak ditemukan.`);

  const whatsappLink = document.createElement("a");
  whatsappLink.className = originalButton.className;
  whatsappLink.href = packageWhatsAppUrl(PACKAGES[packageKey]);
  whatsappLink.target = "_blank";
  whatsappLink.rel = "noopener noreferrer";
  whatsappLink.setAttribute("aria-label", `Bayar paket ${PACKAGES[packageKey].name} via WhatsApp`);
  whatsappLink.textContent = "Bayar via WhatsApp →";
  originalButton.replaceWith(whatsappLink);
  return card;
}

function showUpgradeOptions() {
  $("upgrade-package-options").replaceChildren(
    createUpgradePackageCard("tempur"),
    createUpgradePackageCard("victory")
  );
  $("upgrade-dialog").showModal();
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
  const navScreens = ["dashboard-view", "practice-view", "analysis-view", "profile-view"];
  const showUserNavigation = Boolean(currentUser()) && navScreens.includes(screenId);
  $("user-bottom-nav").classList.toggle("hidden", !showUserNavigation);
  document.body.classList.toggle("has-user-bottom-nav", showUserNavigation);
  $("user-bottom-nav").querySelectorAll("[data-nav-screen]").forEach((button) => {
    if (button.dataset.navScreen === screenId) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
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

function getCompletedTestTypes(email = currentUser()) {
  const stored = readStored(STORAGE.completedTests, {});
  const completed = new Set(
    stored && typeof stored === "object" && !Array.isArray(stored) && Array.isArray(stored[email])
      ? stored[email].filter((test) => Object.prototype.hasOwnProperty.call(TEST_BANKS, test))
      : []
  );
  const history = readStored(STORAGE.history, []);
  if (Array.isArray(history)) {
    history.forEach((item) => {
      if (item && item.email === email && Object.prototype.hasOwnProperty.call(TEST_BANKS, item.test)) {
        completed.add(item.test);
      }
    });
  }
  return completed;
}

function recordCompletedTest(test) {
  const email = currentUser();
  if (!email || !Object.prototype.hasOwnProperty.call(TEST_BANKS, test)) return;
  const stored = readStored(STORAGE.completedTests, {});
  const completedByUser = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  const completed = getCompletedTestTypes(email);
  completed.add(test);
  completedByUser[email] = [...completed];
  writeStored(STORAGE.completedTests, completedByUser);
}

function hasCompletedAllTestTypes() {
  const completed = getCompletedTestTypes();
  return Object.keys(TEST_BANKS).every((test) => completed.has(test));
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
  const answerKeysUnlocked = currentValidity() !== "1-day" || hasCompletedAllTestTypes();
  const reviewAccessText = answerKeysUnlocked
    ? "Kunci jawaban dan pembahasan tersedia setelah sesi."
    : "Selesaikan satu tryout TIU, TKP, dan TWK untuk membuka kunci jawaban dan pembahasan.";
  $("bank-description").textContent = `${config.questionCount} soal dipilih acak dari bank soal ${selectedTest}. ${reviewAccessText}`;
  $("start-button").disabled = false;
}

function configureAccountAccess() {
  const lifetimeAccess = currentValidity() === "forever";
  const catAccess = ["7-days", "forever"].includes(currentValidity());
  $("cat-simulation-start").classList.toggle("hidden", !catAccess);
  $("cat-simulation-locked").classList.toggle("hidden", catAccess);
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
  ["profile-avatar", "profile-page-avatar"].forEach((avatarId) => {
    const avatar = $(avatarId);
    if (!avatar) return;
    const image = avatar.querySelector(".avatar-image");
    const initial = avatar.querySelector(".avatar-initial");
    initial.textContent = Array.from(currentUserName().trim())[0] || "U";
    initial.hidden = false;
    initial.classList.remove("hidden");
    image.hidden = true;
    image.classList.add("hidden");
    if (!profilePhotoId) return;
    image.src = `${profilePhotoUrl(profilePhotoId)}&v=${Date.now()}`;
    activateAvatarImages(avatar);
  });
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
  $("profile-menu-name").textContent = email ? currentUserName() : "";
  $("profile-menu-email").textContent = email || "";
  $("profile-menu").classList.toggle("hidden", !email);
  $("profile-edit-name").value = email ? currentUserName() : "";
  $("profile-account-email").value = email || "";
  if (!email) closeProfileMenu();
}

function closeProfileMenu() {
  $("profile-menu-panel").hidden = true;
  $("profile-menu-toggle").setAttribute("aria-expanded", "false");
}

function toggleProfileMenu() {
  const panel = $("profile-menu-panel");
  const isOpen = !panel.hidden;
  panel.hidden = isOpen;
  $("profile-menu-toggle").setAttribute("aria-expanded", String(!isOpen));
}

async function logoutUser() {
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
  renderHomeSummary();
  renderHomeLeaderboardRank();
  renderHistory();
  renderCatHistory();
  renderScoreProgress();
  showScreen("dashboard-view");
}

function getLearningProgress(subject, email = currentUser()) {
  const stored = readStored(STORAGE.learningProgress, {});
  const userProgress = stored && typeof stored === "object" && !Array.isArray(stored)
    ? stored[email]
    : null;
  const subjectProgress = userProgress && typeof userProgress === "object" && !Array.isArray(userProgress)
    ? userProgress[subject]
    : null;
  if (subjectProgress && typeof subjectProgress === "object" && !Array.isArray(subjectProgress)) return subjectProgress;
  if (subject === "TIU") {
    const oldProgress = readStored(STORAGE.tiuLearningProgress, {});
    const oldUserProgress = oldProgress && typeof oldProgress === "object" && !Array.isArray(oldProgress)
      ? oldProgress[email]
      : null;
    if (oldUserProgress && typeof oldUserProgress === "object" && !Array.isArray(oldUserProgress)) return oldUserProgress;
  }
  return {};
}

function canAccessLearningLevel(subject, levelId, progress = getLearningProgress(subject)) {
  const course = PRACTICE_SUBJECTS[subject];
  if (!course || !Number.isInteger(levelId) || levelId < 1 || levelId > course.levels.length) return false;
  for (let previousLevel = 1; previousLevel < levelId; previousLevel += 1) {
    if (!progress[previousLevel]) return false;
  }
  return true;
}

function renderHomeSummary() {
  const totals = getStudyTotals();
  $("home-tryout-count").textContent = String(totals.tryoutQuestions);
  $("home-practice-count").textContent = String(totals.practiceQuestions);
}

function getStudyTotals(email = currentUser()) {
  const totals = { tryoutQuestions: 0, practiceQuestions: 0, bySubject: {} };
  Object.keys(PRACTICE_SUBJECTS).forEach((subject) => {
    totals.bySubject[subject] = { practice: 0, tryout: 0 };
  });
  const tryouts = readStored(STORAGE.history, []);
  if (Array.isArray(tryouts)) {
    tryouts.forEach((item) => {
      if (!item || item.email !== email || !Object.prototype.hasOwnProperty.call(totals.bySubject, item.test)) return;
      const count = Number.isSafeInteger(item.answeredCount) && item.answeredCount >= 0
        ? item.answeredCount
        : Number.isSafeInteger(item.questionCount) && item.questionCount >= 0 ? item.questionCount : 0;
      totals.tryoutQuestions += count;
      totals.bySubject[item.test].tryout += count;
    });
  }
  const practice = readStored(STORAGE.learningHistory, []);
  if (Array.isArray(practice)) {
    practice.forEach((item) => {
      if (!item || item.email !== email || !Object.prototype.hasOwnProperty.call(totals.bySubject, item.subject)) return;
      const count = Number.isSafeInteger(item.answeredCount) && item.answeredCount >= 0 ? item.answeredCount : 0;
      totals.practiceQuestions += count;
      totals.bySubject[item.subject].practice += count;
    });
  }
  const savedTotals = readStored(STORAGE.activityTotals, {});
  const userTotals = savedTotals && typeof savedTotals === "object" && !Array.isArray(savedTotals)
    ? savedTotals[email]
    : null;
  Object.keys(totals.bySubject).forEach((subject) => {
    ["practice", "tryout"].forEach((activity) => {
      const savedCount = userTotals && userTotals[subject] && userTotals[subject][activity];
      if (Number.isSafeInteger(savedCount) && savedCount >= 0) {
        totals.bySubject[subject][activity] = Math.max(totals.bySubject[subject][activity], savedCount);
      }
    });
  });
  totals.practiceQuestions = Object.values(totals.bySubject).reduce((sum, item) => sum + item.practice, 0);
  totals.tryoutQuestions = Object.values(totals.bySubject).reduce((sum, item) => sum + item.tryout, 0);
  return totals;
}

function recordActivityQuestions(activity, subject, answeredCount, email = currentUser()) {
  const totals = getStudyTotals(email);
  const saved = readStored(STORAGE.activityTotals, {});
  const allTotals = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  const userTotals = Object.fromEntries(Object.entries(totals.bySubject).map(([name, counts]) => [name, { ...counts }]));
  userTotals[subject][activity] += answeredCount;
  allTotals[email] = userTotals;
  writeStored(STORAGE.activityTotals, allTotals);
}

function renderAnalysis() {
  const hasAnalysisAccess = currentValidity() === "forever";
  $("analysis-locked").classList.toggle("hidden", hasAnalysisAccess);
  $("analysis-content").classList.toggle("hidden", !hasAnalysisAccess);
  if (!hasAnalysisAccess) return;

  const totals = getStudyTotals();
  $("analysis-practice-total").textContent = String(totals.practiceQuestions);
  $("analysis-tryout-total").textContent = String(totals.tryoutQuestions);
  const maxCount = Math.max(1, ...Object.values(totals.bySubject).flatMap((counts) => [counts.practice, counts.tryout]));
  $("analysis-chart").innerHTML = Object.entries(totals.bySubject).map(([subject, counts]) => `
    <article class="analysis-subject">
      <h3>${subject}</h3>
      <div class="analysis-bar-row"><span>Latihan</span><div class="analysis-bar-track"><span class="analysis-bar practice-bar" style="width:${Math.round((counts.practice / maxCount) * 100)}%"></span></div><strong>${counts.practice}</strong></div>
      <div class="analysis-bar-row"><span>Tryout</span><div class="analysis-bar-track"><span class="analysis-bar tryout-bar" style="width:${Math.round((counts.tryout / maxCount) * 100)}%"></span></div><strong>${counts.tryout}</strong></div>
    </article>
  `).join("");
  const tryouts = readStored(STORAGE.history, []);
  const practice = readStored(STORAGE.learningHistory, []);
  renderCategoryAnalysis(tryouts, practice);
  const recentItems = [
    ...(Array.isArray(tryouts) ? tryouts.filter((item) => item.email === currentUser()).map((item) => ({ ...item, activity: "Tryout", subject: item.test })) : []),
    ...(Array.isArray(practice) ? practice.filter((item) => item.email === currentUser()).map((item) => ({ ...item, activity: "Latihan", subject: item.subject })) : [])
  ].sort((first, second) => Date.parse(second.completedAt || "") - Date.parse(first.completedAt || "")).slice(0, 8);
  $("analysis-history").innerHTML = recentItems.length
    ? recentItems.map((item) => {
      const completedAt = Date.parse(item.completedAt || "");
      const date = item.date || (Number.isFinite(completedAt)
        ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(completedAt))
        : "Tanggal tidak tersedia");
      const scoreLabel = Number.isFinite(item.score)
        ? item.subject === "CAT" ? `${item.score}/${getCatScoreMaximum(item.questionCount)}` : `${item.score}%`
        : "—";
      return `<div class="history-item"><span>${escapeHtml(item.activity)} · ${escapeHtml(item.subject)}${item.level ? ` · ${escapeHtml(item.level)}` : ""} · ${escapeHtml(date)}</span><strong>${scoreLabel}</strong></div>`;
    }).join("")
    : '<p class="empty-state">Selesaikan latihan atau tryout untuk mulai melihat progresmu.</p>';
}

function renderCategoryAnalysis(tryouts, practice) {
  const subjectStats = Object.fromEntries(
    Object.keys(PRACTICE_SUBJECTS).map((subject) => [subject, { topics: {}, answeredCount: 0, correctCount: 0 }])
  );
  const sessions = [
    ...(Array.isArray(tryouts) ? tryouts : []),
    ...(Array.isArray(practice) ? practice : [])
  ].filter((item) => item && item.email === currentUser())
    .sort((first, second) => {
      const firstDate = Date.parse(first.completedAt || "");
      const secondDate = Date.parse(second.completedAt || "");
      return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0);
    });

  sessions.forEach((session) => {
    const categoryStats = session.categoryStats;
    if (!categoryStats || typeof categoryStats !== "object" || Array.isArray(categoryStats)) return;
    Object.entries(categoryStats).forEach(([subject, topics]) => {
      if (!Object.prototype.hasOwnProperty.call(subjectStats, subject)
        || !topics || typeof topics !== "object" || Array.isArray(topics)) return;
      Object.entries(topics).forEach(([category, result]) => {
        if (typeof category !== "string" || !category.trim()
          || !result || typeof result !== "object" || Array.isArray(result)) return;
        const { questionCount, answeredCount, correctCount } = result;
        if (!Number.isSafeInteger(questionCount) || questionCount < 1
          || !Number.isSafeInteger(answeredCount) || answeredCount < 1 || answeredCount > questionCount
          || !Number.isSafeInteger(correctCount) || correctCount < 0 || correctCount > answeredCount) return;

        const subjectData = subjectStats[subject];
        const topic = subjectData.topics[category] || {
          answeredCount: 0,
          correctCount: 0,
          latestAccuracy: null,
          previousAccuracy: null
        };
        const sessionAccuracy = correctCount / answeredCount;
        if (topic.latestAccuracy === null) topic.latestAccuracy = sessionAccuracy;
        else if (topic.previousAccuracy === null) topic.previousAccuracy = sessionAccuracy;
        topic.answeredCount += answeredCount;
        topic.correctCount += correctCount;
        subjectData.answeredCount += answeredCount;
        subjectData.correctCount += correctCount;
        subjectData.topics[category] = topic;
      });
    });
  });

  const topics = Object.entries(subjectStats).flatMap(([subject, data]) =>
    Object.entries(data.topics).map(([category, result]) => ({
      subject,
      category,
      ...result,
      accuracy: result.answeredCount ? result.correctCount / result.answeredCount : 0
    }))
  );
  if (!topics.length) {
    $("analysis-category-insights").innerHTML =
      '<p class="empty-state">Rincian kategori akan muncul setelah kamu menyelesaikan tryout atau latihan berikutnya.</p>';
    return;
  }

  const recommendedTopics = topics.filter((topic) => topic.answeredCount >= 3);
  const weakest = [...(recommendedTopics.length ? recommendedTopics : topics)]
    .sort((first, second) => first.accuracy - second.accuracy || second.answeredCount - first.answeredCount)[0];
  const subjectCards = Object.entries(subjectStats).map(([subject, data]) => {
    const subjectTopics = Object.entries(data.topics)
      .map(([category, result]) => ({
        category,
        ...result,
        accuracy: result.answeredCount ? result.correctCount / result.answeredCount : 0
      }))
      .sort((first, second) => first.accuracy - second.accuracy || second.answeredCount - first.answeredCount);
    if (!subjectTopics.length) return "";
    const overallAccuracy = Math.round((data.correctCount / data.answeredCount) * 100);
    return `
      <section class="analysis-topic-subject" aria-label="Analisis topik ${subject}">
        <header><strong>${subject}</strong><span>Akurasi keseluruhan ${overallAccuracy}%</span></header>
        <div class="analysis-topic-list">${subjectTopics.map((topic) => {
          const accuracy = Math.round(topic.accuracy * 100);
          const trend = topic.previousAccuracy === null
            ? "Satu sesi tercatat"
            : `${topic.latestAccuracy > topic.previousAccuracy ? "Naik" : topic.latestAccuracy < topic.previousAccuracy ? "Turun" : "Tetap"} ${Math.abs(Math.round((topic.latestAccuracy - topic.previousAccuracy) * 100))} poin persentase`;
          const answerLabel = subject === "TKP" ? "jawaban bernilai penuh" : "jawaban benar";
          return `
            <article class="analysis-topic-item">
              <div class="analysis-topic-heading"><strong>${escapeHtml(topic.category)}</strong><strong>${accuracy}%</strong></div>
              <div class="analysis-topic-track" role="img" aria-label="Akurasi ${accuracy} persen"><span style="width:${accuracy}%"></span></div>
              <small>${topic.correctCount}/${topic.answeredCount} ${answerLabel} · ${escapeHtml(trend)}</small>
            </article>
          `;
        }).join("")}</div>
      </section>
    `;
  }).join("");

  const recommendationAccuracy = Math.round(weakest.accuracy * 100);
  $("analysis-category-insights").innerHTML = `
    <aside class="analysis-recommendation">
      <div><span class="section-kicker">REKOMENDASI LATIHAN</span><strong>${weakest.subject} · ${escapeHtml(weakest.category)}</strong><p>Akurasi ${recommendationAccuracy}% dari ${weakest.answeredCount} jawaban. Ulangi materi terkait untuk memperkuat topik ini.</p></div>
      <button class="button button-outline" type="button" data-analysis-practice="${weakest.subject}">Buka latihan ${weakest.subject} <span aria-hidden="true">→</span></button>
    </aside>
    <div class="analysis-topic-grid">${subjectCards}</div>
  `;
}

function getCatScoreMaximum(questionCount) {
  return questionCount === CAT_TOTAL_QUESTION_COUNT ? CAT_TOTAL_SCORE : 500;
}

function renderHomeLeaderboardRank() {
  const position = $("home-rank-position");
  const participants = $("home-rank-participants");
  const message = $("home-rank-message");
  const action = $("home-rank-action");
  const hasLeaderboardAccess = ["7-days", "forever"].includes(currentValidity());
  if (!hasLeaderboardAccess) {
    position.textContent = "Terkunci";
    participants.textContent = "Fitur paket Tempur dan Victory";
    message.textContent = "Selesaikan simulasi CAT untuk masuk leaderboard.";
    action.innerHTML = 'Lihat paket <span aria-hidden="true">→</span>';
    return;
  }
  action.innerHTML = 'Simulasi CAT <span aria-hidden="true">→</span>';
  loadHomeLeaderboardRank(position, participants, message);
}

async function loadHomeLeaderboardRank(position, participants, message) {
  position.textContent = "Memuat...";
  participants.textContent = "Memuat jumlah peserta...";
  message.textContent = "Selesaikan simulasi CAT untuk masuk leaderboard.";
  try {
    const response = await fetch("/api/leaderboard", { cache: "no-store" });
    const result = await readApiJson(response);
    const rank = result && result.leaderboard && result.leaderboard.rank;
    const participantCount = result && result.leaderboard && result.leaderboard.participantCount;
    if (!response.ok) throw new Error((result && result.error) || `Peringkat gagal dimuat (${response.status}).`);
    if (!Number.isSafeInteger(participantCount) || participantCount < 0
      || (rank !== null && (!Number.isSafeInteger(rank) || rank < 1 || rank > participantCount))) {
      throw new Error("Data peringkat leaderboard dari server tidak valid.");
    }
    position.textContent = rank === null ? "Belum masuk" : `#${rank}`;
    participants.textContent = `dari ${participantCount} peserta`;
    message.textContent = rank === 1
      ? "Kamu berada di peringkat 1. Ikuti simulasi CAT lagi untuk memperbarui skor!"
      : rank === null
        ? "Selesaikan simulasi CAT untuk mendapatkan peringkat."
        : "Ikuti simulasi CAT lagi untuk memperbarui skor dan mengejar peringkat 1.";
  } catch (error) {
    console.error("Tidak dapat memuat peringkat pengguna:", error);
    position.textContent = "—";
    participants.textContent = "Peringkat belum tersedia";
    message.textContent = error.message || "Data peringkat belum dapat dimuat. Coba lagi nanti.";
  }
}

function renderPracticeSubjects() {
  $("practice-subject-picker").innerHTML = Object.entries(PRACTICE_SUBJECTS).map(([subject, course]) => {
    const completed = Object.keys(getLearningProgress(subject)).length;
    return `
      <button class="practice-subject-card" type="button" data-practice-subject="${subject}">
        <span class="practice-subject-icon">${subject}</span>
        <span class="practice-subject-name">${escapeHtml(course.name)}</span>
        <span class="practice-subject-description">${escapeHtml(course.description)}</span>
        <span class="practice-subject-progress">${completed} dari ${course.levels.length} level selesai <span aria-hidden="true">→</span></span>
      </button>
    `;
  }).join("");
}

function showPractice() {
  if (!currentUser()) {
    showLogin();
    return;
  }
  selectedPracticeSubject = null;
  $("practice-level-view").classList.add("hidden");
  $("practice-subject-picker").classList.remove("hidden");
  renderPracticeSubjects();
  showScreen("practice-view");
}

function showAnalysis() {
  if (!currentUser()) {
    showLogin();
    return;
  }
  renderAnalysis();
  showScreen("analysis-view");
}

function showProfile() {
  if (!currentUser()) {
    showLogin();
    return;
  }
  $("profile-edit-name").value = currentUserName();
  $("profile-name-message").textContent = "";
  $("profile-name-message").classList.remove("success");
  $("profile-photo-message").textContent = "";
  $("profile-photo-message").classList.remove("success");
  renderProfilePhoto();
  syncHeader();
  showScreen("profile-view");
}

async function updateProfileName(event) {
  event.preventDefault();
  const name = $("profile-edit-name").value.trim();
  const message = $("profile-name-message");
  const button = $("profile-save-button");
  message.classList.remove("success");
  message.textContent = "";
  if (!name || name.length > 80) {
    message.textContent = "Nama wajib diisi dan maksimal 80 karakter.";
    return;
  }
  button.disabled = true;
  message.textContent = "Menyimpan perubahan...";
  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const result = await readApiJson(response);
    if (!response.ok || !result.user || result.user.name !== name) {
      throw new Error(result.error || "Nama profil gagal diperbarui.");
    }
    localStorage.setItem(STORAGE.currentName, result.user.name);
    syncHeader();
    renderProfilePhoto();
    $("welcome-title").textContent = `Siap latihan hari ini, ${currentUserName().split(" ")[0]}?`;
    message.textContent = "Nama profil berhasil diperbarui.";
    message.classList.add("success");
  } catch (error) {
    console.error("Tidak dapat memperbarui nama profil:", error);
    message.textContent = error.message || "Nama profil gagal diperbarui. Coba lagi.";
  } finally {
    button.disabled = false;
  }
}

async function loadPracticeData(subject) {
  if (practiceDataCache[subject]) return practiceDataCache[subject];
  const path = subject === "TIU" ? "./tiu-learning.json" : `./${TEST_BANKS[subject]}`;
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Materi ${subject} tidak dapat dimuat (${response.status}).`);
  const data = await response.json();
  if (subject === "TIU" ? !data || !Array.isArray(data.levels) : !Array.isArray(data)) {
    throw new Error(`Bank soal ${subject} tidak memiliki format yang valid.`);
  }
  practiceDataCache[subject] = data;
  return data;
}

function getPracticeQuestions(subject, level, data) {
  if (subject === "TIU") return level.questions;
  return level.sections.flatMap((section) => {
    const matching = data.filter((question) => question.category === section.category);
    const start = section.start || 0;
    return section.count === undefined ? matching.slice(start) : matching.slice(start, start + section.count);
  });
}

async function openPracticeSubject(subject) {
  if (!Object.prototype.hasOwnProperty.call(PRACTICE_SUBJECTS, subject)) return;
  selectedPracticeSubject = subject;
  try {
    const data = await loadPracticeData(subject);
    const course = PRACTICE_SUBJECTS[subject];
    $("practice-subject-picker").classList.add("hidden");
    $("practice-level-view").classList.remove("hidden");
    $("practice-subject-title").textContent = `Belajar ${subject}`;
    $("practice-subject-description").textContent = course.description;
    await renderPracticeLevels(subject, data);
  } catch (error) {
    console.error(`Tidak dapat memuat materi ${subject}:`, error);
    showToast(error.message || `Materi ${subject} gagal dimuat.`);
  }
}

async function renderPracticeLevels(subject, loadedData) {
  const course = PRACTICE_SUBJECTS[subject];
  const data = loadedData || await loadPracticeData(subject);
  const progress = getLearningProgress(subject);
  $("practice-levels").innerHTML = course.groups.map((group) => `
    <section class="victory-tiu-group" aria-label="${escapeHtml(group.title)}">
      <h3>${escapeHtml(group.title)}</h3>
      <div class="victory-tiu-group-list">${group.levels.map((levelInfo) => {
        const level = subject === "TIU" ? data.levels.find((item) => item.id === levelInfo.id) : levelInfo;
        if (!level) return "";
        const questions = getPracticeQuestions(subject, level, data);
        const completed = Boolean(progress[level.id]);
        const locked = !canAccessLearningLevel(subject, level.id, progress);
        const requiredLevel = locked
          ? Array.from({ length: level.id - 1 }, (_, index) => index + 1).find((id) => !progress[id])
          : null;
        const status = locked
          ? `Terkunci · selesaikan Level ${requiredLevel} terlebih dahulu · ${questions.length} soal`
          : completed ? `Selesai · ${progress[level.id].score}% · bisa diulang` : `Materi + ${questions.length} soal`;
        return `
          <article class="victory-tiu-level ${locked ? "locked" : ""}">
            <span class="victory-tiu-level-number">${String(level.id).padStart(2, "0")}</span>
            <div class="victory-tiu-level-copy"><strong>${escapeHtml(level.title)}</strong><span>${escapeHtml(level.topic)}</span><small>${status}</small></div>
            <button class="button ${locked ? "button-outline" : "button-primary"}" type="button" data-learning-level="${level.id}" ${locked ? "disabled" : ""}>${locked ? "Terkunci" : completed ? "Ulangi" : "Mulai"} <span aria-hidden="true">→</span></button>
          </article>
        `;
      }).join("")}</div>
    </section>
  `).join("");
}

function returnToPracticeLevels() {
  if (!currentUser()) {
    showLanding();
    return;
  }
  if (!selectedPracticeSubject) {
    showPractice();
    return;
  }
  $("practice-subject-picker").classList.add("hidden");
  $("practice-level-view").classList.remove("hidden");
  renderPracticeLevels(selectedPracticeSubject).catch((error) => {
    console.error("Tidak dapat memperbarui daftar level:", error);
    showToast(error.message || "Daftar level gagal dimuat.");
  });
  showScreen("practice-view");
}

async function openLearningLevel(subject, levelId) {
  const course = PRACTICE_SUBJECTS[subject];
  const progress = getLearningProgress(subject);
  if (!course || !canAccessLearningLevel(subject, levelId, progress)) {
    showToast("Selesaikan level sebelumnya untuk membuka materi ini.");
    return;
  }

  try {
    const data = await loadPracticeData(subject);
    const level = subject === "TIU"
      ? data.levels.find((item) => item.id === levelId)
      : course.levels.find((item) => item.id === levelId);
    const questions = level && getPracticeQuestions(subject, level, data);
    if (!level || !Array.isArray(questions) || !questions.length
      || (subject === "TIU" && questions.length !== 10)) {
      throw new Error(`Materi Level ${levelId} ${subject} tidak lengkap. Silakan coba lagi nanti.`);
    }
    activeLearningLevel = { ...level, questions, subject };
    activeLearningQuestions = questions;
    learningStage = "lesson";
    $("tiu-learning-heading").textContent = `KELAS ${subject} · ${course.name.toUpperCase()}`;
    renderLearning();
    showScreen("tiu-learning-view");
  } catch (error) {
    console.error(`Tidak dapat membuka materi ${subject}:`, error);
    showToast(error.message || `Materi ${subject} gagal dimuat.`);
  }
}

function renderLearning() {
  const content = $("tiu-learning-content");
  const questionCount = activeLearningQuestions.length;
  if (learningStage === "lesson") {
    content.innerHTML = `
      <article class="tiu-lesson-card">
        <span class="section-kicker">${escapeHtml(activeLearningLevel.subject)} · ${escapeHtml(activeLearningLevel.topic)}</span>
        <h1>${escapeHtml(activeLearningLevel.title)}</h1>
        <p class="muted">${escapeHtml(activeLearningLevel.description || `Pelajari materi ${activeLearningLevel.topic} sebelum mengerjakan latihan.`)}</p>
        <h2>Materi sebelum latihan</h2>
        <ol class="tiu-material-list">${activeLearningLevel.material.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        <div class="tiu-lesson-footer"><span>${questionCount} soal · Tanpa batas waktu</span><button class="button button-primary" type="button" data-tiu-action="start">Mulai latihan <span aria-hidden="true">→</span></button></div>
      </article>
    `;
    return;
  }
  if (learningStage === "quiz") {
    const question = activeLearningQuestions[activeLearningQuestion];
    content.innerHTML = `
      <div class="tiu-practice-heading"><div><span class="section-kicker">${escapeHtml(activeLearningLevel.subject)} · ${escapeHtml(activeLearningLevel.title)}</span><h1>Latihan ${escapeHtml(activeLearningLevel.title)}</h1></div><span class="pill">Tanpa batas waktu</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${((activeLearningQuestion + 1) / questionCount) * 100}%"></div></div>
      <article class="tiu-question-card">
        <div class="question-category">${escapeHtml(question.category)}</div>
        <span class="tiu-question-count">SOAL ${String(activeLearningQuestion + 1).padStart(2, "0")} / ${questionCount}</span>
        <h2>${escapeHtml(question.question)}</h2>
        <div class="answer-list">${question.options.map((option, index) => `
          <button class="answer-option ${activeLearningAnswers[activeLearningQuestion] === index ? "selected" : ""}" type="button" data-tiu-answer="${index}">
            <span class="answer-letter">${LETTERS[index] || index + 1}</span><span>${escapeHtml(option)}</span>
          </button>
        `).join("")}</div>
        <div class="tiu-question-navigation">
          <button class="button button-outline" type="button" data-tiu-action="previous" ${activeLearningQuestion === 0 ? "disabled" : ""}>← Sebelumnya</button>
          <span>${activeLearningAnswers.filter((answer) => answer !== null).length} / ${questionCount} terjawab</span>
          ${activeLearningQuestion === questionCount - 1
            ? '<button class="button button-primary" type="button" data-tiu-action="finish">Lihat hasil <span aria-hidden="true">✓</span></button>'
            : '<button class="button button-primary" type="button" data-tiu-action="next">Berikutnya <span aria-hidden="true">→</span></button>'}
        </div>
        <div class="tiu-question-grid">${activeLearningQuestions.map((_, index) => `
          <button class="question-number ${activeLearningAnswers[index] !== null ? "answered" : ""} ${index === activeLearningQuestion ? "current" : ""}" type="button" data-tiu-question="${index}" aria-label="Soal ${index + 1}">${String(index + 1).padStart(2, "0")}</button>
        `).join("")}</div>
      </article>
    `;
    return;
  }

  const correct = activeLearningAnswers.reduce((total, answer, index) => total + (answer === activeLearningQuestions[index].answer ? 1 : 0), 0);
  const score = Math.round((correct / questionCount) * 100);
  const nextLevel = activeLearningLevel.id < PRACTICE_SUBJECTS[activeLearningLevel.subject].levels.length ? activeLearningLevel.id + 1 : null;
  content.innerHTML = `
    <section class="tiu-result-hero">
      <span class="section-kicker">LEVEL SELESAI</span>
      <h1>${score === 100 ? "Sempurna, hebat!" : "Latihan selesai!"}</h1>
      <p class="muted">${escapeHtml(activeLearningLevel.subject)} · ${escapeHtml(activeLearningLevel.title)} · ${correct} dari ${questionCount} jawaban benar</p>
      <div class="tiu-result-score">${score}<small>/ 100</small></div>
      <p class="tiu-result-unlock">${nextLevel ? "Kunci jawaban dan pembahasan sudah tersedia. Level berikutnya sekarang terbuka." : "Kunci jawaban dan pembahasan sudah tersedia. Kamu telah menyelesaikan seluruh level materi ini."}</p>
      ${nextLevel
        ? `<button class="button button-primary" type="button" data-tiu-action="next-level">Lanjut ke Level ${nextLevel} <span aria-hidden="true">→</span></button>`
        : '<button class="button button-primary" type="button" data-tiu-action="dashboard">Kembali ke materi <span aria-hidden="true">→</span></button>'}
    </section>
    <section class="tiu-corrections">
      <div class="section-heading compact"><div><span class="section-kicker">KUNCI & PEMBAHASAN</span><h2>Koreksi jawabanmu</h2></div><span class="pill">${questionCount - correct} perlu dipelajari</span></div>
      <div class="review-list">${activeLearningQuestions.map((question, index) => {
        const isCorrect = activeLearningAnswers[index] === question.answer;
        const yourAnswer = activeLearningAnswers[index] === null ? "Belum dijawab" : `${LETTERS[activeLearningAnswers[index]] || activeLearningAnswers[index] + 1}. ${question.options[activeLearningAnswers[index]]}`;
        const keyAnswer = `${LETTERS[question.answer] || question.answer + 1}. ${question.options[question.answer]}`;
        return `
          <article class="review-card ${isCorrect ? "correct" : "incorrect"}">
            <div class="review-heading"><strong>SOAL ${String(index + 1).padStart(2, "0")} · ${escapeHtml(question.category)}</strong><span class="review-status">${isCorrect ? "✓ Benar" : "✕ Perlu dipelajari"}</span></div>
            <p class="review-question">${escapeHtml(question.question)}</p>
            <div class="review-answer"><span>Jawabanmu: <strong>${escapeHtml(yourAnswer)}</strong></span><span>Kunci jawaban: <strong>${escapeHtml(keyAnswer)}</strong></span></div>
            ${!isCorrect ? `<div class="review-explanation"><strong>Pembahasan:</strong> ${escapeHtml(question.explanation)}</div>` : ""}
          </article>
        `;
      }).join("")}</div>
    </section>
  `;
}

function startTiuLearningPractice() {
  activeLearningQuestions = [...activeLearningLevel.questions];
  activeLearningAnswers = Array(activeLearningQuestions.length).fill(null);
  activeLearningQuestion = 0;
  learningStage = "quiz";
  renderLearning();
}

function buildCategoryStats(questions, selectedAnswers, defaultSubject) {
  return questions.reduce((stats, question, index) => {
    const subject = question.test || defaultSubject;
    if (!Object.prototype.hasOwnProperty.call(PRACTICE_SUBJECTS, subject)
      || typeof question.category !== "string" || !question.category.trim()) return stats;
    const category = question.category.trim();
    const subjectStats = stats[subject] || (stats[subject] = {});
    const categoryStats = subjectStats[category] || (subjectStats[category] = {
      questionCount: 0,
      answeredCount: 0,
      correctCount: 0
    });
    const answer = selectedAnswers[index];
    categoryStats.questionCount += 1;
    if (answer !== null) {
      categoryStats.answeredCount += 1;
      if (answer === question.answer) categoryStats.correctCount += 1;
    }
    return stats;
  }, {});
}

function finishTiuLearningPractice() {
  const correct = activeLearningAnswers.reduce((total, answer, index) => total + (answer === activeLearningQuestions[index].answer ? 1 : 0), 0);
  const score = Math.round((correct / activeLearningQuestions.length) * 100);
  const completedAt = new Date().toISOString();
  const answeredCount = activeLearningAnswers.filter((answer) => answer !== null).length;
  recordActivityQuestions("practice", activeLearningLevel.subject, answeredCount);
  const users = readStored(STORAGE.learningProgress, {});
  const allProgress = users && typeof users === "object" && !Array.isArray(users) ? users : {};
  const userProgress = allProgress[currentUser()] && typeof allProgress[currentUser()] === "object"
    ? allProgress[currentUser()]
    : {};
  userProgress[activeLearningLevel.subject] = {
    ...getLearningProgress(activeLearningLevel.subject),
    [activeLearningLevel.id]: { score, completedAt }
  };
  allProgress[currentUser()] = userProgress;
  writeStored(STORAGE.learningProgress, allProgress);
  const history = readStored(STORAGE.learningHistory, []);
  const learningHistory = Array.isArray(history) ? history : [];
  learningHistory.unshift({
    email: currentUser(),
    subject: activeLearningLevel.subject,
    level: activeLearningLevel.title,
    score,
    correct,
    questionCount: activeLearningQuestions.length,
    answeredCount,
    categoryStats: buildCategoryStats(activeLearningQuestions, activeLearningAnswers, activeLearningLevel.subject),
    completedAt
  });
  writeStored(STORAGE.learningHistory, learningHistory.slice(0, 200));
  learningStage = "result";
  renderLearning();
  renderPracticeLevels(activeLearningLevel.subject).catch((error) => {
    console.error("Tidak dapat memperbarui progres level:", error);
  });
  renderHomeSummary();
}

function handleTiuLearningAction(event) {
  const answerButton = event.target.closest("[data-tiu-answer]");
  if (answerButton) {
    activeLearningAnswers[activeLearningQuestion] = Number(answerButton.dataset.tiuAnswer);
    renderLearning();
    return;
  }
  const questionButton = event.target.closest("[data-tiu-question]");
  if (questionButton) {
    activeLearningQuestion = Number(questionButton.dataset.tiuQuestion);
    renderLearning();
    return;
  }
  const actionButton = event.target.closest("[data-tiu-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.tiuAction;
  if (action === "start") startTiuLearningPractice();
  if (action === "previous" && activeLearningQuestion > 0) {
    activeLearningQuestion -= 1;
    renderLearning();
  }
  if (action === "next" && activeLearningQuestion < activeLearningQuestions.length - 1) {
    activeLearningQuestion += 1;
    renderLearning();
  }
  if (action === "finish") {
    const unanswered = activeLearningAnswers.filter((answer) => answer === null).length;
    if (unanswered && !window.confirm(`Masih ada ${unanswered} soal belum dijawab. Selesaikan latihan sekarang?`)) return;
    finishTiuLearningPractice();
  }
  if (action === "next-level") openLearningLevel(activeLearningLevel.subject, activeLearningLevel.id + 1);
  if (action === "dashboard") returnToPracticeLevels();
}

function showLanding() {
  if (currentUser()) {
    showDashboard();
    return;
  }
  syncHeader();
  showScreen("landing-view");
  maybeShowStarterWelcome();
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

function maybeShowStarterWelcome() {
  if (currentUser() || localStorage.getItem(STORAGE.starterWelcomeDismissed) === "true") return;
  const dialog = $("starter-welcome-dialog");
  if (!dialog.open) dialog.showModal();
}

function dismissStarterWelcome() {
  localStorage.setItem(STORAGE.starterWelcomeDismissed, "true");
  const dialog = $("starter-welcome-dialog");
  if (dialog.open) dialog.close();
}

function showPricingFromStarterWelcome() {
  dismissStarterWelcome();
  returnToPricing();
}

function showLoginFromStarterWelcome() {
  dismissStarterWelcome();
  showLogin();
}

function setStarterAuthMode(mode) {
  const isRegister = mode === "register";
  $("starter-register-form").classList.toggle("hidden", !isRegister);
  $("starter-login-form").classList.toggle("hidden", isRegister);
  $("starter-register-tab").classList.toggle("active", isRegister);
  $("starter-register-tab").setAttribute("aria-pressed", String(isRegister));
  $("starter-login-tab").classList.toggle("active", !isRegister);
  $("starter-login-tab").setAttribute("aria-pressed", String(!isRegister));
  $("starter-auth-title").textContent = isRegister ? "Buat akun Starter" : "Masuk ke Starter";
  $("starter-auth-description").textContent = isRegister
    ? "Akses latihan selama 1 hari dengan 10 soal per sesi."
    : "Masuk dengan akun Starter yang masih berlaku.";
  if (isRegister) $("starter-register-name").focus();
  else $("starter-login-email").focus();
}

function showStarterAuth(mode) {
  if (currentUser()) {
    showDashboard();
    return;
  }
  showScreen("starter-auth-view");
  setStarterAuthMode(mode);
}

function returnToPricing() {
  if (currentUser()) {
    showDashboard();
    return;
  }
  showLanding();
  $("pricing-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

function startUserSession(user) {
  localStorage.setItem(STORAGE.currentUser, user.email);
  localStorage.setItem(STORAGE.currentName, user.name);
  localStorage.setItem(STORAGE.currentValidity, user.validity);
  if (user.profilePhotoId) localStorage.setItem(STORAGE.profilePhotoId, user.profilePhotoId);
  else localStorage.removeItem(STORAGE.profilePhotoId);
  scheduleAccountExpiry(user.expiresAt);
  syncHeader();
  showDashboard();
}

async function handleStarterRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("starter-register-message");
  const name = $("starter-register-name").value.trim();
  const email = $("starter-register-email").value.trim().toLowerCase();
  const password = $("starter-register-password").value;
  const passwordConfirm = $("starter-register-password-confirm").value;
  message.classList.remove("success");
  message.textContent = "";
  if (password !== passwordConfirm) {
    message.textContent = "Kata sandi dan ulangannya belum sama.";
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "starter-register", name, email, password })
    });
    const result = await readApiJson(response);
    if (!response.ok || !result.user || result.user.role !== "user" || result.user.validity !== "1-day") {
      throw new Error(result.error || "Pendaftaran Starter tidak berhasil.");
    }
    form.reset();
    startUserSession(result.user);
  } catch (error) {
    message.textContent = error.message || "Pendaftaran tidak dapat diproses saat ini.";
  } finally {
    submitButton.disabled = false;
  }
}

async function handleStarterLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("starter-login-message");
  message.classList.remove("success");
  message.textContent = "";
  const email = $("starter-login-email").value.trim().toLowerCase();
  const password = $("starter-login-password").value;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "starter-login", email, password })
    });
    const result = await readApiJson(response);
    if (!response.ok || !result.user || result.user.role !== "user" || result.user.validity !== "1-day") {
      throw new Error(result.error || "Email atau kata sandi akun Starter tidak sesuai.");
    }
    form.reset();
    startUserSession(result.user);
  } catch (error) {
    message.textContent = error.message || "Login Starter tidak dapat diproses saat ini.";
  } finally {
    submitButton.disabled = false;
  }
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
  list.innerHTML = history.map((item) => {
    const resultSummary = item.test === "CAT"
      ? `${item.answeredCount || 0}/${item.questionCount || 100} terjawab`
      : `${item.correct}/${item.questionCount || 10} benar`;
    const scoreLabel = item.test === "CAT" ? `${item.score}/${getCatScoreMaximum(item.questionCount)}` : item.score;
    return `<div class="history-item"><span>${escapeHtml(item.test || "TIU")} · ${escapeHtml(item.date)} · ${resultSummary}</span><strong>${scoreLabel}</strong></div>`;
  }).join("");
}

function renderCatHistory() {
  const card = $("cat-history-card");
  const hasCatAccess = ["7-days", "forever"].includes(currentValidity());
  card.classList.toggle("hidden", !hasCatAccess);
  if (!hasCatAccess) return;

  const history = readStored(STORAGE.history, []);
  const catRuns = (Array.isArray(history) ? history : [])
    .filter((item) => item && item.email === currentUser() && item.test === "CAT"
      && Number.isSafeInteger(item.score) && item.score >= 0
      && item.score <= getCatScoreMaximum(item.questionCount))
    .map((item) => ({ ...item, maximum: getCatScoreMaximum(item.questionCount) }));
  if (!catRuns.length) {
    $("cat-history-summary").innerHTML = '<p class="empty-state">Belum ada simulasi CAT. Selesaikan simulasi untuk mulai melihat perkembangan skor.</p>';
    $("cat-history-chart").innerHTML = "";
    $("cat-history-breakdown").innerHTML = "";
    return;
  }

  const latest = catRuns[0];
  const comparableRuns = catRuns.filter((item) => item.maximum === latest.maximum);
  const previous = comparableRuns[1];
  const best = comparableRuns.reduce((highest, item) => item.score > highest.score ? item : highest, comparableRuns[0]);
  const delta = previous ? latest.score - previous.score : null;
  const formatScoreChange = (change) => change === null
    ? "Belum ada pembanding"
    : change > 0 ? `Naik ${change} poin` : change < 0 ? `Turun ${Math.abs(change)} poin` : "Tetap";
  const summaryItems = [
    { label: "Skor terbaru", value: `${latest.score}/${latest.maximum}`, note: latest.date || "Simulasi terakhir" },
    { label: "Skor terbaik", value: `${best.score}/${best.maximum}`, note: best.date || "Format yang sama" },
    { label: "Perubahan", value: formatScoreChange(delta), note: previous ? "Dibandingkan simulasi sebelumnya" : "Selesaikan simulasi berikutnya untuk membandingkan" }
  ];
  $("cat-history-summary").innerHTML = summaryItems.map((item) => `
    <article class="cat-history-stat"><span>${item.label}</span><strong>${item.value}</strong><small>${escapeHtml(item.note)}</small></article>
  `).join("");

  const chartRuns = comparableRuns.slice(0, 6).reverse();
  $("cat-history-chart").innerHTML = `
    <ol class="cat-history-chart-list">
      ${chartRuns.map((item) => {
        const date = item.date || "Tanggal tidak tersedia";
        const height = Math.max(2, Math.round((item.score / item.maximum) * 100));
        return `<li aria-label="${escapeHtml(date)}: ${item.score} dari ${item.maximum} poin"><strong>${item.score}</strong><div class="cat-history-bar-track"><span style="height:${height}%"></span></div><small>${escapeHtml(date)}</small></li>`;
      }).join("")}
    </ol>
    <p class="muted cat-history-note">Menampilkan hingga enam simulasi terakhir dengan skor maksimal yang sama.</p>
  `;

  const validScores = (item) => item && item.scores && CAT_TESTS.every((test) =>
    Number.isSafeInteger(item.scores[test]) && item.scores[test] >= 0 && item.scores[test] <= CAT_SCORE_MAXIMUMS[test]);
  if (!validScores(latest)) {
    $("cat-history-breakdown").innerHTML = '<p class="empty-state">Rincian subtes belum tersedia untuk simulasi ini.</p>';
    return;
  }
  $("cat-history-breakdown").innerHTML = `
    <div class="cat-history-breakdown-grid">
      ${CAT_TESTS.map((test) => {
        const subtestDelta = validScores(previous) ? latest.scores[test] - previous.scores[test] : null;
        return `
          <article class="cat-history-subtest">
            <span>${test}</span>
            <strong>${latest.scores[test]} <small>/ ${CAT_SCORE_MAXIMUMS[test]}</small></strong>
            <small>${escapeHtml(formatScoreChange(subtestDelta))}${previous ? " · dibanding simulasi sebelumnya" : ""}</small>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

async function renderScoreProgress() {
  const list = $("score-progress-list");
  const requestId = ++scoreProgressRequestId;
  const isStarter = currentValidity() === "1-day";
  const progressLocked = isStarter && !hasCompletedAllTestTypes();
  list.classList.toggle("hidden", progressLocked);
  $("score-progress-gate").classList.toggle("hidden", !progressLocked);
  $("score-progress-upgrade").classList.toggle("hidden", !isStarter);
  if (progressLocked) {
    $("certificate-status").textContent = "Sertifikat tersedia untuk akun Victory setelah seluruh target TIU, TKP, dan TWK tercapai.";
    $("certificate-status").classList.remove("success");
    $("print-certificate-button").disabled = true;
    return;
  }
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
  activateAvatarImages(track);
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
        <span class="leaderboard-player"><strong>${escapeHtml(maskReviewUsername(user.username))}</strong><small>TIU ${user.scores.TIU} · TKP ${user.scores.TKP} · TWK ${user.scores.TWK}</small></span>
        <strong class="leaderboard-score">${user.score}<small>/ ${CAT_TOTAL_SCORE}</small></strong>
      </li>
    `).join("");
    activateAvatarImages(list);
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
    message.textContent = `Progres ${test} berhasil disimpan. Peringkat dihitung dari simulasi CAT terbaru.`;
    message.classList.add("success");
    renderScoreProgress();
  } catch (error) {
    console.error("Tidak dapat menyimpan progres tryout:", error);
    message.classList.remove("success");
    message.textContent = error.message || "Progres tryout belum dapat disimpan.";
  }
}

async function saveCatLeaderboardScore(score, scores) {
  const message = $("leaderboard-submit-message");
  message.textContent = "Menyimpan skor simulasi CAT terbaru...";
  try {
    const response = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "CAT", score, scores })
    });
    const result = await readApiJson(response);
    if (!response.ok) throw new Error(result.error || `Skor CAT gagal disimpan (${response.status}).`);
    if (result.leaderboardEligible !== true) {
      throw new Error("Akun ini tidak memenuhi syarat untuk leaderboard CAT.");
    }
    message.textContent = "Skor CAT terbaru berhasil disimpan dan digunakan untuk leaderboard.";
    message.classList.add("success");
    renderLeaderboard();
    renderHomeLeaderboardRank();
  } catch (error) {
    console.error("Tidak dapat menyimpan skor simulasi CAT:", error);
    message.classList.remove("success");
    message.textContent = error.message || "Skor CAT belum dapat disimpan ke leaderboard.";
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

function shuffleItems(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

async function loadCatQuestions() {
  const banks = {};
  await Promise.all(CAT_TESTS.map(async (test) => {
    const response = await fetch(`./${TEST_BANKS[test]}`);
    if (!response.ok) throw new Error(`Bank soal ${test} tidak dapat dimuat (${response.status}).`);
    const questions = await response.json();
    const requiredCount = CAT_CONFIG.questionCounts[test];
    if (!Array.isArray(questions) || questions.length < requiredCount) {
      throw new Error(`Bank soal ${test} harus memiliki sedikitnya ${requiredCount} soal.`);
    }
    banks[test] = questions;
  }));

  const tiuCount = CAT_CONFIG.questionCounts.TIU;
  const tiuRegular = shuffleItems(banks.TIU.filter((question) =>
    question.category !== "PENALARAN FIGURAL"
    && !Array.isArray(question.figureSequence)
    && !Array.isArray(question.figureOptions)
  )).slice(0, tiuCount);
  if (tiuRegular.length !== tiuCount) {
    throw new Error("Bank TIU tidak memiliki cukup soal nonfigural.");
  }
  return [
    ...shuffleItems(banks.TWK).slice(0, CAT_CONFIG.questionCounts.TWK).map((question) => ({ ...question, test: "TWK" })),
    ...tiuRegular.map((question) => ({ ...question, test: "TIU" })),
    ...shuffleItems(banks.TKP).slice(0, CAT_CONFIG.questionCounts.TKP).map((question) => ({ ...question, test: "TKP" }))
  ];
}

function startQuizSession(questions, durationSeconds, catSimulation = false) {
  sessionQuestions = questions;
  answers = Array(sessionQuestions.length).fill(null);
  currentQuestion = 0;
  remainingSeconds = durationSeconds;
  isCatSimulation = catSimulation;
  sessionFinished = false;
  renderQuestion();
  showScreen("quiz-view");
  startTimer();
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
    const questions = await loadLocalQuestions(difficulty.questionCount);
    startQuizSession(questions, difficulty.durationSeconds);
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

async function beginCatSimulation() {
  if (!["7-days", "forever"].includes(currentValidity())) {
    showToast("Simulasi CAT hanya tersedia untuk paket Tempur dan Victory.");
    return;
  }
  const button = $("cat-simulation-start");
  button.disabled = true;
  button.textContent = "Menyiapkan simulasi...";
  try {
    const questions = await loadCatQuestions();
    if (questions.length !== CAT_TOTAL_QUESTION_COUNT) {
      throw new Error(`Simulasi CAT harus berisi tepat ${CAT_TOTAL_QUESTION_COUNT} soal.`);
    }
    startQuizSession(questions, CAT_CONFIG.durationSeconds, true);
  } catch (error) {
    showToast(error.message || "Simulasi CAT gagal disiapkan.");
    console.error("Simulasi CAT gagal disiapkan:", error);
  } finally {
    button.disabled = false;
    button.innerHTML = 'Mulai simulasi CAT <span aria-hidden="true">→</span>';
  }
}

const FIGURAL_SHAPES = {
  circle: (x) => `<circle cx="${x}" cy="32" r="13" />`,
  square: (x) => `<rect x="${x - 12}" y="20" width="24" height="24" rx="2" />`,
  triangle: (x) => `<polygon points="${x},18 ${x + 14},44 ${x - 14},44" />`,
  diamond: (x) => `<polygon points="${x},17 ${x + 14},32 ${x},47 ${x - 14},32" />`,
  pentagon: (x) => `<polygon points="${x},17 ${x + 14},27 ${x + 9},44 ${x - 9},44 ${x - 14},27" />`,
  star: (x) => `<polygon points="${x},17 ${x + 4},27 ${x + 15},28 ${x + 7},35 ${x + 10},46 ${x},40 ${x - 10},46 ${x - 7},35 ${x - 15},28 ${x - 4},27" />`
};

function renderFigureMarkup(shapes, label, sequence = false) {
  if (!Array.isArray(shapes) || !shapes.length
    || shapes.some((shape) => !Object.prototype.hasOwnProperty.call(FIGURAL_SHAPES, shape))) {
    throw new Error("Data soal figural tidak valid.");
  }
  const spacing = sequence ? 60 : 54;
  const width = shapes.length * spacing;
  const figures = shapes.map((shape, index) => {
    const x = spacing / 2 + index * spacing;
    const arrow = sequence && index < shapes.length - 1
      ? `<text x="${x + spacing / 2}" y="36" text-anchor="middle" class="figure-arrow">→</text>`
      : "";
    return `${FIGURAL_SHAPES[shape](x)}${arrow}`;
  }).join("");
  return `<svg class="figural-svg" width="${width}" height="64" viewBox="0 0 ${width} 64" role="img" aria-label="${escapeHtml(label)}"><g fill="#6254d9" stroke="#41369e" stroke-width="1">${figures}</g></svg>`;
}

function renderCatSectionNavigation(activeTest) {
  const navigation = $("cat-section-navigation");
  navigation.classList.toggle("hidden", !isCatSimulation);
  if (!isCatSimulation) return;

  navigation.querySelectorAll("[data-cat-section]").forEach((button) => {
    const test = button.dataset.catSection;
    const sectionQuestions = sessionQuestions
      .map((question, index) => ({ question, index }))
      .filter((item) => item.question.test === test);
    const answered = sectionQuestions.filter((item) => answers[item.index] !== null).length;
    const selected = test === activeTest;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute("aria-label", `${test}, ${answered} dari ${sectionQuestions.length} soal terjawab`);
    button.querySelector("[data-cat-section-progress]").textContent =
      `${answered}/${sectionQuestions.length}`;
  });
}

function navigateToCatSection(test) {
  const sectionIndices = sessionQuestions
    .map((question, index) => question.test === test ? index : -1)
    .filter((index) => index >= 0);
  if (!sectionIndices.length) return;

  currentQuestion = sectionIndices.find((index) => answers[index] === null) ?? sectionIndices[0];
  renderQuestion();
}

function renderQuestion() {
  const question = sessionQuestions[currentQuestion];
  $("quiz-test").textContent = isCatSimulation ? "SIMULASI CAT" : selectedTest;
  $("quiz-counter").textContent = `SOAL ${String(currentQuestion + 1).padStart(2, "0")} / ${sessionQuestions.length}`;
  renderCatSectionNavigation(question.test);
  $("question-category").textContent = isCatSimulation
    ? `${question.test} · ${question.category.toUpperCase()}`
    : question.category.toUpperCase();
  $("question-text").textContent = question.question;
  const figure = $("question-figure");
  figure.innerHTML = question.figureSequence
    ? renderFigureMarkup(question.figureSequence, "Urutan gambar soal figural", true)
    : "";
  figure.classList.toggle("hidden", !question.figureSequence);
  $("progress-fill").style.width = `${((currentQuestion + 1) / sessionQuestions.length) * 100}%`;
  $("answer-list").innerHTML = question.options.map((option, index) => `
    <button class="answer-option ${answers[currentQuestion] === index ? "selected" : ""}" type="button" data-answer="${index}">
      <span class="answer-letter">${LETTERS[index] || index + 1}</span><span class="answer-content">${escapeHtml(option)}${question.figureOptions ? renderFigureMarkup(question.figureOptions[index], `Gambar opsi ${LETTERS[index] || index + 1}`) : ""}</span>
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
  $("submit-button").innerHTML = isCatSimulation
    ? 'Selesaikan simulasi CAT <span>✓</span>'
    : 'Selesaikan tryout <span>✓</span>';
  $("answered-count").textContent = `${answers.filter((answer) => answer !== null).length}/${sessionQuestions.length} terjawab`;
  const visibleQuestionIndices = sessionQuestions
    .map((item, index) => ({ item, index }))
    .filter((entry) => !isCatSimulation || entry.item.test === question.test);
  $("question-grid").innerHTML = visibleQuestionIndices.map(({ index }, sectionIndex) => `
    <button type="button" class="question-number ${answers[index] !== null ? "answered" : ""} ${index === currentQuestion ? "current" : ""}" data-question="${index}" aria-label="${isCatSimulation ? `${question.test} ` : ""}Soal ${sectionIndex + 1}${answers[index] !== null ? ", terjawab" : ", belum dijawab"}">${String(sectionIndex + 1).padStart(2, "0")}</button>
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
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const catScores = isCatSimulation
    ? sessionQuestions.reduce((scores, question, index) => {
      const answer = answers[index];
      if (answer === null) return scores;
      if (question.test === "TKP") {
        scores.TKP += answer === question.answer ? 5 : 1;
      } else if (answer === question.answer) {
        scores[question.test] += 5;
      }
      return scores;
    }, { TWK: 0, TIU: 0, TKP: 0 })
    : null;
  const score = isCatSimulation
    ? Object.values(catScores).reduce((total, sectionScore) => total + sectionScore, 0)
    : Math.round((correct / sessionQuestions.length) * 100);
  const categoryStats = buildCategoryStats(sessionQuestions, answers, isCatSimulation ? null : selectedTest);
  const catPassed = isCatSimulation
    && CAT_TESTS.every((test) => catScores[test] >= CAT_CONFIG.passingScores[test]);
  if (isCatSimulation) {
    CAT_TESTS.forEach((test) => {
      const sectionAnswered = sessionQuestions.reduce((total, question, index) =>
        total + (question.test === test && answers[index] !== null ? 1 : 0), 0);
      recordActivityQuestions("tryout", test, sectionAnswered);
    });
  } else {
    recordActivityQuestions("tryout", selectedTest, answeredCount);
  }
  $("score-value").textContent = String(score);
  $("score-scale").textContent = isCatSimulation ? `/ ${CAT_TOTAL_SCORE}` : "/ 100";
  $("correct-label").textContent = isCatSimulation ? "Jawaban terisi" : "Jawaban benar";
  $("correct-value").textContent = isCatSimulation
    ? `${answeredCount} / ${sessionQuestions.length}`
    : `${correct} / ${sessionQuestions.length}`;
  $("result-test").textContent = isCatSimulation ? "Simulasi CAT" : selectedTest;
  $("result-source").textContent = isCatSimulation
    ? `${CAT_TOTAL_QUESTION_COUNT} soal · ${CAT_CONFIG.durationSeconds / 60} menit`
    : "Bank soal lokal";
  $("result-heading").textContent = isCatSimulation
    ? catPassed ? "Selamat, seluruh ambang batas tercapai!" : "Terus berlatih dan coba lagi!"
    : score >= 80 ? "Luar biasa, pertahankan!" : score >= 50 ? "Latihan yang hebat!" : "Terus berlatih, kamu pasti bisa!";
  $("result-subtitle").textContent = isCatSimulation
    ? expired
      ? "Waktu habis. Skor dihitung dari jawaban yang sempat dipilih."
      : "Simulasi CAT selesai. Skor ini adalah nilai latihan, bukan hasil tes resmi."
    : expired
      ? "Waktu habis. Pelajari pembahasan dan coba lagi untuk meningkatkan skor."
      : "Setiap latihan membawamu selangkah lebih siap.";
  const breakdown = $("cat-result-breakdown");
  breakdown.classList.toggle("hidden", !isCatSimulation);
  breakdown.innerHTML = isCatSimulation
    ? CAT_TESTS.map((test) => {
      const passed = catScores[test] >= CAT_CONFIG.passingScores[test];
      return `<div class="cat-score-line ${passed ? "passed" : "below-target"}"><strong>${test}</strong><span>${catScores[test]} / ${CAT_SCORE_MAXIMUMS[test]}</span><small>Ambang ${CAT_CONFIG.passingScores[test]} · ${passed ? "Tercapai" : "Belum tercapai"}</small></div>`;
    }).join("")
    : "";

  const history = readStored(STORAGE.history, []);
  const completedAt = new Date().toISOString();
  history.unshift({
    email: currentUser(),
    test: isCatSimulation ? "CAT" : selectedTest,
    correct,
    score,
    questionCount: sessionQuestions.length,
    answeredCount,
    categoryStats,
    ...(isCatSimulation ? { scores: catScores } : {}),
    completedAt,
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date())
  });
  writeStored(STORAGE.history, history.slice(0, 30));
  const isStarter = currentValidity() === "1-day";
  if (isStarter) recordCompletedTest(selectedTest);
  const answerKeysUnlocked = !isStarter || hasCompletedAllTestTypes();

  const review = $("review-list");
  const needsReview = sessionQuestions.filter((question, index) => {
    if (!isCatSimulation || question.test !== "TKP") return answers[index] !== question.answer;
    return answers[index] === null || answers[index] !== question.answer;
  }).length;
  $("review-count").textContent = `${needsReview} perlu ditinjau`;
  review.classList.toggle("hidden", isStarter && !answerKeysUnlocked);
  $("review-upgrade-gate").classList.toggle("hidden", !isStarter || answerKeysUnlocked);
  $("review-upgrade-available").classList.toggle("hidden", !isStarter || !answerKeysUnlocked);
  review.innerHTML = isStarter && !answerKeysUnlocked ? "" : sessionQuestions.map((question, index) => {
    const isCorrect = answers[index] === question.answer;
    const tkpPoints = isCatSimulation && question.test === "TKP"
      ? answers[index] === null ? 0 : isCorrect ? 5 : 1
      : null;
    const reviewClass = tkpPoints !== null
      ? tkpPoints === 5 ? "correct" : answers[index] === null ? "incorrect" : "partial"
      : isCorrect ? "correct" : "incorrect";
    const status = tkpPoints !== null
      ? `Poin TKP ${tkpPoints}/5`
      : isCorrect ? "✓ Benar" : "✕ Perlu dipelajari";
    const yourAnswer = answers[index] === null ? "Belum dijawab" : `${LETTERS[answers[index]] || answers[index] + 1}. ${question.options[answers[index]]}`;
    const keyAnswer = `${LETTERS[question.answer] || question.answer + 1}. ${question.options[question.answer]}`;
    const questionFigure = question.figureSequence
      ? `<div class="review-figure">${renderFigureMarkup(question.figureSequence, "Urutan gambar soal figural", true)}</div>`
      : "";
    const answerFigure = question.figureOptions && answers[index] !== null
      ? `<div class="review-figure">${renderFigureMarkup(question.figureOptions[answers[index]], "Gambar jawaban yang dipilih")}</div>`
      : "";
    const keyFigure = question.figureOptions
      ? `<div class="review-figure">${renderFigureMarkup(question.figureOptions[question.answer], "Gambar kunci jawaban")}</div>`
      : "";
    return `
      <article class="review-card ${reviewClass}">
        <div class="review-heading"><strong>SOAL ${String(index + 1).padStart(2, "0")} · ${escapeHtml(question.test || selectedTest)} · ${escapeHtml(question.category)}</strong><span class="review-status">${status}</span></div>
        <p class="review-question">${escapeHtml(question.question)}</p>
        ${questionFigure}
        <div class="review-answer"><span>Jawabanmu: <strong>${escapeHtml(yourAnswer)}</strong>${answerFigure}</span>${!isCorrect || (isStarter && answerKeysUnlocked) ? `<span>Kunci jawaban: <strong>${escapeHtml(keyAnswer)}</strong>${keyFigure}</span>` : ""}</div>
        ${!isCorrect ? `<div class="review-explanation"><strong>Cara menjawab:</strong> ${escapeHtml(question.explanation)}</div>` : ""}
      </article>
    `;
  }).join("");
  showScreen("result-view");
  $("leaderboard-submit-message").classList.remove("success");
  if (currentUser()) {
    if (isCatSimulation) saveCatLeaderboardScore(score, catScores);
    else saveLeaderboardScore(selectedTest, score);
  }
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
    startUserSession(result.user);
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
  $("upgrade-dialog-close").addEventListener("click", () => $("upgrade-dialog").close());
  $("upgrade-dialog").addEventListener("click", (event) => {
    if (event.target === $("upgrade-dialog")) $("upgrade-dialog").close();
  });
  document.querySelectorAll(".upgrade-account-button").forEach((button) => {
    button.addEventListener("click", showUpgradeOptions);
  });
  $("starter-welcome-close").addEventListener("click", dismissStarterWelcome);
  $("starter-welcome-cta").addEventListener("click", showPricingFromStarterWelcome);
  $("starter-welcome-login").addEventListener("click", showLoginFromStarterWelcome);
  $("starter-welcome-dialog").addEventListener("click", (event) => {
    if (event.target === $("starter-welcome-dialog")) dismissStarterWelcome();
  });
  $("starter-welcome-dialog").addEventListener("close", () => {
    localStorage.setItem(STORAGE.starterWelcomeDismissed, "true");
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
  document.addEventListener("click", (event) => {
    if (!$("profile-menu").contains(event.target)) closeProfileMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
      if (!$("profile-menu-panel").hidden) {
        closeProfileMenu();
        $("profile-menu-toggle").focus();
      }
    }
  });
  $("nav-start-test-button").addEventListener("click", showLogin);
  $("landing-login-button").addEventListener("click", showLogin);
  $("back-to-landing-button").addEventListener("click", showLanding);
  $("starter-back-button").addEventListener("click", returnToPricing);
  $("starter-register-tab").addEventListener("click", () => setStarterAuthMode("register"));
  $("starter-login-tab").addEventListener("click", () => setStarterAuthMode("login"));
  $("starter-register-form").addEventListener("submit", handleStarterRegister);
  $("starter-login-form").addEventListener("submit", handleStarterLogin);
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
  $("cat-simulation-start").addEventListener("click", beginCatSimulation);
  $("profile-menu-toggle").addEventListener("click", toggleProfileMenu);
  $("profile-menu-open-profile").addEventListener("click", () => {
    closeProfileMenu();
    showProfile();
  });
  $("user-bottom-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-nav-screen]");
    if (!button) return;
    const actions = {
      "dashboard-view": showDashboard,
      "practice-view": showPractice,
      "analysis-view": showAnalysis,
      "profile-view": showProfile
    };
    if (actions[button.dataset.navScreen]) actions[button.dataset.navScreen]();
  });
  $("analysis-unlock-button").addEventListener("click", () => showPackageDetails("victory"));
  $("analysis-content").addEventListener("click", (event) => {
    const button = event.target.closest("[data-analysis-practice]");
    if (!button) return;
    showPractice();
    openPracticeSubject(button.dataset.analysisPractice);
  });
  $("home-rank-action").addEventListener("click", () => {
    if (["7-days", "forever"].includes(currentValidity())) {
      showDashboard();
      $("cat-simulation-title").scrollIntoView({ behavior: "smooth", block: "center" });
    }
    else showPackageDetails("victory");
  });
  $("practice-subject-picker").addEventListener("click", (event) => {
    const button = event.target.closest("[data-practice-subject]");
    if (button) openPracticeSubject(button.dataset.practiceSubject);
  });
  $("practice-levels").addEventListener("click", (event) => {
    const button = event.target.closest("[data-learning-level]");
    if (button && !button.disabled) openLearningLevel(selectedPracticeSubject, Number(button.dataset.learningLevel));
  });
  $("practice-subjects-back").addEventListener("click", showPractice);
  $("tiu-learning-content").addEventListener("click", handleTiuLearningAction);
  $("tiu-learning-back").addEventListener("click", returnToPracticeLevels);
  $("profile-form").addEventListener("submit", updateProfileName);
  $("profile-photo-button").addEventListener("click", () => $("profile-photo-input").click());
  $("profile-photo-input").addEventListener("change", handleProfilePhotoChange);
  $("profile-logout-button").addEventListener("click", logoutUser);
  $("open-reviews-button").addEventListener("click", showReviews);
  $("reviews-home-button").addEventListener("click", showDashboard);
  $("review-form").addEventListener("submit", handleReviewSubmit);
  $("review-form").querySelectorAll('input[name="review-rating"]').forEach((input) => {
    input.addEventListener("change", () => updateStarRating(Number(input.value)));
  });
  $("next-button").addEventListener("click", () => { currentQuestion += 1; renderQuestion(); });
  $("previous-button").addEventListener("click", () => { currentQuestion = Math.max(0, currentQuestion - 1); renderQuestion(); });
  $("cat-section-navigation").addEventListener("click", (event) => {
    const button = event.target.closest("[data-cat-section]");
    if (button) navigateToCatSection(button.dataset.catSection);
  });
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
  $("logout-button").addEventListener("click", logoutUser);
  document.querySelectorAll("[data-home]").forEach((element) => element.addEventListener("click", (event) => {
    event.preventDefault();
    if (currentUser()) showDashboard();
    else showLanding();
  }));
  showScreen("landing-view");
  restoreUserSession();
}

initialize();
