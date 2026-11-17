const $ = (id) => document.getElementById(id);

async function readJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("json")) {
    throw new Error("Server admin tidak mengembalikan JSON. Pastikan API telah di-deploy.");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Permintaan gagal (${response.status}).`);
  return result;
}

async function sendAuthRequest(payload) {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJson(response);
}

function showAdminPanel(user) {
  $("admin-login-panel").classList.add("hidden");
  $("admin-dashboard").classList.remove("hidden");
  $("admin-users-section").classList.remove("hidden");
  $("admin-welcome").textContent = `Login sebagai ${user.username}. Buat akun dan berikan kredensialnya kepada pengguna dengan aman.`;
  loadUserAccounts();
}

function showAdminLogin() {
  $("admin-dashboard").classList.add("hidden");
  $("admin-users-section").classList.add("hidden");
  $("admin-login-panel").classList.remove("hidden");
}

function formatAccountValidity(user) {
  if (user.validity === "forever" || user.expiresAt === null) return "Selamanya";
  if (!Number.isSafeInteger(user.expiresAt)) return "Masa berlaku tidak valid";
  const date = new Date(user.expiresAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  if (user.expiresAt <= Date.now()) return `Kedaluwarsa · ${date}`;
  const duration = user.validity === "1-day" ? "1 hari" : "7 hari";
  return `${duration} · hingga ${date}`;
}

function renderUserAccounts(users) {
  const body = $("admin-users-table-body");
  body.textContent = "";
  if (!users.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.className = "admin-users-empty";
    cell.textContent = "Belum ada akun pengguna.";
    row.append(cell);
    body.append(row);
    return;
  }

  for (const user of users) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const emailCell = document.createElement("td");
    const validityCell = document.createElement("td");
    nameCell.textContent = user.name;
    emailCell.textContent = user.email;
    validityCell.textContent = formatAccountValidity(user);
    if (user.expiresAt !== null && Number.isSafeInteger(user.expiresAt) && user.expiresAt <= Date.now()) {
      validityCell.className = "admin-user-expired";
    }
    row.append(nameCell, emailCell, validityCell);
    body.append(row);
  }
}

async function loadUserAccounts() {
  const message = $("admin-users-message");
  const body = $("admin-users-table-body");
  message.textContent = "";
  body.textContent = "";
  const loadingRow = document.createElement("tr");
  const loadingCell = document.createElement("td");
  loadingCell.colSpan = 3;
  loadingCell.className = "admin-users-empty";
  loadingCell.textContent = "Memuat data akun...";
  loadingRow.append(loadingCell);
  body.append(loadingRow);

  try {
    const result = await sendAuthRequest({ action: "list-users" });
    if (!Array.isArray(result.users)) throw new Error("Format daftar akun dari server tidak valid.");
    renderUserAccounts(result.users);
  } catch (error) {
    body.textContent = "";
    const errorRow = document.createElement("tr");
    const errorCell = document.createElement("td");
    errorCell.colSpan = 3;
    errorCell.className = "admin-users-empty";
    errorCell.textContent = "Daftar akun tidak dapat dimuat.";
    errorRow.append(errorCell);
    body.append(errorRow);
    message.textContent = error.message || "Daftar akun tidak dapat dimuat.";
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const message = $("admin-login-message");
  message.textContent = "";
  try {
    const result = await sendAuthRequest({
      action: "admin-login",
      username: $("admin-username").value.trim(),
      password: $("admin-password").value
    });
    showAdminPanel(result.user);
    $("admin-password").value = "";
  } catch (error) {
    message.textContent = error.message || "Login admin gagal.";
  }
}

async function handleCreateUser(event) {
  event.preventDefault();
  const message = $("create-user-message");
  message.classList.remove("success");
  message.textContent = "";
  try {
    const result = await sendAuthRequest({
      action: "create-user",
      name: $("new-user-name").value.trim(),
      email: $("new-user-email").value.trim(),
      password: $("new-user-password").value,
      validity: $("new-user-validity").value
    });
    $("create-user-form").reset();
    const duration = result.user.validity === "forever" ? "selamanya" : result.user.validity === "1-day" ? "1 hari" : "7 hari";
    message.textContent = `Akun ${result.user.email} berhasil dibuat dengan masa berlaku ${duration}. Berikan password awalnya dengan aman.`;
    message.classList.add("success");
    loadUserAccounts();
  } catch (error) {
    message.textContent = error.message || "Akun tidak dapat dibuat.";
  }
}

async function restoreAdminSession() {
  try {
    const response = await fetch("/api/auth", { cache: "no-store" });
    const result = await readJson(response);
    if (result.user && result.user.role === "admin") showAdminPanel(result.user);
  } catch (error) {
    $("admin-login-message").textContent = error.message || "Status admin tidak dapat diperiksa.";
  }
}

function initializeAdminPage() {
  $("admin-login-form").addEventListener("submit", handleAdminLogin);
  $("create-user-form").addEventListener("submit", handleCreateUser);
  $("admin-logout-button").addEventListener("click", async () => {
    try {
      await sendAuthRequest({ action: "logout" });
      showAdminLogin();
    } catch (error) {
      $("create-user-message").textContent = error.message || "Logout admin gagal.";
    }
  });
  $("refresh-users-button").addEventListener("click", loadUserAccounts);
  restoreAdminSession();
}

initializeAdminPage();
