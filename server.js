const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = 3030;
const ROOT = __dirname;
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

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
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

  const request = http.get({ host: HOST, port: PORT, path: "/" }, (response) => {
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
