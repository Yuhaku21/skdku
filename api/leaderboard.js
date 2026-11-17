const { getSession } = require("../lib/session");
const { redisCommand } = require("../lib/redis");
const { sendJson } = require("../lib/http");

const LEADERBOARD_KEY = "ruangskd:leaderboard:v2";
const LEADERBOARD_NAMES_KEY = "ruangskd:leaderboard:names";
const LEADERBOARD_SCORES_KEY = "ruangskd:leaderboard:scores:v2";
const MAX_BODY_BYTES = 2048;
const SAVE_ACCUMULATED_SCORE_SCRIPT = [
  "redis.call('HINCRBY', KEYS[2], ARGV[1] .. ':' .. ARGV[2], ARGV[3])",
  "local total = 0",
  "for _, test in ipairs({'TIU', 'TKP', 'TWK'}) do",
  "  total = total + tonumber(redis.call('HGET', KEYS[2], ARGV[1] .. ':' .. test) or '0')",
  "end",
  "redis.call('ZADD', KEYS[1], total, ARGV[1])",
  "redis.call('HSET', KEYS[3], ARGV[1], ARGV[4])",
  "return total"
].join("\n");

async function getLeaderboard() {
  const entries = await redisCommand(["ZREVRANGE", LEADERBOARD_KEY, 0, 4, "WITHSCORES"]);
  if (!Array.isArray(entries) || entries.length % 2 !== 0) {
    throw new Error("Format data leaderboard tidak valid.");
  }
  if (!entries.length) return [];

  const emails = entries.filter((_, index) => index % 2 === 0);
  const scoreFields = emails.flatMap((email) => [`${email}:TIU`, `${email}:TKP`, `${email}:TWK`]);
  const [names, scores] = await Promise.all([
    redisCommand(["HMGET", LEADERBOARD_NAMES_KEY, ...emails]),
    redisCommand(["HMGET", LEADERBOARD_SCORES_KEY, ...scoreFields])
  ]);
  if (!Array.isArray(names) || names.length !== emails.length) {
    throw new Error("Data nama leaderboard tidak lengkap.");
  }
  if (!Array.isArray(scores) || scores.length !== scoreFields.length) {
    throw new Error("Data skor leaderboard tidak lengkap.");
  }
  return emails.map((email, index) => {
    const score = Number(entries[index * 2 + 1]);
    const sectionScores = scores.slice(index * 3, index * 3 + 3).map((value) => Number(value || 0));
    if (typeof names[index] !== "string" || !Number.isSafeInteger(score) || score < 0
      || sectionScores.some((value) => !Number.isSafeInteger(value) || value < 0)
      || sectionScores.reduce((total, value) => total + value, 0) !== score) {
      throw new Error("Data leaderboard tidak valid.");
    }
    return {
      username: names[index],
      score,
      scores: { TIU: sectionScores[0], TKP: sectionScores[1], TWK: sectionScores[2] }
    };
  });
}

async function getUserProgress(email) {
  const tests = ["TIU", "TKP", "TWK"];
  const scores = await redisCommand([
    "HMGET",
    LEADERBOARD_SCORES_KEY,
    ...tests.map((test) => `${email}:${test}`)
  ]);
  if (!Array.isArray(scores) || scores.length !== tests.length) {
    throw new Error("Data progres tryout tidak lengkap.");
  }
  const progress = Object.fromEntries(tests.map((test, index) => [test, Number(scores[index] || 0)]));
  if (Object.values(progress).some((score) => !Number.isSafeInteger(score) || score < 0)) {
    throw new Error("Data progres tryout tidak valid.");
  }
  return { ...progress, total: Object.values(progress).reduce((total, score) => total + score, 0) };
}

module.exports = async function leaderboardHandler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "Metode tidak diizinkan." });
    return;
  }

  try {
    if (request.method === "GET") {
      const session = await getSession(request);
      const progress = session && session.role === "user" && session.email
        ? await getUserProgress(session.email)
        : null;
      sendJson(response, 200, { users: await getLeaderboard(), progress });
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
      || !["TIU", "TKP", "TWK"].includes(payload.test)
      || !Number.isInteger(payload.score) || payload.score < 0 || payload.score > 100) {
      sendJson(response, 400, { error: "Skor tryout tidak valid." });
      return;
    }

    await redisCommand([
      "EVAL",
      SAVE_ACCUMULATED_SCORE_SCRIPT,
      3,
      LEADERBOARD_KEY,
      LEADERBOARD_SCORES_KEY,
      LEADERBOARD_NAMES_KEY,
      session.email,
      payload.test,
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
