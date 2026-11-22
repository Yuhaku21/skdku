const { redisCommand } = require("../lib/redis");

const USERS_KEY = "ruangskd:users";
const LEADERBOARD_KEY = "ruangskd:leaderboard:cat:v2";
const LEADERBOARD_NAMES_KEY = "ruangskd:leaderboard:names";
const LEADERBOARD_SCORES_KEY = "ruangskd:leaderboard:cat-scores:v2";
const SCORE_LIMITS = { TIU: 175, TKP: 225, TWK: 150 };
const TOTAL_SCORE_RANGE = { minimum: 300, maximum: 465 };

const USERS = [
  { email: "aditya.pratama@example.com", name: "Aditya Pratama", TIU: 155, TKP: 180, TWK: 130 },
  { email: "siti.nurhaliza@example.com", name: "Siti Nurhaliza", TIU: 140, TKP: 160, TWK: 120 },
  { email: "budi.santoso@example.com", name: "Budi Santoso", TIU: 130, TKP: 140, TWK: 110 },
  { email: "dewi.anggraini@example.com", name: "Dewi Anggraini", TIU: 120, TKP: 120, TWK: 100 },
  { email: "rizky.ramadhan@example.com", name: "Rizky Ramadhan", TIU: 110, TKP: 100, TWK: 90 }
];

const SEED_SCRIPT = [
  "for index = 1, #ARGV, 6 do",
  "  local email = ARGV[index]",
  "  local stored = redis.call('HGET', KEYS[1], email)",
  "  if stored then",
  "    local account = cjson.decode(stored)",
  "    if account.dummy ~= true then",
  "      return redis.error_reply('Email dummy sudah digunakan akun asli: ' .. email)",
  "    end",
  "  end",
  "end",
  "for index = 1, #ARGV, 6 do",
  "  local email = ARGV[index]",
  "  local name = ARGV[index + 1]",
  "  local account = ARGV[index + 2]",
  "  local tiu = ARGV[index + 3]",
  "  local tkp = ARGV[index + 4]",
  "  local twk = ARGV[index + 5]",
  "  local total = tonumber(tiu) + tonumber(tkp) + tonumber(twk)",
  "  redis.call('HSET', KEYS[1], email, account)",
  "  redis.call('HSET', KEYS[3], email, name)",
  "  redis.call('HSET', KEYS[4], email .. ':TIU', tiu, email .. ':TKP', tkp, email .. ':TWK', twk)",
  "  redis.call('ZADD', KEYS[2], total, email)",
  "end",
  "return (#ARGV / 6)"
].join("\n");

async function seedLeaderboard() {
  const args = USERS.flatMap((user) => {
    const scores = [user.TIU, user.TKP, user.TWK];
    const total = scores.reduce((sum, score) => sum + score, 0);
    if (Object.entries(SCORE_LIMITS).some(([test, maximum]) =>
      !Number.isSafeInteger(user[test]) || user[test] < 0 || user[test] > maximum)
      || total < TOTAL_SCORE_RANGE.minimum || total > TOTAL_SCORE_RANGE.maximum) {
      throw new Error(`Skor contoh untuk ${user.name} tidak valid.`);
    }
    return [
      user.email,
      user.name,
      JSON.stringify({ name: user.name, validity: "forever", expiresAt: null, dummy: true }),
      ...scores
    ];
  });

  const inserted = await redisCommand([
    "EVAL",
    SEED_SCRIPT,
    4,
    USERS_KEY,
    LEADERBOARD_KEY,
    LEADERBOARD_NAMES_KEY,
    LEADERBOARD_SCORES_KEY,
    ...args
  ]);
  if (inserted !== USERS.length) {
    throw new Error("Jumlah akun contoh yang ditambahkan tidak sesuai.");
  }

  console.log("Leaderboard dummy berhasil diisi:");
  [...USERS]
    .sort((first, second) =>
      second.TIU + second.TKP + second.TWK - (first.TIU + first.TKP + first.TWK))
    .forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}: ${user.TIU + user.TKP + user.TWK} poin`);
    });
}

seedLeaderboard().catch((error) => {
  console.error("Gagal mengisi leaderboard dummy:", error.message);
  process.exitCode = 1;
});
