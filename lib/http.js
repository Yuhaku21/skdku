function sendJson(response, statusCode, value) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (typeof response.status === "function") {
    response.status(statusCode).json(value);
    return;
  }
  response.statusCode = statusCode;
  response.end(JSON.stringify(value));
}

module.exports = { sendJson };
