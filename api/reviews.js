const REVIEW_LIST_KEY = "ruangskd:reviews";
const MAX_REVIEW_BODY_BYTES = 8192;
const MAX_STORED_REVIEWS = 1000;
const APPEND_REVIEW_SCRIPT = [
  "redis.call('LPUSH', KEYS[1], ARGV[1])",
  "redis.call('LTRIM', KEYS[1], 0, tonumber(ARGV[2]) - 1)",
  "return 1"
].join("\n");

function sendJson(response, statusCode, value) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.status(statusCode).json(value);
}

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    const error = new Error("Database ulasan belum dikonfigurasi.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(url.replace(/\/+$/, ""), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error("Database ulasan menolak permintaan.");
  return result.result;
}

function validateReview(review) {
  const username = review && typeof review.username === "string" ? review.username.trim() : "";
  const comment = review && typeof review.comment === "string" ? review.comment.trim() : "";
  const rating = review && review.rating;
  if (!username || username.length > 80 || !comment || comment.length > 1000
    || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }
  return { username, rating, comment, createdAt: new Date().toISOString() };
}

module.exports = async function reviewsHandler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "Metode tidak diizinkan." });
    return;
  }

  try {
    if (request.method === "GET") {
      const entries = await redisCommand(["LRANGE", REVIEW_LIST_KEY, 0, MAX_STORED_REVIEWS - 1]);
      if (!Array.isArray(entries)) throw new Error("Format data Redis tidak valid.");
      sendJson(response, 200, entries.map((entry) => JSON.parse(entry)));
      return;
    }

    if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] || "")) {
      sendJson(response, 400, { error: "Gunakan Content-Type application/json." });
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
      || Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_REVIEW_BODY_BYTES) {
      sendJson(response, 400, { error: "Data ulasan tidak valid atau terlalu besar." });
      return;
    }

    const review = validateReview(payload);
    if (!review) {
      sendJson(response, 400, { error: "Nama, komentar (maksimal 1000 karakter), dan rating 1–5 wajib diisi." });
      return;
    }

    await redisCommand([
      "EVAL",
      APPEND_REVIEW_SCRIPT,
      1,
      REVIEW_LIST_KEY,
      JSON.stringify(review),
      MAX_STORED_REVIEWS
    ]);
    sendJson(response, 201, review);
  } catch (error) {
    if (error.statusCode === 503) {
      sendJson(response, 503, { error: error.message });
      return;
    }
    console.error("API ulasan Vercel gagal:", error);
    sendJson(response, 502, { error: "Database ulasan tidak dapat dijangkau." });
  }
};
