const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT) || 3030;
const ROOT = __dirname;
const REVIEWS_FILE = path.resolve(process.env.REVIEWS_FILE || path.join(ROOT, "data", "reviews.json"));
const MAX_REVIEW_BODY_BYTES = 8192;
const MAX_STORED_REVIEWS = 1000;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

let reviewWriteQueue = Promise.resolve();

function sendJson(response, statusCode, value) {
  const body = JSON.stringify(value);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(body);
}

async function readReviews() {
  try {
    const contents = await fs.promises.readFile(REVIEWS_FILE, "utf8");
    const reviews = JSON.parse(contents);
    if (!Array.isArray(reviews)) throw new Error("Stored reviews must be an array.");
    return reviews;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function saveReviews(reviews) {
  await fs.promises.mkdir(path.dirname(REVIEWS_FILE), { recursive: true });
  const temporaryFile = `${REVIEWS_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.promises.writeFile(temporaryFile, JSON.stringify(reviews, null, 2), "utf8");
  await fs.promises.rename(temporaryFile, REVIEWS_FILE);
}

async function appendReview(review) {
  const operation = reviewWriteQueue.then(async () => {
    const reviews = await readReviews();
    await saveReviews([review, ...reviews].slice(0, MAX_STORED_REVIEWS));
  });
  reviewWriteQueue = operation.then(() => undefined, () => undefined);
  await operation;
}

async function readJsonBody(request) {
  const chunks = [];
  let byteLength = 0;
  let tooLarge = false;
  for await (const chunk of request) {
    byteLength += chunk.length;
    if (byteLength > MAX_REVIEW_BODY_BYTES) {
      tooLarge = true;
    } else if (!tooLarge) {
      chunks.push(chunk);
    }
  }
  if (tooLarge) {
    const error = new Error("Ukuran data ulasan terlalu besar.");
    error.statusCode = 413;
    throw error;
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Format JSON tidak valid.");
    error.statusCode = 400;
    throw error;
  }
}

async function handleReviewsApi(request, response) {
  if (request.method === "GET") {
    await reviewWriteQueue;
    sendJson(response, 200, await readReviews());
    return;
  }
  if (request.method !== "POST") {
    response.writeHead(405, {
      "Allow": "GET, POST",
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(JSON.stringify({ error: "Metode tidak diizinkan." }));
    return;
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] || "")) {
    sendJson(response, 415, { error: "Gunakan Content-Type application/json." });
    return;
  }

  const payload = await readJsonBody(request);
  const username = payload && typeof payload.username === "string" ? payload.username.trim() : "";
  const comment = payload && typeof payload.comment === "string" ? payload.comment.trim() : "";
  const rating = payload && payload.rating;
  if (!username || username.length > 80 || !comment || comment.length > 1000
    || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error("Nama, komentar (maksimal 1000 karakter), dan rating 1–5 wajib diisi.");
    error.statusCode = 400;
    throw error;
  }
  const review = { username, rating, comment, createdAt: new Date().toISOString() };
  await appendReview(review);
  sendJson(response, 201, review);
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  if (pathname === "/api/reviews") {
    handleReviewsApi(request, response).catch((error) => {
      if (error.statusCode && error.statusCode < 500) {
        sendJson(response, error.statusCode, { error: error.message });
        return;
      }
      console.error("API ulasan gagal:", error);
      if (response.headersSent) {
        response.destroy();
        return;
      }
      sendJson(response, 500, { error: "Ulasan tidak dapat diproses saat ini." });
    });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(ROOT, relativePath);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": stats.size,
      "X-Content-Type-Options": "nosniff"
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => {
      if (!response.headersSent) response.writeHead(500);
      response.end("Unable to read file");
    });
    stream.pipe(response);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Ruang SKD berjalan di http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code !== "EADDRINUSE") {
    console.error(`Server gagal dijalankan: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const request = http.get({ host: "127.0.0.1", port: PORT, path: "/" }, (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => { body += chunk; });
    response.on("end", () => {
      if (response.statusCode === 200 && body.includes("Ruang SKD")) {
        console.log(`Ruang SKD sudah berjalan di http://localhost:${PORT}`);
        return;
      }

      console.error(`Port ${PORT} sedang dipakai aplikasi lain. Tutup aplikasi tersebut atau kosongkan port, lalu jalankan npm start lagi.`);
      process.exitCode = 1;
    });
  });

  request.on("error", () => {
    console.error(`Port ${PORT} sedang dipakai. Tutup aplikasi yang menggunakannya, lalu jalankan npm start lagi.`);
    process.exitCode = 1;
  });
});
