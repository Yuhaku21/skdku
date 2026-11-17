const crypto = require("node:crypto");
const { redisCommand } = require("./redis");

const COOKIE_NAME = "ruangskd_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function getSessionToken(request) {
  const cookies = (request.headers.cookie || "").split(";");
  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== COOKIE_NAME) continue;
    return cookie.slice(separator + 1).trim();
  }
  return "";
}

function sessionKey(token) {
  const digest = crypto.createHash("sha256").update(token).digest("hex");
  return `ruangskd:session:${digest}`;
}

function setSessionCookie(request, response, token, maxAge) {
  const secure = request.headers["x-forwarded-proto"] === "https" || Boolean(request.socket && request.socket.encrypted);
  const flags = ["HttpOnly", "SameSite=Strict", "Path=/", `Max-Age=${maxAge}`];
  if (secure) flags.push("Secure");
  response.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; ${flags.join("; ")}`);
}

async function createSession(request, response, user) {
  const token = crypto.randomBytes(32).toString("base64url");
  await redisCommand(["SET", sessionKey(token), JSON.stringify(user), "EX", SESSION_TTL_SECONDS]);
  setSessionCookie(request, response, token, SESSION_TTL_SECONDS);
  return user;
}

async function getSession(request) {
  const token = getSessionToken(request);
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) return null;
  const stored = await redisCommand(["GET", sessionKey(token)]);
  if (!stored) return null;
  const session = JSON.parse(stored);
  return session && ["admin", "user"].includes(session.role) ? session : null;
}

async function destroySession(request, response) {
  const token = getSessionToken(request);
  setSessionCookie(request, response, "", 0);
  if (token) await redisCommand(["DEL", sessionKey(token)]);
}

module.exports = { createSession, destroySession, getSession };
