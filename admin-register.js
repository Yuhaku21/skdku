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
  $("admin-welcome").textContent = `Login sebagai ${user.username}. Buat akun dan berikan kredensialnya kepada pengguna dengan aman.`;
}

function showAdminLogin() {
  $("admin-dashboard").classList.add("hidden");
  $("admin-login-panel").classList.remove("hidden");
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
      password: $("new-user-password").value
    });
    $("create-user-form").reset();
    message.textContent = `Akun ${result.user.email} berhasil dibuat. Berikan password awalnya dengan aman.`;
    message.classList.add("success");
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
  restoreAdminSession();
}

initializeAdminPage();
