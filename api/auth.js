const crypto = require("node:crypto");
const { createSession, destroySession, getSession } = require("../lib/session");
const { redisCommand } = require("../lib/redis");
const { sendJson } = require("../lib/http");
const { ensureProfilePhotoId } = require("../lib/profile-photo");

const USERS_KEY = "ruangskd:users";
const PASSWORD_ITERATIONS = 120000;
const MAX_BODY_BYTES = 8192;
const MIN_PASSWORD_LENGTH = 10;
const ACCOUNT_VALIDITY_MS = {
  "1-day": 24 * 60 * 60 * 1000,
  "7-days": 7 * 24 * 60 * 60 * 1000,
  forever: null
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeEqual(first, second) {
  const firstHash = crypto.createHash("sha256").update(first).digest();
  const secondHash = crypto.createHash("sha256").update(second).digest();
  return crypto.timingSafeEqual(firstHash, secondHash);
}

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, PASSWORD_ITERATIONS, 32, "sha256", (error, hash) => {
      if (error) reject(error);
      else resolve(hash.toString("hex"));
    });
  });
}

function getAccountValidity(account) {
  if (["1-day", "7-days", "forever"].includes(account.validity)) return account.validity;
  return account.expiresAt === null || account.expiresAt === undefined ? "forever" : "7-days";
}

async function getAuthenticatedUser(request) {
  const session = await getSession(request);
  if (!session || session.role !== "user" || !session.email) return session;
  const stored = await redisCommand(["HGET", USERS_KEY, session.email]);
  if (!stored) return session;
  const account = JSON.parse(stored);
  const profilePhotoId = await ensureProfilePhotoId(session.email, account);
  return {
    ...session,
    validity: session.validity || getAccountValidity(account),
    profilePhotoId: account.profilePhotoUploadedAt ? profilePhotoId : null
  };
}

function readPayload(request, response) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] || "")) {
    sendJson(response, 400, { error: "Gunakan Content-Type application/json." });
    return null;
  }
  let payload;
  try {
    payload = request.body;
  } catch {
    sendJson(response, 400, { error: "Format JSON tidak valid." });
    return null;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)
    || Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_BODY_BYTES) {
    sendJson(response, 400, { error: "Data permintaan tidak valid atau terlalu besar." });
    return null;
  }
  return payload;
}

async function loginAdmin(request, response, payload) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 12) {
    sendJson(response, 503, { error: "Konfigurasi admin belum lengkap atau password belum cukup kuat." });
    return;
  }
  if (typeof payload.username !== "string" || typeof payload.password !== "string"
    || !safeEqual(payload.username, username) || !safeEqual(payload.password, password)) {
    sendJson(response, 401, { error: "Username atau password admin tidak sesuai." });
    return;
  }
  const user = { role: "admin", username };
  await createSession(request, response, user);
  sendJson(response, 200, { user });
}

async function loginUser(request, response, payload) {
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  if (!isValidEmail(email) || !password) {
    sendJson(response, 400, { error: "Masukkan email dan password yang valid." });
    return;
  }
  const stored = await redisCommand(["HGET", USERS_KEY, email]);
  const account = stored ? JSON.parse(stored) : null;
  if (!account || typeof account.name !== "string" || typeof account.salt !== "string"
    || typeof account.passwordHash !== "string"
    || !safeEqual(await hashPassword(password, account.salt), account.passwordHash)) {
    sendJson(response, 401, { error: "Email atau password tidak sesuai." });
    return;
  }
  const expiresAt = account.expiresAt === undefined ? null : account.expiresAt;
  if (expiresAt !== null && (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now())) {
    sendJson(response, 403, { error: "Masa berlaku akun sudah habis. Hubungi admin." });
    return;
  }
  const profilePhotoId = await ensureProfilePhotoId(email, account);
  const user = {
    role: "user",
    email,
    name: account.name,
    validity: getAccountValidity(account),
    expiresAt,
    profilePhotoId: account.profilePhotoUploadedAt ? profilePhotoId : null
  };
  await createSession(request, response, user);
  sendJson(response, 200, { user });
}

async function createUser(request, response, payload) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") {
    sendJson(response, 401, { error: "Hanya admin yang dapat membuat akun." });
    return;
  }
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const validity = payload.validity;
  if (!name || name.length > 80 || !isValidEmail(email)
    || password.length < MIN_PASSWORD_LENGTH || password.length > 128
    || !Object.prototype.hasOwnProperty.call(ACCOUNT_VALIDITY_MS, validity)) {
    sendJson(response, 400, { error: "Nama, email valid, password minimal 10 karakter, dan masa berlaku akun wajib diisi." });
    return;
  }

  const expiresAt = ACCOUNT_VALIDITY_MS[validity] === null ? null : Date.now() + ACCOUNT_VALIDITY_MS[validity];
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(password, salt);
  const account = JSON.stringify({
    name,
    salt,
    passwordHash,
    validity,
    expiresAt,
    profilePhotoId: crypto.randomUUID()
  });
  const created = await redisCommand(["HSETNX", USERS_KEY, email, account]);
  if (created !== 1) {
    sendJson(response, 409, { error: "Email tersebut sudah memiliki akun." });
    return;
  }
  sendJson(response, 201, { user: { email, name, validity, expiresAt } });
}

async function changeUserPassword(request, response, payload) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") {
    sendJson(response, 401, { error: "Hanya admin yang dapat mengubah password pengguna." });
    return;
  }
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  if (!isValidEmail(email) || password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    sendJson(response, 400, { error: "Email valid dan password baru minimal 10 karakter wajib diisi." });
    return;
  }

  const stored = await redisCommand(["HGET", USERS_KEY, email]);
  if (!stored) {
    sendJson(response, 404, { error: "Akun pengguna tidak ditemukan." });
    return;
  }
  const account = JSON.parse(stored);
  if (!account || typeof account !== "object" || Array.isArray(account)) {
    throw new Error("Data akun di database tidak valid.");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(password, salt);
  await redisCommand(["HSET", USERS_KEY, email, JSON.stringify({ ...account, salt, passwordHash })]);
  sendJson(response, 200, { success: true, email });
}

async function listUsers(request, response) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") {
    sendJson(response, 401, { error: "Hanya admin yang dapat melihat daftar akun." });
    return;
  }

  const entries = await redisCommand(["HGETALL", USERS_KEY]);
  if (!Array.isArray(entries) || entries.length % 2 !== 0) {
    throw new Error("Format daftar akun di database tidak valid.");
  }
  const users = [];
  for (let index = 0; index < entries.length; index += 2) {
    const email = entries[index];
    const account = JSON.parse(entries[index + 1]);
    if (typeof email !== "string" || !account || typeof account.name !== "string") {
      throw new Error("Data akun di database tidak valid.");
    }
    const expiresAt = account.expiresAt === undefined ? null : account.expiresAt;
    if (expiresAt !== null && !Number.isSafeInteger(expiresAt)) {
      throw new Error("Masa berlaku akun di database tidak valid.");
    }
    users.push({
      name: account.name,
      email,
      validity: getAccountValidity(account),
      expiresAt
    });
  }
  users.sort((first, second) => first.name.localeCompare(second.name, "id"));
  sendJson(response, 200, { users });
}

module.exports = async function authHandler(request, response) {
  try {
    if (request.method === "GET") {
      sendJson(response, 200, { user: await getAuthenticatedUser(request) });
      return;
    }
    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");
      sendJson(response, 405, { error: "Metode tidak diizinkan." });
      return;
    }
    const payload = readPayload(request, response);
    if (!payload) return;
    if (payload.action === "admin-login") return await loginAdmin(request, response, payload);
    if (payload.action === "user-login") return await loginUser(request, response, payload);
    if (payload.action === "create-user") return await createUser(request, response, payload);
    if (payload.action === "change-user-password") return await changeUserPassword(request, response, payload);
    if (payload.action === "list-users") return await listUsers(request, response);
    if (payload.action === "logout") {
      await destroySession(request, response);
      sendJson(response, 200, { success: true });
      return;
    }
    sendJson(response, 400, { error: "Aksi autentikasi tidak dikenal." });
  } catch (error) {
    console.error("API autentikasi gagal:", error);
    sendJson(response, error.statusCode || 502, {
      error: error.statusCode === 403 || error.statusCode === 503
        ? error.message
        : "Autentikasi tidak dapat diproses saat ini."
    });
  }
};
