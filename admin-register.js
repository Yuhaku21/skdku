const $ = (id) => document.getElementById(id);
const USERS_PER_PAGE = 10;
let userAccounts = [];
let currentUserPage = 1;

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

function renderUserAccounts(users, emptyMessage) {
  const body = $("admin-users-table-body");
  body.textContent = "";
  if (!users.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "admin-users-empty";
    cell.textContent = emptyMessage;
    row.append(cell);
    body.append(row);
    return;
  }

  for (const user of users) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const emailCell = document.createElement("td");
    const validityCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const upgradeCell = document.createElement("td");
    const changePasswordButton = document.createElement("button");
    changePasswordButton.className = "button button-outline admin-change-password-button";
    changePasswordButton.type = "button";
    changePasswordButton.dataset.changePassword = "true";
    changePasswordButton.dataset.email = user.email;
    changePasswordButton.textContent = "Ubah password";
    const upgradeControls = document.createElement("div");
    upgradeControls.className = "admin-upgrade-controls";
    const upgradeSelect = document.createElement("select");
    upgradeSelect.className = "form-input admin-upgrade-select";
    upgradeSelect.dataset.upgradeValidity = "true";
    upgradeSelect.setAttribute("aria-label", `Paket upgrade untuk ${user.email}`);
    const sevenDayOption = document.createElement("option");
    sevenDayOption.value = "7-days";
    sevenDayOption.textContent = "7 hari";
    sevenDayOption.disabled = user.validity === "forever";
    const foreverOption = document.createElement("option");
    foreverOption.value = "forever";
    foreverOption.textContent = "Selamanya";
    upgradeSelect.append(sevenDayOption, foreverOption);
    upgradeSelect.value = user.validity === "forever" ? "forever" : "7-days";
    const upgradeButton = document.createElement("button");
    upgradeButton.className = "button button-primary admin-upgrade-button";
    upgradeButton.type = "button";
    upgradeButton.dataset.upgradeUser = "true";
    upgradeButton.dataset.email = user.email;
    upgradeButton.textContent = "Upgrade";
    upgradeControls.append(upgradeSelect, upgradeButton);
    upgradeCell.append(upgradeControls);
    nameCell.textContent = user.name;
    emailCell.textContent = user.email;
    validityCell.textContent = formatAccountValidity(user);
    actionCell.append(changePasswordButton);
    if (user.expiresAt !== null && Number.isSafeInteger(user.expiresAt) && user.expiresAt <= Date.now()) {
      validityCell.className = "admin-user-expired";
    }
    row.append(nameCell, emailCell, validityCell, actionCell, upgradeCell);
    body.append(row);
  }
}

function getFilteredUserAccounts() {
  const query = $("admin-user-email-filter").value.trim().toLowerCase();
  return userAccounts.filter((user) => user.email.toLowerCase().includes(query));
}

function renderFilteredUserAccounts() {
  const query = $("admin-user-email-filter").value.trim();
  const filteredUsers = getFilteredUserAccounts();
  const pageCount = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  currentUserPage = pageCount ? Math.min(currentUserPage, pageCount) : 1;
  const startIndex = (currentUserPage - 1) * USERS_PER_PAGE;
  const pageUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  const emptyMessage = query
    ? "Tidak ada akun yang cocok dengan email tersebut."
    : "Belum ada akun pengguna.";

  renderUserAccounts(pageUsers, emptyMessage);
  $("admin-users-page-info").textContent = filteredUsers.length
    ? `Menampilkan ${startIndex + 1}–${startIndex + pageUsers.length} dari ${filteredUsers.length} akun`
    : "Tidak ada akun";
  $("admin-users-prev-page").disabled = currentUserPage <= 1;
  $("admin-users-next-page").disabled = currentUserPage >= pageCount;
}

async function loadUserAccounts() {
  const message = $("admin-users-message");
  const body = $("admin-users-table-body");
  message.textContent = "";
  message.classList.remove("success");
  body.textContent = "";
  const loadingRow = document.createElement("tr");
  const loadingCell = document.createElement("td");
  loadingCell.colSpan = 5;
  loadingCell.className = "admin-users-empty";
  loadingCell.textContent = "Memuat data akun...";
  loadingRow.append(loadingCell);
  body.append(loadingRow);

  try {
    const result = await sendAuthRequest({ action: "list-users" });
    if (!Array.isArray(result.users)) throw new Error("Format daftar akun dari server tidak valid.");
    userAccounts = result.users;
    renderFilteredUserAccounts();
  } catch (error) {
    userAccounts = [];
    body.textContent = "";
    const errorRow = document.createElement("tr");
    const errorCell = document.createElement("td");
    errorCell.colSpan = 5;
    errorCell.className = "admin-users-empty";
    errorCell.textContent = "Daftar akun tidak dapat dimuat.";
    errorRow.append(errorCell);
    body.append(errorRow);
    $("admin-users-page-info").textContent = "Data tidak tersedia";
    $("admin-users-prev-page").disabled = true;
    $("admin-users-next-page").disabled = true;
    message.textContent = error.message || "Daftar akun tidak dapat dimuat.";
  }
}

async function handleUpgradeUser(email, validity, button) {
  const duration = validity === "forever" ? "selamanya" : "7 hari";
  if (!window.confirm(`Upgrade akun ${email} menjadi akses ${duration}?`)) return;

  const message = $("admin-users-message");
  message.classList.remove("success");
  message.textContent = "";
  button.disabled = true;
  try {
    const result = await sendAuthRequest({
      action: "upgrade-user",
      email,
      validity
    });
    await loadUserAccounts();
    if (!message.textContent) {
      message.textContent = `Akun ${result.user.email} berhasil di-upgrade menjadi ${duration}. Minta pengguna memuat ulang halaman untuk menerapkan akses baru.`;
      message.classList.add("success");
    }
  } catch (error) {
    message.textContent = error.message || "Akun pengguna tidak dapat di-upgrade.";
  } finally {
    button.disabled = false;
  }
}

let selectedUserEmail = "";

function openChangePasswordDialog(email) {
  selectedUserEmail = email;
  $("change-password-form").reset();
  $("change-password-message").textContent = "";
  $("change-password-message").classList.remove("success");
  $("change-password-email").textContent = email;
  $("change-password-dialog").showModal();
  $("change-user-password").focus();
}

async function handleChangePassword(event) {
  event.preventDefault();
  const password = $("change-user-password").value;
  const confirmation = $("confirm-user-password").value;
  const message = $("change-password-message");
  message.classList.remove("success");
  message.textContent = "";
  if (password !== confirmation) {
    message.textContent = "Konfirmasi password tidak sama.";
    return;
  }

  const submitButton = $("change-password-form").querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    await sendAuthRequest({
      action: "change-user-password",
      email: selectedUserEmail,
      password
    });
    $("change-password-dialog").close();
    $("change-password-form").reset();
    const usersMessage = $("admin-users-message");
    usersMessage.textContent = `Password untuk ${selectedUserEmail} berhasil diubah.`;
    usersMessage.classList.add("success");
  } catch (error) {
    message.textContent = error.message || "Password tidak dapat diubah.";
  } finally {
    submitButton.disabled = false;
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
    $("admin-user-email-filter").value = "";
    currentUserPage = 1;
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
  $("admin-users-table-body").addEventListener("click", (event) => {
    const button = event.target.closest("[data-change-password]");
    if (button) openChangePasswordDialog(button.dataset.email);
    const upgradeButton = event.target.closest("[data-upgrade-user]");
    if (upgradeButton) {
      const row = upgradeButton.closest("tr");
      const validity = row.querySelector("[data-upgrade-validity]").value;
      handleUpgradeUser(upgradeButton.dataset.email, validity, upgradeButton);
    }
  });
  $("change-password-form").addEventListener("submit", handleChangePassword);
  $("cancel-change-password").addEventListener("click", () => $("change-password-dialog").close());
  $("admin-logout-button").addEventListener("click", async () => {
    try {
      await sendAuthRequest({ action: "logout" });
      showAdminLogin();
    } catch (error) {
      $("create-user-message").textContent = error.message || "Logout admin gagal.";
    }
  });
  $("refresh-users-button").addEventListener("click", loadUserAccounts);
  $("admin-user-email-filter").addEventListener("input", () => {
    currentUserPage = 1;
    renderFilteredUserAccounts();
  });
  $("admin-users-prev-page").addEventListener("click", () => {
    if (currentUserPage <= 1) return;
    currentUserPage -= 1;
    renderFilteredUserAccounts();
  });
  $("admin-users-next-page").addEventListener("click", () => {
    if (currentUserPage * USERS_PER_PAGE >= getFilteredUserAccounts().length) return;
    currentUserPage += 1;
    renderFilteredUserAccounts();
  });
  restoreAdminSession();
}

initializeAdminPage();
