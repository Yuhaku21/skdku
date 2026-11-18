const crypto = require("node:crypto");
const { redisCommand } = require("./redis");

const USERS_KEY = "ruangskd:users";

function isProfilePhotoId(value) {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function ensureProfilePhotoId(email, account) {
  if (isProfilePhotoId(account.profilePhotoId)) return account.profilePhotoId;
  const profilePhotoId = crypto.randomUUID();
  await redisCommand(["HSET", USERS_KEY, email, JSON.stringify({ ...account, profilePhotoId })]);
  return profilePhotoId;
}

async function attachReviewProfilePhotos(reviews) {
  if (!reviews.some((review) => review && typeof review.username === "string"
    && typeof review.profilePhotoId !== "string")) {
    return reviews;
  }
  const entries = await redisCommand(["HGETALL", USERS_KEY]);
  if (!Array.isArray(entries) || entries.length % 2 !== 0) {
    throw new Error("Format data akun foto profil tidak valid.");
  }
  const photosByName = new Map();
  const ambiguousNames = new Set();
  for (let index = 0; index < entries.length; index += 2) {
    const account = JSON.parse(entries[index + 1]);
    if (!account || typeof account.name !== "string" || !account.profilePhotoUploadedAt
      || !isProfilePhotoId(account.profilePhotoId)) continue;
    if (photosByName.has(account.name)) {
      photosByName.delete(account.name);
      ambiguousNames.add(account.name);
    } else if (!ambiguousNames.has(account.name)) {
      photosByName.set(account.name, account.profilePhotoId);
    }
  }
  return reviews.map((review) => {
    if (!review || typeof review.username !== "string" || typeof review.profilePhotoId === "string") return review;
    const profilePhotoId = photosByName.get(review.username);
    return profilePhotoId ? { ...review, profilePhotoId } : review;
  });
}

module.exports = { attachReviewProfilePhotos, ensureProfilePhotoId, isProfilePhotoId };
