const { createSession, getSession } = require("../lib/session");
const { redisCommand } = require("../lib/redis");
const { sendJson } = require("../lib/http");
const { ensureProfilePhotoId, isProfilePhotoId } = require("../lib/profile-photo");

const USERS_KEY = "ruangskd:users";
const PROFILE_PHOTOS_KEY = "ruangskd:profile-photos";
const MAX_IMAGE_BYTES = 20 * 1024;
const MAX_BODY_BYTES = 30 * 1024;

function getProfilePhotoId(request) {
  try {
    return new URL(request.url, "http://localhost").searchParams.get("id");
  } catch {
    return null;
  }
}

function sendPhoto(response, base64) {
  response.setHeader("Content-Type", "image/webp");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(Buffer.from(base64, "base64"));
}

module.exports = async function profileHandler(request, response) {
  if (!["GET", "POST", "PUT"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST, PUT");
    sendJson(response, 405, { error: "Metode tidak diizinkan." });
    return;
  }

  try {
    if (request.method === "GET") {
      const profilePhotoId = getProfilePhotoId(request);
      if (!isProfilePhotoId(profilePhotoId)) {
        sendJson(response, 404, { error: "Foto profil tidak ditemukan." });
        return;
      }
      const photo = await redisCommand(["HGET", PROFILE_PHOTOS_KEY, profilePhotoId]);
      if (typeof photo !== "string") {
        sendJson(response, 404, { error: "Foto profil tidak ditemukan." });
        return;
      }
      sendPhoto(response, photo);
      return;
    }

    if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] || "")) {
      sendJson(response, 400, { error: "Gunakan Content-Type application/json." });
      return;
    }
    const session = await getSession(request);
    if (!session || session.role !== "user" || !session.email) {
      sendJson(response, 401, { error: "Masuk terlebih dahulu untuk mengubah profil." });
      return;
    }
    let payload;
    try {
      payload = request.body;
    } catch {
      sendJson(response, 400, { error: "Format JSON tidak valid." });
      return;
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)
      || Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_BODY_BYTES) {
      sendJson(response, 400, { error: "Data permintaan tidak valid atau terlalu besar." });
      return;
    }

    if (request.method === "PUT") {
      const name = typeof payload.name === "string" ? payload.name.trim() : "";
      if (!name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name)) {
        sendJson(response, 400, { error: "Nama wajib diisi, tidak boleh memuat karakter kontrol, dan maksimal 80 karakter." });
        return;
      }
      const stored = await redisCommand(["HGET", USERS_KEY, session.email]);
      if (typeof stored !== "string") {
        sendJson(response, 404, { error: "Akun pengguna tidak ditemukan." });
        return;
      }
      const account = JSON.parse(stored);
      if (!account || typeof account !== "object" || Array.isArray(account)) {
        throw new Error("Data akun di database tidak valid.");
      }
      await redisCommand(["HSET", USERS_KEY, session.email, JSON.stringify({ ...account, name })]);
      await createSession(request, response, {
        ...session,
        name,
        validity: session.validity || account.validity,
        expiresAt: session.expiresAt === undefined ? account.expiresAt : session.expiresAt
      });
      sendJson(response, 200, { user: { name, email: session.email } });
      return;
    }

    if (typeof payload.image !== "string"
      || !/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(payload.image)) {
      sendJson(response, 400, { error: "Foto harus berupa gambar WebP yang valid dan berukuran maksimal 20 KB." });
      return;
    }
    const base64 = payload.image.slice("data:image/webp;base64,".length);
    const image = Buffer.from(base64, "base64");
    if (image.length > MAX_IMAGE_BYTES || image.toString("base64") !== base64
      || image.length < 12 || image.toString("ascii", 0, 4) !== "RIFF"
      || image.toString("ascii", 8, 12) !== "WEBP") {
      sendJson(response, 400, { error: "Foto harus berupa gambar WebP yang valid dan berukuran maksimal 20 KB." });
      return;
    }

    const stored = await redisCommand(["HGET", USERS_KEY, session.email]);
    if (typeof stored !== "string") {
      sendJson(response, 404, { error: "Akun pengguna tidak ditemukan." });
      return;
    }
    const account = JSON.parse(stored);
    if (!account || typeof account !== "object" || Array.isArray(account)) {
      throw new Error("Data akun di database tidak valid.");
    }
    const profilePhotoId = await ensureProfilePhotoId(session.email, account);
    await Promise.all([
      redisCommand(["HSET", PROFILE_PHOTOS_KEY, profilePhotoId, base64]),
      redisCommand(["HSET", USERS_KEY, session.email, JSON.stringify({
        ...account,
        profilePhotoId,
        profilePhotoUploadedAt: Date.now()
      })])
    ]);
    sendJson(response, 200, { profilePhotoId });
  } catch (error) {
    if (error.statusCode && error.statusCode < 600) {
      sendJson(response, error.statusCode, { error: error.message });
      return;
    }
    console.error("API foto profil gagal:", error);
    sendJson(response, 502, { error: "Foto profil tidak dapat diproses saat ini." });
  }
};
