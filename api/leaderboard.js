const { getSession } = require("../lib/session");
const { redisCommand } = require("../lib/redis");
const { sendJson } = require("../lib/http");

const USERS_KEY = "ruangskd:users";
const LEADERBOARD_KEY = "ruangskd:leaderboard:v2";
const LEADERBOARD_NAMES_KEY = "ruangskd:leaderboard:names";
const LEADERBOARD_SCORES_KEY = "ruangskd:leaderboard:scores:v2";
const CAT_LEADERBOARD_KEY = "ruangskd:leaderboard:cat:v2";
const CAT_SCORES_KEY = "ruangskd:leaderboard:cat-scores:v2";
const MAX_BODY_BYTES = 2048;
const CERTIFICATE_TARGETS = { TIU: 80, TKP: 156, TWK: 65 };
const CAT_SCORE_MAXIMUMS = { TWK: 150, TIU: 175, TKP: 225 };
const CAT_TOTAL_SCORE_MAXIMUM = Object.values(CAT_SCORE_MAXIMUMS)
  .reduce((total, score) => total + score, 0);
const SAVE_ACCUMULATED_SCORE_SCRIPT = [
  "redis.call('HINCRBY', KEYS[2], ARGV[1] .. ':' .. ARGV[2], ARGV[3])",
  "local total = 0",
  "for _, test in ipairs({'TIU', 'TKP', 'TWK'}) do",
  "  total = total + tonumber(redis.call('HGET', KEYS[2], ARGV[1] .. ':' .. test) or '0')",
  "end",
  "if ARGV[5] == '1' then",
  "  redis.call('ZADD', KEYS[1], total, ARGV[1])",
  "end",
  "redis.call('HSET', KEYS[3], ARGV[1], ARGV[4])",
  "return total"
].join("\n");
const SAVE_CAT_SCORE_SCRIPT = [
  "redis.call('ZADD', KEYS[1], ARGV[1], ARGV[2])",
  "redis.call('HSET', KEYS[2], ARGV[2] .. ':TWK', ARGV[3], ARGV[2] .. ':TIU', ARGV[4], ARGV[2] .. ':TKP', ARGV[5])",
  "redis.call('HSET', KEYS[3], ARGV[2], ARGV[6])",
  "return ARGV[1]"
].join("\n");

async function getLeaderboard(currentEmail = null) {
  const entries = await redisCommand(["ZREVRANGE", CAT_LEADERBOARD_KEY, 0, -1, "WITHSCORES"]);
  if (!Array.isArray(entries) || entries.length % 2 !== 0) {
    throw new Error("Format data leaderboard tidak valid.");
  }
  if (!entries.length) return { users: [], rank: null, participantCount: 0 };

  const accounts = await redisCommand(["HGETALL", USERS_KEY]);
  if (!Array.isArray(accounts) || accounts.length % 2 !== 0) {
    throw new Error("Format data akun leaderboard tidak valid.");
  }
  const eligibleAccountEmails = new Set();
  const now = Date.now();
  for (let index = 0; index < accounts.length; index += 2) {
    const account = JSON.parse(accounts[index + 1]);
    if (!account || typeof account !== "object" || Array.isArray(account)) {
      throw new Error("Data akun leaderboard tidak valid.");
    }
    if (account.validity === "forever"
      || (!account.validity && (account.expiresAt === null || account.expiresAt === undefined))
      || (account.validity === "7-days" && Number.isSafeInteger(account.expiresAt) && account.expiresAt > now)
      || (!account.validity && Number.isSafeInteger(account.expiresAt) && account.expiresAt > now)) {
      eligibleAccountEmails.add(accounts[index]);
    }
  }
  const eligibleEntries = [];
  for (let index = 0; index < entries.length; index += 2) {
    if (eligibleAccountEmails.has(entries[index])) eligibleEntries.push(entries[index], entries[index + 1]);
  }
  const eligibleEmails = eligibleEntries.filter((_, index) => index % 2 === 0);
  const rankIndex = currentEmail ? eligibleEmails.indexOf(currentEmail) : -1;
  const participantCount = eligibleEmails.length;
  const emails = eligibleEmails.slice(0, 5);
  const topEntries = eligibleEntries.slice(0, emails.length * 2);
  if (!emails.length) return { users: [], rank: null, participantCount };
  const scoreFields = emails.flatMap((email) => [`${email}:TWK`, `${email}:TIU`, `${email}:TKP`]);
  const [names, scores] = await Promise.all([
    redisCommand(["HMGET", LEADERBOARD_NAMES_KEY, ...emails]),
    redisCommand(["HMGET", CAT_SCORES_KEY, ...scoreFields])
  ]);
  if (!Array.isArray(names) || names.length !== emails.length) {
    throw new Error("Data nama leaderboard tidak lengkap.");
  }
  if (!Array.isArray(scores) || scores.length !== scoreFields.length) {
    throw new Error("Data skor leaderboard tidak lengkap.");
  }
  const profilePhotoIds = new Map();
  for (let index = 0; index < accounts.length; index += 2) {
    const account = JSON.parse(accounts[index + 1]);
    if (account.profilePhotoUploadedAt && typeof account.profilePhotoId === "string") {
      profilePhotoIds.set(accounts[index], account.profilePhotoId);
    }
  }
  const users = emails.map((email, index) => {
    const score = Number(topEntries[index * 2 + 1]);
    const sectionScores = scores.slice(index * 3, index * 3 + 3).map((value) => Number(value || 0));
    if (typeof names[index] !== "string" || !Number.isSafeInteger(score) || score < 0
      || sectionScores.some((value, scoreIndex) => !Number.isSafeInteger(value) || value < 0
        || value > CAT_SCORE_MAXIMUMS[["TWK", "TIU", "TKP"][scoreIndex]])
      || sectionScores.reduce((total, value) => total + value, 0) !== score) {
      throw new Error("Data leaderboard tidak valid.");
    }
    return {
      username: names[index],
      profilePhotoId: profilePhotoIds.get(email) || null,
      score,
      scores: { TWK: sectionScores[0], TIU: sectionScores[1], TKP: sectionScores[2] }
    };
  });
  return {
    users,
    rank: rankIndex < 0 ? null : rankIndex + 1,
    participantCount
  };
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

async function getSessionValidity(session) {
  if (session.validity) return session.validity;
  const stored = await redisCommand(["HGET", USERS_KEY, session.email]);
  if (!stored) return null;
  const account = JSON.parse(stored);
  if (["1-day", "7-days", "forever"].includes(account.validity)) return account.validity;
  return account.expiresAt === null || account.expiresAt === undefined ? "forever" : "7-days";
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
      const authenticatedUser = session && session.role === "user" && session.email;
      const progress = authenticatedUser
        ? await getUserProgress(session.email)
        : null;
      const validity = authenticatedUser ? await getSessionValidity(session) : null;
      const certificateEligible = validity === "forever" && progress
        && Object.entries(CERTIFICATE_TARGETS).every(([test, target]) => progress[test] >= target);
      const leaderboard = await getLeaderboard(authenticatedUser ? session.email : null);
      sendJson(response, 200, {
        users: leaderboard.users,
        leaderboard: {
          rank: leaderboard.rank,
          participantCount: leaderboard.participantCount
        },
        progress,
        certificateEligible: Boolean(certificateEligible),
        certificateName: authenticatedUser ? session.name : null
      });
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
    const validity = await getSessionValidity(session);

    const payload = request.body;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)
      || Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_BODY_BYTES
      || !Number.isInteger(payload.score) || payload.score < 0
      || (payload.test === "CAT"
        ? payload.score > CAT_TOTAL_SCORE_MAXIMUM || !payload.scores || typeof payload.scores !== "object"
          || Array.isArray(payload.scores)
          || Object.keys(CAT_SCORE_MAXIMUMS).some((test) => !Number.isInteger(payload.scores[test])
            || payload.scores[test] < 0 || payload.scores[test] > CAT_SCORE_MAXIMUMS[test])
          || Object.values(CAT_SCORE_MAXIMUMS).length !== Object.keys(payload.scores).length
          || Object.entries(CAT_SCORE_MAXIMUMS).reduce((total, [test]) => total + payload.scores[test], 0) !== payload.score
        : !["TIU", "TKP", "TWK"].includes(payload.test) || payload.score > 100)) {
      sendJson(response, 400, { error: "Skor tryout tidak valid." });
      return;
    }

    if (payload.test === "CAT") {
      if (!["7-days", "forever"].includes(validity)) {
        sendJson(response, 403, { error: "Simulasi CAT dan leaderboard hanya tersedia untuk paket Tempur dan Victory." });
        return;
      }
      await redisCommand([
        "EVAL",
        SAVE_CAT_SCORE_SCRIPT,
        3,
        CAT_LEADERBOARD_KEY,
        CAT_SCORES_KEY,
        LEADERBOARD_NAMES_KEY,
        payload.score,
        session.email,
        payload.scores.TWK,
        payload.scores.TIU,
        payload.scores.TKP,
        session.name
      ]);
      sendJson(response, 200, { success: true, leaderboardEligible: true });
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
      session.name,
      validity === "forever" ? 1 : 0
    ]);
    sendJson(response, 200, { success: true, leaderboardEligible: validity === "forever" });
  } catch (error) {
    if (error.statusCode === 503) {
      sendJson(response, 503, { error: error.message });
      return;
    }
    console.error("API leaderboard gagal:", error);
    sendJson(response, 502, { error: "Leaderboard tidak dapat diproses saat ini." });
  }
};
