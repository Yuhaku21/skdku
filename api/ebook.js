const { getSession } = require("../lib/session");
const { redisCommand } = require("../lib/redis");
const { sendJson } = require("../lib/http");

const USERS_KEY = "ruangskd:users";

function getAccountValidity(account) {
  if (["1-day", "7-days", "forever"].includes(account.validity)) return account.validity;
  return account.expiresAt === null || account.expiresAt === undefined ? "forever" : "7-days";
}

async function getSessionValidity(session) {
  if (session.validity) return session.validity;
  const stored = await redisCommand(["HGET", USERS_KEY, session.email]);
  if (!stored) return null;
  return getAccountValidity(JSON.parse(stored));
}

module.exports = async function ebookHandler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Metode tidak diizinkan." });
    return;
  }

  try {
    const session = await getSession(request);
    if (!session || session.role !== "user" || !session.email) {
      sendJson(response, 401, { error: "Masuk dengan akun Tempur atau Victory untuk membuka e-book." });
      return;
    }

    const validity = await getSessionValidity(session);
    if (!["7-days", "forever"].includes(validity)) {
      sendJson(response, 403, { error: "E-book hanya tersedia untuk akun Tempur dan Victory." });
      return;
    }

    let ebookUrl;
    try {
      ebookUrl = new URL(process.env.EBOOK_URL);
    } catch {
      sendJson(response, 503, { error: "Tautan e-book belum dikonfigurasi." });
      return;
    }
    if (ebookUrl.protocol !== "https:") {
      sendJson(response, 503, { error: "Konfigurasi tautan e-book tidak valid." });
      return;
    }

    response.writeHead(302, {
      "Location": ebookUrl.href,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    response.end();
  } catch (error) {
    if (error.statusCode === 503) {
      sendJson(response, 503, { error: error.message });
      return;
    }
    console.error("API e-book gagal:", error);
    sendJson(response, 502, { error: "E-book tidak dapat dibuka saat ini." });
  }
};
