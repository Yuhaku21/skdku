const { redisCommand } = require("../lib/redis");

const USERS_KEY = "ruangskd:users";
const LEADERBOARD_KEY = "ruangskd:leaderboard:cat:v1";
const LEADERBOARD_NAMES_KEY = "ruangskd:leaderboard:names";
const LEADERBOARD_SCORES_KEY = "ruangskd:leaderboard:cat-scores:v1";

const USERS = [
  { email: "aditya.pratama@example.com", name: "Aditya Pratama", TIU: 92, TKP: 185, TWK: 88 },
  { email: "siti.nurhaliza@example.com", name: "Siti Nurhaliza", TIU: 88, TKP: 190, TWK: 82 },
  { email: "budi.santoso@example.com", name: "Budi Santoso", TIU: 90, TKP: 178, TWK: 85 },
  { email: "dewi.anggraini@example.com", name: "Dewi Anggraini", TIU: 86, TKP: 180, TWK: 84 },
  { email: "rizky.ramadhan@example.com", name: "Rizky Ramadhan", TIU: 84, TKP: 176, TWK: 83 }
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
    if (scores.some((score) => !Number.isSafeInteger(score) || score < 0)) {
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
  USERS.forEach((user) => {
    console.log(`- ${user.name}: ${user.TIU + user.TKP + user.TWK} poin`);
  });
}

seedLeaderboard().catch((error) => {
  console.error("Gagal mengisi leaderboard dummy:", error.message);
  process.exitCode = 1;
});
