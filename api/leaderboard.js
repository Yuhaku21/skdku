const { getSession } = require("../lib/session");
const { redisCommand } = require("../lib/redis");
const { sendJson } = require("../lib/http");

const LEADERBOARD_KEY = "ruangskd:leaderboard";
const LEADERBOARD_NAMES_KEY = "ruangskd:leaderboard:names";
const MAX_BODY_BYTES = 2048;
const SAVE_BEST_SCORE_SCRIPT = [
  "local previous = redis.call('ZSCORE', KEYS[1], ARGV[1])",
  "if not previous or tonumber(ARGV[2]) > tonumber(previous) then",
  "  redis.call('ZADD', KEYS[1], ARGV[2], ARGV[1])",
  "end",
  "redis.call('HSET', KEYS[2], ARGV[1], ARGV[3])",
  "return 1"
].join("\n");

async function getLeaderboard() {
  const entries = await redisCommand(["ZREVRANGE", LEADERBOARD_KEY, 0, 4, "WITHSCORES"]);
  if (!Array.isArray(entries) || entries.length % 2 !== 0) {
    throw new Error("Format data leaderboard tidak valid.");
  }
  if (!entries.length) return [];

  const emails = entries.filter((_, index) => index % 2 === 0);
  const names = await redisCommand(["HMGET", LEADERBOARD_NAMES_KEY, ...emails]);
  if (!Array.isArray(names) || names.length !== emails.length) {
    throw new Error("Data nama leaderboard tidak lengkap.");
  }
  return emails.map((email, index) => {
    const score = Number(entries[index * 2 + 1]);
    if (typeof names[index] !== "string" || !Number.isInteger(score) || score < 0 || score > 100) {
      throw new Error("Data leaderboard tidak valid.");
    }
    return { username: names[index], score };
  });
}

module.exports = async function leaderboardHandler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "Metode tidak diizinkan." });
    return;
  }

  try {
    if (request.method === "GET") {
      sendJson(response, 200, { users: await getLeaderboard() });
      return;
    }
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] || "")) {
      sendJson(response, 400, { error: "Gunakan Content-Type application/json." });
      return;
    }
    const session = await getSession(request);
    if (!session || session.role !== "user" || !session.email || !session.name) {
      sendJson(response, 401, { error: "Masuk sebagai pengguna untuk menyimpan skor." });
      return;
    }

    const payload = request.body;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)
      || Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_BODY_BYTES
      || !Number.isInteger(payload.score) || payload.score < 0 || payload.score > 100) {
      sendJson(response, 400, { error: "Skor tryout tidak valid." });
      return;
    }

    await redisCommand([
      "EVAL",
      SAVE_BEST_SCORE_SCRIPT,
      2,
      LEADERBOARD_KEY,
      LEADERBOARD_NAMES_KEY,
      session.email,
      payload.score,
      session.name
    ]);
    sendJson(response, 200, { success: true });
  } catch (error) {
    if (error.statusCode === 503) {
      sendJson(response, 503, { error: error.message });
      return;
    }
    console.error("API leaderboard gagal:", error);
    sendJson(response, 502, { error: "Leaderboard tidak dapat diproses saat ini." });
  }
};
